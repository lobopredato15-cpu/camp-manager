import { NextResponse } from "next/server";
import { getRequestContext, writeAudit } from "@/app/api/_utils";

export async function POST(request: Request) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const body = await request.json();
  const personId = String(body.personId || "");
  const roomId = String(body.roomId || "");
  if (!personId || !roomId) return NextResponse.json({ error: "Person and room are required" }, { status: 400 });

  const startDate = String(body.startDate || new Date().toISOString().slice(0, 10));
  const endDate = String(body.endDate || "2026-12-31");

  const existing = await context.supabase
    .from("assignments")
    .select("id")
    .eq("organization_id", context.session.organizationId)
    .eq("room_id", roomId)
    .in("status", ["planned", "checked-in"])
    .limit(1);

  if (existing.data?.length) {
    return NextResponse.json({ error: "Room already has an active assignment" }, { status: 409 });
  }

  const { data, error } = await context.supabase
    .from("assignments")
    .insert({
      organization_id: context.session.organizationId,
      person_id: personId,
      room_id: roomId,
      start_date: startDate,
      end_date: endDate,
      status: "planned",
    })
    .select("id,person_id,room_id,start_date,end_date,status")
    .single();

  if (error) return NextResponse.json({ error: "Could not create assignment" }, { status: 400 });
  await context.supabase.from("rooms").update({ status: "reserved" }).eq("id", roomId).eq("organization_id", context.session.organizationId);
  await writeAudit("Assignment created", `Person assigned to room`);
  return NextResponse.json(data);
}
