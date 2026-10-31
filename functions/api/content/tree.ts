// GET /api/content/tree —— 列出可管理的博客内容文件/文件夹
// 规则：只保留 src/ 下的路径；排除 src/.vuepress 与 src/public；
//       文件仅保留 .md 的 blob；目录(tree)保留，并从 blob 路径父级派生补齐。
import { json, requireAdmin, gh, REPO_API, BRANCH } from "../_utils";

// 判断路径是否纳入结果（必须以 src/ 开头，且不在排除目录下）
function includePath(p: string): boolean {
  if (!p.startsWith("src/")) return false;
  if (p === "src/.vuepress" || p.startsWith("src/.vuepress/")) return false;
  if (p === "src/public" || p.startsWith("src/public/")) return false;
  return true;
}

// 把某路径的所有父级目录加入 dirs 集合（如 a/b/c.md -> a, a/b）
function addParents(p: string, dirs: Set<string>): void {
  const parts = p.split("/");
  for (let i = 1; i < parts.length; i++) {
    const dir = parts.slice(0, i).join("/");
    if (includePath(dir)) dirs.add(dir);
  }
}

export const onRequestGet = async (context: any) => {
  const denied = requireAdmin(context);
  if (denied) return denied;

  const res = await gh(context, `${REPO_API}/git/trees/${BRANCH}?recursive=1`);
  if (!res.ok || !res.data || !Array.isArray(res.data.tree)) {
    return json(
      { ok: false, error: "get_tree_failed", detail: { status: res.status, body: res.data } },
      502
    );
  }

  const blobs = new Set<string>();
  const dirs = new Set<string>();

  for (const node of res.data.tree) {
    const p: string = node && node.path;
    if (!p || !includePath(p)) continue;
    if (node.type === "blob") {
      // 文件只保留 .md
      if (p.endsWith(".md")) {
        blobs.add(p);
        addParents(p, dirs);
      }
    } else if (node.type === "tree") {
      // 目录保留用于展示，并补齐其父级
      dirs.add(p);
      addParents(p, dirs);
    }
  }

  const entries: any[] = [];
  for (const d of dirs) entries.push({ path: d, type: "tree" });
  for (const b of blobs) entries.push({ path: b, type: "blob" });

  // 按 path 排序
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  return json({ ok: true, entries });
};
