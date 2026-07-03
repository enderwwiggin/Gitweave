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

export async function createCommit(commit: FileVersion, creds: AuthCreds, attachment?: AttachmentPayload): Promise<FileVersion> {
  const res = await fetch(`${backendUrl()}/api/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(creds) },
    body: JSON.stringify({ commit, attachment }),
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