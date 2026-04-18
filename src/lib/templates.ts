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

export type PdfFormBinding = {
  templatePath: string; // relative to project root
  mapValues: (data: Record<string, string>) => Record<string, string | boolean>;
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
  pdfForm?: PdfFormBinding;
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
        id: "contrat-professionnalisation",
        name: "Contrat de professionnalisation",
        description:
          "Contrat en alternance (CERFA 12434*02) régi par les articles L. 6325-1 à L. 6325-24 du Code du travail.",
        fields: [
          { id: "employerName", label: "Employeur (nom ou dénomination)", type: "text", required: true },
          { id: "employerSiret", label: "SIRET de l'établissement", type: "text", required: true, placeholder: "14 chiffres" },
          { id: "employerAddress", label: "Adresse de l'établissement (voie)", type: "text", required: true, placeholder: "12 rue des Lilas" },
          { id: "employerAddressCp", label: "Code postal", type: "text", required: true, placeholder: "75011" },
          { id: "employerAddressCity", label: "Commune", type: "text", required: true, placeholder: "Paris" },
          { id: "employerNaf", label: "Code NAF", type: "text", required: false, placeholder: "6201Z" },
          { id: "employerEffectif", label: "Effectif salarié de l'entreprise", type: "number", required: false },
          { id: "employerPhone", label: "Téléphone employeur", type: "text", required: false },
          { id: "employerEmail", label: "Courriel employeur", type: "text", required: false },
          { id: "employerConvention", label: "Convention collective appliquée", type: "text", required: false },
          { id: "employerIdcc", label: "Code IDCC convention", type: "text", required: false, placeholder: "1486" },
          { id: "employeeName", label: "Nom et prénom du salarié", type: "text", required: true },
          { id: "employeeBirth", label: "Date de naissance du salarié", type: "date", required: true },
          { id: "employeeSex", label: "Sexe", type: "select", options: ["M", "F"], required: true },
          { id: "employeeAddress", label: "Adresse du salarié (voie)", type: "text", required: true },
          { id: "employeeAddressCp", label: "Code postal salarié", type: "text", required: true },
          { id: "employeeAddressCity", label: "Commune salarié", type: "text", required: true },
          { id: "employeePhone", label: "Téléphone salarié", type: "text", required: false },
          { id: "employeeEmail", label: "Courriel salarié", type: "text", required: false },
          { id: "employeeHandicap", label: "Reconnaissance travailleur handicapé", type: "select", options: ["non", "oui"], required: false, defaultValue: "non" },
          { id: "employeePoleEmploi", label: "Inscrit à Pôle Emploi", type: "select", options: ["non", "oui"], required: false, defaultValue: "non" },
          { id: "employeeDiploma", label: "Diplôme ou titre le plus élevé obtenu (code)", type: "text", required: false, placeholder: "ex: 44" },
          { id: "tutorName", label: "Tuteur — nom et prénom", type: "text", required: true },
          { id: "tutorJob", label: "Tuteur — emploi occupé", type: "text", required: false },
          { id: "tutorBirth", label: "Tuteur — date de naissance", type: "date", required: false },
          {
            id: "contractNature",
            label: "Nature du contrat",
            type: "select",
            options: ["CDI", "CDD", "Travail temporaire"],
            required: true,
            defaultValue: "CDD",
          },
          { id: "jobTitle", label: "Emploi occupé pendant le contrat", type: "text", required: true },
          { id: "jobClassification", label: "Classification dans la convention collective", type: "text", required: false },
          { id: "jobLevel", label: "Niveau de classification", type: "text", required: false, placeholder: "III" },
          { id: "jobCoefficient", label: "Coefficient hiérarchique", type: "text", required: false, placeholder: "250" },
          { id: "contractStart", label: "Date de début du contrat", type: "date", required: true },
          { id: "contractEnd", label: "Date de fin du CDD ou de l'action de professionnalisation", type: "date", required: true },
          { id: "trialDays", label: "Durée de la période d'essai (jours)", type: "number", required: false, defaultValue: "30" },
          { id: "weeklyHours", label: "Durée hebdomadaire du travail (heures)", type: "number", required: true, defaultValue: "35" },
          { id: "weeklyMinutes", label: "Durée hebdomadaire du travail (minutes)", type: "number", required: false, defaultValue: "0" },
          { id: "grossSalary", label: "Salaire brut mensuel à l'embauche (€)", type: "number", required: true },
          { id: "trainingOrg", label: "Organisme de formation principal", type: "text", required: true },
          { id: "trainingSiret", label: "SIRET de l'organisme de formation", type: "text", required: false },
          { id: "trainingInternal", label: "Service de formation interne", type: "select", options: ["non", "oui"], required: false, defaultValue: "non" },
          { id: "trainingTitle", label: "Diplôme ou titre visé (intitulé précis)", type: "text", required: true },
          { id: "trainingSpecialty", label: "Spécialité de formation (code)", type: "text", required: false },
          { id: "trainingTotalHours", label: "Durée totale des enseignements (heures)", type: "number", required: true },
          { id: "trainingGeneralHours", label: "Dont enseignements généraux (heures)", type: "number", required: false },
          { id: "trainingStart", label: "Date de début du cycle de formation", type: "date", required: true },
          { id: "trainingEnd", label: "Date prévue de fin des épreuves ou examens", type: "date", required: true },
          { id: "opcaName", label: "Nom de l'OPCA / OPCO", type: "text", required: false },
          { id: "opcaAdherent", label: "N° d'adhérent de l'employeur à l'OPCA", type: "text", required: false },
          { id: "city", label: "Fait à (ville)", type: "text", required: true },
        ],
        pdfForm: {
          templatePath: "public/templates/contrat-professionnalisation.pdf",
          mapValues: (d) => {
            const split = (iso?: string) => {
              if (!iso) return { j: "", m: "", a: "" };
              const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (!m) return { j: "", m: "", a: "" };
              return { j: m[3], m: m[2], a: m[1] };
            };
            const empBirth = split(d.employeeBirth);
            const tutBirth = split(d.tutorBirth);
            const cStart = split(d.contractStart);
            const cEnd = split(d.contractEnd);
            const fStart = split(d.trainingStart);
            const fEnd = split(d.trainingEnd);
            const today = new Date();
            const sig = {
              j: String(today.getDate()).padStart(2, "0"),
              m: String(today.getMonth() + 1).padStart(2, "0"),
              a: String(today.getFullYear()),
            };
            const salary = String(d.grossSalary || "");
            const [salInt, salDec] = salary.includes(".")
              ? salary.split(".")
              : salary.includes(",")
              ? salary.split(",")
              : [salary, ""];
            const P = "topmostSubform[0].Page1[0].";
            const mapping: Record<string, string | boolean> = {
              [P + "emp_denom[0]"]: d.employerName || "",
              [P + "emp_siret[0]"]: (d.employerSiret || "").replace(/\s/g, ""),
              [P + "emp_adr_voie[0]"]: d.employerAddress || "",
              [P + "emp_adr_cp[0]"]: d.employerAddressCp || "",
              [P + "emp_adr_ville[0]"]: d.employerAddressCity || "",
              [P + "emp_naf[0]"]: d.employerNaf || "",
              [P + "emp_eff[0]"]: d.employerEffectif || "",
              [P + "emp_tel[0]"]: d.employerPhone || "",
              [P + "emp_mail1[0]"]: d.employerEmail || "",
              [P + "emp_conv_coll1[0]"]: d.employerConvention || "",
              [P + "emp_idcc[0]"]: d.employerIdcc || "",
              [P + "emp_particulier_non[0]"]: true,
              [P + "alt_nom[0]"]: d.employeeName || "",
              [P + "alt_adr_voie[0]"]: d.employeeAddress || "",
              [P + "alt_adr_cp[0]"]: d.employeeAddressCp || "",
              [P + "alt_adr_ville[0]"]: d.employeeAddressCity || "",
              [P + "alt_tel[0]"]: d.employeePhone || "",
              [P + "alt_mail1[0]"]: d.employeeEmail || "",
              [P + "alt_ddn_jour[0]"]: empBirth.j,
              [P + "alt_ddn_mois[0]"]: empBirth.m,
              [P + "alt_ddn_annee[0]"]: empBirth.a,
              [P + "alt_sexe_m[0]"]: d.employeeSex === "M",
              [P + "alt_sexe_f[0]"]: d.employeeSex === "F",
              [P + "alt_handicape_oui[0]"]: d.employeeHandicap === "oui",
              [P + "alt_handicape_non[0]"]: d.employeeHandicap !== "oui",
              [P + "alt_insrit_pe_oui[0]"]: d.employeePoleEmploi === "oui",
              [P + "alt_inscrit_pe_non[0]"]: d.employeePoleEmploi !== "oui",
              [P + "alt_diplome[0]"]: d.employeeDiploma || "",
              [P + "maitre_nom[0]"]: d.tutorName || "",
              [P + "maitre_emploi[0]"]: d.tutorJob || "",
              [P + "maitre_ddn_jour[0]"]: tutBirth.j,
              [P + "maitre_ddn_mois[0]"]: tutBirth.m,
              [P + "maitre_ddn_annee[0]"]: tutBirth.a,
              [P + "contrat_cdi[0]"]: d.contractNature === "CDI",
              [P + "contrat_cdd[0]"]: d.contractNature === "CDD",
              [P + "contrat_cdt[0]"]: d.contractNature === "Travail temporaire",
              [P + "contrat_emploi[0]"]: d.jobTitle || "",
              [P + "contrat_classif_emploi[0]"]: d.jobClassification || "",
              [P + "contrat_niveau[0]"]: d.jobLevel || "",
              [P + "contrat_coef[0]"]: d.jobCoefficient || "",
              [P + "contrat_debut_jour[0]"]: cStart.j,
              [P + "contrat_debut_mois[0]"]: cStart.m,
              [P + "contrat_debut_annee[0]"]: cStart.a,
              [P + "contrat_fin_jour[0]"]: cEnd.j,
              [P + "contrat_fin_mois[0]"]: cEnd.m,
              [P + "contrat_fin_annee[0]"]: cEnd.a,
              [P + "contrat_essai_jours[0]"]: d.trialDays || "",
              [P + "contrat_duree_hebdo_heures[0]"]: d.weeklyHours || "",
              [P + "contrat_duree_hebdo_minutes[0]"]: d.weeklyMinutes || "",
              [P + "contrat_salaire1[0]"]: salInt || "",
              [P + "contrat_salaire2[0]"]: salDec || "",
              [P + "formation_nom[0]"]: d.trainingOrg || "",
              [P + "formation_siret[0]"]: (d.trainingSiret || "").replace(/\s/g, ""),
              [P + "formation_interne_oui[0]"]: d.trainingInternal === "oui",
              [P + "formation_interne_non[0]"]: d.trainingInternal !== "oui",
              [P + "formation_intitule[0]"]: d.trainingTitle || "",
              [P + "formation_specialite[0]"]: d.trainingSpecialty || "",
              [P + "formation_duree_eval[0]"]: d.trainingTotalHours || "",
              [P + "formation_duree_ens[0]"]: d.trainingGeneralHours || "",
              [P + "formation_debut_jour[0]"]: fStart.j,
              [P + "formation_debut_mois[0]"]: fStart.m,
              [P + "formation_debut_annee[0]"]: fStart.a,
              [P + "formation_fin_jour[0]"]: fEnd.j,
              [P + "formation_fin_mois[0]"]: fEnd.m,
              [P + "formation_fin_annee[0]"]: fEnd.a,
              [P + "signature_date_jour[0]"]: sig.j,
              [P + "signature_date_mois[0]"]: sig.m,
              [P + "signature_date_annee[0]"]: sig.a,
              [P + "signature_lieu[0]"]: d.city || "",
              [P + "opca_nom[0]"]: d.opcaName || "",
              [P + "opca_num_adh[0]"]: d.opcaAdherent || "",
            };
            return mapping;
          },
        },
        render: (d) => ({
          title: "CONTRAT DE PROFESSIONNALISATION",
          body: [
            `Contrat régi par les articles L. 6325-1 à L. 6325-24 du Code du travail.`,
            `Entre l'employeur ${d.employerName || "..."}, dont l'établissement est situé ${d.employerAddress || "..."}, SIRET ${d.employerSiret || "..."}${d.employerNaf ? `, code NAF ${d.employerNaf}` : ""}${d.employerConvention ? `, relevant de la convention collective « ${d.employerConvention} »` : ""},`,
            `et le salarié ${d.employeeName || "..."}, né(e) le ${d.employeeBirth || "..."} (${d.employeeSex || "..."}), demeurant ${d.employeeAddress || "..."}${d.employeeDiploma ? `, titulaire du diplôme / titre : ${d.employeeDiploma}` : ""},`,
            `il a été convenu ce qui suit :`,
            `Article 1 — Nature et objet du contrat : Le présent contrat est un contrat de professionnalisation ${d.contractNature || "..."}. Il a pour objet de permettre au salarié d'acquérir une qualification professionnelle en lien avec l'emploi de « ${d.jobTitle || "..."} »${d.jobLevel ? `, niveau ${d.jobLevel}` : ""}${d.jobCoefficient ? `, coefficient ${d.jobCoefficient}` : ""}.`,
            `Article 2 — Durée : Le contrat prend effet le ${d.contractStart || "..."} et prend fin le ${d.contractEnd || "..."}. Une période d'essai de ${d.trialDays || "..."} jour(s) est prévue à compter de la date d'embauche.`,
            `Article 3 — Temps de travail : La durée hebdomadaire de travail est fixée à ${d.weeklyHours || "..."} heures.`,
            `Article 4 — Rémunération : Le salarié percevra un salaire brut mensuel de ${d.grossSalary || "..."} € à l'embauche, conformément aux dispositions légales et conventionnelles applicables.`,
            `Article 5 — Tutorat : ${d.tutorName || "..."}${d.tutorJob ? ` (${d.tutorJob})` : ""} est désigné(e) comme tuteur au sein de l'établissement et assure l'accompagnement du salarié pendant toute la durée du contrat.`,
            `Article 6 — Formation : La formation est dispensée par l'organisme ${d.trainingOrg || "..."}${d.trainingSiret ? ` (SIRET ${d.trainingSiret})` : ""}. Elle vise l'obtention du diplôme ou titre suivant : ${d.trainingTitle || "..."}. La durée totale des actions d'évaluation, d'accompagnement et des enseignements est de ${d.trainingTotalHours || "..."} heures. Le cycle de formation débute le ${d.trainingStart || "..."} et s'achève au plus tard à la date des épreuves ou examens, prévue le ${d.trainingEnd || "..."}.`,
            `Article 7 — Engagements des parties : En application de l'article L. 6325-3 du Code du travail, l'employeur s'engage à assurer au salarié une formation lui permettant d'acquérir une qualification professionnelle et à lui fournir un emploi en relation avec cet objectif pendant la durée du contrat. Le salarié s'engage à travailler pour le compte de son employeur et à suivre la formation prévue au contrat.`,
            `Article 8 — Droit applicable : Le présent contrat est soumis au droit français et aux dispositions de la convention collective applicable.`,
            `Fait à ${d.city || "..."}, le ${todayFr()}, en deux exemplaires originaux.`,
          ],
          footer: `Signature de l'employeur : ${d.employerName || ""}     Signature du salarié : ${d.employeeName || ""}`,
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
