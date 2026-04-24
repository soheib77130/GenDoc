import { prisma } from "./db";
import { ACTION_COST, getPlan, UNIT_PRICE_CTS } from "./plans";

export type Action = "generate" | "edit";

type QuotaStatus = {
  allowed: boolean;
  usingQuota: boolean; // if true, action is free (covered by plan)
  needsCredits: boolean;
  needsPayment: boolean;
  remaining: number; // remaining in plan quota
  credits: number; // remaining credits
  cost: number; // crédits requis pour cette action
  planName: string;
};

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function maybeResetPeriod(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const start = monthStart(new Date());
  if (user.quotaPeriodStart < start) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        quotaGenUsed: 0,
        quotaEditUsed: 0,
        quotaPeriodStart: start,
      },
    });
    return prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }
  return user;
}

export async function getQuotaStatus(
  userId: string,
  action: Action
): Promise<QuotaStatus> {
  const user = await maybeResetPeriod(userId);
  const plan = getPlan(user.plan);
  const used = action === "generate" ? user.quotaGenUsed : user.quotaEditUsed;
  const max = action === "generate" ? plan.quotaGen : plan.quotaEdit;
  const remaining = Math.max(0, max - used);
  const usingQuota = remaining > 0;
  const cost = ACTION_COST[action];
  const needsCredits = !usingQuota && user.credits >= cost;
  const needsPayment = !usingQuota && user.credits < cost;

  return {
    allowed: usingQuota || needsCredits,
    usingQuota,
    needsCredits,
    needsPayment,
    remaining,
    credits: user.credits,
    cost,
    planName: plan.name,
  };
}

export async function consumeAction(userId: string, action: Action) {
  const status = await getQuotaStatus(userId, action);
  if (status.usingQuota) {
    if (action === "generate") {
      await prisma.user.update({
        where: { id: userId },
        data: { quotaGenUsed: { increment: 1 } },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { quotaEditUsed: { increment: 1 } },
      });
    }
    return { kind: "quota" as const };
  }
  if (status.needsCredits) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: status.cost } },
    });
    return { kind: "credits" as const, spent: status.cost };
  }
  // needs payment — caller should have redirected earlier
  throw new Error("PAYMENT_REQUIRED");
}

export { UNIT_PRICE_CTS };
