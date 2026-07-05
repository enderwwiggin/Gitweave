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
  login: (name: string, password: string) => { ok: boolean; error?: string };
  register: (data: {
    name: string;
    phone: string;
    email: string;
    idCard: string;
    password: string;
    confirmPassword: string;
    code: string;
  }) => { ok: boolean; error?: string };
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

// 从 localStorage 恢复注册过的用户，localStorage 数据覆盖 teamMembers 的同 ID 条目
function loadPool(): TeamMember[] {
  const base = [...teamMembers];
  try {
    const saved = localStorage.getItem(POOL_KEY);
    if (saved) {
      const overrides = JSON.parse(saved) as TeamMember[];
      const overrideMap = new Map(overrides.map((m) => [m.id, m]));
      // 更新已有成员 + 追加新成员
      for (let i = 0; i < base.length; i++) {
        const ov = overrideMap.get(base[i].id);
        if (ov) { base[i] = { ...base[i], ...ov }; overrideMap.delete(base[i].id); }
      }
      // 追加 teamMembers 中不存在的新注册用户
      for (const m of overrideMap.values()) base.push(m);
    }
  } catch {
    // ignore
  }
  return base;
}

// 持久化全部用户池（包括对 teamMembers 的覆盖更新）
function persistPool(pool: TeamMember[]) {
  try { localStorage.setItem(POOL_KEY, JSON.stringify(pool)); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);
  const [users, setUsers] = useState<TeamMember[]>(loadPool);

  // 登录：姓名 + 密码
  const login = useCallback((name: string, password: string): { ok: boolean; error?: string } => {
    const found = users.find((m) => m.name === name.trim());
    if (!found) return { ok: false, error: '该姓名未注册' };
    if (found.password !== password) return { ok: false, error: '密码错误' };
    const authUser = toAuthUser(found);
    setUser(authUser);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser)); } catch { /* ignore */ }
    return { ok: true };
  }, [users]);
  const register = useCallback((data: {
    name: string; phone: string; email: string; idCard: string;
    password: string; confirmPassword: string; code: string;
  }): { ok: boolean; error?: string } => {
    const { name, phone, email, idCard, password, confirmPassword, code } = data;

    if (!name.trim()) return { ok: false, error: '请输入真实姓名' };
    if (!/^1\d{10}$/.test(phone.trim())) return { ok: false, error: '请输入有效的 11 位手机号' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok: false, error: '请输入有效的邮箱' };
    if (!/^\d{6}$/.test(idCard.trim())) return { ok: false, error: '请输入身份证后 6 位' };
    if (password.length < 6) return { ok: false, error: '密码至少 6 位' };
    if (password !== confirmPassword) return { ok: false, error: '两次密码不一致' };

    // 验证码 = 身份证后6位 + 手机号后4位
    const expectedCode = idCard.trim().slice(-6) + phone.trim().slice(-4);
    if (code.trim() !== expectedCode) {
      return { ok: false, error: '验证码不正确（应为身份证后6位+手机号后4位）' };
    }

    if (users.some((m) => m.phone === phone.trim())) return { ok: false, error: '该手机号已注册' };

    // 姓名匹配：如果后台已有同名成员（含 admin），自动对应其身份信息
    const matched = users.find((m) => m.name === name.trim());

    const id = matched ? matched.id : `u${Date.now()}`;
    const initials = matched ? matched.initials : name.trim().slice(0, 2);
    const color = matched ? matched.color : '#6366f1';
    const role = matched ? matched.role : '普通成员';
    const userRole = matched ? matched.userRole : 'member' as const;

    let newPool: TeamMember[];
    if (matched) {
      newPool = users.map((m) =>
        m.id === matched.id
          ? { ...m, phone: phone.trim(), password, email: email.trim(), idCard: idCard.trim() }
          : m
      );
    } else {
      const newMember: TeamMember = {
        id, name: name.trim(), avatar: '/team-avatars.png',
        role, initials, color, userRole,
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        phone: phone.trim(), password, email: email.trim(), idCard: idCard.trim(),
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
    <AuthContext.Provider value={{ user, users, login, register, logout }}>
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