// 共享工具函数：鉴权、JSON 响应、GitHub API 调用、UTF-8 base64 编码
// 说明：本文件位于 Pages Functions 目录，由 wrangler（esbuild）打包，
//       不做类型检查，因此这里统一用 any 以避免引入类型依赖。

// 仓库常量
export const OWNER = "wanghui0648-rgb";
export const REPO = "blog";
export const BRANCH = "main";
// GitHub REST API 中本仓库的前缀
export const REPO_API = `/repos/${OWNER}/${REPO}`;

// Cloudflare Pages 环境变量
export type Env = {
  ADMIN_PASSWORD: string;
  GITHUB_TOKEN: string;
};

// 返回 JSON Response
export function json(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// 鉴权：读取请求头 x-admin-key 与环境变量 ADMIN_PASSWORD 比对。
// 通过返回 null；不通过返回 401 Response（调用方直接 return 即可）。
export function requireAdmin(context: any): Response | null {
  const env = (context && context.env) || {};
  const headers = context && context.request && context.request.headers;
  const key = headers ? headers.get("x-admin-key") : null;
  if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

// 调用 https://api.github.com + path。
// init 可选，可传 { method, body, headers }。
// 返回 { status, ok, data }，其中 data 为解析后的 JSON；解析失败时回退为文本。
export async function gh(context: any, path: string, init: any = {}) {
  const env = (context && context.env) || {};
  const headers: any = {
    Authorization: `Bearer ${env.GITHUB_TOKEN || ""}`,
    "User-Agent": "blog-admin",
    Accept: "application/vnd.github+json",
  };
  // 有 body 时默认按 JSON 发送
  if (init && init.body != null) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch("https://api.github.com" + path, {
    ...init,
    headers: { ...headers, ...((init && init.headers) || {}) },
  });
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, ok: res.ok, data };
}

// 调用 GitHub GraphQL API：POST https://api.github.com/graphql
// 返回 { status, ok, data }
export async function ghGraphQL(context: any, query: string, variables: any = {}) {
  const env = (context && context.env) || {};
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN || ""}`,
      "User-Agent": "blog-admin",
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, ok: res.ok, data };
}

// UTF-8 安全 base64 编码（TextEncoder + btoa 逐字节）
export function b64(str: string): string {
  const bytes = new TextEncoder().encode(str == null ? "" : String(str));
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}
