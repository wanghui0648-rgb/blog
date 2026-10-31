// POST /api/auth/verify —— 校验管理员口令
// 通过：200 { ok:true }；不通过：401 { ok:false, error:"unauthorized" }
import { json, requireAdmin } from "../_utils";

export const onRequestPost = async (context: any) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  return json({ ok: true });
};

// GET 同样可用于探活/校验
export const onRequestGet = async (context: any) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  return json({ ok: true });
};
