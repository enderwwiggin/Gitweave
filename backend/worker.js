/**
 * GitWeave 后端代理 (Cloudflare Worker)
 * ------------------------------------------------------------
 * 作用：让静态前端「新建提交」真正写进【私有】GitHub 仓库，且令牌不暴露。
 *
 * 需要在 Cloudflare 里配置的环境变量/密钥：
 *   GITHUB_TOKEN      —— 对私有数据仓库有 contents 读写权限的 PAT（设为 Secret）
 *   ADMIN_PASSPHRASE  —— 管理员口令，只有它才能写入/删除（设为 Secret）
 *   DATA_REPO         —— 数据仓库，如 "enderwwiggin/gitweave-data"（普通变量）
 *   ALLOW_ORIGIN      —— 允许的前端来源，如 "https://enderwwiggin.github.io"（普通变量，可选，默认 *）
 *
 * 权限模型：
 *   - 读取（GET 提交列表 / 下载附件）：无需口令（Worker URL 即门槛）
 *   - 写入（新建/删除提交、上传附件）：必须带 X-Admin-Key === ADMIN_PASSPHRASE
 *     → 员工浏览器里没有该口令，物理上无法写入，"员工只读"在服务端强制生效。
 */

const GH_API = 'https://api.github.com';

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-User, X-Auth-Pass',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(env) },
  });
}

// 用 TEAM_USERS（{name:{password,role}}）校验登录账号
// 名称/密码可能含中文，前端用 encodeURIComponent 编码，这里解码
function authUser(env, request) {
  let users;
  try {
    users = JSON.parse(env.TEAM_USERS || '{}');
  } catch {
    users = {};
  }
  const name = decodeURIComponent(request.headers.get('X-Auth-User') || '');
  const pass = decodeURIComponent(request.headers.get('X-Auth-Pass') || '');
  const u = name ? users[name] : null;
  if (!u || u.password !== pass) return null;
  return { name, role: u.role || 'member' };
}
function isAdmin(env, request) {
  const u = authUser(env, request);
  return !!u && u.role === 'admin';
}
function isMember(env, request) {
  return !!authUser(env, request);
}

// UTF-8 安全的 base64（提交说明含中文）
function b64encodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}
function b64decodeUtf8(b64) {
  const clean = b64.replace(/\n/g, '');
  return new TextDecoder().decode(Uint8Array.from(atob(clean), (c) => c.charCodeAt(0)));
}

// 读私有仓库文件（带 cache-buster，缓解 GitHub Contents API 写后读缓存陈旧）
async function ghGet(env, path) {
  const res = await fetch(`${GH_API}/repos/${env.DATA_REPO}/contents/${path}?t=${Date.now()}`, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'gitweave-worker',
      'Cache-Control': 'no-cache',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} 失败: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ghPut(env, path, contentB64, message, sha) {
  const body = { message, content: contentB64 };
  if (sha) body.sha = sha;
  const res = await fetch(`${GH_API}/repos/${env.DATA_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'gitweave-worker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} 失败: ${res.status} ${await res.text()}`);
  return res.json();
}

// 单次提交写入多个文件（附件+commits.json 合并为一个 commit）
// 避免产生两个独立 commit（attach xxx / commit xxx），仓库历史更干净
async function ghBatchCommit(env, files, message) {
  // files: [{ path, contentBase64 }]
  // 1. 获取当前 HEAD 和基础 tree
  const refRes = await fetch(`${GH_API}/repos/${env.DATA_REPO}/git/ref/heads/main`, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'gitweave-worker' },
  });
  if (!refRes.ok) throw new Error(`获取 ref 失败: ${refRes.status} ${await refRes.text()}`);
  const refData = await refRes.json();
  const baseCommitSha = refData.object.sha;

  const commitRes = await fetch(`${GH_API}/repos/${env.DATA_REPO}/git/commits/${baseCommitSha}`, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'gitweave-worker' },
  });
  if (!commitRes.ok) throw new Error(`获取 commit 失败: ${commitRes.status} ${await commitRes.text()}`);
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 2. 为每个文件创建 blob
  const treeEntries = [];
  for (const f of files) {
    const blobRes = await fetch(`${GH_API}/repos/${env.DATA_REPO}/git/blobs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'gitweave-worker', 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: f.contentBase64, encoding: 'base64' }),
    });
    if (!blobRes.ok) throw new Error(`创建 blob ${f.path} 失败: ${blobRes.status} ${await blobRes.text()}`);
    const blobData = await blobRes.json();
    treeEntries.push({ path: f.path, mode: '100644', type: 'blob', sha: blobData.sha });
  }

  // 3. 创建新 tree（基于旧 tree + 新增/修改的条目）
  const treeRes = await fetch(`${GH_API}/repos/${env.DATA_REPO}/git/trees`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'gitweave-worker', 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });
  if (!treeRes.ok) throw new Error(`创建 tree 失败: ${treeRes.status} ${await treeRes.text()}`);
  const treeData = await treeRes.json();

  // 4. 创建 commit
  const newCommitRes = await fetch(`${GH_API}/repos/${env.DATA_REPO}/git/commits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'gitweave-worker', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tree: treeData.sha, parents: [baseCommitSha] }),
  });
  if (!newCommitRes.ok) throw new Error(`创建 commit 失败: ${newCommitRes.status} ${await newCommitRes.text()}`);
  const newCommitData = await newCommitRes.json();

  // 5. 更新 ref
  const updateRefRes = await fetch(`${GH_API}/repos/${env.DATA_REPO}/git/refs/heads/main`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'gitweave-worker', 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: newCommitData.sha, force: false }),
  });
  if (!updateRefRes.ok) throw new Error(`更新 ref 失败: ${updateRefRes.status} ${await updateRefRes.text()}`);

  return newCommitData;
}


