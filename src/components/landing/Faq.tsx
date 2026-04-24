"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "Comment fonctionne le paiement à l'unité ?",
    a: "À l'inscription, 5 crédits vous sont offerts. Ensuite, chaque génération coûte 5 crédits et chaque modification PDF coûte 1 crédit. Vous pouvez acheter des packs de crédits ou souscrire à un abonnement pour un meilleur tarif.",
  },
  {
    q: "Comment fonctionne le parrainage ?",
    a: "Depuis votre tableau de bord, partagez votre lien de parrainage. Pour chaque ami qui s'inscrit via votre lien, vous recevez 10 crédits et votre filleul reçoit 10 crédits bonus (en plus des 5 crédits de bienvenue).",
  },
  {
    q: "Puis-je changer de formule à tout moment ?",
    a: "Oui. Les changements sont appliqués immédiatement et les quotas sont ajustés au prorata. Aucun engagement, annulation en un clic.",
  },
  {
    q: "Mes documents sont-ils conservés ?",
    a: "Tous vos documents sont conservés dans votre espace et peuvent être re-téléchargés à tout moment. Vous pouvez aussi les supprimer manuellement.",
  },
  {
    q: "Les modèles sont-ils valables juridiquement ?",
    a: "Nos modèles sont rédigés à partir de textes standards mais ne remplacent pas l'avis d'un professionnel pour des situations complexes.",
  },
  {
    q: "Que fait l'éditeur PDF exactement ?",
    a: "Il extrait le texte de vos PDF (OCR si nécessaire) et permet de le modifier directement tout en conservant au mieux la mise en page d'origine.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
            FAQ
          </div>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Questions fréquentes
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50/50"
                >
                  <span className="text-sm font-medium text-slate-900">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
