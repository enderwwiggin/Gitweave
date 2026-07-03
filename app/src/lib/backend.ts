import type { FileVersion } from '@/types';

// 后端代理（Cloudflare Worker）客户端
// 令牌在 Worker 服务端，前端只跟 Worker 通信。

const URL_KEY = 'gitweave_backend_url';
const ADMIN_KEY = 'gitweave_admin_key';

// 部署 Worker 后把 URL 填在这里作为团队默认值（员工无需手动配置即可读取）。
// 为空时前端回退到 localStorage 演示模式。
const BAKED_BACKEND_URL = '';

export function backendUrl(): string {
  const v = (localStorage.getItem(URL_KEY) || BAKED_BACKEND_URL).trim();
  return v.replace(/\/+$/, '');
}

export function getAdminKey(): string {
  return localStorage.getItem(ADMIN_KEY) || '';
}

export function saveBackendConfig(url: string, adminKey: string): void {
  localStorage.setItem(URL_KEY, url.trim());
  localStorage.setItem(ADMIN_KEY, adminKey);
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

export async function createCommit(commit: FileVersion, attachment?: AttachmentPayload): Promise<FileVersion> {
  const res = await fetch(`${backendUrl()}/api/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': getAdminKey() },
    body: JSON.stringify({ commit, attachment }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `提交失败: ${res.status}`);
  return data.commit as FileVersion;
}

export async function deleteCommit(id: string): Promise<void> {
  const res = await fetch(`${backendUrl()}/api/commits/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': getAdminKey() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `删除失败: ${res.status}`);
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