import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

type Rendered = {
  title: string;
  body: string[];
  footer?: string;
};

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}

export async function renderTemplateToPdf(rendered: Rendered): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marginX = 60;
  let y = 780;

  // Header band
  page.drawRectangle({
    x: 0,
    y: 810,
    width: 595,
    height: 32,
    color: rgb(0.067, 0.094, 0.153), // slate-900
  });
  page.drawText("GenDoc", {
    x: marginX,
    y: 820,
    size: 12,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Document généré", {
    x: 480,
    y: 820,
    size: 10,
    font,
    color: rgb(0.8, 0.8, 0.85),
  });

  y = 760;

  // Title
  page.drawText(rendered.title, {
    x: marginX,
    y,
    size: 18,
    font: bold,
    color: rgb(0.05, 0.05, 0.1),
  });
  y -= 8;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: 595 - marginX, y },
    thickness: 1.5,
    color: rgb(0.2, 0.4, 0.95),
  });
  y -= 28;

  // Body
  const size = 11;
  const lineH = 16;
  const maxChars = 85;

  for (const para of rendered.body) {
    const lines = wrap(para, maxChars);
    for (const l of lines) {
      if (y < 100) {
        const p = pdf.addPage([595, 842]);
        y = 780;
        page.drawText("", { x: 0, y: 0, size: 1, font });
        p.drawText(l, { x: marginX, y, size, font, color: rgb(0.1, 0.1, 0.15) });
        y -= lineH;
      } else {
        page.drawText(l, { x: marginX, y, size, font, color: rgb(0.1, 0.1, 0.15) });
        y -= lineH;
      }
    }
    y -= 10;
  }

  if (rendered.footer) {
    y -= 20;
    page.drawText(rendered.footer, {
      x: marginX,
      y: Math.max(y, 80),
      size: 11,
      font: bold,
      color: rgb(0.1, 0.1, 0.15),
    });
  }

  // Footer
  page.drawText(`Généré via GenDoc — ${new Date().toLocaleDateString("fr-FR")}`, {
    x: marginX,
    y: 40,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.55),
  });

  return pdf.save();
}

/* ─── Generic structured PDF builder (FPDF-style) ───────────────
   These helpers build a PDF page-by-page using simple drawing
   primitives. No template, no AcroForm — just text + lines drawn
   on a blank page, like FPDF's cell()/multi_cell() in Python. */

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 45;
const COL = { ink: rgb(0.1, 0.1, 0.15), muted: rgb(0.4, 0.42, 0.5), accent: rgb(0.2, 0.35, 0.85), border: rgb(0.85, 0.87, 0.92), bandBg: rgb(0.07, 0.09, 0.16) };

type Ctx = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  y: number;
};

function newCtx(pdf: PDFDocument, font: PDFFont, bold: PDFFont, italic: PDFFont): Ctx {
  const page = pdf.addPage([A4.w, A4.h]);
  return { pdf, page, font, bold, italic, y: A4.h - MARGIN };
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed < MARGIN + 30) {
    ctx.page = ctx.pdf.addPage([A4.w, A4.h]);
    ctx.y = A4.h - MARGIN;
  }
}

