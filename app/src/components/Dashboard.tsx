import { useState } from 'react';
import {
  LayoutDashboard, KanbanSquare, AlertCircle,
  Users, ChevronLeft, ChevronRight, Sparkles,
  FolderKanban, ArrowRightLeft, Shield, FolderOpen,
} from 'lucide-react';
import {
  teamMembers, tasks, issues, getProjectColor,
} from '@/data/mockData';
import type { TeamMember } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import KanbanBoard from './KanbanBoard';
import IssueTracker from './IssueTracker';
import AgentExperience from './AgentExperience';
import TransferGraph from './TransferGraph';
import CodeVersion from './CodeVersion';
import AdminPanel from './AdminPanel';
import TodoList from './TodoList';

const sidebarItems = [
  { id: 'overview', label: '概览', icon: LayoutDashboard },
  { id: 'board', label: '项目看板', icon: KanbanSquare },
  { id: 'issues', label: '问题追踪', icon: AlertCircle },
  { id: 'transfers', label: '移交轨迹', icon: ArrowRightLeft },
  { id: 'code', label: '项目文件上传', icon: FolderOpen },
  { id: 'agent', label: 'Agent心得', icon: Sparkles },
  { id: 'team', label: '团队成员', icon: Users },
  { id: 'admin', label: '管理控制台', icon: Shield },
];

