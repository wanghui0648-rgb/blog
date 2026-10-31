// POST /api/comments/delete —— 删除评论 / 讨论（支持批量）
// body: { commentIds?: string[], discussionIds?: string[] }
import { json, requireAdmin, ghGraphQL } from "../_utils";

// 删除单条讨论评论
const DELETE_COMMENT = `mutation($id: ID!) {
  deleteDiscussionComment(input: { id: $id }) {
    clientMutationId
  }
}`;

// 删除整个讨论（需带选择集，GraphQL 对象类型字段必须选择子字段）
const DELETE_DISCUSSION = `mutation($id: ID!) {
  deleteDiscussion(input: { discussionId: $id }) {
    clientMutationId
  }
}`;

export const onRequestPost = async (context: any) => {
  const denied = requireAdmin(context);
  if (denied) return denied;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const commentIds: string[] = Array.isArray(body && body.commentIds) ? body.commentIds : [];
  const discussionIds: string[] = Array.isArray(body && body.discussionIds) ? body.discussionIds : [];

  if (commentIds.length === 0 && discussionIds.length === 0) {
    return json({ ok: false, error: "no_ids" }, 400);
  }

  const errors: any[] = [];
  let deletedComments = 0;
  let deletedDiscussions = 0;

  // 逐条删除评论，单个失败不整体失败
  for (const id of commentIds) {
    try {
      const g = await ghGraphQL(context, DELETE_COMMENT, { id });
      if (!g.ok || (g.data && g.data.errors)) {
        errors.push({ type: "comment", id, status: g.status, error: (g.data && g.data.errors) || g.data });
      } else {
        deletedComments++;
      }
    } catch (e: any) {
      errors.push({ type: "comment", id, error: String((e && e.message) || e) });
    }
  }

  // 逐个删除讨论
  for (const id of discussionIds) {
    try {
      const g = await ghGraphQL(context, DELETE_DISCUSSION, { id });
      if (!g.ok || (g.data && g.data.errors)) {
        errors.push({ type: "discussion", id, status: g.status, error: (g.data && g.data.errors) || g.data });
      } else {
        deletedDiscussions++;
      }
    } catch (e: any) {
      errors.push({ type: "discussion", id, error: String((e && e.message) || e) });
    }
  }

  return json({ ok: true, deletedComments, deletedDiscussions, errors });
};
