"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FileSignature, Wand2, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-28">
      {/* Background grid + gradient glow */}
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-400/30 via-sky-300/20 to-cyan-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-4 py-1.5 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Nouveau — Éditeur PDF intelligent avec OCR
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-slate-900 md:text-7xl"
        >
          Vos documents,{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              générés & modifiés
            </span>
            <svg
              className="absolute -bottom-2 left-0 h-3 w-full text-indigo-400"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M2 7 Q 50 1 100 5 T 198 5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <br />
          en quelques secondes.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-7 max-w-2xl text-balance text-lg text-slate-600"
        >
          Certificats, contrats, attestations, baux — générez des documents
          professionnels à partir de nos modèles, ou modifiez vos PDF existants
          avec une précision millimétrée. Sans app à installer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/register"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
          >
            Essayer gratuitement
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/#categories"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 text-sm font-medium text-slate-800 backdrop-blur transition hover:border-slate-300 hover:bg-white"
          >
            Voir les modèles
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500"
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Données chiffrées
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileSignature className="h-4 w-4 text-indigo-500" /> Modèles juridiques vérifiés
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wand2 className="h-4 w-4 text-cyan-500" /> OCR intelligent
          </span>
        </motion.div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto mt-20 max-w-4xl"
        >
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-indigo-400/30 via-sky-300/30 to-cyan-300/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-slate-400 shadow-inner">
                app.gendoc.fr/generate/medical/certificat-medical
              </div>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="space-y-3 p-6">
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    Champ — Nom du patient
                  </div>
                  <div className="flex h-10 items-center rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 text-sm text-slate-800">
                    Jean Dupont
                    <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-indigo-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Motif
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    État grippal nécessitant un repos.
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Durée
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    3 jours
                  </div>
                </div>
                <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/30">
                  Générer le PDF
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative border-l border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6">
                <div className="absolute inset-0 opacity-40 shine" />
                <div className="relative aspect-[1/1.2] rounded-xl border border-slate-200 bg-white p-5 text-[10px] leading-relaxed shadow-sm">
                  <div className="mb-2 border-b border-indigo-500 pb-1 text-center text-[11px] font-bold tracking-widest text-slate-800">
                    CERTIFICAT MÉDICAL
                  </div>
                  <p className="mb-1.5 text-slate-700">
                    Je soussigné Dr. Martin, docteur en médecine...
                  </p>
                  <p className="mb-1.5 text-slate-700">
                    certifie avoir examiné ce jour M. Jean Dupont...
                  </p>
                  <p className="mb-1.5 text-slate-700">
                    État grippal nécessitant un repos.
                  </p>
                  <p className="text-slate-700">
                    Durée : 3 jours à compter de ce jour.
                  </p>
                  <div className="absolute bottom-5 right-5 text-[9px] italic text-slate-400">
                    Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