function TeamView() {
  const memberList = teamMembers.filter((m) => m.userRole === 'member');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const selectedMember = memberList.find((m) => m.id === selectedMemberId);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold text-[#f4f4f5] mb-6">团队成员</h2>
      <h3 className="text-xs font-mono text-[#1868d6] mb-3 uppercase tracking-wider">普通成员</h3>
      <div className="flex flex-col gap-4">
        <div className="flex items-center pl-2">
          {memberList.map((member: TeamMember, index: number) => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-[#050507] -ml-2 transition-transform hover:scale-110 ${selectedMemberId === member.id ? 'ring-2 ring-[#1868d6] z-10' : ''}`}
              style={{ backgroundColor: member.color, zIndex: memberList.length - index }}
              title={member.name}
            >
              {member.initials}
            </button>
          ))}
        </div>

        <select
          value={selectedMemberId || ''}
          onChange={(e) => setSelectedMemberId(e.target.value || null)}
          className="h-8 px-2 rounded bg-[#050507] border border-[#1f1f22] text-xs text-[#f4f4f5] focus:outline-none focus:border-[#1868d6]/50 font-mono"
        >
          <option value="">选择成员</option>
          {memberList.map((member: TeamMember) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>

        {selectedMember && (
          <div className="glass-panel rounded-lg p-5 fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: selectedMember.color }}>
                {selectedMember.initials}
              </div>
              <div>
                <h3 className="text-base font-medium text-[#f4f4f5]">{selectedMember.name}</h3>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1f1f22]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-mono font-bold text-[#1868d6]">
                    {tasks.filter((t) => t.assignee.id === selectedMember.id).length}
                  </div>
                  <div className="text-xs text-[#969699]">任务</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-bold text-[#10b981]">
                    {tasks.filter((t) => t.assignee.id === selectedMember.id && t.status === 'done').length}
                  </div>
                  <div className="text-xs text-[#969699]">完成</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-bold text-[#d7244b]">
                    {issues.filter((i) => i.assignee.id === selectedMember.id && i.status === 'open').length}
                  </div>
                  <div className="text-xs text-[#969699]">待修复</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewView({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { projects } = useProjects();
  const [taskFilterProject, setTaskFilterProject] = useState('all');
  // 只显示进行中（active）的项目
  const projectStats = projects
    .filter((p) => p.status === 'active')
    .map((p) => ({
      ...p,
      taskCount: tasks.filter((t) => t.projectId === p.id).length,
      doneCount: tasks.filter((t) => t.projectId === p.id && t.status === 'done').length,
      issueCount: issues.filter((i) => i.projectId === p.id && i.status === 'open').length,
    }));

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        {projectStats.map((p, i) => {
          return (
            <div key={p.id} className="glass-panel rounded-lg p-4 fade-in-up cursor-pointer hover:border-[#1868d6]/30 transition-colors"
              style={{ animationDelay: `${i * 80}ms` }} onClick={() => onNavigate('board')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getProjectColor(p.id) }} />
                  <h3 className="text-sm font-semibold text-[#f4f4f5]">{p.name}</h3>
                </div>
                <div className="flex items-center -space-x-2">
                  {[p.lead, ...p.members.filter((m) => m.id !== p.lead.id)].map((member) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full border-2 border-[#050507] flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: member.color }}
                      title={member.name}
                    >
                      {member.initials}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#969699] mb-3 line-clamp-1">{p.description}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-sm font-mono font-bold text-[#f4f4f5]">{p.taskCount}</div><div className="text-[10px] text-[#969699]">任务</div></div>
                <div><div className="text-sm font-mono font-bold text-[#d7244b]">{p.issueCount}</div><div className="text-[10px] text-[#969699]">待修复</div></div>
                <div><div className="text-sm font-mono font-bold text-[#10b981]">{p.doneCount}</div><div className="text-[10px] text-[#969699]">已完成</div></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f22]">
            <h3 className="text-sm font-medium text-[#f4f4f5] flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#1868d6]" />最新提交
            </h3>
            <button onClick={() => onNavigate('git')} className="text-xs text-[#1868d6] hover:underline">查看全部</button>
          </div>
          <div className="h-[calc(100%-44px)] overflow-hidden"><GitGraph /></div>
        </div>
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f22]">
            <h3 className="text-sm font-medium text-[#f4f4f5] flex items-center gap-2">
              <KanbanSquare className="w-4 h-4 text-[#10b981]" />任务概览
            </h3>
            <select
              value={taskFilterProject}
              onChange={(e) => setTaskFilterProject(e.target.value)}
              className="h-7 px-2 text-xs rounded bg-[#050507] border border-[#1f1f22] text-[#f4f4f5] focus:outline-none focus:border-[#10b981]/50 cursor-pointer"
            >
              <option value="all">全部项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="h-[calc(100%-44px)] overflow-y-auto scrollbar-thin p-4">
            <div className="space-y-2 mb-4">
              {projects.filter((p) => taskFilterProject === 'all' || p.id === taskFilterProject).map((p) => {
                const pt = tasks.filter((t) => t.projectId === p.id);
                const todo = pt.filter((t) => t.status === 'todo').length;
                const doing = pt.filter((t) => t.status === 'in-progress').length;
                const done = pt.filter((t) => t.status === 'done').length;
                return (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <FolderKanban className="w-3.5 h-3.5" style={{ color: getProjectColor(p.id) }} />
                    <span className="text-[#f4f4f5] w-20 truncate">{p.name}</span>
                    <div className="flex-1 flex gap-1">
                      <div className="h-2 rounded-full bg-[#d7244b]" style={{ width: `${(todo / Math.max(pt.length, 1)) * 100}%`, minWidth: todo > 0 ? 4 : 0 }} />
                      <div className="h-2 rounded-full bg-[#1868d6]" style={{ width: `${(doing / Math.max(pt.length, 1)) * 100}%`, minWidth: doing > 0 ? 4 : 0 }} />
                      <div className="h-2 rounded-full bg-[#10b981]" style={{ width: `${(done / Math.max(pt.length, 1)) * 100}%`, minWidth: done > 0 ? 4 : 0 }} />
                    </div>
                    <span className="text-[#969699] font-mono w-6 text-right">{pt.length}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded bg-[#d7244b]/10">
                <div className="text-2xl font-mono font-bold text-[#d7244b]">{tasks.filter((t) => t.status === 'todo').length}</div>
                <div className="text-xs text-[#969699]">待办</div>
              </div>
              <div className="text-center p-3 rounded bg-[#1868d6]/10">
                <div className="text-2xl font-mono font-bold text-[#1868d6]">{tasks.filter((t) => t.status === 'in-progress').length}</div>
                <div className="text-xs text-[#969699]">进行中</div>
              </div>
              <div className="text-center p-3 rounded bg-[#10b981]/10">
                <div className="text-2xl font-mono font-bold text-[#10b981]">{tasks.filter((t) => t.status === 'done').length}</div>
                <div className="text-xs text-[#969699]">已完成</div>
              </div>
            </div>
            <TodoList />
          </div>
        </div>
        </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.userRole === 'admin';
  const visibleItems = isAdmin ? sidebarItems : sidebarItems.filter((i) => i.id !== 'admin');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'code': return <CodeVersion />;
      case 'board': return <KanbanBoard />;
      case 'issues': return <IssueTracker />;
      case 'transfers': return <TransferGraph />;
      case 'agent': return <AgentExperience />;
      case 'team': return <TeamView />;
      case 'admin': return <AdminPanel />;
      default: return <OverviewView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="relative z-10 flex h-[calc(100vh-64px)]">
      <aside className={`flex-shrink-0 glass-header border-r border-[#1f1f22] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className="p-3 space-y-1">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-end p-2 text-[#969699] hover:text-[#f4f4f5] transition-colors mb-2">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-[#1868d6]/15 text-[#1868d6]' : 'text-[#969699] hover:text-[#f4f4f5] hover:bg-[#111113]'
                }`} title={sidebarCollapsed ? item.label : undefined}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </aside>
      <main className="flex-1 overflow-hidden p-6"><div className="h-full">{renderContent()}</div></main>
    </div>
  );
}
