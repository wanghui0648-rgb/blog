<template>
  <!-- SSR 安全：整块 UI 仅在 onMounted 置 ready 后渲染 -->
  <div v-if="ready" class="admin-root">
    <!-- 左下角浮动按钮 -->
    <button
      type="button"
      class="admin-fab"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      aria-label="打开站长管理面板"
      @click="toggleOpen"
    >
      🛠 管理
    </button>

    <!-- 弹层 -->
    <div v-if="open" class="admin-overlay" @click.self="close">
      <div class="admin-modal" role="dialog" aria-modal="true" aria-label="站长管理面板">
        <!-- 未解锁：密码输入 -->
        <div v-if="!unlocked" class="admin-lock">
          <h2 class="admin-title">站长验证</h2>
          <p class="admin-sub">请输入站长密码后进入管理面板。</p>
          <input
            v-model="keyInput"
            class="admin-input"
            type="password"
            placeholder="站长密码"
            autocomplete="off"
            :disabled="verifying"
            @keyup.enter="verifyKey"
          />
          <button class="admin-btn primary" type="button" :disabled="verifying" @click="verifyKey">
            {{ verifying ? "验证中…" : "进入" }}
          </button>
          <p v-if="authError" class="admin-msg error">{{ authError }}</p>
        </div>

        <!-- 已解锁：管理界面 -->
        <template v-else>
          <header class="admin-head">
            <h2 class="admin-title">站长管理面板</h2>
            <div class="admin-head__actions">
              <button class="admin-btn small ghost" type="button" @click="lock">锁定/退出</button>
              <button class="admin-btn small ghost" type="button" aria-label="关闭" @click="close">✕</button>
            </div>
          </header>

          <nav class="admin-tabs">
            <button
              type="button"
              class="admin-tab"
              :class="{ active: tab === 'comments' }"
              @click="switchTab('comments')"
            >
              评论管理
            </button>
            <button
              type="button"
              class="admin-tab"
              :class="{ active: tab === 'content' }"
              @click="switchTab('content')"
            >
              内容管理
            </button>
          </nav>

          <div class="admin-body">
            <!-- ============ 评论管理 ============ -->
            <section v-if="tab === 'comments'" class="admin-pane">
              <p v-if="commentsLoading" class="admin-hint">正在加载评论…</p>
              <p v-else-if="commentsError" class="admin-msg error">{{ commentsError }}</p>
              <p v-else-if="discussions.length === 0" class="admin-hint">暂无评论讨论。</p>

              <ul v-else class="disc-list">
                <li v-for="d in discussions" :key="String(d.id)" class="disc-item">
                  <div class="disc-head">
                    <label class="admin-check">
                      <input
                        type="checkbox"
                        :checked="isDiscussionAllSelected(d)"
                        :indeterminate.prop="isDiscussionPartial(d)"
                        @change="toggleDiscussionAll(d)"
                      />
                      <span class="admin-check__box" aria-hidden="true" />
                    </label>
                    <button type="button" class="disc-toggle" @click="toggleExpand(d)">
                      <span class="disc-caret">{{ isExpanded(d) ? "▾" : "▸" }}</span>
                      <span class="disc-title">{{ d.title || "（无标题）" }}</span>
                    </button>
                    <span class="disc-count">{{ d.commentCount ?? (d.comments ? d.comments.length : 0) }} 条</span>
                    <a
                      v-if="d.url"
                      class="disc-link"
                      :href="d.url"
                      target="_blank"
                      rel="noopener"
                    >打开</a>
                  </div>

                  <ul v-if="isExpanded(d)" class="comment-list">
                    <li v-for="c in d.comments || []" :key="String(c.id)" class="comment-item">
                      <label class="admin-check">
                        <input
                          type="checkbox"
                          :checked="selectedCommentIds.has(String(c.id))"
                          @change="toggleComment(c)"
                        />
                        <span class="admin-check__box" aria-hidden="true" />
                      </label>
                      <img
                        v-if="c.avatarUrl"
                        class="comment-avatar"
                        :src="c.avatarUrl"
                        alt=""
                        loading="lazy"
                      />
                      <div class="comment-main">
                        <div class="comment-meta">
                          <a
                            v-if="c.authorUrl"
                            class="comment-author"
                            :href="c.authorUrl"
                            target="_blank"
                            rel="noopener"
                          >{{ c.author || "匿名" }}</a>
                          <span v-else class="comment-author">{{ c.author || "匿名" }}</span>
                          <span class="comment-time">{{ c.createdAt || "" }}</span>
                        </div>
                        <p class="comment-body">{{ c.body }}</p>
                        <a
                          v-if="c.url"
                          class="comment-link"
                          :href="c.url"
                          target="_blank"
                          rel="noopener"
                        >查看评论</a>
                      </div>
                    </li>
                  </ul>
                </li>
              </ul>

              <footer class="admin-footer">
                <span class="admin-hint inline">已选 {{ selectedCommentCount }} 条评论</span>
                <button
                  class="admin-btn danger"
                  type="button"
                  :disabled="selectedCommentCount === 0 || busy"
                  @click="deleteSelectedComments"
                >
                  🗑 批量删除所选评论
                </button>
              </footer>
              <p v-if="commentsMsg" class="admin-msg success">{{ commentsMsg }}</p>
            </section>

            <!-- ============ 内容管理 ============ -->
            <section v-else class="admin-pane">
              <div class="content-toolbar">
                <button class="admin-btn small" type="button" :disabled="busy" @click="createFile">
                  ＋ 新建文件
                </button>
                <button class="admin-btn small" type="button" :disabled="busy" @click="createFolder">
                  ＋ 新建文件夹
                </button>
                <button
                  class="admin-btn small danger"
                  type="button"
                  :disabled="selectedContentCount === 0 || busy"
                  @click="deleteSelectedContent"
                >
                  🗑 批量删除所选
                </button>
              </div>

              <p v-if="contentLoading" class="admin-hint">正在加载文件树…</p>
              <p v-else-if="contentError" class="admin-msg error">{{ contentError }}</p>
              <p v-else-if="treeEntries.length === 0" class="admin-hint">暂无可管理的内容。</p>

              <ul v-else class="tree-list">
                <li
                  v-for="e in treeEntries"
                  :key="e.path"
                  class="tree-row"
                  :style="{ paddingInlineStart: treeDepth(e.path) * 18 + 'px' }"
                >
                  <label v-if="isSelectable(e)" class="admin-check">
                    <input
                      type="checkbox"
                      :checked="selectedContent.has(e.path)"
                      @change="toggleContent(e.path)"
                    />
                    <span class="admin-check__box" aria-hidden="true" />
                  </label>
                  <span v-else class="tree-spacer" aria-hidden="true" />
                  <span class="tree-icon" aria-hidden="true">{{ e.type === "tree" ? "📁" : "📄" }}</span>
                  <span class="tree-name" :title="e.path">{{ baseName(e.path) }}</span>
                </li>
              </ul>

              <footer class="admin-footer">
                <span class="admin-hint inline">已选 {{ selectedContentCount }} 项</span>
                <button class="admin-btn small ghost" type="button" :disabled="contentLoading" @click="loadTree">
                  刷新
                </button>
              </footer>
              <p v-if="contentMsg" class="admin-msg success">{{ contentMsg }}</p>
            </section>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