// 生成附件路径：attachments/项目名称/版本号/文件名
// 版本号按项目递增，从 v0.0.1 开始
function nextProjectVersion(commits, projectId) {
  const versions = (commits || [])
    .filter((c) => c.projectId === projectId)
    .map((c) => {
      const m = String(c.version || '').match(/v0\.0\.(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    });
  const max = versions.length ? Math.max(...versions) : 0;
  return `v0.0.${max + 1}`;
}
function safePathName(name) {
  return String(name || 'unknown').replace(/[^\w.\-\u4e00-\u9fa5]/g, '_');
}

async function readCommits(env) {
  const file = await ghGet(env, 'commits.json');
  if (!file) return { commits: [], sha: null };
  return { commits: JSON.parse(b64decodeUtf8(file.content)), sha: file.sha };
}

async function readProjects(env) {
  const file = await ghGet(env, 'projects.json');
  if (!file) return { data: { added: [], removedIds: [] }, sha: null };
  return { data: JSON.parse(b64decodeUtf8(file.content)), sha: file.sha };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    try {
      // 读取提交列表
      if (pathname === '/api/commits' && request.method === 'GET') {
        const { commits } = await readCommits(env);
        return json({ commits }, env);
      }

      // 新建提交（管理员）
      if (pathname === '/api/commits' && request.method === 'POST') {
        if (!isAdmin(env, request)) {
          return json({ error: '无权限：请用管理员账号登录后再提交' }, env, 401);
        }
        const payload = await request.json();
        const commit = payload.commit;
        if (!commit || !commit.id) return json({ error: '缺少 commit 数据' }, env, 400);

        // 先读取 commits.json，以便按项目生成版本号
        const { commits, sha } = await readCommits(env);
        const version = nextProjectVersion(commits, commit.projectId);
        commit.version = version;

        // 附件：上传到 R2（不限量，零出站费）
        const projectName = safePathName(commit.projectName || commit.projectId);
        const incoming = Array.isArray(payload.files) ? payload.files : [];
        if (payload.attachment && payload.attachment.contentBase64) {
          incoming.push({ relativePath: payload.attachment.name, contentBase64: payload.attachment.contentBase64, size: payload.attachment.size });
        }
        const attachments = [];
        for (const f of incoming) {
          if (!f || !f.contentBase64) continue;
          const rel = String(f.relativePath || f.name || 'file')
            .split('/')
            .map((seg) => safePathName(seg))
            .join('/');
          const key = `attachments/${projectName}/${version}/${rel}`;
          const bin = Uint8Array.from(atob(f.contentBase64), (c) => c.charCodeAt(0));
          await env.ATTACHMENTS.put(key, bin);
          attachments.push({ name: f.relativePath || f.name || rel, path: key, size: f.size || '' });
        }
        if (attachments.length) commit.attachments = attachments;

        // 只写 commits.json 到 GitHub（附件已存 R2）
        const next = [commit, ...commits];
        const uploader = commit.uploader || {};
        const uploaderInfo = [uploader.name, uploader.phone, uploader.email].filter(Boolean).join(' ');
        const message = `commit ${version} by ${uploaderInfo || 'unknown'}: ${commit.description || '文件提交'}`;
        await ghPut(env, 'commits.json', b64encodeUtf8(JSON.stringify(next, null, 2)), message, sha);
        return json({ ok: true, commit }, env);
      }

      // 删除提交（管理员）
      if (pathname.startsWith('/api/commits/') && request.method === 'DELETE') {
        if (!isAdmin(env, request)) {
          return json({ error: '无权限：仅管理员可删除提交' }, env, 401);
        }
        const id = decodeURIComponent(pathname.split('/').pop());
        const { commits, sha } = await readCommits(env);
        const target = commits.find((c) => c.id === id);
        // 清理 R2 中的附件
        if (target && target.attachments) {
          for (const att of target.attachments) {
            try { await env.ATTACHMENTS.delete(att.path); } catch { /* R2 delete best-effort */ }
          }
        }
        const next = commits.filter((c) => c.id !== id);
        await ghPut(env, 'commits.json', b64encodeUtf8(JSON.stringify(next, null, 2)), `delete commit ${id}`, sha);
        return json({ ok: true }, env);
      }

      // 下载附件（读取，Worker 用令牌代理私有仓库文件）
      // 下载附件（从 R2 读取，零出站费）
      if (pathname.startsWith('/api/attachments/') && request.method === 'GET') {
        const key = pathname.replace('/api/', '');
        const obj = await env.ATTACHMENTS.get(key);
        if (!obj) return json({ error: '附件不存在' }, env, 404);
        const name = key.split('/').pop();
        return new Response(obj.body, {
          headers: {
            'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(name || 'file')}"`,
            'Cache-Control': 'public, max-age=31536000',
            ...cors(env),
          },
        });
      }

      // 项目覆盖层（读取，开放）：added=新增项目，removedIds=被移除的预置项目id
      if (pathname === '/api/projects' && request.method === 'GET') {
        const { data } = await readProjects(env);
        return json({ added: data.added || [], removedIds: data.removedIds || [] }, env);
      }

      // 新建项目（任意登录成员）
      if (pathname === '/api/projects' && request.method === 'POST') {
        if (!isMember(env, request)) {
          return json({ error: '无权限：请登录后再新建项目' }, env, 401);
        }
        const payload = await request.json();
        const project = payload.project;
        if (!project || !project.id) return json({ error: '缺少 project 数据' }, env, 400);
        const { data, sha } = await readProjects(env);
        const added = [...(data.added || []), project];
        const removedIds = (data.removedIds || []).filter((x) => x !== project.id);
        await ghPut(env, 'projects.json', b64encodeUtf8(JSON.stringify({ added, removedIds }, null, 2)), `add project ${project.name}`, sha);
        return json({ ok: true, project }, env);
      }

      // 移除项目（管理员）：预置项目记入 removedIds，新增项目直接删除
      if (pathname.startsWith('/api/projects/') && request.method === 'DELETE') {
        if (!isAdmin(env, request)) {
          return json({ error: '无权限：仅管理员可移除项目' }, env, 401);
        }
        const id = decodeURIComponent(pathname.split('/').pop());
        const { data, sha } = await readProjects(env);
        const prevAdded = data.added || [];
        const added = prevAdded.filter((p) => p.id !== id);
        const removedIds = added.length === prevAdded.length
          ? [...new Set([...(data.removedIds || []), id])]
          : (data.removedIds || []);
        await ghPut(env, 'projects.json', b64encodeUtf8(JSON.stringify({ added, removedIds }, null, 2)), `remove project ${id}`, sha);
        return json({ ok: true }, env);
      }

      return json({ error: 'Not found' }, env, 404);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, env, 500);
    }
  },
};