import { NextResponse } from "next/server";
import { getRequestContext, writeAudit } from "@/app/api/_utils";

export async function POST(request: Request) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const body = await request.json();
  const name = String(body.name || "").trim();
  const campId = String(body.campId || "");
  const beds = Number(body.beds || 1);
  if (!campId || !name || !Number.isInteger(beds) || beds < 1) {
    return NextResponse.json({ error: "Camp, room name, and beds are required" }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("rooms")
    .insert({
      organization_id: context.session.organizationId,
      camp_id: campId,
      building: String(body.building || "Main").trim() || "Main",
      name,
      beds,
      status: String(body.status || "available"),
    })
    .select("id,camp_id,building,name,beds,status")
    .single();

  if (error) return NextResponse.json({ error: "Could not create room" }, { status: 400 });
  await writeAudit("Room created", `${data.name} with ${data.beds} beds`);
  return NextResponse.json(data);
}
