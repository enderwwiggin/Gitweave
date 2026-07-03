// 本地运行真实 worker.js（对真私有仓库），用于端到端验证前端
import worker from './worker.js';
import { createServer } from 'node:http';
import fs from 'node:fs';

const TOKEN = fs.readFileSync('/tmp/ghtok.txt', 'utf8').trim();
const env = {
  GITHUB_TOKEN: TOKEN,
  DATA_REPO: 'enderwwiggin/gitweave-data',
  ADMIN_USERS: '{"傅雪影":"fuxueying","赵海涛":"zhaohaitao"}',
  ALLOW_ORIGIN: '*',
};

const server = createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://localhost:8787${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
    });
    const resp = await worker.fetch(request, env);
    const buf = Buffer.from(await resp.arrayBuffer());
    const headers = {};
    resp.headers.forEach((v, k) => { headers[k] = v; });
    res.writeHead(resp.status, headers);
    res.end(buf);
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});
server.listen(8787, () => console.log('worker harness on http://localhost:8787 (ADMIN_PASSPHRASE=testkey123)'));