function wrapToWidth(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      cur = candidate;
    } else {
      if (cur) lines.push(cur);
      // If the single word is wider than the box, split by char.
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = "";
        for (const ch of w) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        cur = chunk;
      } else {
        cur = w;
      }
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawHeaderBand(ctx: Ctx, title: string, subtitle?: string) {
  const bandH = 64;
  ctx.page.drawRectangle({
    x: 0,
    y: A4.h - bandH,
    width: A4.w,
    height: bandH,
    color: COL.bandBg,
  });
  ctx.page.drawText("GenDoc", {
    x: MARGIN,
    y: A4.h - 24,
    size: 11,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.page.drawText(title, {
    x: MARGIN,
    y: A4.h - 46,
    size: 18,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  if (subtitle) {
    ctx.page.drawText(subtitle, {
      x: MARGIN,
      y: A4.h - 60,
      size: 8.5,
      font: ctx.italic,
      color: rgb(0.78, 0.82, 0.92),
    });
  }
  ctx.page.drawText(new Date().toLocaleDateString("fr-FR"), {
    x: A4.w - MARGIN - 70,
    y: A4.h - 24,
    size: 9,
    font: ctx.font,
    color: rgb(0.78, 0.82, 0.92),
  });
  ctx.y = A4.h - bandH - 20;
}

function drawSection(ctx: Ctx, title: string) {
  ensureSpace(ctx, 30);
  ctx.y -= 10;
  ctx.page.drawText(title, {
    x: MARGIN,
    y: ctx.y,
    size: 11,
    font: ctx.bold,
    color: COL.accent,
  });
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: A4.w - MARGIN, y: ctx.y },
    thickness: 0.7,
    color: COL.accent,
  });
  ctx.y -= 12;
}

function drawField(
  ctx: Ctx,
  label: string,
  value: string,
  opts: { x?: number; w?: number } = {}
) {
  const x = opts.x ?? MARGIN;
  const w = opts.w ?? (A4.w - 2 * MARGIN);
  const fs = 9;
  const lineH = 12;

  ensureSpace(ctx, 28);

  ctx.page.drawText(label, {
    x,
    y: ctx.y,
    size: 7,
    font: ctx.bold,
    color: COL.muted,
  });

  const safeValue = value && value.trim() !== "" ? value : "—";
  const lines = wrapToWidth(safeValue, w - 6, ctx.font, fs);

  for (let i = 0; i < lines.length; i++) {
    ctx.page.drawText(lines[i], {
      x,
      y: ctx.y - 12 - i * lineH,
      size: fs,
      font: ctx.font,
      color: COL.ink,
    });
  }

  const baseY = ctx.y - 12 - (Math.max(0, lines.length - 1)) * lineH - 4;
  ctx.page.drawLine({
    start: { x, y: baseY },
    end: { x: x + w, y: baseY },
    thickness: 0.4,
    color: COL.border,
  });
  return baseY - 6;
}

function drawTwoColFields(
  ctx: Ctx,
  rows: { label: string; value: string }[][]
) {
  const colW = (A4.w - 2 * MARGIN - 14) / 2;
  for (const row of rows) {
    ensureSpace(ctx, 32);
    const yStart = ctx.y;
    let leftEnd = yStart;
    let rightEnd = yStart;
    if (row[0]) {
      ctx.y = yStart;
      leftEnd = drawField(ctx, row[0].label, row[0].value, { x: MARGIN, w: colW });
    }
    if (row[1]) {
      ctx.y = yStart;
      rightEnd = drawField(ctx, row[1].label, row[1].value, { x: MARGIN + colW + 14, w: colW });
    }
    ctx.y = Math.min(leftEnd, rightEnd);
  }
}

function drawParagraph(ctx: Ctx, text: string) {
  const fs = 9.5;
  const lineH = 13;
  const lines = wrapToWidth(text, A4.w - 2 * MARGIN, ctx.font, fs);
  for (const l of lines) {
    ensureSpace(ctx, lineH);
    ctx.page.drawText(l, {
      x: MARGIN,
      y: ctx.y,
      size: fs,
      font: ctx.font,
      color: COL.ink,
    });
    ctx.y -= lineH;
  }
  ctx.y -= 6;
}

function drawSignatureBlock(ctx: Ctx, leftLabel: string, leftName: string, rightLabel: string, rightName: string) {
  ensureSpace(ctx, 110);
  ctx.y -= 8;
  const colW = (A4.w - 2 * MARGIN - 30) / 2;
  const top = ctx.y;
  // Left box
  ctx.page.drawRectangle({
    x: MARGIN,
    y: top - 90,
    width: colW,
    height: 90,
    borderColor: COL.border,
    borderWidth: 0.6,
  });
  ctx.page.drawText(leftLabel, {
    x: MARGIN + 8,
    y: top - 14,
    size: 8,
    font: ctx.bold,
    color: COL.muted,
  });
  ctx.page.drawText(leftName, {
    x: MARGIN + 8,
    y: top - 28,
    size: 9,
    font: ctx.font,
    color: COL.ink,
  });
  ctx.page.drawText("Signature :", {
    x: MARGIN + 8,
    y: top - 78,
    size: 7,
    font: ctx.italic,
    color: COL.muted,
  });
  // Right box
  ctx.page.drawRectangle({
    x: MARGIN + colW + 30,
    y: top - 90,
    width: colW,
    height: 90,
    borderColor: COL.border,
    borderWidth: 0.6,
  });
  ctx.page.drawText(rightLabel, {
    x: MARGIN + colW + 38,
    y: top - 14,
    size: 8,
    font: ctx.bold,
    color: COL.muted,
  });
  ctx.page.drawText(rightName, {
    x: MARGIN + colW + 38,
    y: top - 28,
    size: 9,
    font: ctx.font,
    color: COL.ink,
  });
  ctx.page.drawText("Signature :", {
    x: MARGIN + colW + 38,
    y: top - 78,
    size: 7,
    font: ctx.italic,
    color: COL.muted,
  });
  ctx.y = top - 100;
}

function drawFooterAllPages(ctx: Ctx) {
  const pages = ctx.pdf.getPages();
  const total = pages.length;
  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} / ${total} — Document généré via GenDoc`, {
      x: MARGIN,
      y: 22,
      size: 7.5,
      font: ctx.font,
      color: rgb(0.55, 0.58, 0.65),
    });
  });
}

function fr(value?: string): string {
  if (!value) return "";
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export async function renderContratProfessionnalisationPdf(
  d: Record<string, string>
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const ctx = newCtx(pdf, font, bold, italic);

  drawHeaderBand(ctx, "Contrat de professionnalisation", "Articles L. 6325-1 à L. 6325-24 du Code du travail");

  // Employeur
  drawSection(ctx, "1. Employeur");
  drawTwoColFields(ctx, [
    [{ label: "Dénomination / Nom", value: d.employerName || "" }, { label: "SIRET", value: d.employerSiret || "" }],
    [{ label: "Adresse", value: d.employerAddress || "" }, { label: "Code NAF", value: d.employerNaf || "" }],
    [{ label: "Code postal", value: d.employerAddressCp || "" }, { label: "Commune", value: d.employerAddressCity || "" }],
    [{ label: "Téléphone", value: d.employerPhone || "" }, { label: "Courriel", value: d.employerEmail || "" }],
    [{ label: "Effectif salarié", value: d.employerEffectif || "" }, { label: "Convention collective (IDCC)", value: [d.employerConvention, d.employerIdcc ? `(IDCC ${d.employerIdcc})` : ""].filter(Boolean).join(" ") }],
  ]);

  // Salarié
  drawSection(ctx, "2. Salarié en alternance");
  drawTwoColFields(ctx, [
    [{ label: "Nom et prénom", value: d.employeeName || "" }, { label: "Date de naissance", value: fr(d.employeeBirth) }],
    [{ label: "Sexe", value: d.employeeSex === "F" ? "Féminin" : d.employeeSex === "M" ? "Masculin" : "" }, { label: "Diplôme le plus élevé (code)", value: d.employeeDiploma || "" }],
    [{ label: "Adresse", value: d.employeeAddress || "" }, { label: "Téléphone", value: d.employeePhone || "" }],
    [{ label: "Code postal", value: d.employeeAddressCp || "" }, { label: "Commune", value: d.employeeAddressCity || "" }],
    [{ label: "Reconnaissance travailleur handicapé", value: d.employeeHandicap === "oui" ? "Oui" : "Non" }, { label: "Inscrit à Pôle Emploi", value: d.employeePoleEmploi === "oui" ? "Oui" : "Non" }],
    [{ label: "Courriel", value: d.employeeEmail || "" }, { label: "", value: "" }],
  ]);

  // Tuteur
  drawSection(ctx, "3. Tuteur");
  drawTwoColFields(ctx, [
    [{ label: "Nom et prénom", value: d.tutorName || "" }, { label: "Emploi occupé", value: d.tutorJob || "" }],
    [{ label: "Date de naissance", value: fr(d.tutorBirth) }, { label: "", value: "" }],
  ]);

  // Contrat
  drawSection(ctx, "4. Contrat de travail");
  drawTwoColFields(ctx, [
    [{ label: "Nature du contrat", value: d.contractNature || "" }, { label: "Emploi occupé", value: d.jobTitle || "" }],
    [{ label: "Date de début", value: fr(d.contractStart) }, { label: "Date de fin", value: fr(d.contractEnd) }],
    [{ label: "Période d'essai (jours)", value: d.trialDays || "" }, { label: "Classification", value: d.jobClassification || "" }],
    [{ label: "Niveau", value: d.jobLevel || "" }, { label: "Coefficient", value: d.jobCoefficient || "" }],
    [
      {
        label: "Durée hebdomadaire",
        value: `${d.weeklyHours || "0"} h ${d.weeklyMinutes && d.weeklyMinutes !== "0" ? d.weeklyMinutes + " min" : ""}`.trim(),
      },
      { label: "Salaire brut mensuel à l'embauche", value: d.grossSalary ? `${d.grossSalary} €` : "" },
    ],
  ]);

  // Formation
  drawSection(ctx, "5. Formation");
  drawTwoColFields(ctx, [
    [{ label: "Organisme de formation", value: d.trainingOrg || "" }, { label: "SIRET de l'organisme", value: d.trainingSiret || "" }],
    [{ label: "Service de formation interne", value: d.trainingInternal === "oui" ? "Oui" : "Non" }, { label: "Spécialité (code)", value: d.trainingSpecialty || "" }],
    [{ label: "Diplôme ou titre visé", value: d.trainingTitle || "" }, { label: "Durée totale (heures)", value: d.trainingTotalHours || "" }],
    [{ label: "Dont enseignements généraux (h)", value: d.trainingGeneralHours || "" }, { label: "", value: "" }],
    [{ label: "Début du cycle", value: fr(d.trainingStart) }, { label: "Fin prévue (épreuves)", value: fr(d.trainingEnd) }],
  ]);

  // OPCO
  if (d.opcaName || d.opcaAdherent) {
    drawSection(ctx, "6. OPCO / Financement");
    drawTwoColFields(ctx, [
      [{ label: "Nom de l'OPCO / OPCA", value: d.opcaName || "" }, { label: "N° d'adhérent", value: d.opcaAdherent || "" }],
    ]);
  }

  // Mentions légales (paragraphe)
  drawSection(ctx, "Engagements des parties");
  drawParagraph(
    ctx,
    "En application de l'article L. 6325-3 du Code du travail, l'employeur s'engage à assurer au salarié une formation lui permettant d'acquérir une qualification professionnelle et à lui fournir un emploi en relation avec cet objectif pendant la durée du contrat. Le salarié s'engage à travailler pour le compte de son employeur et à suivre la formation prévue au contrat."
  );
  drawParagraph(
    ctx,
    `Fait à ${d.city || "—"}, le ${new Date().toLocaleDateString("fr-FR")}, en deux exemplaires originaux.`
  );

  // Signatures
  drawSignatureBlock(
    ctx,
    "L'EMPLOYEUR",
    d.employerName || "",
    "LE SALARIÉ",
    d.employeeName || ""
  );

  drawFooterAllPages(ctx);
  return pdf.save();
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof Buffer !== "undefined"
    ? Buffer.from(bytes).toString("base64")
    : btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
