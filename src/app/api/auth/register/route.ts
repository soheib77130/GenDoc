import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { REFERRAL_BONUS_CREDITS, SIGNUP_CREDITS } from "@/lib/plans";
import { generateUniqueReferralCode } from "@/lib/referral";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Au moins 6 caractères"),
  name: z.string().optional(),
  referralCode: z.string().trim().min(1).max(32).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
    }

    let referrer = null as { id: string } | null;
    if (data.referralCode) {
      const found = await prisma.user.findUnique({
        where: { referralCode: data.referralCode.toUpperCase() },
        select: { id: true },
      });
      if (found) referrer = found;
    }

    const passwordHash = await hashPassword(data.password);
    const referralCode = await generateUniqueReferralCode();
    const credits = SIGNUP_CREDITS + (referrer ? REFERRAL_BONUS_CREDITS : 0);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        referralCode,
        credits,
        referredById: referrer?.id ?? null,
      },
    });

    if (referrer) {
      await prisma.user.update({
        where: { id: referrer.id },
        data: { credits: { increment: REFERRAL_BONUS_CREDITS } },
      });
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
