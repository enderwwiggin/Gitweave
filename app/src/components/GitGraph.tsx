import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { gitNodes, getProjectColor } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { GitBranch, FolderKanban, Filter, Plus, X, GitCommit, FolderOpen, Download, Trash2, Loader2, RefreshCw } from 'lucide-react';
import type { FileVersion } from '@/types';
import { backendUrl, fetchCommits, createCommit, deleteCommit, readFolderFiles, type FolderFilePayload } from '@/lib/backend';
import { useProjects } from '@/hooks/useProjects';

interface TooltipData {
  x: number;
  y: number;
  version: FileVersion;
}

const COMMITS_KEY = 'gitweave_commits';

// 未配置后端时的本地演示数据（localStorage）
function loadLocalCommits(): FileVersion[] {
  try {
    const s = localStorage.getItem(COMMITS_KEY);
    return s ? (JSON.parse(s) as FileVersion[]) : [];
  } catch {
    return [];
  }
}

export default function GitGraph() {
  const { user, users } = useAuth();
  const { projects } = useProjects();
  const isAdmin = user?.userRole === 'admin';
  const backendOn = backendUrl().length > 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [commits, setCommits] = useState<FileVersion[]>(() => (backendUrl().length > 0 ? [] : loadLocalCommits()));
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const linesGroupRef = useRef<THREE.Group | null>(null);

  // 新建提交表单（整个项目文件夹）
  const [fProject, setFProject] = useState('');
  const [fFolderName, setFFolderName] = useState(''); // 项目文件夹名称（自动从所选文件夹提取）
  const [fMessage, setFMessage] = useState('');
  const [fDiff, setFDiff] = useState('');
  const [fFiles, setFFiles] = useState<FolderFilePayload[]>([]);
  const [fFileCount, setFFileCount] = useState(0);
  const [fTotalKB, setFTotalKB] = useState(0);
  const [fReading, setFReading] = useState(false);


  // 后端模式：初次 / 刷新 / backendOn 变化时异步加载（demo 模式已在 init 时同步加载）
  useEffect(() => {
    if (!backendOn) return;
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
  }, [backendOn, refreshKey]);

  // 演示模式下持久化到 localStorage
  useEffect(() => {
    if (!backendOn) {
      try { localStorage.setItem(COMMITS_KEY, JSON.stringify(commits)); } catch { /* ignore */ }
    }
  }, [commits, backendOn]);

  const filteredVersions = useMemo(() => {
    return filterProject ? commits.filter((v) => v.projectId === filterProject) : commits;
  }, [filterProject, commits]);

  const resetForm = () => {
    setFProject(''); setFFolderName(''); setFMessage(''); setFDiff('');
    setFFiles([]); setFFileCount(0); setFTotalKB(0); setFReading(false);
  };

  const handleFolderSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setFReading(true);
    try {
      // 从第一个文件的相对路径提取文件夹名
      const first = fileList[0];
      const folderName = (first.webkitRelativePath || first.name).split('/')[0] || '项目文件夹';
      const { files, error: readErr } = await readFolderFiles(fileList);
      if (readErr) { setError(readErr); setFFiles([]); setFFileCount(0); setFTotalKB(0); setFFolderName(''); return; }
      const totalKB = Array.from(fileList).reduce((s, f) => s + f.size, 0) / 1024;
      setFFolderName(folderName);
      setFFiles(files);
      setFFileCount(files.length);
      setFTotalKB(Math.round(totalKB));
    } finally {
      setFReading(false);
    }
  };

  const handleCreate = async () => {
    if (!fProject || fFiles.length === 0) return;
    const uploader = users.find((u) => u.id === user?.id) ?? users[0];
    const history = commits.filter((c) => c.projectId === fProject && c.filename === fFolderName);
    const parent = history[0] ?? null;
    const proj = projects.find((p) => p.id === fProject);
    const commit: FileVersion = {
      id: `cm-${Date.now()}`,
      version: `v0.0.${history.length + 1}`,
      filename: fFolderName,
      projectId: fProject,
      projectName: proj?.name,
      projectDescription: proj?.description,
      uploader,
      description: fMessage.trim() || '文件夹提交',
      diff: fDiff.trim() || (fMessage.trim() || '文件夹提交'),
      timestamp: new Date().toLocaleString('sv').slice(0, 16),
      size: fTotalKB >= 1024 ? `${(fTotalKB / 1024).toFixed(1)}MB` : `${fTotalKB}KB`,
      hash: Array.from({ length: 7 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
      parentId: parent ? parent.id : null,
    };

    if (!backendOn) {
      setCommits((prev) => [commit, ...prev]);
      resetForm();
      setShowModal(false);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const saved = await createCommit(commit, { name: user?.name ?? '', password: users.find((u) => u.id === user?.id)?.password ?? '' }, fFiles, commits);
      setCommits((prev) => [saved, ...prev]); // 乐观更新，避免写后读缓存陈旧
      resetForm();
      setShowModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!backendOn) {
      setCommits((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    try {
      await deleteCommit(id, { name: user?.name ?? '', password: users.find((u) => u.id === user?.id)?.password ?? '' });
      setCommits((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };


  // Three.js 3D 背景（装饰性，基于 gitNodes，与提交数据无关）
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.z = 200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const linesGroup = new THREE.Group();
    scene.add(linesGroup);
    linesGroupRef.current = linesGroup;

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1868d6, transparent: true, opacity: 0.35 });
    const circleGeometry = new THREE.CircleGeometry(4, 32);
    const linesCache = new Map<string, THREE.Line>();

    function updateLines() {
      linesCache.forEach((l) => linesGroup.remove(l));
      linesCache.clear();

      const w = container!.clientWidth;
      const h = container!.clientHeight;

      for (let i = 0; i < gitNodes.length; i++) {
        for (let j = i + 1; j < gitNodes.length; j++) {
          if (Math.random() > 0.6) continue;
          const start = new THREE.Vector3(gitNodes[i].x - w / 2, h / 2 - gitNodes[i].y, 0);
          const end = new THREE.Vector3(gitNodes[j].x - w / 2, h / 2 - gitNodes[j].y, 0);
          const mid = new THREE.Vector3().lerpVectors(start, end, 0.5).add(new THREE.Vector3(0, 0, Math.random() * 100 - 50));
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
          const line = new THREE.Line(lineGeo, lineMaterial);
          linesGroup.add(line);
          linesCache.set(`${i}-${j}`, line);
        }
      }

      const w2 = container!.clientWidth;
      const h2 = container!.clientHeight;
      const spanCandidates: { x: number; y: number; z: number }[] = [];
      for (let y = 0; y < h2; y += 12) {
        for (let x = 0; x < w2; x += 12) {
          let nearLine = false;
          for (let i = 0; i < gitNodes.length && !nearLine; i++) {
            for (let j = i + 1; j < gitNodes.length && !nearLine; j++) {
              const dx = gitNodes[j].x - gitNodes[i].x;
              const dy = gitNodes[j].y - gitNodes[i].y;
              const dist = Math.abs(dy * x - dx * y + gitNodes[j].x * gitNodes[i].y - gitNodes[j].y * gitNodes[i].x) / Math.sqrt(dx * dx + dy * dy);
              if (dist < 6) nearLine = true;
            }
          }
          if (nearLine || Math.random() > 0.97) {
            spanCandidates.push({ x: x - w2 / 2, y: h2 / 2 - y, z: 0 });
          }
        }
      }
      for (let i = spanCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spanCandidates[i], spanCandidates[j]] = [spanCandidates[j], spanCandidates[i]];
      }
      const spans = spanCandidates.slice(0, 150);

      const dotGeo = new THREE.CircleGeometry(1.5, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
      spans.forEach((s) => {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(s.x, s.y, s.z);
        linesGroup.add(dot);
      });

      gitNodes.forEach((n) => {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
        const mesh = new THREE.Mesh(circleGeometry, mat);
        mesh.position.set(n.x - w / 2, h / 2 - n.y, 0);
        scene.add(mesh);
      });
    }

    updateLines();

    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      linesGroup.rotation.z += 0.00015;
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY;
      if (linesGroupRef.current) {
        const velocity = scrollY * 0.001;
        linesGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
            child.position.y -= velocity * 0.1;
          }
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
      <div ref={canvasContainerRef} className="absolute inset-0 opacity-40" style={{ zIndex: 0 }} />
      <div className="relative z-10 h-full overflow-y-auto scrollbar-thin p-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-sm font-mono text-[#969699] tracking-wider uppercase flex-shrink-0 flex items-center gap-2">
            代码提交
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-sans ${backendOn ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#1f1f22] text-[#969699]'}`}>
              {backendOn ? '云端' : '本地'}
            </span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Filter className="w-3.5 h-3.5 text-[#969699]" />
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
            {backendOn && (
              <button onClick={() => setRefreshKey((k) => k + 1)} title="刷新" className="p-1 rounded-full bg-[#1f1f22] text-[#969699] hover:text-[#f4f4f5] transition-colors">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium bg-[#1868d6] hover:bg-[#1868d6]/80 text-white transition-colors">
                <Plus className="w-3 h-3" />新建提交
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 rounded bg-[#d7244b]/10 border border-[#d7244b]/30 text-xs text-[#d7244b] flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-8 h-8 text-[#1868d6] animate-spin mb-3" />
            <p className="text-sm text-[#969699]">加载中...</p>
          </div>
        ) : filteredVersions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GitCommit className="w-10 h-10 text-[#1f1f22] mb-3" />
            <p className="text-sm text-[#969699]">暂无提交记录</p>
            <p className="text-xs text-[#969699] mt-1">
              {isAdmin ? '点击右上角「新建提交」创建第一条提交' : '管理员创建提交后将在此显示'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVersions.map((version, index) => {
              const projColor = getProjectColor(version.projectId);
              const proj = projects.find((p) => p.id === version.projectId);
              return (
                <div key={version.id} className="commit-node glass-panel rounded-lg p-3 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, version })}
                  onMouseLeave={() => setTooltip(null)}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: version.uploader.color }}>
                      <span className="text-xs font-bold text-white">{version.uploader.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: projColor + '20', color: projColor }}>
                          <FolderKanban className="w-3 h-3" />{proj?.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#1868d6] bg-[#1868d6]/10 px-1.5 py-0.5 rounded">{version.version}</span>
                        {isAdmin && (
                          <button onClick={() => handleDelete(version.id)} title="删除提交"
                            className="ml-auto opacity-0 group-hover:opacity-100 text-[#969699] hover:text-[#d7244b] transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-[#f4f4f5] truncate">{version.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-[#969699]">{version.hash}</span>
                        <span className="text-xs text-[#969699]">•</span>
                        <span className="text-xs text-[#969699]">{version.timestamp}</span>
                        <span className="text-xs text-[#969699]">•</span>
                        <span className="text-xs font-mono text-[#969699]">{version.size}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-[#969699] bg-[#1f1f22] px-1.5 py-0.5 rounded">
                          <GitBranch className="w-3 h-3" />{version.filename}
                        </span>
                        {version.attachments && version.attachments.length > 0 && (
                          <>
                            <span className="inline-flex items-center gap-1 text-xs font-mono text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                              <FolderOpen className="w-3 h-3" />{version.attachments.length} 个文件
                            </span>
                            {version.attachments.map((att) => (
                              <a key={att.path} href={`${backendUrl()}/api/${att.path}`} target="_blank" rel="noreferrer" title={att.name}
                                className="inline-flex items-center gap-1 text-xs font-mono text-[#1868d6] bg-[#1868d6]/10 px-1.5 py-0.5 rounded hover:bg-[#1868d6]/20 transition-colors max-w-[180px] truncate">
                                <Download className="w-3 h-3 shrink-0" /><span className="truncate">{att.name}</span>
                              </a>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredVersions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-mono text-[#969699] mb-4 tracking-wider uppercase">Branch Graph</h3>
            <div className="relative">
              <svg className="w-full" viewBox={`0 0 350 ${filteredVersions.length * 40 + 20}`} preserveAspectRatio="xMinYMin meet">
                <line x1="30" y1="20" x2="30" y2={filteredVersions.length * 40 - 20 + 20} stroke="#1868d6" strokeWidth="2" opacity="0.5" />
                {filteredVersions.map((c, i) => {
                  const cy = 20 + i * 40;
                  const color = getProjectColor(c.projectId);
                  return (
                    <g key={c.id}>
                      <circle cx="30" cy={cy} r="6" fill={color} stroke="#050507" strokeWidth="2" className="pulse-dot" style={{ animationDelay: `${i * 150}ms` }} />
                      <text x="46" y={cy - 1} fill="#f4f4f5" fontSize="11" fontFamily="JetBrains Mono, monospace">{c.hash} · {c.version}</text>
                      <text x="46" y={cy + 12} fill="#969699" fontSize="9">{c.description.length > 44 ? c.description.slice(0, 44) + '…' : c.description}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {tooltip && (
        <div className="fixed z-50 glass-panel rounded-lg p-3 max-w-xs pointer-events-none" style={{ left: tooltip.x + 16, top: tooltip.y - 16 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getProjectColor(tooltip.version.projectId) }} />
            <span className="text-[10px] text-[#969699]">{projects.find((p) => p.id === tooltip.version.projectId)?.name}</span>
          </div>
          <p className="text-sm font-mono text-[#1868d6] mb-1">{tooltip.version.version}: {tooltip.version.hash}</p>
          <p className="text-xs text-[#f4f4f5] mb-2">{tooltip.version.description}</p>
          {tooltip.version.diff && tooltip.version.diff !== tooltip.version.description && (
            <pre className="text-[10px] text-[#969699] whitespace-pre-wrap mb-2 font-mono">{tooltip.version.diff}</pre>
          )}
          <div className="flex items-center gap-2 text-xs text-[#969699]">
            <span>{tooltip.version.filename}</span>
            <span>{tooltip.version.size}</span>
          </div>
        </div>
      )}

      {/* 新建提交弹窗 —— 仅管理员 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !submitting && setShowModal(false)}>
          <div className="glass-panel rounded-xl w-full max-w-md p-5 fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#f4f4f5] flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#1868d6]" />新建提交
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#969699] hover:text-[#f4f4f5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#969699] mb-1 block">所属项目 *</label>
                <select value={fProject} onChange={(e) => setFProject(e.target.value)}
                  className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] focus:outline-none focus:border-[#1868d6]/50">
                  <option value="">选择项目...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#969699] mb-1 block flex items-center gap-1"><FolderOpen className="w-3 h-3" />项目文件夹 *（上传整个文件夹，禁止压缩包）</label>
                <input
                  type="file"
                  /* @ts-expect-error 非标准属性，用于选择整个文件夹 */
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(e) => handleFolderSelect(e.target.files)}
                  className="w-full text-xs text-[#969699] file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[#1868d6]/20 file:text-[#1868d6] file:text-xs file:cursor-pointer hover:file:bg-[#1868d6]/30"
                />
                {fReading && <p className="text-[10px] text-[#1868d6] mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />正在读取文件夹...</p>}
                {!fReading && fFileCount > 0 && (
                  <p className="text-[10px] text-[#10b981] mt-1">
                    已选择文件夹「{fFolderName}」：{fFileCount} 个文件，共 {fTotalKB >= 1024 ? `${(fTotalKB / 1024).toFixed(1)}MB` : `${fTotalKB}KB`}
                  </p>
                )}
                {!backendOn && <p className="text-[10px] text-[#d7244b] mt-1">本地模式不支持上传，请先配置后端</p>}
              </div>
              <div>
                <label className="text-xs text-[#969699] mb-1 block">提交说明（可选）</label>
                <input type="text" value={fMessage} onChange={(e) => setFMessage(e.target.value)} placeholder="简要描述本次提交（可选）"
                  className="w-full h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50" />
              </div>
              <div>
                <label className="text-xs text-[#969699] mb-1 block">变更详情（可选）</label>
                <textarea value={fDiff} onChange={(e) => setFDiff(e.target.value)} rows={2} placeholder="可将 Agent 跑完后的变更报告粘贴至此..."
                  className="w-full px-3 py-2 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 resize-none font-mono" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} disabled={submitting}
                className="flex-1 h-9 rounded border border-[#1f1f22] text-sm text-[#969699] hover:text-[#f4f4f5] hover:border-[#969699]/40 transition-colors disabled:opacity-40">取消</button>
              <button onClick={handleCreate} disabled={!fProject || fFiles.length === 0 || fReading || submitting}
                className="flex-1 h-9 rounded bg-[#1868d6] hover:bg-[#1868d6]/80 disabled:opacity-40 text-sm font-medium text-white transition-colors flex items-center justify-center gap-1">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />提交中...</> : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}