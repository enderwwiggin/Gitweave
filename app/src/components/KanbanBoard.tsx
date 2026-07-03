import { useState, useCallback, useEffect } from 'react';
import {
  GitBranch, Calendar, GripVertical, Filter, User,
  ArrowRightLeft, X, FolderKanban, Lock, Unlock, Pencil, Save, Plus, Loader2, Trash2,
} from 'lucide-react';
import {
  tasks as initialTasks, getProjectColor,
} from '@/data/mockData';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import type { Task, AssignmentHistory, TeamMember } from '@/types';
import { useProjects } from '@/hooks/useProjects';

const columns: { id: Task['status']; title: string; color: string }[] = [
  { id: 'todo', title: '待办', color: '#d7244b' },
  { id: 'in-progress', title: '进行中', color: '#1868d6' },
  { id: 'done', title: '已完成', color: '#10b981' },
];

function TransferMini({ history }: { history: AssignmentHistory[] }) {
  if (history.length <= 1) return null;
  return (
    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#1f1f22]">
      <ArrowRightLeft className="w-3 h-3 text-[#f59e0b]" />
      <div className="flex items-center gap-1 overflow-hidden">
        {history.slice(0, 3).map((h, i) => (
          <div key={h.id} className="flex items-center gap-1">
            {i > 0 && <span className="text-[#1f1f22]">&rarr;</span>}
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: h.to.color }}
              title={`${h.to.name} ${h.timestamp}`}>
              <span className="text-[7px] font-bold text-white">{h.to.initials}</span>
            </div>
          </div>
        ))}
        {history.length > 3 && <span className="text-[9px] text-[#969699]">+{history.length - 3}</span>}
      </div>
    </div>
  );
}

function PermissionBadge({ canEdit, isOwner }: { canEdit: boolean; isOwner: boolean }) {
  if (canEdit) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-mono">
        <Unlock className="w-2.5 h-2.5" />
        {isOwner ? '可编辑' : 'Admin'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded font-mono">
      <Lock className="w-2.5 h-2.5" />
      只读
    </span>
  );
}