/* ----------------------------- 类型 ----------------------------- */
interface AdminComment {
  id: string | number;
  author?: string;
  avatarUrl?: string;
  authorUrl?: string;
  body?: string;
  createdAt?: string;
  url?: string;
}

interface AdminDiscussion {
  id: string | number;
  title?: string;
  url?: string;
  commentCount?: number;
  comments?: AdminComment[];
}

interface TreeEntry {
  path: string;
  type: "blob" | "tree" | string;
}

/* ----------------------------- 基础状态 ----------------------------- */
const SESSION_KEY = "blog_admin_key";

const ready = ref(false);
const open = ref(false);
const unlocked = ref(false);

const keyInput = ref("");
const adminKey = ref("");
const verifying = ref(false);
const authError = ref("");

const tab = ref<"comments" | "content">("comments");
const busy = ref(false);

/* ----------------------------- 评论状态 ----------------------------- */
const discussions = ref<AdminDiscussion[]>([]);
const commentsLoading = ref(false);
const commentsError = ref("");
const commentsMsg = ref("");
const expanded = reactive(new Set<string>());
// key = String(comment.id) 用于判重/勾选；value 保留原始 id（string|number），提交时原样回传。
const selectedCommentIds = reactive(new Map<string, string | number>());

const selectedCommentCount = computed(() => selectedCommentIds.size);

