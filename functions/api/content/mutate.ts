// POST /api/content/mutate —— 通过 GitHub Git Data API 做「一次提交」批量新建/删除内容
// body: { creates?: [{ path, content }], deletes?: string[] }
// 返回: { ok:true, commit, created, deleted }
import { json, requireAdmin, gh, b64, REPO_API, BRANCH } from "../_utils";

// 统一错误响应：把 GitHub status 与返回体带回，便于排查
function fail(step: string, status: number, body: any) {
  return json({ ok: false, error: step, detail: { status, body } }, 502);
}

// 路径安全校验：只允许 src/ 下的内容文件/目录，禁止目录穿越与敏感目录，
// 避免（即使口令外泄时）被用来改写仓库里的工作流、配置或任意其它文件。
function isSafeContentPath(p: string): boolean {
  if (typeof p !== "string") return false;
  const s = p.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!s) return false;
  if (s.includes("..")) return false;
  if (!s.startsWith("src/")) return false;
  if (s === "src/.vuepress" || s.startsWith("src/.vuepress/")) return false;
  if (s === "src/public" || s.startsWith("src/public/")) return false;
  if (s === "src" || s === "src/") return false;
  return true;
}

export const onRequestPost = async (context: any) => {
  const denied = requireAdmin(context);
  if (denied) return denied;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const creates: any[] = Array.isArray(body && body.creates) ? body.creates : [];
  const deletes: any[] = Array.isArray(body && body.deletes) ? body.deletes : [];

  if (creates.length === 0 && deletes.length === 0) {
    return json({ ok: false, error: "nothing_to_do" }, 400);
  }

  // 校验创建项（含路径安全）
  for (const c of creates) {
    if (!c || typeof c.path !== "string" || typeof c.content !== "string" || !c.path) {
      return json({ ok: false, error: "invalid_create_item", detail: c }, 400);
    }
    const norm = c.path.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!isSafeContentPath(norm)) {
      return json({ ok: false, error: "invalid_path", detail: c.path }, 400);
    }
    c.path = norm;
  }

  // a. 取当前分支 HEAD commit 与 baseTree
  const refRes = await gh(context, `${REPO_API}/git/ref/heads/${BRANCH}`);
  if (!refRes.ok || !refRes.data || !refRes.data.object || !refRes.data.object.sha) {
    return fail("get_ref_failed", refRes.status, refRes.data);
  }
  const currentCommitSha: string = refRes.data.object.sha;

  const commitRes = await gh(context, `${REPO_API}/git/commits/${currentCommitSha}`);
  if (!commitRes.ok || !commitRes.data || !commitRes.data.tree || !commitRes.data.tree.sha) {
    return fail("get_commit_failed", commitRes.status, commitRes.data);
  }
  const baseTree: string = commitRes.data.tree.sha;

  // b. 载入 baseTree 全量树（仅在有删除时用于展开目录前缀）
  const blobSet = new Set<string>();
  const treeEntries: any[] = [];
  const needTree = deletes.length > 0;

  if (needTree) {
    const treeRes = await gh(context, `${REPO_API}/git/trees/${baseTree}?recursive=1`);
    if (!treeRes.ok || !treeRes.data || !Array.isArray(treeRes.data.tree)) {
      return fail("get_base_tree_failed", treeRes.status, treeRes.data);
    }
    for (const node of treeRes.data.tree) {
      if (node && node.type === "blob" && node.path) blobSet.add(node.path);
    }
  }

  // 展开每个删除路径：命中文件则删该文件；否则按目录前缀删除其下所有 blob
  const deleteBlobs = new Set<string>();
  for (const raw of deletes) {
    let d = String(raw == null ? "" : raw).replace(/\\/g, "/").replace(/^\/+/, "");
    if (!d) continue;
    if (!isSafeContentPath(d)) {
      return json({ ok: false, error: "invalid_path", detail: raw }, 400);
    }
    if (blobSet.has(d)) {
      deleteBlobs.add(d);
      continue;
    }
    const prefix = d.endsWith("/") ? d : d + "/";
    for (const b of blobSet) {
      if (b.startsWith(prefix)) deleteBlobs.add(b);
    }
  }

  // c. 逐个创建 blob，收集 tree 条目
  for (const c of creates) {
    const blobRes = await gh(context, `${REPO_API}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: b64(c.content), encoding: "base64" }),
    });
    if (!blobRes.ok || !blobRes.data || !blobRes.data.sha) {
      return fail("create_blob_failed", blobRes.status, blobRes.data);
    }
    treeEntries.push({ path: c.path, mode: "100644", type: "blob", sha: blobRes.data.sha });
  }

  // 删除项：sha 传 null 表示从树上移除
  for (const p of deleteBlobs) {
    treeEntries.push({ path: p, mode: "100644", type: "blob", sha: null });
  }

  // 若最终没有任何变更（例如删除的路径都不存在），直接返回当前 commit
  if (treeEntries.length === 0) {
    return json({ ok: true, commit: currentCommitSha, created: 0, deleted: 0, note: "no_changes" });
  }

  // d. 基于 baseTree 生成新 tree
  const newTreeRes = await gh(context, `${REPO_API}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTree, tree: treeEntries }),
  });
  if (!newTreeRes.ok || !newTreeRes.data || !newTreeRes.data.sha) {
    return fail("create_tree_failed", newTreeRes.status, newTreeRes.data);
  }
  const newTreeSha: string = newTreeRes.data.sha;

  // e. 创建新 commit
  const newCommitRes = await gh(context, `${REPO_API}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "chore(admin): content update via web admin",
      tree: newTreeSha,
      parents: [currentCommitSha],
    }),
  });
  if (!newCommitRes.ok || !newCommitRes.data || !newCommitRes.data.sha) {
    return fail("create_commit_failed", newCommitRes.status, newCommitRes.data);
  }
  const newCommitSha: string = newCommitRes.data.sha;

  // f. 更新分支引用指向新 commit
  const updateRefRes = await gh(context, `${REPO_API}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommitSha }),
  });
  if (!updateRefRes.ok) {
    return fail("update_ref_failed", updateRefRes.status, updateRefRes.data);
  }

  return json({
    ok: true,
    commit: newCommitSha,
    created: creates.length,
    deleted: deleteBlobs.size,
  });
};
