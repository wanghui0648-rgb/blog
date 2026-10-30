import { hopeTheme } from "vuepress-theme-hope";

export default hopeTheme({
  hostname: "https://wanghui-blog.pages.dev",
  author: {
    name: "Wang Hui",
  },
  logo: "/logo.svg",
  navbar: [
    { text: "首页", link: "/" },
    { text: "文章", link: "/posts/" },
    { text: "关于", link: "/about/" },
    { text: "登录", link: "/login/" },
  ],
  sidebar: "structure",
  markdown: {
    align: true,
    codeTabs: true,
  },
  plugins: {
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
      category: "Announcements",
      categoryId: "DIC_kwDOVbeE7s4DJ9t-",
      mapping: "pathname",
      strict: false,
      reactionsEnabled: true,
      inputPosition: "top",
      lazyLoading: true,
    },
  },
});
