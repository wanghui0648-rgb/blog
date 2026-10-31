<template>
  <div class="auth-card">
    <span class="auth-card__tape" aria-hidden="true"></span>

    <header class="auth-head">
      <div class="auth-brand">
        <img
          class="auth-brand__img"
          :src="withBase('/logo-sketch.svg')"
          alt=""
          width="54"
          height="54"
        />
        <div class="auth-brand__text">
          <h1 class="auth-brand__name">Wang Hui 的博客</h1>
          <p class="auth-brand__sub">记录代码、生活与思考的小站</p>
        </div>
      </div>
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
      <!-- 忘记密码邮件回跳后的重置流程 -->
      <template v-if="recovery">
        <p class="auth-recovery">
          已通过邮件确认身份，请在下面写下一个新密码。
        </p>

        <form class="auth-form" novalidate @submit.prevent="handleRecoverySubmit">
          <div class="auth-field">
            <label class="auth-label" for="auth-new-password">新密码</label>
            <div class="auth-input-wrap">
              <input
                id="auth-new-password"
                v-model="newPassword"
                class="auth-input"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="至少 6 位字符"
                :disabled="loading"
                @input="clearLocalFeedback"
              />
              <button
                type="button"
                class="auth-eye"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.7" />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.7 3.4" />
                  <path d="M6.3 7.6C3.9 9.3 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </svg>
              </button>
            </div>
          </div>

          <div class="auth-field">
            <label class="auth-label" for="auth-confirm-password">再写一遍</label>
            <input
              id="auth-confirm-password"
              v-model="confirmPassword"
              class="auth-input"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="再输入一次新密码"
              :disabled="loading"
              @input="clearLocalFeedback"
            />
          </div>

          <button type="submit" class="auth-btn primary" :disabled="loading">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            {{ loading ? "保存中…" : "保存新密码" }}
          </button>
        </form>

        <p v-if="error" class="auth-msg error" role="alert">{{ error }}</p>
        <p v-else-if="message" class="auth-msg success" role="status">{{ message }}</p>
      </template>

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
          <div class="auth-field">
            <label class="auth-label" for="auth-email">邮箱</label>
            <input
              id="auth-email"
              v-model.trim="email"
              class="auth-input"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="you@example.com"
              :disabled="loading"
              @input="clearLocalFeedback"
            />
          </div>

          <div class="auth-field">
            <label class="auth-label" for="auth-password">密码</label>
            <div class="auth-input-wrap">
              <input
                id="auth-password"
                v-model="password"
                class="auth-input"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                placeholder="至少 6 位字符"
                :disabled="loading"
                @input="clearLocalFeedback"
              />
              <button
                type="button"
                class="auth-eye"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.7" />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.7 3.4" />
                  <path d="M6.3 7.6C3.9 9.3 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </svg>
              </button>
            </div>
          </div>

          <div class="auth-row">
            <label class="auth-check">
              <input v-model="rememberEmail" type="checkbox" />
              <span class="auth-check__box" aria-hidden="true">
                <svg class="auth-check__tick" viewBox="0 0 24 24">
                  <path d="M4.5 12.5c2.3 2.1 4.2 4.2 6 6.4 2.6-4.8 5.7-8.8 9.2-12.4" />
                </svg>
              </span>
              <span class="auth-check__text">记住邮箱</span>
            </label>

            <button
              type="button"
              class="auth-forgot"
              :disabled="loading"
              @click="handleForgotPassword"
            >
              忘记密码？
            </button>
          </div>

          <button type="submit" class="auth-btn primary" :disabled="loading">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            {{ loading ? "处理中…" : mode === "signin" ? "登录" : "注册" }}
          </button>
        </form>

        <div class="auth-divider"><span>或</span></div>

        <button type="button" class="auth-btn google" :disabled="loading" @click="handleGoogle">
          <span class="auth-oauth-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48">
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
          </span>
          <span>使用 Google 继续</span>
        </button>

        <p class="auth-switch">
          {{ mode === "signin" ? "还没有账号？" : "已经有账号了？" }}
          <button
            type="button"
            class="auth-inline-link"
            @click="switchMode(mode === 'signin' ? 'signup' : 'signin')"
          >
            {{ mode === "signin" ? "立即注册" : "去登录" }}
          </button>
        </p>

        <button type="button" class="auth-link" :disabled="loading" @click="handleMagicLink">
          <svg class="auth-link__icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="m3.5 6.5 8.5 6 8.5-6" />
          </svg>
          使用邮箱魔法链接登录
        </button>

        <p v-if="error" class="auth-msg error" role="alert">{{ error }}</p>
        <p v-else-if="message" class="auth-msg success" role="status">{{ message }}</p>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter, withBase } from "vuepress/client";
