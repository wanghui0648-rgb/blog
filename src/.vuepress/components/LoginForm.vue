<template>
  <div class="auth-card">
    <header class="auth-head">
      <h1 class="auth-title">{{ mode === "signin" ? "欢迎回来" : "创建账户" }}</h1>
      <p class="auth-subtitle">
        {{ mode === "signin" ? "登录后即可参与评论与互动" : "注册一个账号，开启你的阅读之旅" }}
      </p>
    </header>

    <!-- 未配置 Supabase 时的友好提示 -->
    <div v-if="!isSupabaseConfigured" class="auth-notice" role="alert">
      <strong>登录功能尚未配置</strong>
      <p>请在项目根目录创建 <code>.env.local</code>，并填写以下两项：</p>
      <ul>
        <li><code>VITE_SUPABASE_URL</code></li>
        <li><code>VITE_SUPABASE_ANON_KEY</code></li>
      </ul>
      <p>保存后重启开发服务器即可启用邮箱与 Google 登录。</p>
    </div>

    <template v-else>
      <div class="auth-tabs" role="tablist" aria-label="登录或注册">
        <button
          type="button"
          class="auth-tab"
          :class="{ active: mode === 'signin' }"
          role="tab"
          :aria-selected="mode === 'signin'"
          @click="switchMode('signin')"
        >
          登录
        </button>
        <button
          type="button"
          class="auth-tab"
          :class="{ active: mode === 'signup' }"
          role="tab"
          :aria-selected="mode === 'signup'"
          @click="switchMode('signup')"
        >
          注册
        </button>
      </div>

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <label class="auth-field">
          <span class="auth-label">邮箱</span>
          <input
            v-model.trim="email"
            class="auth-input"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="loading"
          />
        </label>

        <label class="auth-field">
          <span class="auth-label">密码</span>
          <input
            v-model="password"
            class="auth-input"
            type="password"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            placeholder="至少 6 位字符"
            :disabled="loading"
          />
        </label>

        <button type="submit" class="auth-btn primary" :disabled="loading">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          {{ loading ? "处理中…" : mode === "signin" ? "登录" : "注册" }}
        </button>
      </form>

      <div class="auth-divider"><span>或</span></div>

      <button type="button" class="auth-btn google" :disabled="loading" @click="handleGoogle">
        <svg class="google-icon" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        使用 Google 登录
      </button>

      <button type="button" class="auth-link" :disabled="loading" @click="handleMagicLink">
        使用邮箱魔法链接登录
      </button>

      <p v-if="error" class="auth-msg error" role="alert">{{ error }}</p>
      <p v-else-if="message" class="auth-msg success" role="status">{{ message }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vuepress/client";
import { useAuth } from "../composables/useAuth";

type AuthMode = "signin" | "signup";

const router = useRouter();
const {
  loading,
  error,
  message,
  isAuthenticated,
  isSupabaseConfigured,
  initAuth,
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
} = useAuth();

const mode = ref<AuthMode>("signin");
const email = ref("");
const password = ref("");

function switchMode(next: AuthMode): void {
  if (mode.value === next) return;
  mode.value = next;
  password.value = "";
  error.value = null;
  message.value = null;
}

async function handleSubmit(): Promise<void> {
  error.value = null;
  message.value = null;

  if (!email.value) {
    error.value = "请输入邮箱地址。";
    return;
  }
  if (!password.value) {
    error.value = "请输入密码。";
    return;
  }

  const ok =
    mode.value === "signin"
      ? await signInWithEmail(email.value, password.value)
      : await signUpWithEmail(email.value, password.value);

  // 登录成功 / 注册后已直接获得会话 -> 跳转首页
  if (ok && (mode.value === "signin" || isAuthenticated.value)) {
    await router.push("/");
  }
}

async function handleMagicLink(): Promise<void> {
  error.value = null;
  message.value = null;
  if (!email.value) {
    error.value = "请先填写邮箱地址，再获取魔法链接。";
    return;
  }
  await signInWithMagicLink(email.value);
}

async function handleGoogle(): Promise<void> {
  error.value = null;
  message.value = null;
  await signInWithGoogle();
}

onMounted(async () => {
  await initAuth();
  // 已登录用户直接回首页
  if (isAuthenticated.value) {
    await router.push("/");
  }
});
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2.25rem 2rem;
  border-radius: 18px;
  background: var(--vp-c-bg-elv, var(--vp-c-bg, #ffffff));
  border: 1px solid var(--vp-c-border, rgba(127, 127, 127, 0.18));
  box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.32);
  color: var(--vp-c-text-1, #1f2328);
}

.auth-head {
  margin-bottom: 1.5rem;
  text-align: center;
}

.auth-title {
  margin: 0 0 0.4rem;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--vp-c-text-1, #1f2328);
}

.auth-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #57606a);
}

/* 未配置提示 */
.auth-notice {
  padding: 1rem 1.1rem;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--theme-color, #3b82f6) 35%, transparent);
  background: color-mix(in srgb, var(--theme-color, #3b82f6) 8%, transparent);
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--vp-c-text-1, #1f2328);
}
.auth-notice p {
  margin: 0.5rem 0;
}
.auth-notice ul {
  margin: 0.4rem 0;
  padding-left: 1.2rem;
}
.auth-notice code {
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: var(--vp-c-bg-soft, rgba(127, 127, 127, 0.14));
  font-size: 0.85em;
}

/* 选项卡 */
.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
  padding: 0.25rem;
  margin-bottom: 1.4rem;
  border-radius: 12px;
  background: var(--vp-c-bg-soft, rgba(127, 127, 127, 0.1));
}

.auth-tab {
  padding: 0.6rem 0.5rem;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-2, #57606a);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.auth-tab.active {
  background: var(--vp-c-bg, #ffffff);
  color: var(--theme-color, #3b82f6);
  box-shadow: 0 1px 6px -2px rgba(0, 0, 0, 0.25);
}

/* 表单 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.auth-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2, #57606a);
}

.auth-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--vp-c-border, rgba(127, 127, 127, 0.3));
  background: var(--vp-c-bg, #ffffff);
  color: var(--vp-c-text-1, #1f2328);
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.auth-input::placeholder {
  color: var(--vp-c-text-3, #8b949e);
}

.auth-input:focus {
  outline: none;
  border-color: var(--theme-color, #3b82f6);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color, #3b82f6) 22%, transparent);
}

.auth-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 按钮 */
.auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.72rem 1rem;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.auth-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-btn:not(:disabled):active {
  transform: translateY(1px);
}

.auth-btn.primary {
  margin-top: 0.2rem;
  background: var(--theme-color, #3b82f6);
  color: #fff;
  box-shadow: 0 10px 24px -12px var(--theme-color, #3b82f6);
}

.auth-btn.primary:not(:disabled):hover {
  filter: brightness(1.06);
}

.auth-btn.google {
  background: var(--vp-c-bg, #ffffff);
  border-color: var(--vp-c-border, rgba(127, 127, 127, 0.3));
  color: var(--vp-c-text-1, #1f2328);
}

.auth-btn.google:not(:disabled):hover {
  background: var(--vp-c-bg-soft, rgba(127, 127, 127, 0.08));
}

.google-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

/* 分隔线 */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.35rem 0;
  color: var(--vp-c-text-3, #8b949e);
  font-size: 0.78rem;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--vp-c-divider, rgba(127, 127, 127, 0.2));
}

/* 魔法链接 */
.auth-link {
  display: block;
  width: 100%;
  margin-top: 1rem;
  padding: 0.4rem;
  border: none;
  background: none;
  color: var(--theme-color, #3b82f6);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 反馈消息 */
.auth-msg {
  margin: 1rem 0 0;
  padding: 0.65rem 0.85rem;
  border-radius: 9px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.auth-msg.error {
  color: #b42318;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
}

.auth-msg.success {
  color: #067647;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.28);
}

/* 加载动画 */
.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.6rem 1.25rem;
    border-radius: 14px;
  }

  .auth-title {
    font-size: 1.4rem;
  }
}

/* 深色模式下的错误/成功色微调 */
html.dark .auth-msg.error {
  color: #ffb4ab;
  background: rgba(220, 38, 38, 0.16);
}

html.dark .auth-msg.success {
  color: #7ee2b8;
  background: rgba(16, 185, 129, 0.16);
}
</style>
