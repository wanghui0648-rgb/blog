import { computed, ref } from "vue";
import type { Session, User } from "@supabase/supabase-js";
import { getLoginRedirectUrl, getSupabase, isSupabaseConfigured } from "../supabase";

/**
 * 全局共享的认证状态。
 * 放在模块作用域，保证不同组件 / 不同页面使用同一份状态。
 */
const user = ref<User | null>(null);
const session = ref<Session | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const message = ref<string | null>(null);
const initialized = ref(false);

/** 仅保存一次 onAuthStateChange 订阅，避免重复监听。 */
let authSubscription: { unsubscribe: () => void } | null = null;

const NOT_CONFIGURED =
  "Supabase 尚未配置。请在项目根目录创建 .env.local，并填写 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY。";

/** 把 Supabase / 网络错误翻译成友好的中文提示。 */
function toFriendlyError(err: unknown): string {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "";
  const lower = raw.toLowerCase();

  if (!raw) return "操作失败，请稍后重试。";
  if (lower.includes("invalid login credentials")) return "邮箱或密码错误，请检查后重试。";
  if (lower.includes("email not confirmed")) return "邮箱尚未验证，请先查收验证邮件并点击确认链接。";
  if (lower.includes("user already registered")) return "该邮箱已注册，请直接登录。";
  if (lower.includes("password should be at least")) return "密码至少需要 6 位字符。";
  if (lower.includes("unable to validate email") || lower.includes("invalid email"))
    return "邮箱格式不正确，请重新输入。";
  if (lower.includes("rate limit") || lower.includes("for security purposes"))
    return "操作过于频繁，请稍后再试。";
  if (lower.includes("provider is not enabled") || lower.includes("unsupported provider"))
    return "该登录方式尚未在 Supabase 后台启用。";
  if (lower.includes("network") || lower.includes("failed to fetch"))
    return "网络异常，请检查网络后重试。";
  return `操作失败：${raw}`;
}

function resetFeedback(): void {
  error.value = null;
  message.value = null;
}

/** 初始化任务的单例 Promise，保证「只执行一次」，并支持并发调用时共享结果。 */
let initPromise: Promise<void> | null = null;

/**
 * 初始化认证：读取已存在的会话，并订阅一次登录状态变化。
 * 只在浏览器端执行（客户端组件 onMounted / client.ts setup 中调用），
 * 多次调用只会真正执行一次。
 */
export function initAuth(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) {
      initialized.value = true;
      return;
    }

    try {
      // 先订阅状态变化，再读取当前会话（避免遗漏初始化期间的登录事件）。
      if (!authSubscription) {
        const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
          session.value = newSession;
          user.value = newSession?.user ?? null;
        });
        authSubscription = data.subscription;
      }

      const { data } = await supabase.auth.getSession();
      session.value = data.session;
      user.value = data.session?.user ?? null;
    } catch (err) {
      error.value = toFriendlyError(err);
    } finally {
      initialized.value = true;
    }
  })();

  return initPromise;
}

/** 邮箱 + 密码登录。成功返回 true。 */
async function signInWithEmail(email: string, password: string): Promise<boolean> {
  resetFeedback();
  const supabase = getSupabase();
  if (!supabase) {
    error.value = NOT_CONFIGURED;
    return false;
  }
  loading.value = true;
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    message.value = "登录成功，正在跳转…";
    return true;
  } catch (err) {
    error.value = toFriendlyError(err);
    return false;
  } finally {
    loading.value = false;
  }
}

/** 邮箱 + 密码注册。成功返回 true（若开启了邮箱验证，需用户查收邮件）。 */
async function signUpWithEmail(email: string, password: string): Promise<boolean> {
  resetFeedback();
  const supabase = getSupabase();
  if (!supabase) {
    error.value = NOT_CONFIGURED;
    return false;
  }
  loading.value = true;
  try {
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;
    if (data.session) {
      message.value = "注册成功，正在跳转…";
    } else {
      message.value = "注册成功！请查收验证邮件并点击链接完成验证。";
    }
    return true;
  } catch (err) {
    error.value = toFriendlyError(err);
    return false;
  } finally {
    loading.value = false;
  }
}

/** 发送邮箱魔法链接登录。成功返回 true。 */
async function signInWithMagicLink(email: string): Promise<boolean> {
  resetFeedback();
  const supabase = getSupabase();
  if (!supabase) {
    error.value = NOT_CONFIGURED;
    return false;
  }
  loading.value = true;
  try {
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getLoginRedirectUrl() },
    });
    if (authError) throw authError;
    message.value = "魔法链接已发送，请查收邮箱并点击链接登录。";
    return true;
  } catch (err) {
    error.value = toFriendlyError(err);
    return false;
  } finally {
    loading.value = false;
  }
}

/**
 * Google OAuth 登录。
 * 浏览器会跳转到 Google 授权页，成功后回跳到 /login/。
 */
async function signInWithGoogle(): Promise<boolean> {
  resetFeedback();
  const supabase = getSupabase();
  if (!supabase) {
    error.value = NOT_CONFIGURED;
    return false;
  }
  loading.value = true;
  try {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getLoginRedirectUrl() },
    });
    if (authError) throw authError;
    return true;
  } catch (err) {
    error.value = toFriendlyError(err);
    return false;
  } finally {
    loading.value = false;
  }
}

/** 退出登录。 */
async function signOut(): Promise<void> {
  resetFeedback();
  const supabase = getSupabase();
  if (!supabase) return;
  loading.value = true;
  try {
    const { error: authError } = await supabase.auth.signOut();
    if (authError) throw authError;
    user.value = null;
    session.value = null;
    message.value = "已退出登录。";
  } catch (err) {
    error.value = toFriendlyError(err);
  } finally {
    loading.value = false;
  }
}

const isAuthenticated = computed<boolean>(() => user.value !== null);

/**
 * 组合式函数：在组件中通过 `const auth = useAuth()` 使用。
 * 返回的 ref 为共享单例，任何组件修改都会同步到其他组件。
 */
export function useAuth() {
  return {
    // 状态
    user,
    session,
    loading,
    error,
    message,
    initialized,
    isAuthenticated,
    // 配置
    isSupabaseConfigured,
    // 方法
    initAuth,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
  };
}
