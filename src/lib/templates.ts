export type FieldType = "text" | "textarea" | "date" | "number" | "select";

export type TemplateField = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  render: (data: Record<string, string>) => {
    title: string;
    body: string[]; // paragraphs
    footer?: string;
  };
  fields: TemplateField[];
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind gradient
  description: string;
  templates: Template[];
};

const todayFr = () =>
  new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const CATEGORIES: Category[] = [
  {
    id: "medical",
    name: "Médical",
    emoji: "🩺",
    color: "from-emerald-400 to-teal-500",
    description:
      "Certificats médicaux, inaptitudes, attestations professionnelles.",
    templates: [
      {
        id: "certificat-medical",
        name: "Certificat médical",
        description: "Certificat médical de base pour absence ou dispense.",
        fields: [
          { id: "patientName", label: "Nom du patient", type: "text", required: true, placeholder: "Jean Dupont" },
          { id: "patientBirth", label: "Date de naissance", type: "date", required: true },
          { id: "reason", label: "Motif", type: "textarea", required: true, placeholder: "état grippal nécessitant un repos..." },
          { id: "durationDays", label: "Durée (jours)", type: "number", required: true, defaultValue: "3" },
          { id: "doctorName", label: "Nom du médecin", type: "text", required: true, placeholder: "Dr. Martin" },
          { id: "city", label: "Ville", type: "text", required: true, defaultValue: "Paris" },
        ],
        render: (d) => ({
          title: "CERTIFICAT MÉDICAL",
          body: [
            `Je soussigné(e) ${d.doctorName || "..."}, docteur en médecine,`,
            `certifie avoir examiné ce jour M./Mme ${d.patientName || "..."}, né(e) le ${d.patientBirth || "..."},`,
            `et avoir constaté : ${d.reason || "..."}.`,
            `L'état de santé du patient justifie un arrêt de ses activités pendant ${d.durationDays || "..."} jour(s).`,
            `Certificat établi à ${d.city || "..."} le ${todayFr()}, à la demande de l'intéressé(e) et remis en main propre pour faire valoir ce que de droit.`,
          ],
          footer: `Signature du médecin : ${d.doctorName || ""}`,
        }),
      },
      {
        id: "inaptitude-physique",
        name: "Inaptitude physique",
        description: "Attestation d'inaptitude physique (sport, travail).",
        fields: [
          { id: "patientName", label: "Nom", type: "text", required: true },
          { id: "patientBirth", label: "Date de naissance", type: "date", required: true },
          { id: "activity", label: "Activité concernée", type: "text", required: true, placeholder: "sport scolaire, port de charges..." },
          { id: "duration", label: "Durée", type: "text", required: true, placeholder: "4 semaines" },
          { id: "doctorName", label: "Médecin", type: "text", required: true },
          { id: "city", label: "Ville", type: "text", required: true },
        ],
        render: (d) => ({
          title: "ATTESTATION D'INAPTITUDE PHYSIQUE",
          body: [
            `Je soussigné(e) ${d.doctorName || "..."}, docteur en médecine,`,
            `certifie que M./Mme ${d.patientName || "..."}, né(e) le ${d.patientBirth || "..."},`,
            `présente une inaptitude physique à l'activité suivante : ${d.activity || "..."}.`,
            `Cette inaptitude est établie pour une durée de ${d.duration || "..."}, à compter de ce jour.`,
            `Fait à ${d.city || "..."}, le ${todayFr()}.`,
          ],
          footer: `Signature : ${d.doctorName || ""}`,
        }),
      },
    ],
  },
  {
    id: "contract",
    name: "Contrats",
    emoji: "📝",
    color: "from-blue-400 to-indigo-500",
    description: "Contrats de prestation, accords commerciaux, NDA.",
    templates: [
      {
        id: "contrat-prestation",
        name: "Contrat de prestation",
        description: "Contrat simple entre un prestataire et un client.",
        fields: [
          { id: "providerName", label: "Prestataire (nom)", type: "text", required: true },
          { id: "clientName", label: "Client (nom)", type: "text", required: true },
          { id: "mission", label: "Mission", type: "textarea", required: true, placeholder: "développement d'un site web..." },
          { id: "price", label: "Montant (€)", type: "number", required: true },
          { id: "startDate", label: "Date de début", type: "date", required: true },
          { id: "endDate", label: "Date de fin", type: "date", required: true },
        ],
        render: (d) => ({
          title: "CONTRAT DE PRESTATION DE SERVICES",
          body: [
            `Entre les soussignés : ${d.providerName || "..."} (ci-après « le Prestataire »),`,
            `et ${d.clientName || "..."} (ci-après « le Client »),`,
            `il a été convenu ce qui suit :`,
            `Article 1 - Objet : Le Prestataire s'engage à réaliser la mission suivante : ${d.mission || "..."}.`,
            `Article 2 - Durée : La mission débute le ${d.startDate || "..."} et se termine le ${d.endDate || "..."}.`,
            `Article 3 - Rémunération : En contrepartie, le Client versera la somme de ${d.price || "..."} € HT.`,
            `Article 4 - Droit applicable : Le présent contrat est soumis au droit français.`,
            `Fait en deux exemplaires originaux, le ${todayFr()}.`,
          ],
          footer: `Le Prestataire : ${d.providerName || ""}     Le Client : ${d.clientName || ""}`,
        }),
      },
      {
        id: "nda",
        name: "Accord de confidentialité (NDA)",
        description: "Accord mutuel de non-divulgation.",
        fields: [
          { id: "partyA", label: "Partie A", type: "text", required: true },
          { id: "partyB", label: "Partie B", type: "text", required: true },
          { id: "purpose", label: "Objet", type: "textarea", required: true, placeholder: "projet commun de..." },
          { id: "durationYears", label: "Durée (années)", type: "number", required: true, defaultValue: "3" },
        ],
        render: (d) => ({
          title: "ACCORD DE CONFIDENTIALITÉ",
          body: [
            `Entre ${d.partyA || "..."} et ${d.partyB || "..."}, ci-après « les Parties »,`,
            `dans le cadre du projet suivant : ${d.purpose || "..."},`,
            `les Parties conviennent de préserver la confidentialité stricte des informations échangées.`,
            `Toute information transmise par une Partie est réputée confidentielle et ne peut être divulguée à des tiers sans accord écrit préalable.`,
            `Le présent accord est conclu pour une durée de ${d.durationYears || "..."} année(s) à compter de sa signature.`,
            `Fait le ${todayFr()}, en deux exemplaires.`,
          ],
          footer: "Signatures des Parties",
        }),
      },
    ],
  },
  {
    id: "rental",
    name: "Location",
    emoji: "🏠",
    color: "from-amber-400 to-orange-500",
    description: "Baux, états des lieux, quittances de loyer.",
    templates: [
      {
        id: "quittance-loyer",
        name: "Quittance de loyer",
        description: "Reçu officiel de paiement de loyer.",
        fields: [
          { id: "landlord", label: "Bailleur", type: "text", required: true },
          { id: "tenant", label: "Locataire", type: "text", required: true },
          { id: "address", label: "Adresse du logement", type: "textarea", required: true },
          { id: "month", label: "Mois concerné", type: "text", required: true, placeholder: "Avril 2026" },
          { id: "rent", label: "Loyer (€)", type: "number", required: true },
          { id: "charges", label: "Charges (€)", type: "number", required: true },
        ],
        render: (d) => {
          const rent = Number(d.rent || 0);
          const charges = Number(d.charges || 0);
          return {
            title: `QUITTANCE DE LOYER — ${d.month || ""}`,
            body: [
              `Je soussigné(e) ${d.landlord || "..."}, bailleur,`,
              `déclare avoir reçu de ${d.tenant || "..."}, locataire du logement situé :`,
              `${d.address || "..."},`,
              `la somme de ${(rent + charges).toFixed(2)} € au titre du loyer et des charges pour le mois de ${d.month || "..."}.`,
              `Détail : Loyer ${rent.toFixed(2)} € + Charges ${charges.toFixed(2)} €.`,
              `Fait le ${todayFr()} pour servir et valoir ce que de droit.`,
            ],
            footer: `Signature du bailleur : ${d.landlord || ""}`,
          };
        },
      },
      {
        id: "bail-location",
        name: "Contrat de bail",
        description: "Contrat de location meublée courte durée.",
        fields: [
          { id: "landlord", label: "Bailleur", type: "text", required: true },
          { id: "tenant", label: "Locataire", type: "text", required: true },
          { id: "address", label: "Adresse du bien", type: "textarea", required: true },
          { id: "rent", label: "Loyer mensuel (€)", type: "number", required: true },
          { id: "deposit", label: "Dépôt de garantie (€)", type: "number", required: true },
          { id: "startDate", label: "Date d'entrée", type: "date", required: true },
          { id: "durationMonths", label: "Durée (mois)", type: "number", required: true, defaultValue: "12" },
        ],
        render: (d) => ({
          title: "CONTRAT DE LOCATION MEUBLÉE",
          body: [
            `Entre ${d.landlord || "..."}, Bailleur, et ${d.tenant || "..."}, Locataire,`,
            `Objet : location du logement sis ${d.address || "..."}.`,
            `Durée : ${d.durationMonths || "..."} mois à compter du ${d.startDate || "..."}.`,
            `Loyer : ${d.rent || "..."} € par mois, payable d'avance.`,
            `Dépôt de garantie : ${d.deposit || "..."} €, restitué dans les conditions légales.`,
            `Le Locataire s'engage à user paisiblement des lieux et à respecter les clauses du présent bail.`,
            `Fait à ..., le ${todayFr()}, en deux exemplaires.`,
          ],
          footer: "Signatures : Bailleur / Locataire",
        }),
      },
    ],
  },
  {
    id: "admin",
    name: "Administratif",
    emoji: "🗂️",
    color: "from-fuchsia-400 to-pink-500",
    description: "Attestations, lettres officielles, procurations.",
    templates: [
      {
        id: "attestation-hebergement",
        name: "Attestation d'hébergement",
        description: "Attestation que vous hébergez une personne.",
        fields: [
          { id: "host", label: "Vous êtes", type: "text", required: true, placeholder: "Jean Dupont" },
          { id: "hosted", label: "Personne hébergée", type: "text", required: true },
          { id: "address", label: "Adresse du domicile", type: "textarea", required: true },
          { id: "sinceDate", label: "Hébergé(e) depuis le", type: "date", required: true },
          { id: "city", label: "Ville", type: "text", required: true },
        ],
        render: (d) => ({
          title: "ATTESTATION D'HÉBERGEMENT",
          body: [
            `Je soussigné(e) ${d.host || "..."}, résidant à :`,
            `${d.address || "..."},`,
            `atteste sur l'honneur héberger à mon domicile M./Mme ${d.hosted || "..."}, depuis le ${d.sinceDate || "..."}.`,
            `Je certifie l'exactitude des informations ci-dessus.`,
            `Fait à ${d.city || "..."}, le ${todayFr()}, pour servir et valoir ce que de droit.`,
          ],
          footer: `Signature : ${d.host || ""}`,
        }),
      },
      {
        id: "procuration",
        name: "Procuration simple",
        description: "Procuration pour une démarche administrative.",
        fields: [
          { id: "from", label: "Mandant (vous)", type: "text", required: true },
          { id: "to", label: "Mandataire", type: "text", required: true },
          { id: "purpose", label: "Motif", type: "textarea", required: true, placeholder: "retirer un colis en mon nom..." },
          { id: "startDate", label: "Date", type: "date", required: true },
        ],
        render: (d) => ({
          title: "PROCURATION",
          body: [
            `Je soussigné(e) ${d.from || "..."}, Mandant,`,
            `donne par la présente procuration à ${d.to || "..."}, Mandataire,`,
            `pour effectuer en mon nom et pour mon compte : ${d.purpose || "..."}.`,
            `La présente procuration est valable à compter du ${d.startDate || "..."}.`,
            `Fait le ${todayFr()}, pour faire valoir ce que de droit.`,
          ],
          footer: `Signature du Mandant : ${d.from || ""}`,
        }),
      },
    ],
  },
];

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function getTemplate(categoryId: string, templateId: string) {
  const cat = getCategory(categoryId);
  return cat?.templates.find((t) => t.id === templateId);
}
