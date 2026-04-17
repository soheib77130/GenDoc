import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc || doc.userId !== user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await prisma.document.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
