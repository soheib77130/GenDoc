"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Cta() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-7 text-center shadow-2xl shadow-slate-900/30 sm:p-12"
        >
          <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-5" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Prêt à gagner des heures sur vos documents ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
              Créez votre compte gratuitement en 20 secondes. Aucune carte
              bancaire requise pour commencer.
            </p>
            <Link
              href="/register"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:mt-8"
            >
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
