// GET /api/comments/list —— 列出仓库 Discussions 及其评论（giscus 数据源）
import { json, requireAdmin, ghGraphQL } from "../_utils";

// 固定查询：按更新时间倒序取 50 个讨论，每个讨论取前 100 条评论
const LIST_QUERY = `query {
  repository(owner: "wanghui0648-rgb", name: "blog") {
    discussions(first: 50, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes {
        id
        title
        url
        comments(first: 100) {
          totalCount
          nodes {
            id
            body
            createdAt
            url
            author {
              login
              avatarUrl
              url
            }
          }
        }
      }
    }
  }
}`;

export const onRequestGet = async (context: any) => {
  const denied = requireAdmin(context);
  if (denied) return denied;

  const g = await ghGraphQL(context, LIST_QUERY, {});
  if (!g.ok || (g.data && g.data.errors)) {
    return json(
      { ok: false, error: "graphql_failed", detail: { status: g.status, body: g.data } },
      502
    );
  }

  const nodes = (g.data && g.data.data && g.data.data.repository && g.data.data.repository.discussions && g.data.data.repository.discussions.nodes) || [];

  const discussions = nodes.map((d: any) => {
    const cNodes = (d.comments && d.comments.nodes) || [];
    return {
      id: d.id,
      title: d.title,
      url: d.url,
      commentCount: d.comments && d.comments.totalCount != null ? d.comments.totalCount : cNodes.length,
      comments: cNodes.map((c: any) => ({
        id: c.id,
        author: c.author ? c.author.login : null,
        avatarUrl: c.author ? c.author.avatarUrl : null,
        authorUrl: c.author ? c.author.url : null,
        body: c.body != null ? c.body : "",
        createdAt: c.createdAt || null,
        url: c.url || null,
      })),
    };
  });

  return json({ ok: true, discussions });
};
