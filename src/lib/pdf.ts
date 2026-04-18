import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

type Rendered = {
  title: string;
  body: string[];
  footer?: string;
};

export type PdfFormValues = Record<string, string | boolean>;

export async function fillPdfFormTemplate(
  templatePath: string,
  values: PdfFormValues
): Promise<Uint8Array> {
  const abs = path.isAbsolute(templatePath)
    ? templatePath
    : path.join(process.cwd(), templatePath);
  const src = fs.readFileSync(abs);
  const pdf = await PDFDocument.load(src);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();

  for (const [name, raw] of Object.entries(values)) {
    if (raw == null || raw === "") continue;
    const field = (() => {
      try {
        return form.getField(name);
      } catch {
        return null;
      }
    })();
    if (!field) continue;
    const type = field.constructor.name;
    try {
      if (type === "PDFTextField") {
        const tf = form.getTextField(name);
        tf.setText(String(raw));
        tf.updateAppearances(font);
      } else if (type === "PDFCheckBox") {
        const cb = form.getCheckBox(name);
        if (raw === true || raw === "true" || raw === "oui" || raw === "X") cb.check();
        else cb.uncheck();
        cb.updateAppearances();
      } else if (type === "PDFDropdown") {
        form.getDropdown(name).select(String(raw));
      } else if (type === "PDFRadioGroup") {
        form.getRadioGroup(name).select(String(raw));
      }
    } catch {
      // Ignore individual field failures — keep partial progress.
    }
  }

  form.flatten();

  return pdf.save();
}

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