function ReassignModal({ task, onClose, onReassign, allMembers }: {
  task: Task; onClose: () => void;
  onReassign: (taskId: string, newAssignee: TeamMember, reason: string) => void;
  allMembers: TeamMember[];
}) {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [reason, setReason] = useState('');
  const availableMembers = allMembers.filter((m) => m.id !== task.assignee.id && m.userRole === 'member');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="glass-panel rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#f4f4f5]">移交任务</h3>
          <button onClick={onClose} className="text-[#969699] hover:text-[#f4f4f5]"><X className="w-4 h-4" /></button>
        </div>
        <div className="mb-3">
          <p className="text-xs text-[#969699] mb-1">当前负责人</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: task.assignee.color }}>
              <span className="text-[10px] font-bold text-white">{task.assignee.initials}</span>
            </div>
            <span className="text-sm text-[#f4f4f5]">{task.assignee.name}</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-[#969699] mb-2 block">移交给</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {availableMembers.map((m) => (
              <button key={m.id} onClick={() => setSelectedMember(m.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                  selectedMember === m.id ? 'bg-[#1868d6]/20 border border-[#1868d6]/50' : 'bg-[#050507] border border-[#1f1f22] hover:border-[#1868d6]/30'
                }`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: m.color }}>
                  <span className="text-[10px] font-bold text-white">{m.initials}</span>
                </div>
                <span className="text-sm text-[#f4f4f5]">{m.name}</span>
                <span className="text-xs text-[#969699] ml-auto">{m.role}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-[#969699] mb-1.5 block">移交原因</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="为什么移交给这位同事..."
            className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50" />
        </div>
        <button onClick={() => {
          const m = allMembers.find((tm) => tm.id === selectedMember);
          if (m) { onReassign(task.id, m, reason || '任务移交'); onClose(); }
        }} disabled={!selectedMember}
          className="w-full h-10 rounded-lg bg-[#f59e0b] hover:bg-[#f59e0b]/80 disabled:opacity-40 text-[#050507] text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          <ArrowRightLeft className="w-4 h-4" />确认移交
        </button>
      </div>
    </div>
  );
}

function TaskEditModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [tagsInput, setTagsInput] = useState(task.tags.join(', '));
  const { userId, isAdmin } = usePermission();
  const isOwner = task.assignee.id === userId || task.editors.includes(userId);
  const canEdit = isAdmin || isOwner;
  if (!canEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="glass-panel rounded-lg p-6 w-96 max-w-[90vw] text-center">
          <Lock className="w-8 h-8 text-[#969699] mx-auto mb-3" />
          <p className="text-sm text-[#969699]">你无权编辑此任务</p>
          <button onClick={() => onClose()} className="mt-4 px-4 py-2 rounded bg-[#1f1f22] text-xs text-[#969699] hover:text-[#f4f4f5]">关闭</button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const detail = {
      taskId: task.id,
      title: title.trim() || task.title,
      description: description.trim(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    };
    window.dispatchEvent(new CustomEvent('task-edit', { detail }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="glass-panel rounded-lg p-6 w-[440px] max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#f4f4f5] flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#10b981]" />编辑任务
          </h3>
          <button onClick={onClose} className="text-[#969699] hover:text-[#f4f4f5]"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#969699] mb-1.5 block">任务标题</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] focus:outline-none focus:border-[#10b981]/50" />
          </div>
          <div>
            <label className="text-xs text-[#969699] mb-1.5 block">任务描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] focus:outline-none focus:border-[#10b981]/50 resize-none" />
          </div>
          <div>
            <label className="text-xs text-[#969699] mb-1.5 block">标签（逗号分隔）</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              placeholder="UMI, 测试, 交付"
              className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] focus:outline-none focus:border-[#10b981]/50 font-mono" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-[#1f1f22] text-xs text-[#969699] hover:text-[#f4f4f5]">取消</button>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#10b981] hover:bg-[#10b981]/80 text-white text-xs font-medium">
            <Save className="w-3.5 h-3.5" />保存
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, index, onDragStart, onReassign, allMembers }: {
  task: Task; index: number;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onReassign: (taskId: string, newAssignee: TeamMember, reason: string) => void;
  allMembers: TeamMember[];
}) {
  const [showReassign, setShowReassign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { userId, getTaskPermission } = usePermission();
  const { projects } = useProjects();
  const perm = getTaskPermission(task.assignee.id, task.editors);
  const isOwner = task.assignee.id === userId;
  const projColor = getProjectColor(task.projectId);
  const proj = projects.find((p) => p.id === task.projectId);

  return (
    <>
      <div className="kanban-card glass-panel rounded-lg p-3 mb-3 cursor-move fade-in-up relative"
        style={{ animationDelay: `${index * 80}ms` }}
        draggable onDragStart={(e) => onDragStart(e, task)}>
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-[#969699] mt-0.5 flex-shrink-0 opacity-50" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ backgroundColor: projColor + '20', color: projColor }}>
                <FolderKanban className="w-3 h-3" />{proj?.name}
              </span>
              <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <PermissionBadge canEdit={perm.canEdit} isOwner={isOwner} />
            </div>
            <h4 className="text-sm font-medium text-[#f4f4f5] mb-1.5 leading-snug">{task.title}</h4>
            <div className="flex items-center gap-1.5 mb-2">
              <GitBranch className="w-3 h-3 text-[#969699]" />
              <span className="text-xs font-mono text-[#1868d6] bg-[#1868d6]/10 px-1.5 py-0.5 rounded">{task.branch}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: task.assignee.color }} title={task.assignee.name}>
                  <span className="text-[10px] font-bold text-white">{task.assignee.initials}</span>
                </div>
                <span className="text-xs text-[#969699]">{task.assignee.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {perm.canEdit && (
                  <button onClick={() => setShowEdit(true)} className="p-1 rounded hover:bg-[#1f1f22] text-[#969699] hover:text-[#10b981] transition-colors" title="编辑任务">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {perm.canTransfer && (
                  <button onClick={() => setShowReassign(true)} className="p-1 rounded hover:bg-[#1f1f22] text-[#969699] hover:text-[#f59e0b] transition-colors" title="移交任务">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <TransferMini history={task.transferHistory} />
            {task.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {task.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-[#969699] bg-[#1f1f22] px-1.5 py-0.5 rounded font-mono">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showReassign && <ReassignModal task={task} onClose={() => setShowReassign(false)} onReassign={onReassign} allMembers={allMembers} />}
      {showEdit && <TaskEditModal task={task} onClose={() => setShowEdit(false)} />}
    </>
  );
}

export default function KanbanBoard() {
  const { users, user } = useAuth();
  const { projects, addProject, removeProject } = useProjects();
  const isAdmin = user?.userRole === 'admin';
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const memberList = users.filter((m) => m.userRole === 'member');
  const [showAddProject, setShowAddProject] = useState(false);
  const [npName, setNpName] = useState('');
  const [npDesc, setNpDesc] = useState('');
  const [npBusy, setNpBusy] = useState(false);
  const [projError, setProjError] = useState<string | null>(null);

  const handleAddProject = async () => {
    if (!npName.trim()) return;
    setNpBusy(true);
    setProjError(null);
    try {
      await addProject(npName, npDesc);
      setShowAddProject(false);
      setNpName('');
      setNpDesc('');
    } catch (e) {
      setProjError(e instanceof Error ? e.message : String(e));
    } finally {
      setNpBusy(false);
    }
  };

  const handleRemoveProject = async (id: string) => {
    setProjError(null);
    try {
      await removeProject(id);
      if (filterProject === id) setFilterProject(null);
    } catch (e) {
      setProjError(e instanceof Error ? e.message : String(e));
    }
  };

  // 监听 TaskEditModal 发出的编辑事件
  useEffect(() => {
    const onEdit = (e: Event) => {
      const { taskId, title, description, tags } = (e as CustomEvent).detail as {
        taskId: string; title: string; description: string; tags: string[];
      };
      setTaskList((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, title, description, tags, updatedAt: '2026-07-01' } : t
      ));
    };
    window.addEventListener('task-edit', onEdit);
    return () => window.removeEventListener('task-edit', onEdit);
  }, []);
  const filteredTasks = taskList.filter((t) => {
    const matchesProject = !filterProject || t.projectId === filterProject;
    const matchesMember = !filterMember || t.assignee.id === filterMember;
    return matchesProject && matchesMember;
  });

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.currentTarget.classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverColumn(null);
    setTaskList((prev) => prev.map((t) => t.id === taskId ? { ...t, status, updatedAt: '2026-06-30' } : t));
  }, []);

  const handleReassign = useCallback((taskId: string, newAssignee: TeamMember, reason: string) => {
    setTaskList((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const newHistory: AssignmentHistory = {
        id: `th-${Date.now()}`,
        from: t.assignee,
        to: newAssignee,
        timestamp: '2026-06-30 16:00',
        reason,
      };
      return {
        ...t,
        assignee: newAssignee,
        transferHistory: [...t.transferHistory, newHistory],
        editors: [newAssignee.id], // 移交后编辑权转移
        viewers: [...new Set([...t.viewers, t.assignee.id])], // 原负责人变成viewer
        updatedAt: '2026-06-30',
      };
    }));
  }, []);

  const getTasksByStatus = (status: Task['status']) => filteredTasks.filter((t) => t.status === status);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-[#f4f4f5]">项目看板</h2>
          <span className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-1 rounded-full">{filteredTasks.length} 任务</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddProject(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#1868d6] hover:bg-[#1868d6]/80 text-white font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />新建项目
          </button>
          <Calendar className="w-4 h-4 text-[#969699]" />
          <span className="text-sm text-[#969699]">Sprint 3</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-[#969699]" />
        <button onClick={() => setFilterProject(null)}
          className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${!filterProject ? 'bg-[#1868d6]/20 text-[#1868d6]' : 'bg-[#1f1f22] text-[#969699]'}`}>全部项目</button>
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-0.5">
            <button onClick={() => setFilterProject(filterProject === p.id ? null : p.id)}
              className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${filterProject === p.id ? '' : 'bg-[#1f1f22] text-[#969699]'}`}
              style={filterProject === p.id ? { backgroundColor: getProjectColor(p.id) + '30', color: getProjectColor(p.id) } : {}}>{p.name}</button>
            {isAdmin && (
              <button onClick={() => handleRemoveProject(p.id)} title="移除项目"
                className="text-[#969699] hover:text-[#d7244b] transition-colors"><Trash2 className="w-3 h-3" /></button>
            )}
          </div>
        ))}
        <div className="w-px h-5 bg-[#1f1f22]" />
        <User className="w-4 h-4 text-[#969699]" />
        <button onClick={() => setFilterMember(null)}
          className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${!filterMember ? 'bg-[#1868d6]/20 text-[#1868d6]' : 'bg-[#1f1f22] text-[#969699]'}`}>全部成员</button>
        {memberList.map((m) => (
          <button key={m.id} onClick={() => setFilterMember(filterMember === m.id ? null : m.id)}
            className={`transition-all ${filterMember === m.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
            style={filterMember === m.id ? { outline: `2px solid ${m.color}`, outlineOffset: '2px', borderRadius: '9999px' } : {}} title={m.name}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: m.color }}>
              <span className="text-[9px] font-bold text-white">{m.initials}</span>
            </div>
          </button>
        ))}
      </div>

      {projError && (
        <div className="mb-3 px-3 py-2 rounded bg-[#d7244b]/10 border border-[#d7244b]/30 text-xs text-[#d7244b] flex items-center justify-between">
          <span>{projError}</span>
          <button onClick={() => setProjError(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isDragOver = dragOverColumn === column.id;
          return (
            <div key={column.id}
              className={`kanban-column flex flex-col rounded-lg border transition-all duration-200 ${
                isDragOver ? 'border-[#1868d6]/30 bg-[#1868d6]/5' : 'border-[#1f1f22] bg-[#111113]/50'
              }`}
              onDragOver={handleDragOver} onDragEnter={() => setDragOverColumn(column.id)}
              onDragLeave={() => setDragOverColumn(null)} onDrop={(e) => handleDrop(e, column.id)}>
              <div className="flex items-center justify-between p-3 border-b border-[#1f1f22]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                  <span className="text-sm font-medium text-[#f4f4f5]">{column.title}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${column.color}15`, color: column.color }}>{columnTasks.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
                {columnTasks.map((task, index) => (
                  <div key={task.id} onDragEnd={handleDragEnd}>
                    <TaskCard task={task} index={index} onDragStart={handleDragStart} onReassign={handleReassign} allMembers={users} />
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-[#969699]">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#1f1f22] flex items-center justify-center mb-2"><span className="text-lg">+</span></div>
                    <span className="text-xs">拖拽任务到此处</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !npBusy && setShowAddProject(false)}>
          <div className="glass-panel rounded-xl w-full max-w-md p-5 fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#f4f4f5] flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#1868d6]" />新建项目
              </h3>
              <button onClick={() => setShowAddProject(false)} className="text-[#969699] hover:text-[#f4f4f5]"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#969699] mb-1 block">项目名称 *</label>
                <input type="text" value={npName} onChange={(e) => setNpName(e.target.value)} placeholder="如 视觉抓取"
                  className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50" />
              </div>
              <div>
                <label className="text-xs text-[#969699] mb-1 block">项目描述</label>
                <input type="text" value={npDesc} onChange={(e) => setNpDesc(e.target.value)} placeholder="一句话描述"
                  className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAddProject(false)} disabled={npBusy}
                className="flex-1 h-9 rounded border border-[#1f1f22] text-sm text-[#969699] hover:text-[#f4f4f5] transition-colors disabled:opacity-40">取消</button>
              <button onClick={handleAddProject} disabled={!npName.trim() || npBusy}
                className="flex-1 h-9 rounded bg-[#1868d6] hover:bg-[#1868d6]/80 disabled:opacity-40 text-sm font-medium text-white transition-colors flex items-center justify-center gap-1">
                {npBusy ? <><Loader2 className="w-4 h-4 animate-spin" />创建中...</> : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
