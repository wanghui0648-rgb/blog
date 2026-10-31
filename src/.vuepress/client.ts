import { defineClientConfig } from "vuepress/client";
import LoginLayout from "./layouts/LoginLayout.vue";
import { initAuth, useAuth } from "./composables/useAuth";
import { isSupabaseConfigured } from "./supabase";

/** 判断当前地址是否来自「重置密码」邮件链接。 */
const RECOVERY_RE = /(?:^|[?#&])type=recovery(?:&|$)/;

export default defineClientConfig({
  /**
   * 注册自定义页面布局。
   * 页面通过 frontmatter `layout: LoginLayout` 选用它。
   */
  layouts: {
    LoginLayout,
  },

  /**
   * 路由守卫：
   * - `/` 永远先进登录页；已登录则直接去 `/home/`
   * - 未登录访问任何内页都会被打回 `/login/`
   * - 登录用户访问 `/login/` 会自动进入 `/home/`
   *
   * 未配置 Supabase 时不拦截，避免本地无法预览样式。
   */
  enhance({ router }) {
    router.beforeEach(async (to) => {
      if (typeof window === "undefined") return true;

      const path = to.path.replace(/\/+$/, "") || "/";

      // 站点入口：先去登录页，登录后再进 home
      if (path === "/") {
        if (!isSupabaseConfigured) return "/login/";
        await initAuth();
        return useAuth().isAuthenticated.value ? "/home/" : "/login/";
      }

      if (!isSupabaseConfigured) return true;

      await initAuth();
      const { isAuthenticated, recovery } = useAuth();
      const inRecovery = recovery.value || RECOVERY_RE.test(window.location.href);

      if (path === "/login") {
        // 正在重置密码时留在登录页，先完成新密码设置
        if (isAuthenticated.value && !inRecovery) return "/home/";
        return true;
      }

      // 其余页面需要登录后才能访问
      return isAuthenticated.value ? true : "/login/";
    });
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
