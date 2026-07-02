import { useState } from 'react';
import {
  Shield,
  UserPlus,
  UserX,
  Users,
  Crown,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { TeamMember } from '@/types';

export default function AdminPanel() {
  const { users } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>(users);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formInitials, setFormInitials] = useState('');
  const [formColor, setFormColor] = useState('#1868d6');

  const colorOptions = [
    '#1868d6', '#10b981', '#d7244b', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#e87940', '#ec4899', '#6366f1', '#14b8a6',
  ];

  const handleAddMember = () => {
    if (!formName || !formRole || !formInitials) return;
    const newMember: TeamMember = {
      id: `m${Date.now()}`,
      name: formName,
      avatar: '/team-avatars.png',
      role: formRole,
      initials: formInitials.toUpperCase(),
      color: formColor,
      userRole: 'member',
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
      phone: '',
      password: '',
    };
    setMembers((prev) => [...prev, newMember]);
    setFormName('');
    setFormRole('');
    setFormInitials('');
    setShowAddForm(false);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'inactive' as const } : m))
    );
    setShowDeleteConfirm(null);
  };

  const activeList = members.filter((m) => m.status === 'active');
  const inactiveList = members.filter((m) => m.status === 'inactive');

  return (
    <div className="h-full flex flex-col overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#dc2626]" />
          <h2 className="text-xl font-semibold text-[#f4f4f5]">管理员控制台</h2>
          <span className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-1 rounded-full">
            Admin
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-[#10b981]/80 text-white text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          添加入职成员
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-panel rounded-lg p-4 text-center">
          <div className="text-2xl font-mono font-bold text-[#f4f4f5]">{activeList.length}</div>
          <div className="text-xs text-[#969699] mt-1">在职人员</div>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <div className="text-2xl font-mono font-bold text-[#dc2626]">{members.filter((m) => m.userRole === 'admin' && m.status === 'active').length}</div>
          <div className="text-xs text-[#969699] mt-1">管理员</div>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <div className="text-2xl font-mono font-bold text-[#1868d6]">{activeList.filter((m) => m.userRole === 'member').length}</div>
          <div className="text-xs text-[#969699] mt-1">普通成员</div>
        </div>
        <div className="glass-panel rounded-lg p-4 text-center">
          <div className="text-2xl font-mono font-bold text-[#969699]">{inactiveList.length}</div>
          <div className="text-xs text-[#969699] mt-1">已离职</div>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <div className="glass-panel rounded-lg p-5 mb-6 fade-in-up">
          <h3 className="text-sm font-medium text-[#f4f4f5] mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#10b981]" />
            添加入职成员
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">姓名 *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="成员姓名"
                className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#10b981]/50"
              />
            </div>
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">职位 *</label>
              <input
                type="text"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="例如: 算法工程师"
                className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#10b981]/50"
              />
            </div>
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">缩写 *</label>
              <input
                type="text"
                value={formInitials}
                onChange={(e) => setFormInitials(e.target.value.slice(0, 2))}
                placeholder="两位字母"
                maxLength={2}
                className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#10b981]/50 font-mono uppercase"
              />
            </div>
            <div className="col-span-3">
              <label className="text-xs text-[#969699] mb-1.5 block">头像颜色</label>
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      formColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#050507] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAddMember}
              disabled={!formName || !formRole || !formInitials}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#10b981] hover:bg-[#10b981]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              确认添加
            </button>
          </div>
        </div>
      )}

      {/* Admin List */}
      <div className="mb-6">
        <h3 className="text-sm font-mono text-[#969699] mb-3 uppercase tracking-wider flex items-center gap-2">
          <Crown className="w-4 h-4 text-[#dc2626]" />
          管理员
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {members.filter((m) => m.userRole === 'admin' && m.status === 'active').map((m) => (
            <div key={m.id} className="glass-panel rounded-lg p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-[#dc2626]"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>
              <div>
                <div className="text-sm font-medium text-[#f4f4f5] flex items-center gap-2">
                  {m.name}
                  <span className="text-[10px] text-[#dc2626] bg-[#dc2626]/10 px-1.5 py-0.5 rounded font-mono">
                    ADMIN
                  </span>
                </div>
                <div className="text-xs text-[#969699]">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Members */}
      <div className="mb-6">
        <h3 className="text-sm font-mono text-[#969699] mb-3 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1868d6]" />
          在职成员 ({activeList.filter((m) => m.userRole === 'member').length})
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {activeList
            .filter((m) => m.userRole === 'member')
            .map((m) => (
              <div key={m.id} className="glass-panel rounded-lg p-4 group relative">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#f4f4f5]">{m.name}</div>
                    <div className="text-xs text-[#969699]">{m.role}</div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/10 text-[#969699] hover:text-red-400 transition-all"
                    title="标记离职"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 pt-2 border-t border-[#1f1f22] text-[10px] text-[#969699] font-mono">
                  入职: {m.joinedAt}
                </div>

                {/* Delete confirmation */}
                {showDeleteConfirm === m.id && (
                  <div className="absolute inset-0 bg-[#050507]/95 rounded-lg flex flex-col items-center justify-center z-10 gap-3">
                    <AlertTriangle className="w-8 h-8 text-[#d7244b]" />
                    <p className="text-sm text-[#f4f4f5]">确认标记 {m.name} 为离职？</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="px-3 py-1.5 rounded bg-[#d7244b] text-white text-xs font-medium hover:bg-[#d7244b]/80"
                      >
                        确认离职
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1.5 rounded bg-[#1f1f22] text-[#969699] text-xs hover:text-[#f4f4f5]"
                      >
                        <X className="w-3 h-3 inline" /> 取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Inactive Members */}
      {inactiveList.length > 0 && (
        <div>
          <h3 className="text-sm font-mono text-[#969699] mb-3 uppercase tracking-wider flex items-center gap-2">
            <UserX className="w-4 h-4 text-[#969699]" />
            已离职成员
          </h3>
          <div className="grid grid-cols-3 gap-3 opacity-50">
            {inactiveList.map((m) => (
              <div key={m.id} className="glass-panel rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white grayscale"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#969699] line-through">{m.name}</div>
                    <div className="text-xs text-[#969699]">{m.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
