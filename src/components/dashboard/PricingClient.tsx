"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Coins, CreditCard, Lock, X } from "lucide-react";
import { Plan } from "@/lib/plans";
import { formatEuros } from "@/lib/utils";
import Link from "next/link";

type Pack = { id: string; label: string; credits: number; priceCts: number };

export function PricingClient({
  plans,
  packs,
  unitPriceCts,
  currentPlan,
  needPaymentFor,
}: {
  plans: Plan[];
  packs: Pack[];
  unitPriceCts: number;
  currentPlan: string | null;
  needPaymentFor?: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<
    | null
    | { kind: "plan"; planId: string; label: string; amountCts: number }
    | { kind: "credits"; packId: string; label: string; amountCts: number }
    | { kind: "unit"; action: "generate" | "edit"; label: string; amountCts: number }
  >(null);

  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  async function confirm() {
    if (!modal) return;
    if (!currentPlan) {
      router.push("/register");
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1400)); // simulate
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(modal),
    });
    setProcessing(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => {
        setModal(null);
        setDone(false);
        router.refresh();
      }, 1200);
    }
  }

  return (
    <>
      {needPaymentFor && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Vous avez atteint la limite de votre plan pour cette action. Choisissez
          une formule ou un pack de crédits pour continuer.
        </div>
      )}

      {/* Plans */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className={`relative overflow-hidden rounded-3xl border p-5 backdrop-blur transition-all sm:p-7 ${
                plan.highlight
                  ? "border-indigo-300/60 bg-gradient-to-br from-white to-indigo-50/40 shadow-2xl shadow-indigo-500/10"
                  : "border-slate-200/70 bg-white/80"
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
                  <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="h-3 w-3" />
                    Recommandé
                  </div>
                </>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {plan.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">
                  {plan.priceCts === 0
                    ? "0€"
                    : formatEuros(plan.priceCts).replace(",00", "")}
                </span>
                {plan.priceCts > 0 && (
                  <span className="text-sm text-slate-500">/{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{plan.tagline}</p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-slate-700"
                  >
                    <div className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="mt-7 flex h-11 w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
                  <Check className="mr-1.5 h-4 w-4" /> Plan actuel
                </div>
              ) : (
                <button
                  onClick={() =>
                    plan.id === "free"
                      ? currentPlan
                        ? setModal({
                            kind: "plan",
                            planId: "free",
                            label: "Plan Gratuit",
                            amountCts: 0,
                          })
                        : router.push("/register")
                      : setModal({
                          kind: "plan",
                          planId: plan.id,
                          label: `Plan ${plan.name}`,
                          amountCts: plan.priceCts,
                        })
                  }
                  className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.id === "free" ? "Passer au gratuit" : "Choisir ce plan"}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Credit packs */}
      <div id="credits" className="mt-10 sm:mt-14">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Crédits à l'unité
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Générer un document = 5 crédits · Modifier un PDF = 1 crédit.
            </p>
          </div>
          <div className="self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            Prix à l'unité : {formatEuros(unitPriceCts)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {packs.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -4 }}
              className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 backdrop-blur transition hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Coins className="h-5 w-5" />
                </div>
                <span className="text-xs text-slate-500">
                  {formatEuros(Math.round(p.priceCts / p.credits))} / crédit
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">
                  {p.credits}
                </span>
                <span className="text-sm text-slate-500">crédits</span>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Soit {formatEuros(p.priceCts)}
              </div>
              <button
                onClick={() =>
                  currentPlan
                    ? setModal({
                        kind: "credits",
                        packId: p.id,
                        label: `${p.credits} crédits`,
                        amountCts: p.priceCts,
                      })
                    : router.push("/register")
                }
                className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Acheter
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-600">
        <div className="flex items-center gap-2 font-medium text-slate-800">
          <Lock className="h-4 w-4" /> Paiement sécurisé (simulé pour l'instant)
        </div>
        <p className="mt-1.5">
          L'intégration Stripe arrive prochainement. Pour le moment, le paiement
          est simulé et met à jour directement votre compte.
        </p>
      </div>

      {/* Modal de paiement simulé */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => !processing && setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              {done ? (
                <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <Check className="h-7 w-7 text-emerald-600" />
                  </motion.div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">
                    Paiement réussi
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Votre compte a été mis à jour.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Paiement simulé
                      </h3>
                    </div>
                    <button
                      onClick={() => !processing && setModal(null)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="px-5 py-5 sm:px-6">
                    <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 p-4 sm:p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Résumé
                      </div>
                      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-base font-medium text-slate-900">
                          {modal.label}
                        </div>
                        <div className="text-xl font-bold text-slate-900 sm:text-2xl">
                          {formatEuros(modal.amountCts)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Numéro de carte
                        </label>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-500">
                          4242 4242 4242 4242
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Expiration
                          </label>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-500">
                            12/30
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            CVC
                          </label>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-500">
                            ***
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Données simulées — aucun paiement réel n'est effectué.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 p-4">
                    <button
                      onClick={() => setModal(null)}
                      disabled={processing}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirm}
                      disabled={processing}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-70"
                    >
                      {processing ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Payer {formatEuros(modal.amountCts)}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
