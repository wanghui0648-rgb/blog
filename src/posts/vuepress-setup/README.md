---
title: 用 VuePress theme-hope 搭建个人博客
date: 2026-10-27
icon: code
category:
  - 教程
tag:
  - VuePress
  - theme-hope
  - 前端
---

# 用 VuePress theme-hope 搭建个人博客

这篇文章记录我用 **VuePress v2** + **vuepress-theme-hope** 搭建这个博客的全过程，尽量写得可以直接照做。

## 一、为什么选这套组合

- **VuePress v2**：基于 Vue 3 + Vite，构建快，Markdown 写作体验好，静态输出可直接托管。
- **theme-hope**：在 VuePress 基础上补齐了博客列表、文章标签/分类、评论、暗黑模式、搜索、SEO 等一整套能力，几乎开箱即用。

相比手写 HTML 或折腾动态博客，这套方案**内容即代码**，适合我这种只想专注写作的人。

## 二、环境准备

需要 Node.js LTS（建议 18+）和包管理器。以 pnpm 为例：

```bash
node -v        # 确认版本 >= 18
npm i -g pnpm  # 安装 pnpm（也可用 npm / yarn）
```

## 三、初始化项目

theme-hope 提供了脚手架，一条命令生成完整项目结构：

```bash
pnpm create vuepress-theme-hope my-blog
cd my-blog
pnpm install
pnpm docs:dev     # 本地预览，默认 http://localhost:8080
```

生成的关键目录大致如下：

```
my-blog/
├─ src/                  # 源目录（写内容的地方）
│  ├─ index.md           # 首页（home: true）
│  ├─ posts/             # 博客文章
│  └─ .vuepress/
│     ├─ config.ts       # 站点与主题配置
│     └─ public/         # 静态资源（logo、图片）
└─ package.json
```

## 四、配置导航与侧边栏

打开 `src/.vuepress/config.ts`，在 `hopeTheme({ ... })` 里配置 `navbar` 与 `sidebar`：

```ts
import { defineUserConfig } from "vuepress";
import { hopeTheme } from "vuepress-theme-hope";

export default defineUserConfig({
  theme: hopeTheme({
    navbar: [
      { text: "首页", link: "/" },
      { text: "关于", link: "/about/" },
      { text: "文章", link: "/posts/" },
    ],
    sidebar: {
      "/posts/": ["hello-blog/README.md", "vuepress-setup/README.md"],
    },
  }),
});
```

> 提示：`sidebar` 支持按路径前缀分组，也可以直接写成数组应用于全站。改完记得重启 `docs:dev`。

## 五、写一篇文章

每篇文章就是一个文件夹 + `README.md`，例如 `src/posts/hello-blog/README.md`：

```md
---
title: 你好，世界
date: 2026-10-29
category:
  - 随笔
tag:
  - 建站
---

正文从这里开始……
```

frontmatter 里的 `title`、`date`、`category`、`tag` 会被 theme-hope 自动用于生成文章列表、归档和标签页。

## 六、构建与部署

```bash
pnpm docs:build    # 产物在 src/.vuepress/dist
```

把 `dist` 推到 GitHub，用 **GitHub Pages** 托管即可，也可以交给 GitHub Actions 自动化。我的做法是：

1. 新建 GitHub 仓库（如 `blog`）；
2. 本地 `git init` 并关联远程仓库；
3. 构建后把 `dist` 发布到 `gh-pages` 分支，或在仓库设置里选择 GitHub Actions 自动部署。

## 七、几个小建议

- 首页用 `home: true` + `heroText` / `features` 就能做出漂亮的落地页；
- 图片统一放 `src/.vuepress/public/`，引用用绝对路径（如 `/images/a.png`）；
- 提交前把 `node_modules`、`dist`、`.vuepress/cache` 加进 `.gitignore`；
- 坚持写，比把主题折腾到完美更重要。

希望这篇记录对想搭博客的你有帮助，欢迎在评论区交流 🙂
