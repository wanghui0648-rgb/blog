import { hopeTheme } from "vuepress-theme-hope";

export default hopeTheme({
  hostname: "https://wanghui-blog.pages.dev",
  author: {
    name: "Wang Hui",
  },
  logo: "/logo-sketch.svg",
  darkmode: "disable",
  // 站点主页实际位于 /home/；访问根路径 / 时会先进入登录页。
  home: "/home/",
  navbar: [
    { text: "首页", link: "/home/" },
    { text: "文章", link: "/posts/" },
    { text: "关于", link: "/about/" },
  ],
  sidebar: "structure",
  markdown: {
    align: true,
    codeTabs: true,
  },
  plugins: {
    // 图标默认使用 Phosphor 图标集（名字里不带前缀时自动补全 ph:）
    icon: {
      prefix: "ph:",
    },
    blog: true,
    // 评论区配置（Giscus）
    // 注意：comment 必须放在 plugins 里，放在顶层会被 theme-hope 静默忽略。
    // 说明：以下 4 个值需要你到 https://giscus.app 获取后替换为真实值：
    //   repo        —— GitHub 仓库，格式为 "用户名/仓库名"
    //   repoId      —— giscus.app 生成的仓库 ID
    //   category    —— Discussions 分类名称
    //   categoryId  —— giscus.app 生成的分类 ID
    // 前提条件：该 GitHub 仓库必须已开启 Discussions 功能，并已安装 giscus GitHub App，
    // 否则评论区无法正常加载。请务必将下面带 REPLACE_WITH_ 前缀的占位符替换掉。
    comment: {
      provider: "Giscus",
      repo: "wanghui0648-rgb/blog",
      repoId: "R_kgDOVbeE7g",
      // Announcements 分类仅允许维护者创建 discussion，普通登录用户无法发评论/表情；
      // 改用 General（与下方 categoryId 对应，且已有的 discussion 就在 General）。
      category: "General",
      categoryId: "DIC_kwDOVbeE7s4DJ9t-",
      mapping: "pathname",
      strict: false,
      reactionsEnabled: true,
      inputPosition: "top",
      lazyLoading: true,
    },
  },
});
