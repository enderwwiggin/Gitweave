# GitWeave 后端（Cloudflare Worker + 私有 GitHub 仓库）

让静态前端「新建提交 / 上传新版本」真正写进**私有** GitHub 仓库：
- **管理员**（账号 userRole=admin）：登录后即可提交、上传附件、下载、删除——**无需额外口令**
- **员工**：可查看、可下载，**不能编辑**（账号非管理员 → 服务端返回 401 强制拒绝）
- GitHub 令牌只在 Worker 服务端，**绝不进前端代码**

**已部署并接通**：
- Worker：`https://gitweave-backend.2429910092.workers.dev`
- 数据仓库：`enderwwiggin/gitweave-data`（私有，含 `commits.json` + `attachments/`）
- 前端已内置 Worker 地址，全员打开即"云端"模式

## 鉴权是怎么做的（为什么不用单独口令）

写入请求（新建/删除/上传）由前端自动带上**当前登录账号的用户名+密码**（HTTP 头 `X-Auth-User` / `X-Auth-Pass`，已 URL 编码）。Worker 用密钥 `ADMIN_USERS`（`{"名字":"密码"}`）校验是否管理员：
- 是管理员 → 放行写入
- 员工 / 未登录 / 密码错 → 401

所以管理员只要正常登录 App 就能提交，员工登录也改不了——判断在服务端，前端改不了。

## Cloudflare 环境变量/密钥

| 名称 | 类型 | 值 |
|------|------|-----|
| `GITHUB_TOKEN` | Secret | 对 gitweave-data 有 contents 读写权的令牌（当前复用 gh CLI 令牌） |
| `ADMIN_USERS` | Secret | 管理员账号密码 JSON，如 `{"傅雪影":"fuxueying","赵海涛":"zhaohaitao"}` |
| `DATA_REPO` | Text | `enderwwiggin/gitweave-data` |
| `ALLOW_ORIGIN` | Text | `https://enderwwiggin.github.io` |

## 重新部署 / 改配置

```bash
cd backend
npx wrangler deploy                      # 部署 worker.js
npx wrangler secret put GITHUB_TOKEN     # 改令牌
npx wrangler secret put ADMIN_USERS      # 改管理员名单：粘贴 {"名字":"密码",...}
```

- **加管理员**：把新管理员的「App 登录名:密码」加进 `ADMIN_USERS` 的 JSON 再 `secret put`。
- **改管理员密码**：App 里改该账号密码后，同步更新 `ADMIN_USERS`。

## 安全说明（重要）

- 预置账号密码写在**公开**前端仓库的 mockData 里（如 fuxueying），任何人看公开仓库就能得知 → 目前"管理员"防护强度 ≈ 这些密码的保密度。
- 要真正收紧：把管理员密码改成不在公开仓库里的强密码（App 里改 + 同步 `ADMIN_USERS`），并将 `GITHUB_TOKEN` 换成只授权 `gitweave-data` 的细粒度 PAT。
- `GITHUB_TOKEN` 现复用 gh CLI 令牌；若执行 `gh auth logout` 会导致后端失效。

## 附件

走 GitHub Contents API，单文件建议 < 25MB。更大文件需改用 Git LFS 或对象存储（Cloudflare R2）。

## 本地联调（可选）

`serve.mjs` 用真实令牌在本机跑 `worker.js`（需把 PAT 写到 `/tmp/ghtok.txt`，并在 serve.mjs 里设 ADMIN_USERS），前端指向 `http://localhost:8787`。仅供开发。