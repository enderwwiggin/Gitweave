import type { FileVersion, Project } from '@/types';

// 后端代理（Cloudflare Worker）客户端
// 令牌在 Worker 服务端。写入需带登录账号密码，Worker 校验是否管理员。

const URL_KEY = 'gitweave_backend_url';

// 已部署的团队后端地址（员工无需配置即可读取）。为空则回退 localStorage 演示模式。
const BAKED_BACKEND_URL = 'https://gitweave-backend.2429910092.workers.dev';

export function backendUrl(): string {
  const v = (localStorage.getItem(URL_KEY) || BAKED_BACKEND_URL).trim();
  return v.replace(/\/+$/, '');
}

export interface AuthCreds {
  name: string;
  password: string;
}

function authHeaders(creds: AuthCreds): Record<string, string> {
  return {
    'X-Auth-User': encodeURIComponent(creds.name),
    'X-Auth-Pass': encodeURIComponent(creds.password),
  };
}

export async function fetchCommits(): Promise<FileVersion[]> {
  const res = await fetch(`${backendUrl()}/api/commits`);
  if (!res.ok) throw new Error(`读取提交失败: ${res.status}`);
  const data = await res.json();
  return (data.commits as FileVersion[]) ?? [];
}

export interface AttachmentPayload {
  name: string;
  size: string;
  contentBase64: string;
}

// 整个项目文件夹中的单个文件
export interface FolderFilePayload {
  relativePath: string; // 相对文件夹根的路径，如 "src/main.py"
  size: string;
  contentBase64: string;
}

// 计算项目下一个版本号（与 Worker 逻辑一致）
function nextProjectVersion(commits: FileVersion[], projectId: string): string {
  const versions = commits
    .filter((c) => c.projectId === projectId)
    .map((c) => {
      const m = String(c.version || '').match(/v0\.0\.(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    });
  const max = versions.length ? Math.max(...versions) : 0;
  return `v0.0.${max + 1}`;
}

export async function createCommit(
  commit: FileVersion,
  creds: AuthCreds,
  files?: FolderFilePayload[],
  existingCommits?: FileVersion[],
): Promise<FileVersion> {
  // 先算版本号，逐文件上传到 R2（避免大请求体超 Worker CPU 限制）
  const version = nextProjectVersion(existingCommits ?? [], commit.projectId);
  const projectName = commit.projectName || commit.projectId;

  const uploadedFiles: { relativePath: string; size: string }[] = [];
  if (files && files.length > 0) {
    // 并发上传，限制并发数避免请求堆积
    const CONCURRENCY = 4;
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(async (f) => {
        const res = await fetch(`${backendUrl()}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(creds) },
          body: JSON.stringify({
            projectName,
            version,
            relativePath: f.relativePath,
            contentBase64: f.contentBase64,
            size: f.size,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `文件上传失败: ${res.status}`);
        return { relativePath: f.relativePath, size: f.size } satisfies { relativePath: string; size: string };
      }));
      uploadedFiles.push(...results);
    }
  }

  // 提交元数据（文件已上传，只传路径/大小）
  const res = await fetch(`${backendUrl()}/api/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(creds) },
    body: JSON.stringify({ commit, files: uploadedFiles }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `提交失败: ${res.status}`);
  return data.commit as FileVersion;
}

export async function deleteCommit(id: string, creds: AuthCreds): Promise<void> {
  const res = await fetch(`${backendUrl()}/api/commits/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `删除失败: ${res.status}`);
  }
}

// ===== 项目（覆盖层：added 新增 + removedIds 移除的预置项目）=====
export interface ProjectOverrides {
  added: Project[];
  removedIds: string[];
}

export async function fetchProjectOverrides(): Promise<ProjectOverrides> {
  const res = await fetch(`${backendUrl()}/api/projects`);
  if (!res.ok) throw new Error(`读取项目失败: ${res.status}`);
  const data = await res.json();
  return { added: (data.added as Project[]) ?? [], removedIds: (data.removedIds as string[]) ?? [] };
}

export async function addProject(project: Project, creds: AuthCreds): Promise<Project> {
  const res = await fetch(`${backendUrl()}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(creds) },
    body: JSON.stringify({ project }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `新建项目失败: ${res.status}`);
  return data.project as Project;
}

export async function removeProject(id: string, creds: AuthCreds): Promise<void> {
  const res = await fetch(`${backendUrl()}/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `移除项目失败: ${res.status}`);
  }
}

// 读取用户选择的文件为 base64（去掉 data: 前缀），用于上传附件
export function fileToBase64(file: File): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
  reader.readAsDataURL(file);
  return promise;
}

// 压缩文件扩展名（禁止上传）
export const COMPRESSED_EXTS = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz', '.tar.gz', '.tar.bz2', '.cab', '.iso', '.lz', '.lzma', '.z'];

export function isCompressedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return COMPRESSED_EXTS.some((ext) => lower.endsWith(ext));
}

// 读取整个文件夹（webkitdirectory 选择）为 FolderFilePayload 数组
// 返回 { files, error }：若含压缩文件则返回 error，files 为空
export async function readFolderFiles(fileList: FileList | File[]): Promise<{ files: FolderFilePayload[]; error?: string }> {
  const arr = Array.from(fileList);
  // 校验：禁止压缩文件
  const compressed = arr.find((f) => isCompressedFile(f.name));
  if (compressed) {
    return { files: [], error: `禁止上传压缩文件：${compressed.name}。请上传解压后的整个项目文件夹。` };
  }
  const files = await Promise.all(arr.map(async (f) => {
    // webkitRelativePath 形如 "项目文件夹/src/main.py"，去掉首层文件夹名保留内部结构
    const rel = (f.webkitRelativePath || f.name).split('/').slice(1).join('/') || f.name;
    return {
      relativePath: rel,
      size: `${Math.max(1, Math.round(f.size / 1024))}KB`,
      contentBase64: await fileToBase64(f),
    } satisfies FolderFilePayload;
  }));
  return { files };
}