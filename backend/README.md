# GitWeave 后端（Cloudflare Worker + 私有 GitHub 仓库）

让静态前端「新建提交」真正写进**私有** GitHub 仓库，并保证：
- **管理员**（口令持有者）：可新建/删除提交、上传附件、下载
- **员工**：可查看、可下载，**不能编辑**（浏览器里没有口令，服务端强制拒绝写入）
- GitHub 令牌只存在 Worker 服务端，**绝不进前端代码**

数据仓库：`enderwwiggin/gitweave-data`（私有，已创建，含 `commits.json` 和 `attachments/`）。

---

## 一、创建 GitHub 令牌（PAT）

1. 打开 https://github.com/settings/tokens?type=beta →「Generate new token」（Fine-grained）
2. Repository access → Only select repositories →勾选 **gitweave-data**
3. Permissions → Repository permissions → **Contents: Read and write**
4. 生成，复制令牌（`github_pat_...`），只显示一次

## 二、部署 Worker（二选一）

### 方式 A：Cloudflare 网页控制台（无需命令行，推荐）

1. 注册/登录 https://dash.cloudflare.com → 左侧 **Workers & Pages** →「Create」→「Create Worker」
2. 起个名字（如 `gitweave-backend`）→ Deploy（先部署占位）
3. 进入该 Worker →「Edit code」→ 把本目录 `worker.js` 全部内容粘贴进去 → Save & Deploy
4. 回到 Worker →「Settings」→「Variables and Secrets」，添加：
   - `GITHUB_TOKEN`  → 类型 **Secret** → 粘贴第一步的令牌
   - `ADMIN_PASSPHRASE` → 类型 **Secret** → 自定义一个管理员口令（如 `Umi@2026!`）
   - `DATA_REPO` → 类型 Text → `enderwwiggin/gitweave-data`
   - `ALLOW_ORIGIN` → 类型 Text → `https://enderwwiggin.github.io`
5. 复制 Worker 地址（形如 `https://gitweave-backend.你的子域.workers.dev`）

### 方式 B：命令行（wrangler）

```bash
cd backend
npx wrangler deploy
npx wrangler secret put GITHUB_TOKEN        # 粘贴 PAT
npx wrangler secret put ADMIN_PASSPHRASE    # 输入管理员口令
# DATA_REPO / ALLOW_ORIGIN 已在 wrangler.toml 的 [vars] 中
```

## 三、把地址接到前端

拿到 Worker 地址后，**二选一**：

- **推荐（团队生效）**：把地址发我，我填进 `app/src/lib/backend.ts` 的 `BAKED_BACKEND_URL` 并重新部署——之后所有员工打开即读云端，无需各自配置。
- **临时/自测**：登录后进「代码提交」→ 右上角 ⚙ →「后端设置」，填 Worker 地址（管理员再填口令）保存。仅当前浏览器生效。

## 四、日常使用

- **管理员**：⚙ 里填一次 Worker 地址 + 管理员口令（口令只存本机浏览器）。之后「+ 新建提交」可选文件作附件，提交即写入私有仓库。
- **员工**：直接看到提交列表，点附件即下载；看不到「新建提交/删除/设置」。

## 权限与边界

- 读取（列表/下载）走 Worker，无需口令——Worker 地址即门槛。
- 写入/删除必须带正确 `ADMIN_PASSPHRASE`，否则服务端返回 401。员工无口令 → 物理上无法写入。
- 附件走 GitHub Contents API，单文件建议 < 25MB（GitHub 限制）。更大文件需改用 Git LFS 或对象存储（R2）。
- `worker.js`、`wrangler.toml` 不含任何密钥，可安全提交到公开仓库；密钥只在 Cloudflare 里。

## 本地联调（可选）

`serve.mjs` 可在本机用真实令牌跑 `worker.js`（需先把 PAT 写到 `/tmp/ghtok.txt`），前端 ⚙ 指向 `http://localhost:8787` 即可测试。仅供开发。