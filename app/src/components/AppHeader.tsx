import { useState } from 'react';
import { Search, Bell, Command, LogOut } from 'lucide-react';
import { teamMembers } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import Logo from './Logo';

export default function AppHeader() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bellTip, setBellTip] = useState(false);
  const displayMembers = teamMembers;
  const { user, logout } = useAuth();

  return (
    <header className="glass-header sticky top-0 z-50 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Logo className="w-8 h-8" size={32} />
        <span className="text-lg font-semibold tracking-tight text-[#f4f4f5]">
          GitWeave
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`relative flex items-center transition-all duration-300 ${
            searchFocused ? 'w-80' : 'w-64'
          }`}
        >
          <Search className="absolute left-3 w-4 h-4 text-[#969699]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { window.dispatchEvent(new CustomEvent('global-search', { detail: searchQuery.trim() })); setSearchQuery(''); } }}
            placeholder="搜索任务、提交、问题..."
            className="w-full h-9 pl-9 pr-10 rounded bg-[#111113] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 transition-colors"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="absolute right-3 flex items-center gap-0.5 text-xs text-[#969699] font-mono">
            <Command className="w-3 h-3" />
            <span>/</span>
          </kbd>
        </div>

        <div className="relative">
          <button className="relative p-2 rounded hover:bg-[#111113] transition-colors" onClick={() => setBellTip(!bellTip)} title="消息通知">
            <Bell className="w-5 h-5 text-[#969699]" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#d7244b]" />
          </button>
          {bellTip && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-lg p-4 z-50">
              <p className="text-sm text-[#f4f4f5] mb-1">消息通知</p>
              <p className="text-xs text-[#969699]">暂无新消息</p>
            </div>
          )}
        </div>

        <div className="flex items-center -space-x-2">
          {displayMembers.slice(0, 6).map((member) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full border-2 border-[#050507] flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: member.color }}
              title={member.name}
            >
              {member.initials}
            </div>
          ))}
          {displayMembers.length > 6 && (
            <div className="w-8 h-8 rounded-full border-2 border-[#050507] bg-[#1f1f22] flex items-center justify-center text-xs text-[#969699] font-mono">
              +{displayMembers.length - 6}
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-2 pl-3 ml-1 border-l border-[#1f1f22]">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.initials}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-medium text-[#f4f4f5]">{user.name}</div>
              <div className="text-[10px] text-[#969699] font-mono">{user.userRole === 'admin' ? 'Admin' : '成员'}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded hover:bg-[#d7244b]/10 text-[#969699] hover:text-[#d7244b] transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
