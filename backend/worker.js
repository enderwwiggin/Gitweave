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

        // 附件：先写文件，再把路径记进 commit
        if (payload.attachment && payload.attachment.contentBase64) {
          const safeName = payload.attachment.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, '_');
          const apath = `attachments/${commit.id}/${safeName}`;
          await ghPut(env, apath, payload.attachment.contentBase64, `attach ${safeName} for ${commit.id}`);
          commit.attachment = { name: payload.attachment.name, path: apath, size: payload.attachment.size || '' };
        }

        const { commits, sha } = await readCommits(env);
        const next = [commit, ...commits];
        await ghPut(env, 'commits.json', b64encodeUtf8(JSON.stringify(next, null, 2)), `commit ${commit.hash} (${commit.description})`, sha);
        return json({ ok: true, commit }, env);
      }

      // 删除提交（管理员）
      if (pathname.startsWith('/api/commits/') && request.method === 'DELETE') {
        if (!isAdmin(env, request)) {
          return json({ error: '无权限：仅管理员可删除提交' }, env, 401);
        }
        const id = decodeURIComponent(pathname.split('/').pop());
        const { commits, sha } = await readCommits(env);
        const next = commits.filter((c) => c.id !== id);
        await ghPut(env, 'commits.json', b64encodeUtf8(JSON.stringify(next, null, 2)), `delete commit ${id}`, sha);
        return json({ ok: true }, env);
      }

      // 下载附件（读取，Worker 用令牌代理私有仓库文件）
      if (pathname.startsWith('/api/attachments/') && request.method === 'GET') {
        const apath = pathname.replace('/api/', '');
        const file = await ghGet(env, apath);
        if (!file) return json({ error: '附件不存在' }, env, 404);
        const bytes = Uint8Array.from(atob(file.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
        const name = apath.split('/').pop();
        return new Response(bytes, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
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