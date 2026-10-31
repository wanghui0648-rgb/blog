<template>
  <div class="login-page">
    <!-- 手绘小装饰 -->
    <svg class="login-page__doodle login-page__doodle--star" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 6.5c1.7 5.6 3.4 11.3 5.1 16.9 5.7.4 11.4.8 17.1 1.1-4.6 3.6-9.3 7.2-13.9 10.8 1.7 5.6 3.4 11.2 5.1 16.8-4.7-3.5-9.5-7-14.2-10.5-4.6 3.6-9.3 7.2-13.9 10.8 1.8-5.6 3.5-11.3 5.3-16.9C18.1 32.2 13.5 28.6 9 25c5.7-.4 11.4-.8 17.1-1.1 1.9-5.8 3.9-11.6 5.9-17.4Z" />
    </svg>

    <svg class="login-page__doodle login-page__doodle--arrow" viewBox="0 0 130 90" aria-hidden="true">
      <path d="M7 78c24-9 32-28 50-30 18-2 25 12 40 4 10-5 17-15 24-27" />
      <path d="m112 28 9-3-2 10" />
    </svg>

    <main class="login-page__main">
      <ClientOnly>
        <LoginForm />
      </ClientOnly>
    </main>

    <p class="login-page__foot">✎ 用一支黑色中性笔写成的博客</p>
  </div>
</template>

<script setup lang="ts">
import { ClientOnly } from "vuepress/client";
import LoginForm from "../components/LoginForm.vue";
</script>

<style scoped>
.login-page {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 3.5rem 1.25rem 2.4rem;
  overflow-x: clip;
  background: transparent;
}

/* 左侧笔记本打孔 */
.login-page::before {
  content: "";
  position: absolute;
  inset-block: 11vh;
  inset-inline-start: 2.1rem;
  width: 20px;
  background-image: radial-gradient(
    circle at 50% 50%,
    var(--sk-paper, #faf6e9) 0 4.2px,
    var(--sk-ink, #191713) 4.8px 5.8px,
    transparent 6.2px
  );
  background-repeat: repeat-y;
  background-size: 20px 18%;
  opacity: 0.5;
  pointer-events: none;
}

.login-page__main {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 460px;
}

/* ---------- 手绘涂鸦 ---------- */
.login-page__doodle {
  position: absolute;
  z-index: 1;
  fill: none;
  stroke: var(--sk-ink, #191713);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.4;
  opacity: 0.5;
  pointer-events: none;
}

.login-page__doodle--star {
  top: 15%;
  inset-inline-end: 10%;
  width: 66px;
  height: 66px;
  transform: rotate(12deg);
}

.login-page__doodle--arrow {
  bottom: 13%;
  inset-inline-start: 8%;
  width: 130px;
  height: 90px;
  transform: rotate(-6deg);
}

/* ---------- 页脚小字 ---------- */
.login-page__foot {
  position: relative;
  z-index: 2;
  margin: 1.5rem 0 0;
  color: var(--sk-muted, #6f6759);
  font-family: var(--vp-font, "Comic Neue", cursive);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-align: center;
}

@media (max-width: 1100px) {
  .login-page__doodle {
    display: none;
  }
}

@media (max-width: 900px) {
  .login-page::before {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 3.2rem 0.9rem 1.75rem;
  }

  .login-page__foot {
    margin-top: 1.2rem;
    font-size: 0.76rem;
  }
}
</style>
