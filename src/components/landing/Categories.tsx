"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/templates";
import { ArrowUpRight } from "lucide-react";

export function Categories() {
  return (
    <section id="categories" className="relative py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-indigo-50/50 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
            Modèles prêts à l'emploi
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Pour toutes vos situations.
          </h2>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            Chaque modèle est rédigé par des professionnels, juridiquement solide
            et prêt à être rempli.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-2">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                href={`/generate/${cat.id}`}
                className="group block overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/5 backdrop-blur sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-2xl shadow-lg`}
                  >
                    {cat.emoji}
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-slate-900 group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 sm:text-xl">
                  {cat.name}
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">{cat.description}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {cat.templates.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