/* ----------------------------- 内容状态 ----------------------------- */
const treeEntries = ref<TreeEntry[]>([]);
const contentLoading = ref(false);
const contentError = ref("");
const contentMsg = ref("");
const selectedContent = reactive(new Set<string>());
const selectedContentCount = computed(() => selectedContent.size);

/* ----------------------------- 生命周期 ----------------------------- */
onMounted(() => {
  // 仅在客户端执行；SSR 阶段 ready 仍为 false，模板块不会渲染。
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY) || "";
    if (saved) {
      adminKey.value = saved;
      keyInput.value = saved;
      unlocked.value = true;
    }
  } catch {
    // sessionStorage 不可用时忽略。
  }
  ready.value = true;
});

/* ----------------------------- 通用请求封装 ----------------------------- */
async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (adminKey.value) headers["x-admin-key"] = adminKey.value;
  if (opts.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(path, { ...opts, headers });
  } catch (e) {
    throw new Error("网络请求失败：" + (e instanceof Error ? e.message : String(e)));
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || (data && data.ok === false)) {
    const msg =
      (data && data.error) ||
      (data && data.message) ||
      `请求失败（HTTP ${res.status}）`;
    throw new Error(msg);
  }
  return data as T;
}

/* ----------------------------- 鉴权 ----------------------------- */
async function verifyKey(): Promise<void> {
  authError.value = "";
  const k = keyInput.value.trim();
  if (!k) {
    authError.value = "请输入站长密码。";
    return;
  }
  verifying.value = true;
  try {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "x-admin-key": k },
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok && data && data.ok) {
      adminKey.value = k;
      try {
        window.sessionStorage.setItem(SESSION_KEY, k);
      } catch {
        // 忽略存储失败。
      }
      unlocked.value = true;
      authError.value = "";
      await loadComments();
    } else {
      authError.value = (data && data.error) || "密码不正确。";
    }
  } catch (e) {
    authError.value = "验证失败：" + (e instanceof Error ? e.message : String(e));
  } finally {
    verifying.value = false;
  }
}

function lock(): void {
  adminKey.value = "";
  keyInput.value = "";
  unlocked.value = false;
  authError.value = "";
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 忽略。
  }
}

/* ----------------------------- 开关 / Tab ----------------------------- */
function toggleOpen(): void {
  open.value = !open.value;
  if (open.value && unlocked.value && tab.value === "comments" && discussions.value.length === 0) {
    void loadComments();
  }
}

function close(): void {
  open.value = false;
}

function switchTab(next: "comments" | "content"): void {
  if (tab.value === next) return;
  tab.value = next;
  if (next === "comments" && discussions.value.length === 0) void loadComments();
  if (next === "content" && treeEntries.value.length === 0) void loadTree();
}

