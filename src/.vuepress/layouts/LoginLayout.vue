<template>
  <div class="login-page">
    <main class="login-page__main">
      <div class="login-page__brand">Wang Hui 的博客</div>

      <ClientOnly>
        <LoginForm />
      </ClientOnly>

      <a class="login-page__back" :href="withBase('/')">← 返回首页</a>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ClientOnly, withBase } from "vuepress/client";
import LoginForm from "../components/LoginForm.vue";
</script>

<style scoped>
.login-page {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 3rem 1.25rem;
  background:
    radial-gradient(
      1200px 600px at 15% 0%,
      color-mix(in srgb, var(--theme-color, #3b82f6) 14%, transparent),
      transparent 60%
    ),
    radial-gradient(
      900px 500px at 100% 100%,
      color-mix(in srgb, var(--theme-color, #3b82f6) 10%, transparent),
      transparent 55%
    ),
    var(--vp-c-bg, #ffffff);
  overflow: hidden;
}

.login-page__main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.35rem;
  width: 100%;
  max-width: 420px;
}

.login-page__brand {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-1, #1f2328);
  opacity: 0.9;
}

.login-page__back {
  font-size: 0.88rem;
  color: var(--vp-c-text-2, #57606a);
  text-decoration: none;
  transition: color 0.2s ease;
}

.login-page__back:hover {
  color: var(--theme-color, #3b82f6);
}

@media (max-width: 480px) {
  .login-page {
    padding: 2rem 1rem;
  }
}
</style>
