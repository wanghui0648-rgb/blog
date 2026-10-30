import { defineClientConfig } from "vuepress/client";
import LoginLayout from "./layouts/LoginLayout.vue";
import { initAuth } from "./composables/useAuth";

export default defineClientConfig({
  /**
   * 注册自定义页面布局。
   * 页面通过 frontmatter `layout: LoginLayout` 选用它。
   */
  layouts: {
    LoginLayout,
  },

  /**
   * 客户端应用启动时初始化一次认证状态监听。
   * `defineClientConfig` 的 setup 在服务端（SSG 预渲染）也会执行，
   * 因此必须判断 `typeof window`，保证 SSR 安全。
   */
  setup() {
    if (typeof window !== "undefined") {
      void initAuth();
    }
  },
});
