import { useState, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Tag,
  User,
  Calendar,
  Lightbulb,
  ArrowRightLeft,
  FolderKanban,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getProjectColor } from '@/data/mockData';
import type { Issue, AssignmentHistory } from '@/types';
import { useProjects } from '@/hooks/useProjects';

type FilterStatus = 'all' | 'open' | 'resolved' | 'closed';

function TransferTimeline({ history }: { history: AssignmentHistory[] }) {
  if (history.length <= 1) return null;
  return (
    <div className="mt-3 pt-3 border-t border-[#1f1f22]">
      <h5 className="text-[10px] font-mono text-[#f59e0b] mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <ArrowRightLeft className="w-3 h-3" />
        移交轨迹
      </h5>
      <div className="relative pl-4">
        {/* Vertical line */}
        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-[#1f1f22]" />
        {history.map((h) => (
          <div key={h.id} className="relative flex items-start gap-2 mb-2 last:mb-0">
            {/* Dot */}
            <div
              className="absolute left-[-10px] top-1 w-3 h-3 rounded-full border-2 border-[#050507]"
              style={{ backgroundColor: h.to.color }}
            />
            <div className="flex-1 ml-3">
              <div className="flex items-center gap-1.5">
                {h.from ? (
                  <>
                    <span className="text-xs" style={{ color: h.from.color }}>
                      {h.from.name}
                    </span>
                    <span className="text-[#1f1f22]">&rarr;</span>
                  </>
                ) : (
                  <span className="text-xs text-[#10b981]">创建</span>
                )}
                <span className="text-xs font-medium" style={{ color: h.to.color }}>
                  {h.to.name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[#969699]">{h.timestamp}</span>
                {h.reason && (
                  <span className="text-[10px] text-[#969699] bg-[#1f1f22] px-1.5 rounded">
                    {h.reason}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IssueTracker() {
  const { projects } = useProjects();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allIssues = useMemo<Issue[]>(() => {
    return projects.flatMap((project) => {
      const list = project.issues;
      if (!list || list.length === 0) return [];
      return list.map((issue, index): Issue => ({
        id: `${project.id}-issue-${index}`,
        projectId: project.id,
        title: `${project.name} - ${issue}`,
        description: issue,
        solution: '',
        status: 'open',
        priority: 'P2',
        reporter: project.lead,
        assignee: project.lead,
        createdAt: project.startDate,
        tags: ['项目问题'],
        transferHistory: [],
      }));
    });
  }, [projects]);

  const filtered = useMemo(() => {
    return allIssues.filter((issue) => {
      const matchesFilter = filter === 'all' || issue.status === filter;
      const matchesProject = !filterProject || issue.projectId === filterProject;
      const matchesSearch =
        !searchQuery ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesProject && matchesSearch;
    });
  }, [allIssues, filter, filterProject, searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-[#d7244b]" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-[#10b981]" />;
      case 'closed': return <XCircle className="w-4 h-4 text-[#969699]" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return '待处理';
      case 'resolved': return '已解决';
      case 'closed': return '已关闭';
    }
  };

  const getPriorityClass = (priority: string) => `priority-${priority.toLowerCase()}`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#f4f4f5]">问题追踪</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969699]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索问题..."
            className="w-full h-9 pl-10 pr-4 rounded bg-[#111113] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 transition-colors"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-3 p-1 bg-[#111113] rounded-lg border border-[#1f1f22]">
        {(['all', 'open', 'resolved', 'closed'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              filter === status
                ? 'bg-[#1868d6]/20 text-[#1868d6]'
                : 'text-[#969699] hover:text-[#f4f4f5] hover:bg-[#1f1f22]'
            }`}
          >
            {status === 'all' && <Tag className="w-3.5 h-3.5" />}
            {status === 'open' && <AlertCircle className="w-3.5 h-3.5" />}
            {status === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {status === 'closed' && <XCircle className="w-3.5 h-3.5" />}
            {status === 'all' ? '全部' : getStatusLabel(status)}
            <span className="font-mono text-xs opacity-60">
              {allIssues.filter((i) => status === 'all' ? true : i.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Project filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[#969699]" />
        <select
          value={filterProject || ''}
          onChange={(e) => setFilterProject(e.target.value || null)}
          className="h-7 px-2 rounded bg-[#050507] border border-[#1f1f22] text-xs text-[#f4f4f5] focus:outline-none focus:border-[#1868d6]/50 font-mono"
        >
          <option value="">全部项目</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
        {filtered.map((issue, index) => {
          const isExpanded = expandedId === issue.id;
          const projColor = getProjectColor(issue.projectId);
          const proj = projects.find((p) => p.id === issue.projectId);

          return (
            <div
              key={issue.id}
              className="glass-panel rounded-lg overflow-hidden fade-in-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Issue header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : issue.id)}
              >
                {getStatusIcon(issue.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: projColor + '20', color: projColor }}
                    >
                      <FolderKanban className="w-3 h-3" />
                      {proj?.name}
                    </span>
                    <span className={`priority-badge ${getPriorityClass(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <span className="text-xs font-mono text-[#969699]">#{issue.id}</span>
                  </div>
                  <h4 className="text-sm font-medium text-[#f4f4f5]">{issue.title}</h4>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#969699]" />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: issue.assignee.color }}
                      title={issue.assignee.name}
                    >
                      <span className="text-[10px] font-bold text-white">{issue.assignee.initials}</span>
                    </div>
                  </div>
                  {issue.transferHistory.length > 1 && (
                    <div className="flex items-center gap-1 text-[10px] text-[#f59e0b]" title="有移交记录">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      {issue.transferHistory.length - 1}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-[#969699]">
                    <Calendar className="w-3.5 h-3.5" />
                    {issue.createdAt.slice(5)}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#969699]" /> : <ChevronDown className="w-4 h-4 text-[#969699]" />}
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#1f1f22]">
                  <div className="grid grid-cols-2 gap-4 my-4">
                    <div>
                      <h5 className="text-xs font-mono text-[#969699] mb-1.5 uppercase tracking-wider">问题描述</h5>
                      <p className="text-sm text-[#f4f4f5] leading-relaxed">{issue.description}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-mono text-[#969699] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        解决方案
                      </h5>
                      <p className="text-sm text-[#f4f4f5] leading-relaxed">{issue.solution}</p>
                    </div>
                  </div>

                  {/* Transfer timeline */}
                  <TransferTimeline history={issue.transferHistory} />

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1f1f22]">
                    <div className="flex items-center gap-2">
                      {issue.tags.map((tag) => (
                        <span key={tag} className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#969699]">
                      <span>报告人: <span style={{ color: issue.reporter.color }}>{issue.reporter.name}</span></span>
                      {issue.resolvedAt && <span>解决于: {issue.resolvedAt}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-[#969699]">
            <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-sm">暂无匹配的问题</span>
          </div>
        )}
      </div>
    </div>
  );
}
