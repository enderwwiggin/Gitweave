import { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  GitCommit,
  Clock,
  User,
  FileCode,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Filter,
  Loader2,
  Paperclip,
} from 'lucide-react';
import { getProjectColor } from '@/data/mockData';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import type { FileVersion } from '@/types';
import { backendUrl, fetchCommits, createCommit, fileToBase64, type AttachmentPayload } from '@/lib/backend';
import { useProjects } from '@/hooks/useProjects';

export default function CodeVersion() {
  const { getCodePermission } = usePermission();
  const perm = getCodePermission();
  const { user, users } = useAuth();
  const { projects } = useProjects();
  const isAdmin = user?.userRole === 'admin';

  const [commits, setCommits] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formFile, setFormFile] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiff, setFormDiff] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formAttach, setFormAttach] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchCommits();
        if (!cancelled) setCommits(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filtered = filterProject
    ? commits.filter((v) => v.projectId === filterProject)
    : commits;

  // Group by filename
  const grouped = filtered.reduce((acc, v) => {
    if (!acc[v.filename]) acc[v.filename] = [];
    acc[v.filename].push(v);
    return acc;
  }, {} as Record<string, FileVersion[]>);

  const handleUpload = async () => {
    if (!formFile || !formDesc || !formProject) return;
    const uploader = users.find((u) => u.id === user?.id) ?? users[0];
    const history = commits.filter((c) => c.filename === formFile && c.projectId === formProject);
    const parent = history[0] ?? null;
    const commit: FileVersion = {
      id: `cm-${Date.now()}`,
      version: `v${history.length + 1}`,
      filename: formFile,
      projectId: formProject,
      uploader,
      description: formDesc,
      diff: formDiff.trim() || formDesc,
      timestamp: new Date().toLocaleString('sv').slice(0, 16),
      size: formAttach ? `${Math.max(1, Math.round(formAttach.size / 1024))}KB` : '—',
      hash: Array.from({ length: 7 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
      parentId: parent ? parent.id : null,
    };

    setSubmitting(true);
    setError(null);
    try {
      let attachment: AttachmentPayload | undefined;
      if (formAttach) {
        attachment = { name: formAttach.name, size: `${Math.max(1, Math.round(formAttach.size / 1024))}KB`, contentBase64: await fileToBase64(formAttach) };
      }
      const creds = { name: user?.name ?? '', password: users.find((u) => u.id === user?.id)?.password ?? '' };
      await createCommit(commit, creds, attachment);
      setUploadForm(false);
      setFormFile(''); setFormDesc(''); setFormDiff(''); setFormProject(''); setFormAttach(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GitCommit className="w-5 h-5 text-[#1868d6]" />
          <h2 className="text-xl font-semibold text-[#f4f4f5]">代码版本控制</h2>
          <span className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-1 rounded-full">
            {filtered.length} 版本
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setUploadForm(!uploadForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1868d6] hover:bg-[#1868d6]/80 text-white text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              上传新版本
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded bg-[#d7244b]/10 border border-[#d7244b]/30 text-xs text-[#d7244b]">{error}</div>
      )}

      {/* Upload Form */}
      {uploadForm && isAdmin && (
        <div className="glass-panel rounded-lg p-5 mb-4 fade-in-up">
          <h3 className="text-sm font-medium text-[#f4f4f5] mb-4">上传新版本</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">文件名</label>
              <input
                type="text"
                value={formFile}
                onChange={(e) => setFormFile(e.target.value)}
                placeholder="例如: umi3d_control.py"
                className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50"
              />
            </div>
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">所属项目</label>
              <select
                value={formProject}
                onChange={(e) => setFormProject(e.target.value)}
                className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] focus:outline-none focus:border-[#1868d6]/50"
              >
                <option value="">选择项目</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#969699] mb-1.5 block">版本描述</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="这个版本做了什么..."
                className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#969699] mb-1.5 block">变更内容 (Diff)</label>
              <textarea
                value={formDiff}
                onChange={(e) => setFormDiff(e.target.value)}
                placeholder="+ 添加了什么&#10;- 移除了什么&#10;* 修改了什么"
                rows={4}
                className="w-full px-3 py-2 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 font-mono resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#969699] mb-1.5 block flex items-center gap-1"><Paperclip className="w-3 h-3" />附件（可选，上传实际文件）</label>
              <input
                type="file"
                onChange={(e) => setFormAttach(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-[#969699] file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[#1868d6]/20 file:text-[#1868d6] file:text-xs file:cursor-pointer hover:file:bg-[#1868d6]/30"
              />
              {formAttach && <p className="text-[10px] text-[#10b981] mt-1">已选择：{formAttach.name}（{Math.max(1, Math.round(formAttach.size / 1024))}KB）</p>}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleUpload}
              disabled={!formFile || !formDesc || !formProject || submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1868d6] hover:bg-[#1868d6]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />上传中...</> : <><Upload className="w-4 h-4" />确认上传（自动递增版本号）</>}
            </button>
          </div>
        </div>
      )}

      {/* Project Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[#969699]" />
        <button
          onClick={() => setFilterProject(null)}
          className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${
            !filterProject ? 'bg-[#1868d6]/20 text-[#1868d6]' : 'bg-[#1f1f22] text-[#969699]'
          }`}
        >
          全部
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilterProject(filterProject === p.id ? null : p.id)}
            className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${
              filterProject === p.id ? '' : 'bg-[#1f1f22] text-[#969699]'
            }`}
            style={filterProject === p.id ? { backgroundColor: getProjectColor(p.id) + '30', color: getProjectColor(p.id) } : {}}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Version Timeline */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-8 h-8 text-[#1868d6] animate-spin mb-3" />
            <p className="text-sm text-[#969699]">加载中...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileCode className="w-10 h-10 text-[#1f1f22] mb-3" />
            <p className="text-sm text-[#969699]">暂无版本记录</p>
            <p className="text-xs text-[#969699] mt-1">{isAdmin ? '点击「上传新版本」提交第一个文件' : '管理员上传后将在此显示'}</p>
          </div>
        ) : Object.entries(grouped).map(([filename, versions]) => (
          <div key={filename} className="glass-panel rounded-lg overflow-hidden">
            {/* File Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1f1f22]">
              <FileCode className="w-5 h-5 text-[#f59e0b]" />
              <span className="text-sm font-mono font-medium text-[#f4f4f5]">{filename}</span>
              <span className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-0.5 rounded-full">
                {versions.length} 版本
              </span>
            </div>

            {/* Version List */}
            <div className="relative pl-8 pr-4 py-3">
              {/* Vertical timeline line */}
              <div className="absolute left-[27px] top-3 bottom-3 w-px bg-[#1f1f22]" />

              {versions.map((v, i) => {
                const isExpanded = expandedVersion === v.id;
                const proj = projects.find((p) => p.id === v.projectId);

                return (
                  <div key={v.id} className="relative mb-3 last:mb-0">
                    {/* Node dot */}
                    <div
                      className="absolute left-[-19px] top-2 w-3 h-3 rounded-full border-2 border-[#050507] z-10"
                      style={{ backgroundColor: i === versions.length - 1 ? '#10b981' : '#1868d6' }}
                    />

                    <div
                      className={`rounded-lg p-3 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-[#111113]' : 'hover:bg-[#111113]/50'
                      }`}
                      onClick={() => setExpandedVersion(isExpanded ? null : v.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[#1868d6] bg-[#1868d6]/10 px-2 py-0.5 rounded">
                          {v.version}
                        </span>
                        <span className="text-sm text-[#f4f4f5]">{v.description}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#969699] ml-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#969699] ml-auto" />
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-[#969699]">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" style={{ color: v.uploader.color }} />
                          <span style={{ color: v.uploader.color }}>{v.uploader.name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" style={{ color: getProjectColor(v.projectId) }} />
                          {proj?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {v.timestamp}
                        </span>
                        <span className="font-mono">{v.size}</span>
                        <span className="font-mono text-[#969699]">{v.hash}</span>

                        {/* Download attachment - 有附件且有下载权限 */}
                        {v.attachment && perm.canDownloadCode && (
                          <a
                            href={`${backendUrl()}/api/${v.attachment.path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3 h-3" />
                            {v.attachment.name}
                          </a>
                        )}
                        {v.attachment && !perm.canDownloadCode && (
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-[#969699]"><Paperclip className="w-3 h-3" />{v.attachment.name}（只读）</span>
                        )}
                        {!v.attachment && (
                          <span className="ml-auto text-[10px] text-[#969699]">无附件</span>
                        )}
                      </div>

                      {/* Expanded Diff */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#1f1f22]">
                          <h4 className="text-[10px] font-mono text-[#969699] uppercase tracking-wider mb-2">
                            变更详情 (Diff)
                          </h4>
                          <pre className="text-xs text-[#f4f4f5] font-mono leading-relaxed bg-[#050507] rounded p-3 whitespace-pre-wrap">
                            {v.diff}
                          </pre>

                          {/* Mini Git Graph for this file */}
                          <div className="mt-3">
                            <h4 className="text-[10px] font-mono text-[#969699] uppercase tracking-wider mb-2">
                              版本演进图
                            </h4>
                            <div className="flex items-center gap-1">
                              {versions.map((vv, vi) => (
                                <div key={vv.id} className="flex items-center">
                                  {vi > 0 && (
                                    <div className="w-6 h-px bg-[#1868d6]" />
                                  )}
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                                      vv.id === v.id
                                        ? 'border-[#1868d6] bg-[#1868d6]/20 text-[#1868d6]'
                                        : 'border-[#1f1f22] bg-[#050507] text-[#969699]'
                                    }`}
                                    title={`${vv.version}: ${vv.description}`}
                                  >
                                    {vv.version.slice(1)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}