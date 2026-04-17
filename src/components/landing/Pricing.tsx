"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { formatEuros } from "@/lib/utils";

export function Pricing({ ctaHref = "/register" }: { ctaHref?: string }) {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
            Tarifs
          </div>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Simple, transparent, flexible.
          </h2>
          <p className="mt-4 text-slate-600">
            Payez à l'usage ou abonnez-vous. Changez ou annulez à tout moment.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative overflow-hidden rounded-3xl border p-7 backdrop-blur ${
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
                  {plan.priceCts === 0 ? "0€" : formatEuros(plan.priceCts).replace(",00", "")}
                </span>
                {plan.priceCts > 0 && (
                  <span className="text-sm text-slate-500">/{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{plan.tagline}</p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <div className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {plan.id === "free" ? "Commencer gratuitement" : "Choisir ce plan"}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
