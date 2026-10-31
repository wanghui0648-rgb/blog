import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import theme from "./theme.js";

export default defineUserConfig({
  lang: "zh-CN",
  title: "Wang Hui 的博客",
  description: "记录学习与生活的个人博客",
  base: "/",
  bundler: viteBundler(),
  head: [
    ["link", { rel: "icon", href: "/logo-sketch.svg" }],
    [
      "link",
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/comic-neuelatin-400-normal.woff2",
        crossorigin: "",
      },
    ],
    [
      "link",
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/caveatlatin-700-normal.woff2",
        crossorigin: "",
      },
    ],
  ],
  theme,
});
