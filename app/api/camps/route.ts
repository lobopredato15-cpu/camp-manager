import { NextResponse } from "next/server";
import { getRequestContext, writeAudit } from "@/app/api/_utils";

export async function POST(request: Request) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Camp name is required" }, { status: 400 });

  const { data, error } = await context.supabase
    .from("camps")
    .insert({
      organization_id: context.session.organizationId,
      name,
      location: String(body.location || "").trim(),
      manager: String(body.manager || "").trim(),
    })
    .select("id,name,location,manager")
    .single();

  if (error) return NextResponse.json({ error: "Could not create camp" }, { status: 400 });
  await writeAudit("Camp created", data.name);
  return NextResponse.json(data);
}