/* ----------------------------- 评论逻辑 ----------------------------- */
async function loadComments(): Promise<void> {
  commentsLoading.value = true;
  commentsError.value = "";
  try {
    const data = await api<{ ok: boolean; discussions: AdminDiscussion[] }>("/api/comments/list");
    discussions.value = Array.isArray(data.discussions) ? data.discussions : [];
    // 清理已不存在的选中项
    const alive = new Set<string>();
    discussions.value.forEach((d) => (d.comments || []).forEach((c) => alive.add(String(c.id))));
    Array.from(selectedCommentIds.keys()).forEach((id) => {
      if (!alive.has(id)) selectedCommentIds.delete(id);
    });
  } catch (e) {
    commentsError.value = e instanceof Error ? e.message : String(e);
  } finally {
    commentsLoading.value = false;
  }
}

function isExpanded(d: AdminDiscussion): boolean {
  return expanded.has(String(d.id));
}

function toggleExpand(d: AdminDiscussion): void {
  const key = String(d.id);
  if (expanded.has(key)) expanded.delete(key);
  else expanded.add(key);
}

function toggleComment(c: AdminComment): void {
  const key = String(c.id);
  if (selectedCommentIds.has(key)) selectedCommentIds.delete(key);
  else selectedCommentIds.set(key, c.id);
}

function isDiscussionAllSelected(d: AdminDiscussion): boolean {
  const list = d.comments || [];
  return list.length > 0 && list.every((c) => selectedCommentIds.has(String(c.id)));
}

function isDiscussionPartial(d: AdminDiscussion): boolean {
  const list = d.comments || [];
  const n = list.filter((c) => selectedCommentIds.has(String(c.id))).length;
  return n > 0 && n < list.length;
}

function toggleDiscussionAll(d: AdminDiscussion): void {
  const list = d.comments || [];
  const all = isDiscussionAllSelected(d);
  list.forEach((c) => {
    const key = String(c.id);
    if (all) selectedCommentIds.delete(key);
    else selectedCommentIds.set(key, c.id);
  });
}

