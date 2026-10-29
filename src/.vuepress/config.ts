import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import theme from "./theme.js";

export default defineUserConfig({
  lang: "zh-CN",
  title: "Wang Hui 的博客",
  description: "记录学习与生活的个人博客",
  base: "/",
  bundler: viteBundler(),
  theme,
});
