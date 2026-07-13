import { NextResponse } from "next/server";
import { getRequestContext, writeAudit } from "@/app/api/_utils";

export async function POST(request: Request) {
  const context = await getRequestContext();
  if ("error" in context) return context.error;
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await context.supabase
    .from("people")
    .insert({
      organization_id: context.session.organizationId,
      name,
      company: String(body.company || "").trim(),
      trade: String(body.trade || "").trim(),
      flight: String(body.flight || "Pending").trim() || "Pending",
    })
    .select("id,name,company,trade,flight")
    .single();

  if (error) return NextResponse.json({ error: "Could not create person" }, { status: 400 });
  await writeAudit("Person created", `${data.name} added`);
  return NextResponse.json(data);
}
