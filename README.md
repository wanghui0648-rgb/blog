# Wang Hui 的博客

基于 **VuePress v2 + vuepress-theme-hope** 搭建的个人博客。

- 🌐 线上地址：<https://wanghui-blog.pages.dev>
- 💻 源码仓库：<https://github.com/wanghui0648-rgb/blog>

## 本地开发

要求 Node.js 18+（本机实测 Node 24 可正常运行）。

```bash
npm install
npm run docs:dev      # 本地预览，默认 http://localhost:8080
```

## 构建

```bash
npm run docs:build    # 产物在 src/.vuepress/dist
```

## 登录（Supabase Auth）

本站使用 **Supabase Auth** 提供邮箱密码、邮箱 Magic Link 与 Google 一键登录。相关环境变量通过
`.env.local`（本地）和 GitHub Actions Secrets（线上构建）注入，只有 `VITE_` 前缀的变量会被暴露给前端：

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

本地开发请先 `cp .env.example src/.env.local` 再填入真实值（Vite 以 `src` 为根目录，`.env.local` 必须放在 `src/` 下；该文件不会被提交）。
完整的 Supabase 建项目、Email/Google Provider、Redirect URL 与部署配置见
[登录与评论配置指南](docs/auth-and-comments-setup.md)。

## 评论区（Giscus）

文章底部评论区基于 **Giscus + GitHub Discussions**。开启 Discussions、安装 giscus App 后，在
<https://giscus.app> 生成 `repo / repoId / category / categoryId`，填进 `src/.vuepress/theme.ts` 的
`plugins.comment` 配置即可（注意必须在 `plugins` 内，放顶层会被忽略）。详细步骤见 [登录与评论配置指南](docs/auth-and-comments-setup.md)。

## 目录结构

```
Blog/
├─ src/
│  ├─ index.md                  # 首页（home 布局，heroText / features）
│  ├─ about/README.md           # 关于页
│  ├─ posts/                    # 文章：每个文件夹里的 README.md 就是一篇
│  └─ .vuepress/
│     ├─ config.ts              # 站点配置（标题 / 语言 / base）
│     ├─ theme.ts               # 主题配置（导航 / 侧边栏 / 作者）
│     └─ public/                # 静态资源；图片放这里，md 里用 /xxx.png 引用
├─ package.json
└─ tsconfig.json
```

## 写文章

在 `src/posts/` 下新建文件夹，放一个 `README.md`，frontmatter 写好 `title / date / category / tag`，
主题会自动生成文章页、列表、分类与标签。

```md
---
title: 文章标题
date: 2026-10-29
category:
  - 随笔
tag:
  - 标签
---

正文……
```

## 部署（Cloudflare Pages）

本项目使用 **Wrangler 直传** 部署到 Cloudflare Pages（项目名 `wanghui-blog`）。

- 已配置 GitHub Actions：推送到 `main` 会自动构建并部署。
- 需要在仓库 `Settings → Secrets and variables → Actions` 里配置两个 Secret：
  - `CLOUDFLARE_API_TOKEN`（权限：Account › Cloudflare Pages › Edit）
  - `CLOUDFLARE_ACCOUNT_ID`

本地手动部署（维护用，`_deploy/` 未纳入版本库）：

```powershell
$env:CLOUDFLARE_API_TOKEN = "<your token>"
$env:CLOUDFLARE_ACCOUNT_ID = "<your account id>"
cd _deploy
.\deploy.ps1 -Dist "..\src\.vuepress\dist" -Project "wanghui-blog"
```

> 提示：修改内容后 `git add . && git commit -m "..." && git push`，Actions 会自动上线。

## 管理后台

站长可通过页面**左下角的「🛠 管理」**浮层进入管理后台：点击按钮 → 输入**站长密码** → 进入。

后台包含两块功能：

- **评论管理**：查看所有文章的讨论与评论，支持单条删除和**批量删除**（评论、讨论均可批量）。
- **内容管理**：浏览 `src/` 下的 Markdown 文件与目录树，支持**新建文件 / 文件夹**、**删除 / 批量删除**文件夹与文件。

注意事项：

- 内容的新建 / 删除会提交到 GitHub `main`，触发 GitHub Actions 自动重建，约 **1–2 分钟**后线上生效，请稍等再刷新查看。
- 后台后端由 Cloudflare Pages Functions（`functions/` 目录）提供，随部署一起上传；所需密钥 `ADMIN_PASSWORD`、`GITHUB_TOKEN` 在 Cloudflare Pages 项目的环境变量中配置（真实值不入库）。
- 站长密码请勿外泄；删除评论仅限站长操作（评论作者本人也可在 giscus 气泡菜单或 GitHub Discussions 中自删）。
