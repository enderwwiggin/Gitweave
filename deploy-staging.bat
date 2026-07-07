@echo off
REM GitWeave 测试镜像部署脚本
REM 用法: deploy-staging.bat
REM 部署前端到 GitHub Pages + 后端到 Cloudflare Worker

echo ========================================
echo  GitWeave Staging Deploy
echo ========================================

REM 1. 构建前端（指向 staging worker）
echo [1/3] Building frontend with staging backend URL...
cd /d "D:\Projects\团队协作配置\app"
set VITE_BACKEND_URL=https://gitweave-backend-staging.2429910092.workers.dev
call npx vite build
if errorlevel 1 (echo Build FAILED & exit /b 1)

REM 2. 部署 Worker
echo [2/3] Deploying staging worker...
cd /d "D:\Projects\团队协作配置\backend"
call npx wrangler deploy --config wrangler.staging.toml
if errorlevel 1 (echo Worker deploy FAILED & exit /b 1)

REM 3. 复制构建产物到 gh-pages-deploy-staging 并推送
echo [3/3] Deploying frontend to GitHub Pages (staging)...
cd /d "D:\Projects\团队协作配置"
copy /Y app\dist\index.html gh-pages-deploy-staging\index.html
copy /Y app\dist\assets\* gh-pages-deploy-staging\assets\
del /Q gh-pages-deploy-staging\assets\index-*.js 2>nul
copy /Y app\dist\assets\*.js gh-pages-deploy-staging\assets\
copy /Y app\dist\assets\*.css gh-pages-deploy-staging\assets\

cd /d "D:\Projects\团队协作配置\gh-pages-deploy-staging"
git add -A
git commit -m "staging deploy: %date% %time%"
git push origin gh-pages

echo.
echo ========================================
echo  Staging deployed successfully!
echo  Frontend: https://enderwwiggin.github.io/Gitweave-staging/
echo  Backend:  https://gitweave-backend-staging.2429910092.workers.dev
echo ========================================