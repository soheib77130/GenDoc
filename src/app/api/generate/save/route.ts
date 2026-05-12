import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTemplate, getCategory } from "@/lib/templates";
import { getQuotaStatus, consumeAction } from "@/lib/quota";
import {
  bytesToBase64,
  renderContratProfessionnalisationPdf,
  renderTemplateToPdf,
} from "@/lib/pdf";

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

  const data = body.data || {};
  let pdf: Uint8Array;
  try {
    if (tpl.id === "contrat-professionnalisation") {
      pdf = await renderContratProfessionnalisationPdf(data);
    } else {
      const rendered = tpl.render(data);
      pdf = await renderTemplateToPdf(rendered);
    }
  } catch (err) {
    console.error("[generate/save] PDF generation failed:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }

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
