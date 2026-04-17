import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consumeAction, getQuotaStatus } from "@/lib/quota";

const schema = z.object({
  title: z.string().min(1),
  fileData: z.string().min(10), // base64
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await req.json();
  const data = schema.parse(body);

  const status = await getQuotaStatus(user.id, "edit");
  if (status.needsPayment) {
    return NextResponse.json(
      { error: "Paiement requis", needsPayment: true },
      { status: 402 }
    );
  }

  await consumeAction(user.id, "edit");

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      title: data.title,
      kind: "edited",
      category: null,
      templateId: null,
      fileData: data.fileData,
    },
  });
  return NextResponse.json({ id: doc.id });
}
