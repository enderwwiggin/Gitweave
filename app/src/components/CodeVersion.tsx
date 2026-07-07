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
  FolderOpen,
} from 'lucide-react';
import { getProjectColor } from '@/data/mockData';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import type { FileVersion } from '@/types';
import { backendUrl, fetchCommits, createCommit, readFolderFiles, type FolderFilePayload } from '@/lib/backend';
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
  const [refreshKey] = useState(0);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formFolderName, setFormFolderName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiff, setFormDiff] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formFiles, setFormFiles] = useState<FolderFilePayload[]>([]);
  const [formFileCount, setFormFileCount] = useState(0);
  const [formTotalKB, setFormTotalKB] = useState(0);
  const [formReading, setFormReading] = useState(false);

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

  const handleFolderSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setFormReading(true);
    try {
      const first = fileList[0];
      const folderName = (first.webkitRelativePath || first.name).split('/')[0] || '项目文件夹';
      const { files, error: readErr } = await readFolderFiles(fileList);
      if (readErr) { setError(readErr); setFormFiles([]); setFormFileCount(0); setFormTotalKB(0); setFormFolderName(''); return; }
      const totalKB = Array.from(fileList).reduce((s, f) => s + f.size, 0) / 1024;
      setFormFolderName(folderName);
      setFormFiles(files);
      setFormFileCount(files.length);
      setFormTotalKB(Math.round(totalKB));
    } finally {
      setFormReading(false);
    }
  };

  const handleUpload = async () => {
    if (formFiles.length === 0 || !formProject) return;
    const uploader = users.find((u) => u.id === user?.id) ?? users[0];
    const history = commits.filter((c) => c.filename === formFolderName && c.projectId === formProject);
    const parent = history[0] ?? null;
    const proj = projects.find((p) => p.id === formProject);
    const commit: FileVersion = {
      id: `cm-${Date.now()}`,
      version: `v0.0.${history.length + 1}`,
      filename: formFolderName,
      projectId: formProject,
      projectName: proj?.name,
      projectDescription: proj?.description,
      uploader,
      description: formDesc.trim() || '文件夹提交',
      diff: formDiff.trim() || (formDesc.trim() || '文件夹提交'),
      timestamp: new Date().toLocaleString('sv').slice(0, 16),
      size: formTotalKB >= 1024 ? `${(formTotalKB / 1024).toFixed(1)}MB` : `${formTotalKB}KB`,
      hash: Array.from({ length: 7 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
      parentId: parent ? parent.id : null,
    };

    setSubmitting(true);
    setError(null);
    try {
      const creds = { name: user?.name ?? '', password: users.find((u) => u.id === user?.id)?.password ?? '' };
      const saved = await createCommit(commit, creds, formFiles, commits);
      setCommits((prev) => [saved, ...prev]); // 用后端返回的版本号/附件路径覆盖本地
      setUploadForm(false);
      setFormFolderName(''); setFormDesc(''); setFormDiff(''); setFormProject('');
      setFormFiles([]); setFormFileCount(0); setFormTotalKB(0);
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
          <h2 className="text-xl font-semibold text-[#f4f4f5]">项目文件上传</h2>
          <span className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-1 rounded-full">
            {filtered.length} 版本
          </span>
        </div>
        <div className="flex items-center gap-3">
          {perm.canUploadCode && (
            <button
              onClick={() => setUploadForm(!uploadForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1868d6] hover:bg-[#1868d6]/80 text-white text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              上传项目文件
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded bg-[#d7244b]/10 border border-[#d7244b]/30 text-xs text-[#d7244b]">{error}</div>
      )}

      {/* Upload Form */}
      {uploadForm && perm.canUploadCode && (
        <div className="glass-panel rounded-lg p-5 mb-4 fade-in-up">
          <h3 className="text-sm font-medium text-[#f4f4f5] mb-4">上传项目文件</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">所属项目 *</label>
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
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block flex items-center gap-1"><FolderOpen className="w-3 h-3" />项目文件夹 *</label>
              <input
                type="file"
                /* @ts-expect-error 非标准属性，用于选择整个文件夹 */
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => handleFolderSelect(e.target.files)}
                className="w-full text-xs text-[#969699] file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[#1868d6]/20 file:text-[#1868d6] file:text-xs file:cursor-pointer hover:file:bg-[#1868d6]/30"
              />
            </div>
            <div className="col-span-2">
              {formReading && <p className="text-[10px] text-[#1868d6] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />正在读取文件夹...</p>}
              {!formReading && formFileCount > 0 && (
                <p className="text-[10px] text-[#10b981]">
                  已选择文件夹「{formFolderName}」：{formFileCount} 个文件，共 {formTotalKB >= 1024 ? `${(formTotalKB / 1024).toFixed(1)}MB` : `${formTotalKB}KB`}（禁止上传压缩包）
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#969699] mb-1.5 block">提交说明（可选）</label>
              <input type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="这个版本做了什么..."
                className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#969699] mb-1.5 block">变更内容 (Diff，可选)</label>
              <textarea
                value={formDiff}
                onChange={(e) => setFormDiff(e.target.value)}
                placeholder="+ 添加了什么&#10;- 移除了什么&#10;* 修改了什么"
                rows={4}
                className="w-full px-3 py-2 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 font-mono resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end items-center gap-3 mt-4">
            {uploadForm && perm.canUploadCode && (formFiles.length === 0 || !formProject) && !formReading && !submitting && (
              <span className="text-xs text-[#f59e0b]">需选择所属项目并选择项目文件夹后才能上传</span>
            )}
            <button
              onClick={handleUpload}
              disabled={formFiles.length === 0 || !formProject || formReading || submitting}
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
            <p className="text-xs text-[#969699] mt-1">点击「上传项目文件」提交第一个文件</p>
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

                        {/* 文件夹附件 - 显示文件数量 */}
                        {v.attachments && v.attachments.length > 0 ? (
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-[#10b981]">
                            <FolderOpen className="w-3 h-3" />{v.attachments.length} 个文件{!perm.canDownloadCode && '（只读）'}
                          </span>
                        ) : (
                          <span className="ml-auto text-[10px] text-[#969699]">无文件</span>
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

                          {/* 文件夹内文件下载列表 */}
                          {v.attachments && v.attachments.length > 0 && perm.canDownloadCode && (
                            <div className="mt-3">
                              <h4 className="text-[10px] font-mono text-[#969699] uppercase tracking-wider mb-2">
                                项目文件（{v.attachments.length}）
                              </h4>
                              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-thin">
                                {v.attachments.map((att) => (
                                  <a key={att.path} href={`${backendUrl()}/api/${att.path}`} target="_blank" rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2 px-2 py-1 rounded bg-[#050507] hover:bg-[#1868d6]/10 text-xs text-[#1868d6] transition-colors">
                                    <Download className="w-3 h-3 shrink-0" />
                                    <span className="font-mono truncate">{att.name}</span>
                                    <span className="ml-auto text-[10px] text-[#969699] shrink-0">{att.size}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

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