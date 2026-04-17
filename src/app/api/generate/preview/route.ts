import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await req.json();
  const tpl = getTemplate(body.categoryId, body.templateId);
  if (!tpl) return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  const rendered = tpl.render(body.data || {});
  return NextResponse.json({ rendered });
}
