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
