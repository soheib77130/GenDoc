import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { base64ToBytes } from "@/lib/pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc || doc.userId !== user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (!doc.fileData) {
    return NextResponse.json({ error: "Pas de fichier" }, { status: 400 });
  }
  const bytes = base64ToBytes(doc.fileData);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new NextResponse(arrayBuffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${doc.title.replace(/[^a-z0-9-]+/gi, "_")}.pdf"`,
    },
  });
}
