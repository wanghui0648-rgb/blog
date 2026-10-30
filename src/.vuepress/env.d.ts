/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase 项目 URL，例如 https://xxxx.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase 匿名公钥（anon key） */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
