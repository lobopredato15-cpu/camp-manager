import { NextResponse } from "next/server";
import { getRequestContext, writeAudit } from "@/app/api/_utils";

export async function POST(request: Request) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const body = await request.json();
  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!id || !["planned", "checked-in", "checked-out", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Valid assignment and status are required" }, { status: 400 });
  }

  const current = await context.supabase
    .from("assignments")
    .select("id,room_id")
    .eq("organization_id", context.session.organizationId)
    .eq("id", id)
    .single();

  if (current.error || !current.data) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const { data, error } = await context.supabase
    .from("assignments")
    .update({ status })
    .eq("organization_id", context.session.organizationId)
    .eq("id", id)
    .select("id,person_id,room_id,start_date,end_date,status")
    .single();

  if (error) return NextResponse.json({ error: "Could not update assignment" }, { status: 400 });
  if (status === "checked-out" || status === "cancelled") {
    await context.supabase.from("rooms").update({ status: "available" }).eq("id", current.data.room_id).eq("organization_id", context.session.organizationId);
  }
  await writeAudit("Assignment updated", `Status changed to ${status}`);
  return NextResponse.json(data);
}
