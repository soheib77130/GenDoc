"use client";
import { motion } from "framer-motion";
import { FileText, Pencil, Zap, Lock, Layers, Clock } from "lucide-react";

const features = [
  {
    icon: FileText,
    color: "from-indigo-500 to-blue-500",
    title: "Génération guidée",
    desc: "Choisissez un modèle, remplissez un formulaire, téléchargez votre PDF en 30 secondes.",
  },
  {
    icon: Pencil,
    color: "from-cyan-500 to-sky-500",
    title: "Édition PDF précise",
    desc: "Modifiez directement le texte de vos PDF sans altérer la mise en page. OCR intégré.",
  },
  {
    icon: Layers,
    color: "from-fuchsia-500 to-pink-500",
    title: "Modèles variés",
    desc: "Médical, contrats, bail, administratif — une bibliothèque en expansion continue.",
  },
  {
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    title: "Aperçu en direct",
    desc: "Visualisez votre document en temps réel au fur et à mesure de vos modifications.",
  },
  {
    icon: Lock,
    color: "from-emerald-500 to-teal-500",
    title: "Confidentialité",
    desc: "Vos données restent privées. Documents stockés de manière chiffrée, suppression à la demande.",
  },
  {
    icon: Clock,
    color: "from-rose-500 to-red-500",
    title: "Historique",
    desc: "Retrouvez tous vos documents générés et modifiés, téléchargeables à tout moment.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
            Fonctionnalités
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Tout ce dont vous avez besoin, rien de superflu.
          </h2>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            Conçu pour être simple et puissant. Des outils pensés pour vous faire
            gagner du temps sur chaque document.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 backdrop-blur"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${f.color} text-white shadow-md`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.desc}</p>
              <div
                className={`absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
