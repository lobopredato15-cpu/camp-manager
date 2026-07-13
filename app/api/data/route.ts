import { NextResponse } from "next/server";
import { getRequestContext } from "@/app/api/_utils";

export async function GET() {
  const context = await getRequestContext();
  if ("error" in context) return context.error;

  const organizationId = context.session.organizationId;
  const [camps, rooms, people, assignments, auditLogs] = await Promise.all([
    context.supabase.from("camps").select("id,name,location,manager").eq("organization_id", organizationId).order("created_at"),
    context.supabase.from("rooms").select("id,camp_id,building,name,beds,status").eq("organization_id", organizationId).order("created_at"),
    context.supabase.from("people").select("id,name,company,trade,flight").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    context.supabase.from("assignments").select("id,person_id,room_id,start_date,end_date,status").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    context.supabase.from("audit_logs").select("id,action,detail,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
  ]);

  const error = camps.error || rooms.error || people.error || assignments.error || auditLogs.error;
  if (error) {
    return NextResponse.json({ error: "Could not load dashboard data" }, { status: 500 });
  }

  return NextResponse.json({
    camps: camps.data,
    rooms: rooms.data,
    people: people.data,
    assignments: assignments.data,
    auditLogs: auditLogs.data,
  });
}