import { useAuth } from "../composables/useAuth";

type AuthMode = "signin" | "signup";

const REMEMBER_KEY = "wanghui-blog:remember-email";

const router = useRouter();
const {
  loading,
  error,
  message,
  recovery,
  isAuthenticated,
  isSupabaseConfigured,
  initAuth,
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
  resetPassword,
  updatePassword,
} = useAuth();

const mode = ref<AuthMode>("signin");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const rememberEmail = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");

function clearLocalFeedback(): void {
  error.value = null;
  message.value = null;
}

function switchMode(next: AuthMode): void {
  if (mode.value === next) return;
  mode.value = next;
  password.value = "";
  clearLocalFeedback();
}

function persistRememberedEmail(): void {
  if (typeof window === "undefined") return;
  try {
    if (rememberEmail.value) {
      window.localStorage.setItem(REMEMBER_KEY, email.value);
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {
    // 隐私模式下 localStorage 可能不可用，忽略即可。
  }
}

async function handleSubmit(): Promise<void> {
  error.value = null;
  message.value = null;

  if (!email.value) {
    error.value = "请先写下邮箱地址。";
    return;
  }
  if (!password.value) {
    error.value = "密码还没有写哦。";
    return;
  }
  if (mode.value === "signup" && password.value.length < 6) {
    error.value = "密码至少需要 6 位字符。";
    return;
  }

  const ok =
    mode.value === "signin"
      ? await signInWithEmail(email.value, password.value)
      : await signUpWithEmail(email.value, password.value);

  if (ok) persistRememberedEmail();

  // 登录成功 / 注册后已直接获得会话 -> 跳转首页
  if (ok && (mode.value === "signin" || isAuthenticated.value)) {
    await router.push("/home/");
  }
}

async function handleForgotPassword(): Promise<void> {
  error.value = null;
  message.value = null;

  if (!email.value) {
    error.value = "请先填写邮箱地址，再点击忘记密码。";
    return;
  }

  await resetPassword(email.value);
}

async function handleRecoverySubmit(): Promise<void> {
  error.value = null;
  message.value = null;

  if (!newPassword.value) {
    error.value = "请写下新密码。";
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = "密码至少需要 6 位字符。";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = "两次输入的密码不一致，再对一遍吧。";
    return;
  }

  const ok = await updatePassword(newPassword.value);
  if (ok) {
    newPassword.value = "";
    confirmPassword.value = "";
    await router.push("/home/");
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
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        email.value = saved;
        rememberEmail.value = true;
      }
    } catch {
      // 忽略 localStorage 不可用的情况。
    }
  }

  await initAuth();

  // 等 Supabase 处理 URL 中的恢复链接，避免在「重置密码」流程中误跳首页。
  await new Promise((resolve) => setTimeout(resolve, 250));

  const looksLikeRecovery =
    typeof window !== "undefined" &&
    /(?:^|[?#&])type=recovery(?:&|$)/.test(window.location.href);

  if (isAuthenticated.value && !recovery.value && !looksLikeRecovery) {
    await router.push("/home/");
  }
});
</script>

<style scoped>
/* ---------- 卡片 ---------- */
.auth-card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 430px;
  padding: 2.55rem 1.9rem 1.85rem;
  border: 2.5px solid var(--sk-ink, #191713);
  border-radius: 18px 9px 20px 11px / 11px 20px 9px 18px;
  background: var(--sk-paper-2, #fffdf6);
  box-shadow: 6px 6px 0 var(--sk-ink, #191713);
  color: var(--sk-ink, #191713);
}

/* 外侧再描一圈歪歪扭扭的线，模仿手绘双线 */
.auth-card::before {
  content: "";
  position: absolute;
  inset: -5px -4px -4px -5px;
  pointer-events: none;
  border: 1.5px solid rgba(25, 23, 19, 0.5);
  border-radius: 20px 7px 22px 9px / 9px 22px 7px 20px;
  transform: rotate(0.35deg);
}

.auth-card__tape {
  position: absolute;
  top: -15px;
  left: 50%;
  width: 104px;
  height: 26px;
  pointer-events: none;
  transform: translateX(-50%) rotate(-2.5deg);
  border: 1.5px solid rgba(25, 23, 19, 0.32);
  background: var(--sk-tape, rgba(247, 212, 95, 0.72));
  box-shadow: 2px 2px 0 rgba(25, 23, 19, 0.15);
}

/* ---------- 品牌 ---------- */
.auth-head {
  margin-bottom: 1.35rem;
}

.auth-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  text-align: start;
}

.auth-brand__img {
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  transform: rotate(-2.5deg);
  filter: drop-shadow(2px 2px 0 rgba(25, 23, 19, 0.9));
}

.auth-brand__name {
  margin: 0;
  color: var(--sk-ink, #191713);
  font-family: var(--vp-font-heading, "Caveat", cursive);
  font-size: 2.15rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.01em;
}

.auth-brand__sub {
  margin: 0.25rem 0 0;
  color: var(--sk-muted, #6f6759);
  font-family: var(--vp-font, "Comic Neue", cursive);
  font-size: 0.84rem;
  letter-spacing: 0.04em;
}

/* ---------- 未配置提示 ---------- */
.auth-notice {
  padding: 0.9rem 1rem;
  border: 2px solid var(--sk-ink, #191713);
  border-radius: var(--sk-radius, 10px 5px 12px 6px / 6px 12px 5px 10px);
  background: #fff3c4;
  box-shadow: var(--sk-shadow-sm, 2px 2px 0 #191713);
  font-size: 0.88rem;
  line-height: 1.65;
  transform: rotate(-0.4deg);
}

.auth-notice strong {
  display: block;
  margin-bottom: 0.25rem;
  font-family: var(--vp-font-heading, "Caveat", cursive);
  font-size: 1.18rem;
}

.auth-notice p {
  margin: 0.45rem 0;
}

.auth-notice ul {
  margin: 0.4rem 0;
  padding-inline-start: 1.2rem;
}

.auth-notice code {
  padding: 0.08em 0.35em;
  border: 1.5px solid var(--sk-ink, #191713);
  border-radius: 4px;
  background: var(--sk-paper-2, #fffdf6);
  font-family: var(--vp-font-mono, monospace);
  font-size: 0.86em;
}

/* ---------- 重置密码说明 ---------- */
.auth-recovery {
  margin: 0 0 1.1rem;
  padding: 0.65rem 0.8rem;
  border: 1.5px dashed rgba(25, 23, 19, 0.45);
  border-radius: 8px;
  background: rgba(247, 212, 95, 0.3);
  color: var(--sk-ink-soft, #403a31);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ---------- 选项卡 ---------- */
.auth-tabs {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 1.35rem;
  padding-bottom: 0.65rem;
  border-bottom: 1.5px dashed rgba(25, 23, 19, 0.28);
}

.auth-tab {
  padding: 0.25rem 0.75rem;
  border: 2px solid transparent;
  border-radius: 8px 4px 9px 5px / 5px 9px 4px 8px;
  background: transparent;
  color: var(--sk-muted, #6f6759);
  font-family: var(--vp-font-heading, "Caveat", cursive);
  font-size: 1.28rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.auth-tab:hover {
  color: var(--sk-ink, #191713);
  text-decoration: underline wavy var(--sk-orange, #e06a43);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}

.auth-tab.active {
  border-color: var(--sk-ink, #191713);
  background: var(--sk-yellow, #f7d45f);
  box-shadow: var(--sk-shadow-sm, 2px 2px 0 #191713);
  color: var(--sk-ink, #191713);
  transform: rotate(-1deg);
}

/* ---------- 表单 ---------- */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.auth-label {
  color: var(--sk-ink, #191713);
  font-family: var(--vp-font, "Comic Neue", cursive);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.auth-label::before {
  content: "";
  display: inline-block;
  width: 16px;
  height: 2px;
  margin-inline-end: 0.4rem;
  vertical-align: 0.28em;
  background: var(--sk-orange, #e06a43);
  transform: rotate(-8deg);
}

.auth-input-wrap {
  position: relative;
}

.auth-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.72rem 0.9rem;
  border: 2px solid var(--sk-ink, #191713);
  border-radius: 10px 5px 12px 6px / 6px 12px 5px 10px;
  background: #fffef9;
  box-shadow: var(--sk-shadow-sm, 2px 2px 0 #191713);
  color: var(--sk-ink, #191713);
  font-family: var(--vp-font, "Comic Neue", cursive);
  font-size: 1rem;
  line-height: 1.4;
  appearance: none;
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease,
    background 0.14s ease;
}

.auth-input-wrap .auth-input {
  padding-inline-end: 2.9rem;
}

.auth-input::placeholder {
  color: #9a9183;
  opacity: 1;
}

.auth-input:hover {
  background: #fffdf1;
}

.auth-input:focus {
  outline: none;
  background: #fffdf1;
  box-shadow: 4px 4px 0 var(--sk-ink, #191713);
  transform: translate(-1px, -1px);
}

.auth-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-eye {
  position: absolute;
  top: 50%;
  inset-inline-end: 0.55rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--sk-ink-soft, #403a31);
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.auth-eye:hover {
  background: rgba(247, 212, 95, 0.55);
  color: var(--sk-ink, #191713);
}

.auth-eye svg {
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---------- 复选框 / 忘记密码 ---------- */
.auth-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.1rem;
}

.auth-check {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--sk-ink-soft, #403a31);
  font-size: 0.92rem;
  cursor: pointer;
  user-select: none;
}

.auth-check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.auth-check__box {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid var(--sk-ink, #191713);
  border-radius: 5px 3px 7px 4px / 4px 7px 3px 5px;
  background: #fffef9;
  box-shadow: var(--sk-shadow-sm, 2px 2px 0 #191713);
  transform: rotate(-2deg);
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.auth-check__tick {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--sk-ink, #191713);
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.4) rotate(-8deg);
  transition:
    opacity 0.12s ease,
    transform 0.18s ease;
}

.auth-check input:checked + .auth-check__box {
  background: var(--sk-yellow, #f7d45f);
}

.auth-check input:checked + .auth-check__box .auth-check__tick {
  opacity: 1;
  transform: scale(1) rotate(-4deg);
}

.auth-check input:focus-visible + .auth-check__box {
  outline: 2px dashed var(--sk-orange, #e06a43);
  outline-offset: 3px;
}

.auth-check:hover .auth-check__box {
  transform: rotate(1deg) scale(1.04);
}

.auth-forgot {
  padding: 0;
  border: 0;
  background: none;
  color: var(--sk-ink, #191713);
  font-family: var(--vp-font, "Comic Neue", cursive);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline wavy var(--sk-orange, #e06a43);
  text-decoration-thickness: 1.6px;
  text-underline-offset: 4px;
}

.auth-forgot:hover {
  background: rgba(247, 212, 95, 0.55);
}

.auth-forgot:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ---------- 按钮 ---------- */
.auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-sizing: border-box;
  width: 100%;
  padding: 0.62rem 1rem;
  border: 2.5px solid var(--sk-ink, #191713);
  border-radius: 10px 5px 12px 6px / 6px 12px 5px 10px;
  background: var(--sk-paper-2, #fffdf6);
  box-shadow: 3px 3px 0 var(--sk-ink, #191713);
  color: var(--sk-ink, #191713);
  font-family: var(--vp-font-heading, "Caveat", cursive);
  font-size: 1.32rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.15s ease;
}

.auth-btn:hover:not(:disabled) {
  background: var(--sk-yellow, #f7d45f);
  box-shadow: 4px 4px 0 var(--sk-ink, #191713);
  transform: translate(-1px, -1px);
}

.auth-btn:active:not(:disabled) {
  box-shadow: 0 0 0 var(--sk-ink, #191713);
  transform: translate(3px, 3px);
}

.auth-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-btn.primary {
  margin-top: 0.15rem;
  background: var(--sk-yellow, #f7d45f);
}

.auth-btn.primary:hover:not(:disabled) {
  background: var(--sk-yellow-deep, #eec33c);
}

.auth-btn.google {
  padding: 0.6rem 0.9rem;
  font-family: var(--vp-font, "Comic Neue", cursive);
  font-size: 0.98rem;
}

.auth-oauth-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 3px;
  border: 2px solid var(--sk-ink, #191713);
  border-radius: 6px 3px 7px 4px / 4px 7px 3px 6px;
  background: #fff;
  box-shadow: 1.5px 1.5px 0 var(--sk-ink, #191713);
}

.auth-oauth-icon svg {
  width: 19px;
  height: 19px;
}

/* ---------- 分隔线 ---------- */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.35rem 0 1.05rem;
  color: var(--sk-muted, #6f6759);
  font-family: var(--vp-font-heading, "Caveat", cursive);
  font-size: 1.15rem;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    rgba(25, 23, 19, 0.62) 0 7px,
    transparent 7px 13px
  );
}

/* ---------- 切换登录 / 注册 ---------- */
.auth-switch {
  margin: 1.05rem 0 0;
  text-align: center;
  color: var(--sk-muted, #6f6759);
  font-size: 0.92rem;
}

.auth-inline-link {
  padding: 0 0.12rem;
  border: 0;
  background: none;
  color: var(--sk-ink, #191713);
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline wavy var(--sk-orange, #e06a43);
  text-decoration-thickness: 1.6px;
  text-underline-offset: 4px;
}

.auth-inline-link:hover {
  background: rgba(247, 212, 95, 0.55);
}

/* ---------- 魔法链接 ---------- */
.auth-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  margin-top: 0.55rem;
  padding: 0.4rem 0.5rem;
  border: 0;
  background: none;
  color: var(--sk-ink-soft, #403a31);
  font-family: var(--vp-font, "Comic Neue", cursive);
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline wavy rgba(224, 106, 67, 0.85);
  text-decoration-thickness: 1.4px;
  text-underline-offset: 4px;
}

.auth-link:hover {
  background: rgba(247, 212, 95, 0.4);
  color: var(--sk-ink, #191713);
}

.auth-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-link__icon {
  width: 1.05rem;
  height: 1.05rem;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---------- 反馈消息 ---------- */
.auth-msg {
  margin: 1rem 0 0;
  padding: 0.6rem 0.8rem;
  border: 2px solid var(--sk-ink, #191713);
  border-radius: 8px 4px 10px 5px / 5px 10px 4px 8px;
  box-shadow: 3px 3px 0 var(--sk-ink, #191713);
  font-size: 0.9rem;
  line-height: 1.55;
}

.auth-msg.error {
  background: #ffe1da;
  color: #7c2618;
  transform: rotate(-0.35deg);
}

.auth-msg.success {
  background: #e4f3d9;
  color: #24572c;
  transform: rotate(0.3deg);
}

/* ---------- 加载动画 ---------- */
.spinner {
  width: 16px;
  height: 16px;
  border: 2.5px solid rgba(25, 23, 19, 0.25);
  border-top-color: var(--sk-ink, #191713);
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------- 小屏幕 ---------- */
@media (max-width: 480px) {
  .auth-card {
    padding: 2.2rem 1.15rem 1.5rem;
    border-radius: 14px 7px 16px 8px / 8px 16px 7px 14px;
    box-shadow: 4px 4px 0 var(--sk-ink, #191713);
  }

  .auth-brand__img {
    width: 46px;
    height: 46px;
  }

  .auth-brand__name {
    font-size: 1.9rem;
  }

  .auth-brand__sub {
    font-size: 0.78rem;
  }

  .auth-btn {
    font-size: 1.22rem;
  }
}
</style>
