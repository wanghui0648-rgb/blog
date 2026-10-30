import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 客户端（惰性单例）。
 *
 * SSR 安全约定：
 * - 模块顶层只读取 `import.meta.env`（由 Vite 在构建期静态替换），
 *   绝不触碰 window / localStorage / document。
 * - 真正的 `createClient()` 只在浏览器端（`typeof window !== "undefined"`）
 *   且已配置环境变量时才被创建，因此静态构建（SSG 预渲染）阶段不会执行。
 */

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/** 是否已正确配置 Supabase（URL 与 anon key 均存在）。 */
export const isSupabaseConfigured: boolean = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

/**
 * 获取 Supabase 客户端。
 * - 服务端（SSR/构建）返回 `null`
 * - 未配置环境变量返回 `null`
 * - 浏览器端首次调用时惰性创建单例
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;

  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}

/**
 * 登录成功后应该回跳的地址。
 * 使用当前站点 origin + `/login/`（本站 base 为 `/`）。
 */
export function getLoginRedirectUrl(): string {
  if (typeof window === "undefined") return "/login/";
  return `${window.location.origin}/login/`;
}
