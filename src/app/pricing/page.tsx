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
        <div className="pt-28 pb-6 sm:pt-36">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Des tarifs simples et honnêtes.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
              Choisissez l'abonnement qui vous convient. Payez à l'unité si vous
              préférez. Annulez à tout moment.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-6">
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Abonnement & crédits
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
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
