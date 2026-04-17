import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTemplate, getCategory } from "@/lib/templates";
import { getQuotaStatus, consumeAction } from "@/lib/quota";
import { bytesToBase64, renderTemplateToPdf } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await req.json();

  const cat = getCategory(body.categoryId);
  const tpl = getTemplate(body.categoryId, body.templateId);
  if (!cat || !tpl) {
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
  }

  const status = await getQuotaStatus(user.id, "generate");
  if (status.needsPayment) {
    return NextResponse.json(
      { error: "Paiement requis", needsPayment: true },
      { status: 402 }
    );
  }

  await consumeAction(user.id, "generate");

  const rendered = tpl.render(body.data || {});
  const pdf = await renderTemplateToPdf(rendered);

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      title: tpl.name,
      kind: "generated",
      category: cat.id,
      templateId: tpl.id,
      data: JSON.stringify(body.data || {}),
      fileData: bytesToBase64(pdf),
    },
  });

  return NextResponse.json({ id: doc.id });
}
