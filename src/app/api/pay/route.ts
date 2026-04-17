import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CREDITS_PACKS, PLANS } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await req.json();

  if (body.kind === "plan") {
    const plan = PLANS.find((p) => p.id === body.planId);
    if (!plan) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: plan.id,
        planRenewsAt: plan.priceCts > 0 ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null,
        quotaGenUsed: 0,
        quotaEditUsed: 0,
        quotaPeriodStart: new Date(),
      },
    });
    if (plan.priceCts > 0) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          kind: "subscription",
          label: `Abonnement ${plan.name}`,
          amountCts: plan.priceCts,
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "credits") {
    const pack = CREDITS_PACKS.find((p) => p.id === body.packId);
    if (!pack) return NextResponse.json({ error: "Pack invalide" }, { status: 400 });
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: pack.credits } },
    });
    await prisma.payment.create({
      data: {
        userId: user.id,
        kind: "credits",
        label: pack.label,
        amountCts: pack.priceCts,
      },
    });
    return NextResponse.json({ ok: true, credits: pack.credits });
  }

  if (body.kind === "unit") {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: 1 } },
    });
    await prisma.payment.create({
      data: {
        userId: user.id,
        kind: "one-off",
        label: `Action unitaire (${body.action})`,
        amountCts: 99,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
}
