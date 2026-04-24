import { AppShell } from "@/components/dashboard/AppShell";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, CREDITS_PACKS, UNIT_PRICE_CTS } from "@/lib/plans";
import { PricingClient } from "@/components/dashboard/PricingClient";
import { Gift } from "lucide-react";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { need?: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    // Public version (landing-style)
    return (
      <main className="overflow-x-hidden">
        <Navbar />
        <div className="pt-36 pb-6">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-slate-900">
              Des tarifs simples et honnêtes.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Choisissez l'abonnement qui vous convient. Payez à l'unité si vous
              préférez. Annulez à tout moment.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-cyan-50 px-5 py-4 text-sm text-emerald-900">
            <Gift className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div>
              <strong>5 crédits offerts</strong> à l'inscription — parrainez un ami et
              recevez chacun <strong>10 crédits supplémentaires</strong>.
            </div>
          </div>
          <PricingClient
            plans={PLANS}
            packs={CREDITS_PACKS}
            unitPriceCts={UNIT_PRICE_CTS}
            currentPlan={null}
            needPaymentFor={searchParams.need}
          />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Abonnement & crédits
        </h1>
        <p className="mt-1.5 text-slate-600">
          Plan actuel : <span className="font-medium capitalize">{user.plan}</span> ·
          Crédits disponibles : <span className="font-medium">{user.credits}</span>
        </p>
      </div>
      <PricingClient
        plans={PLANS}
        packs={CREDITS_PACKS}
        unitPriceCts={UNIT_PRICE_CTS}
        currentPlan={user.plan}
        needPaymentFor={searchParams.need}
      />
    </AppShell>
  );
}
