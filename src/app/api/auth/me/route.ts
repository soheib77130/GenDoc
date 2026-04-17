import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      quotaGenUsed: user.quotaGenUsed,
      quotaEditUsed: user.quotaEditUsed,
      credits: user.credits,
    },
  });
}
