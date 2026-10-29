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
  ],
  sidebar: "structure",
  markdown: {
    align: true,
    codeTabs: true,
  },
  plugins: {
    blog: true,
  },
});
