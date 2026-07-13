import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function getRequestContext() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { error: NextResponse.json({ error: "Supabase environment variables are missing" }, { status: 500 }) };
  }

  return {
    session,
    supabase: createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

export async function writeAudit(action: string, detail: string) {
  const context = await getRequestContext();
  if ("error" in context) return;
  await context.supabase.rpc("create_audit_log", {
    p_organization_id: context.session.organizationId,
    p_actor_user_id: context.session.userId,
    p_action: action,
    p_detail: detail,
  });
}
