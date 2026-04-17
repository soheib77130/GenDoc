export type PlanId = "free" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  priceCts: number;
  period: "mois" | "unité";
  tagline: string;
  highlight?: boolean;
  quotaGen: number; // -1 = illimité, 0 = aucun forfait
  quotaEdit: number;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    priceCts: 0,
    period: "mois",
    tagline: "Essai libre, paiement à l'unité",
    quotaGen: 0,
    quotaEdit: 0,
    features: [
      "Accès à tous les modèles",
      "Aperçu gratuit avant téléchargement",
      "Génération : 0,99€ / document",
      "Modification PDF : 0,99€ / document",
      "Conservation des documents 7 jours",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceCts: 1990,
    period: "mois",
    tagline: "Pour les indépendants et petits cabinets",
    highlight: true,
    quotaGen: 20,
    quotaEdit: 40,
    features: [
      "20 générations / mois",
      "40 modifications PDF / mois",
      "Tous les modèles premium",
      "OCR haute qualité",
      "Historique illimité",
      "Support prioritaire",
    ],
  },
  {
    id: "business",
    name: "Entreprise",
    priceCts: 5900,
    period: "mois",
    tagline: "Pour les équipes et gros volumes",
    quotaGen: 150,
    quotaEdit: 500,
    features: [
      "150 générations / mois",
      "500 modifications PDF / mois",
      "Multi-utilisateurs (bientôt)",
      "Signature électronique",
      "Export en lot",
      "Support dédié",
    ],
  },
];

export const UNIT_PRICE_CTS = 99; // 0,99€ à l'unité

export const CREDITS_PACKS = [
  { id: "pack-5", label: "5 crédits", credits: 5, priceCts: 399 },
  { id: "pack-20", label: "20 crédits", credits: 20, priceCts: 1490 },
  { id: "pack-50", label: "50 crédits", credits: 50, priceCts: 2990 },
];

export function getPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