async function deleteSelectedComments(): Promise<void> {
  const ids = Array.from(selectedCommentIds.values());
  if (ids.length === 0) return;
  if (!window.confirm(`确定删除所选 ${ids.length} 条评论吗？此操作不可撤销。`)) return;
  busy.value = true;
  commentsMsg.value = "";
  commentsError.value = "";
  try {
    await api("/api/comments/delete", {
      method: "POST",
      body: JSON.stringify({ commentIds: ids }),
    });
    selectedCommentIds.clear();
    commentsMsg.value = `已删除 ${ids.length} 条评论。`;
    await loadComments();
  } catch (e) {
    commentsError.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}

/* ----------------------------- 内容逻辑 ----------------------------- */
function treeDepth(path: string): number {
  return Math.max(0, path.split("/").filter(Boolean).length - 1);
}

function baseName(path: string): string {
  const segs = path.split("/").filter(Boolean);
  return segs.length ? segs[segs.length - 1] : path;
}

function isSelectable(e: TreeEntry): boolean {
  if (e.type === "tree") return true;
  return e.path.toLowerCase().endsWith(".md");
}

async function loadTree(): Promise<void> {
  contentLoading.value = true;
  contentError.value = "";
  try {
    const data = await api<{ ok: boolean; entries: TreeEntry[] }>("/api/content/tree");
    const list = Array.isArray(data.entries) ? data.entries.slice() : [];
    list.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    treeEntries.value = list;
    const alive = new Set(list.map((e) => e.path));
    Array.from(selectedContent).forEach((p) => {
      if (!alive.has(p)) selectedContent.delete(p);
    });
  } catch (e) {
    contentError.value = e instanceof Error ? e.message : String(e);
  } finally {
    contentLoading.value = false;
  }
}

function toggleContent(path: string): void {
  if (selectedContent.has(path)) selectedContent.delete(path);
  else selectedContent.add(path);
}

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function buildMarkdown(title: string): string {
  return `---\ntitle: ${title}\ndate: ${todayStr()}\n---\n\n# ${title}\n\n（在这里写内容）\n`;
}

async function createFile(): Promise<void> {
  const rel = window.prompt("请输入相对 src 的文件路径，如 notes/hello.md");
  if (rel === null) return;
  const cleanRel = rel.trim().replace(/^\/+/, "");
  if (!cleanRel) {
    contentError.value = "文件路径不能为空。";
    return;
  }
  const title = window.prompt("请输入标题", baseName(cleanRel).replace(/\.md$/i, ""));
  if (title === null) return;
  const t = title.trim() || baseName(cleanRel).replace(/\.md$/i, "");
  busy.value = true;
  contentMsg.value = "";
  contentError.value = "";
  try {
    await api("/api/content/mutate", {
      method: "POST",
      body: JSON.stringify({
        creates: [{ path: "src/" + cleanRel, content: buildMarkdown(t) }],
      }),
    });
    contentMsg.value = "已提交，约 1–2 分钟后自动重建上线。";
    await loadTree();
  } catch (e) {
    contentError.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}

async function createFolder(): Promise<void> {
  const dir = window.prompt("请输入相对 src 的目录，如 notes/daily");
  if (dir === null) return;
  const cleanDir = dir.trim().replace(/^\/+|\/+$/g, "");
  if (!cleanDir) {
    contentError.value = "目录不能为空。";
    return;
  }
  const title = baseName(cleanDir) || cleanDir;
  busy.value = true;
  contentMsg.value = "";
  contentError.value = "";
  try {
    await api("/api/content/mutate", {
      method: "POST",
      body: JSON.stringify({
        creates: [
          { path: `src/${cleanDir}/README.md`, content: buildMarkdown(title) },
        ],
      }),
    });
    contentMsg.value = "已提交，约 1–2 分钟后自动重建上线。";
    await loadTree();
  } catch (e) {
    contentError.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}

async function deleteSelectedContent(): Promise<void> {
  const paths = Array.from(selectedContent);
  if (paths.length === 0) return;
  if (!window.confirm(`确定删除所选 ${paths.length} 项（含文件夹及其内容）吗？此操作不可撤销。`)) return;
  busy.value = true;
  contentMsg.value = "";
  contentError.value = "";
  try {
    await api("/api/content/mutate", {
      method: "POST",
      body: JSON.stringify({ deletes: paths }),
    });
    selectedContent.clear();
    contentMsg.value = "已提交，约 1–2 分钟后自动重建上线。";
    await loadTree();
  } catch (e) {
    contentError.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
/* ============================ 基础 ============================ */
.admin-root {
  font-family: inherit;
  color: #2b2b2b;
}

/* ============================ 浮动按钮 ============================ */
.admin-fab {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 9999;
  padding: 0.6rem 1.05rem;
  border: 2px solid #2b2b2b;
  border-radius: 14px 6px 15px 8px / 8px 15px 6px 14px;
  background: #f5c542;
  box-shadow: 4px 4px 0 #2b2b2b;
  color: #2b2b2b;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.15s ease;
}

.admin-fab:hover {
  background: #efb92c;
  box-shadow: 5px 5px 0 #2b2b2b;
  transform: translate(-1px, -1px) rotate(-1deg);
}

.admin-fab:active {
  box-shadow: 0 0 0 #2b2b2b;
  transform: translate(3px, 3px);
}

.admin-fab.is-open {
  background: #fffdf6;
}

/* ============================ 遮罩 + 卡片 ============================ */
.admin-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(25, 23, 19, 0.42);
  backdrop-filter: blur(1.5px);
}

.admin-modal {
  box-sizing: border-box;
  width: 100%;
  max-width: min(920px, 92vw);
  max-height: 82vh;
  overflow: auto;
  padding: 1.4rem 1.5rem 1.5rem;
  border: 2px solid #2b2b2b;
  border-radius: 16px 8px 18px 9px / 9px 18px 8px 16px;
  background: #fffdf6;
  box-shadow: 7px 7px 0 #2b2b2b;
}

/* ============================ 标题 / 头部 ============================ */
.admin-title {
  margin: 0;
  font-family: inherit;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.admin-sub {
  margin: 0.35rem 0 1rem;
  color: #6f6759;
  font-size: 0.9rem;
}

.admin-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding-bottom: 0.7rem;
  border-bottom: 2px dashed rgba(43, 43, 43, 0.28);
}

.admin-head__actions {
  display: flex;
  gap: 0.5rem;
}

/* ============================ 锁定视图 ============================ */
.admin-lock {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 380px;
  margin: 0.5rem auto;
  text-align: center;
}

.admin-lock .admin-title {
  text-align: center;
}

/* ============================ Tab ============================ */
.admin-tabs {
  display: flex;
  gap: 0.6rem;
  margin: 0.85rem 0 1rem;
}

.admin-tab {
  padding: 0.4rem 0.95rem;
  border: 2px solid transparent;
  border-radius: 10px 5px 12px 6px / 6px 12px 5px 10px;
  background: transparent;
  color: #6f6759;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.admin-tab:hover {
  color: #2b2b2b;
}

.admin-tab.active {
  border-color: #2b2b2b;
  background: #f5c542;
  box-shadow: 2px 2px 0 #2b2b2b;
  color: #2b2b2b;
  transform: rotate(-1deg);
}

/* ============================ 输入 / 按钮 ============================ */
.admin-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 2px solid #2b2b2b;
  border-radius: 10px 5px 12px 6px / 6px 12px 5px 10px;
  background: #fffef9;
  box-shadow: 2px 2px 0 #2b2b2b;
  color: #2b2b2b;
  font-family: inherit;
  font-size: 1rem;
}

.admin-input:focus {
  outline: none;
  box-shadow: 4px 4px 0 #2b2b2b;
}

.admin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 0.95rem;
  border: 2px solid #2b2b2b;
  border-radius: 10px 5px 12px 6px / 6px 12px 5px 10px;
  background: #fffdf6;
  box-shadow: 3px 3px 0 #2b2b2b;
  color: #2b2b2b;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.15s ease;
}

.admin-btn:hover:not(:disabled) {
  background: #f5c542;
  box-shadow: 4px 4px 0 #2b2b2b;
  transform: translate(-1px, -1px);
}

.admin-btn:active:not(:disabled) {
  box-shadow: 0 0 0 #2b2b2b;
  transform: translate(3px, 3px);
}

.admin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-btn.primary {
  background: #f5c542;
}

.admin-btn.small {
  padding: 0.4rem 0.7rem;
  font-size: 0.88rem;
}

.admin-btn.ghost {
  background: #fffdf6;
  box-shadow: 2px 2px 0 #2b2b2b;
}

.admin-btn.danger {
  background: #ffe1da;
  color: #7c2618;
}

.admin-btn.danger:hover:not(:disabled) {
  background: #f7b9ac;
}

/* ============================ 提示 ============================ */
.admin-hint {
  margin: 0.6rem 0;
  color: #6f6759;
  font-size: 0.9rem;
}

.admin-hint.inline {
  margin: 0;
}

.admin-msg {
  margin: 0.75rem 0 0;
  padding: 0.55rem 0.75rem;
  border: 2px solid #2b2b2b;
  border-radius: 8px 4px 10px 5px / 5px 10px 4px 8px;
  box-shadow: 2px 2px 0 #2b2b2b;
  font-size: 0.88rem;
  line-height: 1.5;
}

.admin-msg.error {
  background: #ffe1da;
  color: #7c2618;
}

.admin-msg.success {
  background: #e4f3d9;
  color: #24572c;
}

/* ============================ 复选 ============================ */
.admin-check {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  cursor: pointer;
}

.admin-check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.admin-check__box {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #2b2b2b;
  border-radius: 5px 3px 7px 4px / 4px 7px 3px 5px;
  background: #fffef9;
  box-shadow: 1.5px 1.5px 0 #2b2b2b;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.admin-check input:checked + .admin-check__box {
  background: #f5c542;
}

.admin-check input:checked + .admin-check__box::after {
  content: "✓";
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b2b2b;
  font-size: 0.8rem;
  font-weight: 900;
  line-height: 1;
}

.admin-check input:indeterminate + .admin-check__box {
  background: #f5c542;
}

.admin-check input:indeterminate + .admin-check__box::after {
  content: "–";
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b2b2b;
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1;
}

/* ============================ 评论列表 ============================ */
.disc-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.disc-item {
  margin-bottom: 0.7rem;
  border: 2px solid #2b2b2b;
  border-radius: 12px 6px 13px 7px / 7px 13px 6px 12px;
  background: #fffef9;
  box-shadow: 2px 2px 0 rgba(43, 43, 43, 0.85);
  overflow: hidden;
}

.disc-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
}

.disc-toggle {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: #2b2b2b;
  font-family: inherit;
  font-size: 0.98rem;
  font-weight: 700;
  text-align: start;
  cursor: pointer;
}

.disc-caret {
  flex: 0 0 auto;
  width: 1em;
  color: #6f6759;
}

.disc-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.disc-count {
  flex: 0 0 auto;
  color: #6f6759;
  font-size: 0.82rem;
}

.disc-link {
  flex: 0 0 auto;
  color: #2b2b2b;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: underline wavy #e06a43;
  text-underline-offset: 3px;
}

.comment-list {
  margin: 0;
  padding: 0.15rem 0.75rem 0.6rem;
  border-top: 1.5px dashed rgba(43, 43, 43, 0.25);
  list-style: none;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.55rem 0;
  border-bottom: 1px dashed rgba(43, 43, 43, 0.14);
}

.comment-item:last-child {
  border-bottom: 0;
}

.comment-item .admin-check {
  margin-top: 0.15rem;
}

.comment-avatar {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1.5px solid #2b2b2b;
  border-radius: 50%;
  object-fit: cover;
}

.comment-main {
  flex: 1 1 auto;
  min-width: 0;
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.comment-author {
  color: #2b2b2b;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
}

.comment-time {
  color: #8a8274;
  font-size: 0.76rem;
}

.comment-body {
  margin: 0.2rem 0 0;
  color: #3a352d;
  font-size: 0.88rem;
  line-height: 1.55;
  word-break: break-word;
  white-space: pre-wrap;
}

.comment-link {
  display: inline-block;
  margin-top: 0.2rem;
  color: #6f6759;
  font-size: 0.76rem;
  text-decoration: underline wavy rgba(224, 106, 67, 0.85);
  text-underline-offset: 3px;
}

/* ============================ 内容树 ============================ */
.content-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 0.8rem;
}

.tree-list {
  margin: 0;
  padding: 0.3rem;
  border: 2px solid #2b2b2b;
  border-radius: 10px 5px 12px 6px / 6px 12px 5px 10px;
  background: #fffef9;
  list-style: none;
  max-height: 46vh;
  overflow: auto;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.28rem 0.35rem;
  border-radius: 6px;
}

.tree-row:hover {
  background: rgba(245, 197, 66, 0.22);
}

.tree-spacer {
  display: inline-block;
  width: 18px;
  flex: 0 0 auto;
}

.tree-icon {
  flex: 0 0 auto;
  font-size: 0.95rem;
}

.tree-name {
  overflow: hidden;
  color: #2b2b2b;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================ 底部 ============================ */
.admin-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.95rem;
  padding-top: 0.75rem;
  border-top: 2px dashed rgba(43, 43, 43, 0.25);
}

/* ============================ 小屏 ============================ */
@media (max-width: 520px) {
  .admin-fab {
    left: 14px;
    bottom: 14px;
    padding: 0.5rem 0.85rem;
    font-size: 0.92rem;
  }

  .admin-modal {
    padding: 1rem 0.9rem 1.1rem;
    max-height: 88vh;
  }

  .admin-title {
    font-size: 1.28rem;
  }

  .admin-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-footer .admin-btn {
    width: 100%;
  }
}
</style>
