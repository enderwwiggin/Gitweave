import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { teamMembers } from '@/data/mockData';
import type { TeamMember } from '@/types';

interface AuthUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  userRole: 'admin' | 'member';
}

interface AuthContextValue {
  user: AuthUser | null;
  users: TeamMember[];
  login: (phone: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, phone: string, email: string, password: string, code: string) => { ok: boolean; error?: string };
  sendCode: (email: string) => { code: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'gitweave_auth_user';
const POOL_KEY = 'gitweave_user_pool';

function toAuthUser(m: TeamMember): AuthUser {
  return { id: m.id, name: m.name, initials: m.initials, color: m.color, role: m.role, userRole: m.userRole };
}

function loadUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  } catch {
    return null;
  }
}

// 从 localStorage 恢复注册过的用户，与初始 teamMembers 合并
function loadPool(): TeamMember[] {
  const base = [...teamMembers];
  try {
    const saved = localStorage.getItem(POOL_KEY);
    if (saved) {
      const extra = JSON.parse(saved) as TeamMember[];
      const existingIds = new Set(base.map((m) => m.id));
      for (const m of extra) {
        if (!existingIds.has(m.id)) base.push(m);
      }
    }
  } catch {
    // ignore
  }
  return base;
}

function persistPool(pool: TeamMember[]) {
  const extra = pool.filter((m) => !teamMembers.some((t) => t.id === m.id));
  try { localStorage.setItem(POOL_KEY, JSON.stringify(extra)); } catch { /* ignore */ }
}

// EmailJS 配置 —— 留空则降级为演示模式（界面显示验证码）
const EMAILJS_SERVICE_ID = '';
const EMAILJS_TEMPLATE_ID = '';
const EMAILJS_PUBLIC_KEY = '';

async function sendEmailCode(email: string, code: string): Promise<boolean> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) return false;
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: { to_email: email, code, app_name: 'GitWeave' },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);
  const [users, setUsers] = useState<TeamMember[]>(loadPool);

  const login = useCallback((phone: string, password: string): { ok: boolean; error?: string } => {
    const found = users.find((m) => m.phone === phone.trim());
    if (!found) return { ok: false, error: '该手机号未注册' };
    if (found.password !== password) return { ok: false, error: '密码错误' };
    const authUser = toAuthUser(found);
    setUser(authUser);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser)); } catch { /* ignore */ }
    return { ok: true };
  }, [users]);

  const sendCode = useCallback((_email: string): { code: string } => {
    // 生成 6 位随机验证码；EmailJS 未配置时返回 code 供界面演示显示
    const code = genCode();
    // 异步发送邮件，不阻塞；未配置时静默降级
    void sendEmailCode(_email, code);
    return { code };
  }, []);

  const register = useCallback((name: string, phone: string, email: string, password: string, code: string): { ok: boolean; error?: string } => {
    if (!name.trim()) return { ok: false, error: '请输入真实姓名' };
    if (!/^1\d{10}$/.test(phone.trim())) return { ok: false, error: '请输入有效的 11 位手机号' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok: false, error: '请输入有效的邮箱' };
    if (password.length < 6) return { ok: false, error: '密码至少 6 位' };

    // 验证码校验：sendCode 返回的 code 由 Login 组件持有并传入比对
    if (!code.trim()) return { ok: false, error: '请输入邮箱收到的验证码' };

    if (users.some((m) => m.phone === phone.trim())) return { ok: false, error: '该手机号已注册' };

    // 姓名匹配：如果后台已有同名成员（含 admin），自动对应其身份信息
    const matched = users.find((m) => m.name === name.trim());

    const id = matched ? matched.id : `u${Date.now()}`;
    const initials = matched ? matched.initials : name.trim().slice(0, 2);
    const color = matched ? matched.color : '#6366f1';
    const role = matched ? matched.role : '普通成员';
    const userRole = matched ? matched.userRole : 'member' as const;

    // 如果匹配到现有成员，更新其 phone/password/email（首次绑定账号）
    let newPool: TeamMember[];
    if (matched) {
      newPool = users.map((m) =>
        m.id === matched.id
          ? { ...m, phone: phone.trim(), password, email: email.trim() }
          : m
      );
    } else {
      const newMember: TeamMember = {
        id, name: name.trim(), avatar: '/team-avatars.png',
        role, initials, color, userRole,
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        phone: phone.trim(), password, email: email.trim(),
      };
      newPool = [...users, newMember];
    }

    setUsers(newPool);
    persistPool(newPool);

    const authUser: AuthUser = { id, name: name.trim(), initials, color, role, userRole };
    setUser(authUser);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser)); } catch { /* ignore */ }
    return { ok: true };
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, users, login, register, sendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}