import { useState } from 'react';
import { GitBranch, Phone, Lock, User, KeyRound, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // login state: 姓名 + 密码
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCode, setRegCode] = useState('');

  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    const res = login(loginName, loginPassword);
    if (!res.ok) setError(res.error ?? '登录失败');
  };

  const handleRegister = () => {
    setError('');
    const res = register({
      name: regName, phone: regPhone, email: regEmail,
      password: regPassword, confirmPassword: regConfirmPassword, code: regCode,
    });
    if (!res.ok) setError(res.error ?? '注册失败');
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
      {/* 背景网格 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(24,104,214,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(24,104,214,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050507]/40 to-[#050507]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#1868d6]/20 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-[#1868d6]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#f4f4f5]">GitWeave</span>
          </div>
          <p className="text-sm text-[#969699] font-mono">团队代码管理与项目协作平台</p>
        </div>

        {/* 卡片 */}
        <div className="glass-panel rounded-xl p-6 fade-in-up">
          {/* Tab 切换 */}
          <div className="flex gap-1 p-1 bg-[#111113] rounded-lg border border-[#1f1f22] mb-5">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-[#1868d6]/20 text-[#1868d6]' : 'text-[#969699] hover:text-[#f4f4f5]'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'register' ? 'bg-[#10b981]/20 text-[#10b981]' : 'text-[#969699] hover:text-[#f4f4f5]'
              }`}
            >
              注册
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[#d7244b]/10 border border-[#d7244b]/30 text-xs text-[#d7244b] fade-in-up">
              {error}
            </div>
          )}

          {/* 登录表单：姓名 + 密码 */}
          {mode === 'login' && (
            <div className="space-y-4">
              <Field icon={<User className="w-4 h-4" />} label="姓名">
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full h-10 pl-9 pr-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50"
                />
              </Field>
              <Field icon={<Lock className="w-4 h-4" />} label="密码">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="请输入密码"
                  className="w-full h-10 pl-9 pr-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50"
                />
              </Field>
              <button
                onClick={handleLogin}
                disabled={!loginName || !loginPassword}
                className="w-full h-10 rounded-lg bg-[#1868d6] hover:bg-[#1868d6]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                登录 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 注册表单 */}
          {mode === 'register' && (
            <div className="space-y-3">
              <Field icon={<User className="w-4 h-4" />} label="姓名（真实中文姓名）">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="如：陈润峰"
                  className="reg-input"
                />
              </Field>
              <Field icon={<Phone className="w-4 h-4" />} label="手机号 *">
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="11 位手机号"
                  className="reg-input"
                />
              </Field>
              <Field icon={<Mail className="w-4 h-4" />} label="邮箱 *">
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="reg-input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<Lock className="w-4 h-4" />} label="密码">
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="至少 6 位"
                    className="reg-input"
                  />
                </Field>
                <Field icon={<Lock className="w-4 h-4" />} label="确认密码">
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="再输入一次"
                    className="reg-input"
                  />
                </Field>
              </div>
              <div>
                <label className="text-xs text-[#969699] mb-1.5 block">
                  验证码
                  <span className="text-[10px] text-[#1868d6] ml-2">= 手机号后4位</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969699]" />
                  <input
                    type="text"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                    placeholder="4 位验证码"
                    maxLength={4}
                    className="reg-input pl-9 font-mono tracking-wider"
                  />
                </div>
                {regPhone.trim().length >= 11 && (
                  <p className="mt-1.5 text-[10px] text-[#1868d6] font-mono">
                    提示：{regPhone.trim().slice(-4)}
                  </p>
                )}
              </div>
              <button
                onClick={handleRegister}
                disabled={!regName || !regPhone || !regEmail || !regPassword || !regConfirmPassword || !regCode}
                className="w-full h-10 rounded-lg bg-[#10b981] hover:bg-[#10b981]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                注册并登录 <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px] text-[#969699]">
                姓名匹配后台成员将自动继承身份；新姓名则创建普通成员
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-[#969699] mt-6 font-mono">
          GitWeave v3.2 · 内部团队平台
        </p>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[#969699] mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969699]">{icon}</span>
        {children}
      </div>
    </div>
  );
}