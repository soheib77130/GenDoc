"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Type, Signature, Calendar, Square,
  Download, Sparkles, Lock, ChevronLeft, ChevronRight, FileText, Edit3,
  Bold, Minus, Plus, Palette, Move, X,
} from "lucide-react";
import {
  PDFDocument, StandardFonts, rgb,
  PDFName, PDFRawStream, PDFArray, decodePDFRawStream,
} from "pdf-lib";
import { Button } from "@/components/ui/button";

/* ─── Types ──────────────────────────────────────────────────── */
type Overlay = {
  id: string; page: number;
  x: number; y: number; // 0-1 relative to image
  kind: "text" | "date" | "signature" | "check";
  value: string; fontSize: number;
};

// Text extracted from the PDF, directly editable
type PdfTextItem = {
  id: string; page: number;
  // Screen position (px in the rendered canvas image)
  left: number; top: number; width: number; fontSize: number;
  // PDF native coords (for white-out + rewrite on export)
  pdfX: number; pdfY: number; pdfWidth: number; pdfFontSize: number;
  pdfPageHeight: number;
  original: string; current: string; edited: boolean;
  // Index among items on the same page that share the same `original` text,
  // assigned in stream order. Critical: when the user edits one of several
  // "et" or "le", we must replace the right occurrence in the content
  // stream — not the first one found.
  occurrenceIndex: number;
  // Sampled background + text color (0-1) — so we can erase with the right
  // color and redraw the new text in the original ink color, whether the
  // document uses dark-on-light or light-on-colored text.
  bgColor: { r: number; g: number; b: number };
  textColor: { r: number; g: number; b: number };
  // Format overrides — any of these triggers overlay-based rendering on
  // export (erase original + redraw with new format). When all are at their
  // defaults, a pure content-stream byte swap is used instead.
  bold: boolean;
  sizeMul: number;                                    // 1 = original size
  colorOverride: { r: number; g: number; b: number } | null;
  offsetX: number;                                    // PDF units
  offsetY: number;                                    // PDF units
};

type PageImage = {
  page: number; dataUrl: string;
  widthPx: number; heightPx: number; // rendered canvas size
  pdfWidth: number; pdfHeight: number;
  scale: number;
};

/* ─── Component ──────────────────────────────────────────────── */
export function PdfEditor({ usage }: {
  usage: {
    planName: string; usingQuota: boolean; remaining: number;
    credits: number; needsPayment: boolean; unitPriceCts: number;
  };
}) {
  const router = useRouter();
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<PageImage[]>([]);
  const [textItems, setTextItems] = useState<PdfTextItem[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tool, setTool] = useState<Overlay["kind"]>("text");
  const [fontSize, setFontSize] = useState(14);
  const [mode, setMode] = useState<"edit" | "annotate">("edit"); // edit = modify existing text
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Id of the text item whose toolbar is open (Sejda-like floating bar)
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  /* ── Load PDF ── */
  async function handleFile(file: File) {
    setErr(null); setRendering(true);
    const buf = new Uint8Array(await file.arrayBuffer());
    setFileBytes(buf); setFileName(file.name);
    setOverlays([]); setTextItems([]); setCurrentPage(0);
    try {
      const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs" as any);
      pdfjs.GlobalWorkerOptions.workerSrc =
        `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data: buf.slice() }).promise;
      const SCALE = 1.8;
      const images: PageImage[] = [];
      const texts: PdfTextItem[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: SCALE });

        // Render to canvas
        const canvas = document.createElement("canvas");
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
        images.push({
          page: i, dataUrl: canvas.toDataURL("image/png"),
          widthPx: vp.width, heightPx: vp.height,
          pdfWidth: vp.width / SCALE, pdfHeight: vp.height / SCALE, scale: SCALE,
        });

        // Grab full image data once to sample background colors around text
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const cw = canvas.width, chh = canvas.height;

        const sampleColors = (lx: number, tp: number, wd: number, fh: number) => {
          // Mode of pixels sampled OUTSIDE the text row (above/below) gives
          // the true background color — regardless of whether the document
          // is dark-on-light or light-on-colored.
          const bgCounts = new Map<string, { n: number; r: number; g: number; b: number }>();
          // Mode of pixels sampled INSIDE the text row, but only those far
          // from the background color, gives the text ink color.
          const inkCounts = new Map<string, { n: number; r: number; g: number; b: number }>();

          const add = (map: Map<string, { n: number; r: number; g: number; b: number }>, r: number, g: number, b: number) => {
            const qr = r & 0xF0, qg = g & 0xF0, qb = b & 0xF0;
            const key = `${qr},${qg},${qb}`;
            const cur = map.get(key);
            if (cur) { cur.n++; cur.r += r; cur.g += g; cur.b += b; }
            else map.set(key, { n: 1, r, g, b });
          };
          const pushBg = (x: number, y: number) => {
            const xi = Math.round(x), yi = Math.round(y);
            if (xi < 0 || yi < 0 || xi >= cw || yi >= chh) return;
            const idx = (yi * cw + xi) * 4;
            add(bgCounts, imgData[idx], imgData[idx + 1], imgData[idx + 2]);
          };

          const band = Math.max(2, Math.round(fh * 0.35));
          for (let d = 1; d <= band; d++) {
            for (let x = lx; x < lx + wd; x += 2) {
              pushBg(x, tp - d);
              pushBg(x, tp + fh + d);
            }
          }
          for (let d = 1; d <= band; d++) {
            for (let y = tp; y < tp + fh; y += 2) {
              pushBg(lx - d, y);
              pushBg(lx + wd + d, y);
            }
          }

          // Pick bg = mode
          let bgN = 0, bgR = 255, bgG = 255, bgB = 255;
          bgCounts.forEach(v => {
            if (v.n > bgN) { bgN = v.n; bgR = v.r / v.n; bgG = v.g / v.n; bgB = v.b / v.n; }
          });
          const bg = bgN < 3
            ? { r: 1, g: 1, b: 1 }
            : { r: bgR / 255, g: bgG / 255, b: bgB / 255 };

          // Ink = mode of pixels on the text row that are farthest from bg
          for (let y = tp + 2; y < tp + fh - 2; y += 1) {
            for (let x = lx; x < lx + wd; x += 1) {
              const xi = Math.round(x), yi = Math.round(y);
              if (xi < 0 || yi < 0 || xi >= cw || yi >= chh) continue;
              const idx = (yi * cw + xi) * 4;
              const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];
              const dr = r - bgR, dg = g - bgG, db = b - bgB;
              const dist = Math.sqrt(dr * dr + dg * dg + db * db);
              if (dist > 90) add(inkCounts, r, g, b);
            }
          }
          let inkN = 0, inkR = 0, inkG = 0, inkB = 0;
          inkCounts.forEach(v => {
            if (v.n > inkN) { inkN = v.n; inkR = v.r / v.n; inkG = v.g / v.n; inkB = v.b / v.n; }
          });
          const ink = inkN < 3
            ? { r: 0.05, g: 0.05, b: 0.1 }
            : { r: inkR / 255, g: inkG / 255, b: inkB / 255 };

          return { bg, ink };
        };

        // Extract text layer — keep fragments un-merged so we can byte-match
        // each piece against its source Tj operator in the content stream.
        const tc = await page.getTextContent({ disableCombineTextItems: true });
        for (const item of tc.items as any[]) {
          if (!item.str?.trim()) continue;
          // Actual font size in PDF units (handles rotation via hypot of transform column 1)
          const pdfFS = Math.hypot(item.transform[0], item.transform[1])
            || item.height
            || 10;
          // Convert PDF transform to screen coords via viewport
          const tx = pdfjs.Util.transform(vp.transform, item.transform);
          const fontH = pdfFS * SCALE;
          const topPx = tx[5] - fontH;
          const leftPx = tx[4];
          const widthPx = item.width * SCALE;

          const { bg, ink } = sampleColors(leftPx, topPx, Math.max(widthPx, 10), Math.max(fontH, 6));

          texts.push({
            id: Math.random().toString(36).slice(2),
            page: i,
            left: leftPx, top: topPx, width: Math.max(widthPx, 10), fontSize: Math.max(fontH, 6),
            // Native PDF coords for export
            pdfX: item.transform[4], pdfY: item.transform[5],
            pdfWidth: item.width, pdfFontSize: pdfFS,
            pdfPageHeight: vp.height / SCALE,
            original: item.str, current: item.str, edited: false,
            occurrenceIndex: 0, // assigned right after the loop
            bgColor: bg,
            textColor: ink,
            bold: false, sizeMul: 1, colorOverride: null, offsetX: 0, offsetY: 0,
          });
        }
      }
      // Assign per-page occurrence indices so that duplicates can be
      // disambiguated when rewriting the content stream.
      const occCounts = new Map<string, number>();
      for (const t of texts) {
        const key = `${t.page}::${t.original}`;
        const n = occCounts.get(key) ?? 0;
        t.occurrenceIndex = n;
        occCounts.set(key, n + 1);
      }
      setPages(images); setTextItems(texts);
    } catch (e) {
      setErr("Impossible de lire ce PDF. Vérifiez qu'il n'est pas protégé.");
    } finally { setRendering(false); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type === "application/pdf") handleFile(f);
  }

  /* ── Text item edit ── */
  function patchText(id: string, patch: Partial<PdfTextItem>) {
    setTextItems(all => all.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, ...patch };
      next.edited =
        next.current !== next.original
        || next.bold
        || next.sizeMul !== 1
        || next.colorOverride != null
        || next.offsetX !== 0
        || next.offsetY !== 0;
      return next;
    }));
  }
  function updateText(id: string, val: string) { patchText(id, { current: val }); }

  /* ── Add annotation (annotate mode) ── */
  function addOverlayAt(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "annotate" || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const value = tool === "date" ? new Date().toLocaleDateString("fr-FR")
      : tool === "signature" ? "Signature" : tool === "check" ? "✓" : "Texte";
    const o: Overlay = {
      id: Math.random().toString(36).slice(2),
      page: currentPage + 1, x, y, kind: tool, value,
      fontSize: tool === "check" ? 22 : tool === "signature" ? 18 : fontSize,
    };
    setOverlays(all => [...all, o]);
    setSelected(o.id);
  }

  function updateOverlay(id: string, patch: Partial<Overlay>) {
    setOverlays(all => all.map(o => o.id === id ? { ...o, ...patch } : o));
  }
  function deleteOverlay(id: string) {
    setOverlays(all => all.filter(o => o.id !== id));
    if (selected === id) setSelected(null);
  }

  /* ── Export PDF ── */
  async function exportPdf(save: boolean) {
    if (!fileBytes) return;
    setErr(null);
    if (save && usage.needsPayment) { router.push("/pricing?need=edit"); return; }
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(fileBytes.slice() as unknown as ArrayBuffer);
      const pdfPages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const scriptFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      // 1. Apply edited text items. Two paths:
      //    a) pure text change, no format override → content-stream byte swap
      //       (preserves font, color, weight, position exactly)
      //    b) format override (bold, size, color, position) → overlay: erase
      //       original glyphs in the sampled bg color and redraw with the
      //       requested format.
      const edited = textItems.filter(t => t.edited);
      const skipped: string[] = [];

      const hasFmt = (t: PdfTextItem) =>
        t.bold || t.sizeMul !== 1 || t.colorOverride != null || t.offsetX !== 0 || t.offsetY !== 0;

      const streamPath = edited.filter(t => !hasFmt(t));
      const overlayPath = edited.filter(t => hasFmt(t));

      // Path A: content-stream replacement, grouped by page
      const byPage = new Map<number, typeof streamPath>();
      for (const t of streamPath) {
        const arr = byPage.get(t.page) ?? [];
        arr.push(t); byPage.set(t.page, arr);
      }
      byPage.forEach((items, pageNum) => {
        const p = pdfPages[pageNum - 1];
        if (!p) { items.forEach(t => skipped.push(t.original)); return; }
        const bytes = getPageContentBytes(p);
        if (!bytes) { items.forEach(t => skipped.push(t.original)); return; }

        // Group by `original`; for each group, find ALL occurrence positions
        // in the stream once (in any of the supported forms) and apply the
        // edits in DESCENDING position order so earlier offsets don't shift.
        const byOrig = new Map<string, typeof items>();
        for (const t of items) {
          const arr = byOrig.get(t.original) ?? [];
          arr.push(t); byOrig.set(t.original, arr);
        }

        type Plan = { start: number; end: number; repl: Uint8Array; t: PdfTextItem };
        const plans: Plan[] = [];

        byOrig.forEach((group, orig) => {
          // Try literal form first; fall back to hex/UTF-16/TJ if needed.
          // For each form we get the list of (start,end) ranges.
          const ranges = findAllOccurrencesAnyForm(bytes, orig);
          if (!ranges) { group.forEach(t => skipped.push(t.original)); return; }
          for (const t of group) {
            const r = ranges.list[t.occurrenceIndex];
            if (!r) { skipped.push(t.original); continue; }
            const repl = ranges.encode(t.current);
            plans.push({ start: r.start, end: r.end, repl, t });
          }
        });

        if (!plans.length) return;
        plans.sort((a, b) => b.start - a.start); // right-to-left
        let buf = bytes;
        for (const pl of plans) {
          const out = new Uint8Array(buf.length - (pl.end - pl.start) + pl.repl.length);
          out.set(buf.subarray(0, pl.start), 0);
          out.set(pl.repl, pl.start);
          out.set(buf.subarray(pl.end), pl.start + pl.repl.length);
          buf = out;
        }
        setPageContent(pdfDoc, p, buf);
      });

      // Path B: overlay (needed whenever user changed format/position)
      for (const t of overlayPath) {
        const p = pdfPages[t.page - 1];
        if (!p) continue;
        const bg = rgb(t.bgColor.r, t.bgColor.g, t.bgColor.b);
        const chosenFont = t.bold ? boldFont : font;
        const size = t.pdfFontSize * t.sizeMul;
        const color = t.colorOverride
          ? rgb(t.colorOverride.r, t.colorOverride.g, t.colorOverride.b)
          : rgb(t.textColor.r, t.textColor.g, t.textColor.b);

        // Erase original glyphs (5x5 dense grid, regular font, original size)
        const offsets = [-0.5, -0.25, 0, 0.25, 0.5];
        for (const dx of offsets) {
          for (const dy of offsets) {
            p.drawText(t.original, {
              x: t.pdfX + dx,
              y: t.pdfY + dy,
              size: t.pdfFontSize,
              font,
              color: bg,
            });
          }
        }
        p.drawText(t.current, {
          x: t.pdfX + t.offsetX,
          y: t.pdfY + t.offsetY,
          size,
          font: chosenFont,
          color,
        });
      }

      // 2. Apply annotation overlays (existing feature)
      const page0 = pdfPages[0];
      for (const o of overlays) {
        const p = pdfPages[o.page - 1];
        if (!p) continue;
        const { width: pw, height: ph } = p.getSize();
        const x = o.x * pw;
        const y = ph - o.y * ph - o.fontSize;
        const chosenFont = o.kind === "signature" ? scriptFont
          : o.kind === "check" ? boldFont : font;
        p.drawText(o.value, { x, y, size: o.fontSize, font: chosenFont, color: rgb(0.05, 0.08, 0.2) });
      }

      const bytes = await pdfDoc.save();

      if (skipped.length) {
        const preview = skipped.slice(0, 2).map(s => `"${s}"`).join(", ");
        const more = skipped.length > 2 ? ` et ${skipped.length - 2} autre(s)` : "";
        setErr(`${skipped.length} modification(s) ignorée(s) (${preview}${more}) — ce texte est encodé d'une façon que l'outil ne peut pas modifier en l'état sans altérer l'apparence. Le reste du PDF est intact.`);
      }

      if (save) {
        let base64 = "";
        if (typeof Buffer !== "undefined") {
          base64 = Buffer.from(bytes).toString("base64");
        } else {
          let bin = "";
          for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          base64 = btoa(bin);
        }
        const res = await fetch("/api/edit/save", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: fileName.replace(/\.pdf$/i, "") || "Document modifié", fileData: base64 }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          if (j.needsPayment) { router.push("/pricing?need=edit"); return; }
          throw new Error(j.error || "Erreur");
        }
        const j = await res.json();
        router.push(`/documents/${j.id}`);
        return;
      }

      // Direct download
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = (fileName.replace(/\.pdf$/i, "") || "document") + "-modifie.pdf";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally { setSaving(false); }
  }

  const billLabel = usage.usingQuota
    ? `Inclus — ${usage.planName} (reste ${usage.remaining})`
    : usage.credits > 0 ? `1 crédit (reste ${usage.credits})`
    : `${(usage.unitPriceCts / 100).toFixed(2)}€ requis`;

  /* ─── Upload screen ─── */
  if (!fileBytes) {
    return (
      <div
        onDragOver={e => e.preventDefault()} onDrop={onDrop}
        className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 px-8 py-24 text-center backdrop-blur transition hover:border-indigo-400 hover:bg-indigo-50/30"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/30">
          <Upload className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Déposez votre PDF ici</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-600">Glissez-déposez un PDF ou cliquez pour sélectionner. Le texte devient directement éditable.</p>
        <label className="mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800">
          <Upload className="h-4 w-4" />
          Sélectionner un PDF
          <input type="file" accept="application/pdf" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        {rendering && <p className="mt-4 text-sm text-indigo-600 animate-pulse">Extraction du texte en cours…</p>}
      </div>
    );
  }

  const page = pages[currentPage];
  const pageTexts = textItems.filter(t => t.page === currentPage + 1);
  const editedCount = textItems.filter(t => t.edited).length;

  /* ─── Editor ─── */
  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">

      {/* Toolbar */}
      <aside className="space-y-4">
        {/* File info */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate text-sm font-medium text-slate-900">
              <FileText className="h-4 w-4 flex-none text-slate-500" />
              <span className="truncate">{fileName}</span>
            </div>
            <button onClick={() => { setFileBytes(null); setPages([]); setTextItems([]); setOverlays([]); }}
              className="text-xs text-slate-400 hover:text-red-600">Changer</button>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-slate-500">
            <span>{pages.length} page{pages.length > 1 ? "s" : ""}</span>
            <span>{pageTexts.length} zones de texte</span>
            {editedCount > 0 && <span className="text-indigo-600 font-medium">{editedCount} modifié{editedCount > 1 ? "s" : ""}</span>}
          </div>
        </div>

        {/* Mode switch */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mode</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("edit")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition ${mode === "edit" ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              <Edit3 className="h-3.5 w-3.5" /> Modifier texte
            </button>
            <button onClick={() => setMode("annotate")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition ${mode === "annotate" ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              <Type className="h-3.5 w-3.5" /> Annoter
            </button>
          </div>

          {mode === "edit" && (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Cliquez directement sur le texte du document pour le modifier.
            </p>
          )}

          {mode === "annotate" && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([
                  { k: "text", icon: Type, label: "Texte" },
                  { k: "date", icon: Calendar, label: "Date" },
                  { k: "signature", icon: Signature, label: "Signature" },
                  { k: "check", icon: Square, label: "Coche" },
                ] as const).map(t => (
                  <button key={t.k} onClick={() => setTool(t.k)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs transition ${tool === t.k ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                    <t.icon className="h-4 w-4" />{t.label}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <div className="mb-1 text-[11px] text-slate-500">Taille : {fontSize}px</div>
                <input type="range" min={10} max={40} value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Cliquez sur la page pour placer l'élément.</p>
            </>
          )}
        </div>

        {/* Billing info */}
        <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-800">
            {usage.usingQuota ? <Sparkles className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            Facturation
          </div>
          <div className="mt-1 text-slate-700">{billLabel}</div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => exportPdf(false)} loading={saving} className="w-full">
            <Download className="h-4 w-4" /> Télécharger (aperçu)
          </Button>
          <Button onClick={() => exportPdf(true)} loading={saving} className="w-full">
            <Download className="h-4 w-4" />
            {usage.needsPayment ? "Payer et enregistrer" : "Enregistrer"}
          </Button>
        </div>

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
        )}
      </aside>

      {/* Canvas + overlay */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur overflow-hidden">
        {pages.length > 1 && (
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Précédente
            </button>
            <span className="text-xs text-slate-500">Page {currentPage + 1} / {pages.length}</span>
            <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage >= pages.length - 1}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs disabled:opacity-40">
              Suivante <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="overflow-auto max-h-[80vh] scrollbar-thin p-2">
          {page ? (
            <div
              ref={pageRef}
              onClick={addOverlayAt}
              className={`relative mx-auto shadow-xl shadow-slate-900/10 ${mode === "annotate" ? "cursor-crosshair" : "cursor-default"}`}
              style={{ width: page.widthPx }}
            >
              {/* Background image */}
              <img
                src={page.dataUrl} alt="" draggable={false}
                className="pointer-events-none block select-none"
                style={{ width: page.widthPx, height: page.heightPx }}
              />

              {/* Editable text items */}
              {pageTexts.map(t => (
                <EditableTextItem
                  key={t.id}
                  item={t}
                  scale={page.scale}
                  active={activeTextId === t.id}
                  onActivate={() => setActiveTextId(t.id)}
                  onDeactivate={() => setActiveTextId(a => a === t.id ? null : a)}
                  onPatch={p => patchText(t.id, p)}
                />
              ))}

              {/* Floating toolbar for the active text item */}
              {activeTextId && (() => {
                const active = pageTexts.find(t => t.id === activeTextId);
                if (!active) return null;
                return (
                  <TextToolbar
                    item={active}
                    scale={page.scale}
                    onPatch={p => patchText(active.id, p)}
                    onClose={() => setActiveTextId(null)}
                  />
                );
              })()}

              {/* Annotation overlays */}
              {overlays.filter(o => o.page === currentPage + 1).map(o => (
                <AnnotationOverlay
                  key={o.id} overlay={o} selected={selected === o.id}
                  onSelect={() => setSelected(o.id)}
                  onUpdate={patch => updateOverlay(o.id, patch)}
                  onDelete={() => deleteOverlay(o.id)}
                  pageRef={pageRef}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-slate-500 animate-pulse">Chargement…</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Content-stream byte-level text replacement ─────────────── */
// Get the decompressed bytes of a page's content stream(s), concatenated.
// Returns null if the page has no stream or it can't be decoded.
function getPageContentBytes(page: any): Uint8Array | null {
  const node = page.node;
  const contents = node.get(PDFName.of("Contents"));
  if (!contents) return null;
  const streams: PDFRawStream[] = [];
  const ctx = node.context;
  const resolve = (ref: any) => ctx.lookup(ref);
  if (contents instanceof PDFArray) {
    for (let i = 0; i < contents.size(); i++) {
      const s = resolve(contents.get(i));
      if (s instanceof PDFRawStream) streams.push(s);
    }
  } else {
    const s = resolve(contents);
    if (s instanceof PDFRawStream) streams.push(s);
  }
  if (!streams.length) return null;
  try {
    const parts = streams.map(s => decodePDFRawStream(s).decode());
    // Concatenate (insert a space between streams just in case)
    let total = 0;
    for (const p of parts) total += p.length + 1;
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of parts) {
      out.set(p, off); off += p.length;
      out[off++] = 0x0A;
    }
    return out;
  } catch {
    return null;
  }
}

// Replace the page's content with a single new (compressed) stream.
function setPageContent(pdfDoc: PDFDocument, page: any, bytes: Uint8Array) {
  const newStream = pdfDoc.context.flateStream(bytes);
  const ref = pdfDoc.context.register(newStream);
  page.node.set(PDFName.of("Contents"), ref);
}

// Escape a string for use as a PDF literal `( ... )`.
function encodePdfLiteral(s: string): Uint8Array {
  const out: number[] = [0x28]; // (
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0x28 || c === 0x29 || c === 0x5C) { out.push(0x5C, c); }
    else if (c === 0x0A) { out.push(0x5C, 0x6E); }
    else if (c === 0x0D) { out.push(0x5C, 0x72); }
    else if (c <= 0x7F) { out.push(c); }
    else {
      // Encode as \nnn octal (PDFDocEncoding / WinAnsi approximation)
      const b = c & 0xFF;
      const s1 = (b >> 6) & 0x07, s2 = (b >> 3) & 0x07, s3 = b & 0x07;
      out.push(0x5C, 0x30 + s1, 0x30 + s2, 0x30 + s3);
    }
  }
  out.push(0x29); // )
  return new Uint8Array(out);
}

// Build the exact byte sequence a PDF literal would have for `s`.
function literalBytesForMatch(s: string): Uint8Array {
  return encodePdfLiteral(s);
}

// Find a PDF literal `( s )` (with simple ASCII) inside `stream` and replace
// it with `( r )`. Returns the new bytes, or null if not found.
function replacePdfLiteralString(
  stream: Uint8Array, s: string, r: string,
): Uint8Array | null {
  const needle = literalBytesForMatch(s);
  const replacement = encodePdfLiteral(r);
  const idx = indexOfBytes(stream, needle);
  if (idx < 0) return null;
  const out = new Uint8Array(stream.length - needle.length + replacement.length);
  out.set(stream.subarray(0, idx), 0);
  out.set(replacement, idx);
  out.set(stream.subarray(idx + needle.length), idx + replacement.length);
  return out;
}

// Find every (start,end) range that holds the source string `s` in the
// stream, across all supported encodings. Returns the list AND an encoder
// that produces the bytes for the replacement in the same form, so the
// caller can splice without changing the surrounding operators.
function findAllOccurrencesAnyForm(
  stream: Uint8Array, s: string,
): { list: { start: number; end: number }[]; encode: (r: string) => Uint8Array } | null {
  // 1. Literal form
  {
    const needle = literalBytesForMatch(s);
    const list = findAllRanges(stream, needle);
    if (list.length) return { list, encode: (r) => encodePdfLiteral(r) };
  }
  // 2. Hex 1-byte
  {
    const needle = hexBytes(s, false);
    if (needle.length > 2) {
      const list = findAllRanges(stream, needle);
      if (list.length) return { list, encode: (r) => hexBytes(r, false) };
    }
  }
  // 3. Hex 2-byte (Identity-H)
  {
    const needle = hexBytes(s, true);
    if (needle.length > 2) {
      const list = findAllRanges(stream, needle);
      if (list.length) return { list, encode: (r) => hexBytes(r, true) };
    }
  }
  // 4. TJ arrays whose concatenated content equals s
  const tj = findAllTJArrays(stream, s);
  if (tj.length) {
    return {
      list: tj,
      encode: (r) => {
        // Replace the whole "[...] TJ" with "(r) Tj"
        const lit = encodePdfLiteral(r);
        const out = new Uint8Array(lit.length + 3);
        out.set(lit, 0);
        out[lit.length] = 0x20; out[lit.length + 1] = 0x54; out[lit.length + 2] = 0x6A;
        return out;
      },
    };
  }
  return null;
}

function findAllRanges(hay: Uint8Array, needle: Uint8Array): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  if (needle.length === 0) return out;
  let i = 0;
  while (i <= hay.length - needle.length) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) { match = false; break; }
    }
    if (match) {
      out.push({ start: i, end: i + needle.length });
      i += needle.length;
    } else {
      i++;
    }
  }
  return out;
}

function findAllTJArrays(stream: Uint8Array, s: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let i = 0;
  while (i < stream.length) {
    if (stream[i] !== 0x5B) { i++; continue; }
    const start = i;
    i++;
    let content = "";
    while (i < stream.length && stream[i] !== 0x5D) {
      const c = stream[i];
      if (c === 0x28) {
        let j = i + 1, depth = 1, text = "";
        while (j < stream.length && depth > 0) {
          const cc = stream[j];
          if (cc === 0x5C && j + 1 < stream.length) {
            const esc = stream[j + 1];
            if (esc === 0x6E) { text += "\n"; j += 2; }
            else if (esc === 0x72) { text += "\r"; j += 2; }
            else if (esc === 0x74) { text += "\t"; j += 2; }
            else if (esc >= 0x30 && esc <= 0x37) {
              let oct = esc - 0x30, k = j + 2;
              while (k < j + 4 && stream[k] >= 0x30 && stream[k] <= 0x37) {
                oct = oct * 8 + (stream[k] - 0x30); k++;
              }
              text += String.fromCharCode(oct & 0xFF);
              j = k;
            } else { text += String.fromCharCode(esc); j += 2; }
          } else if (cc === 0x28) { depth++; text += "("; j++; }
          else if (cc === 0x29) { depth--; if (depth > 0) text += ")"; j++; }
          else { text += String.fromCharCode(cc); j++; }
        }
        content += text;
        i = j;
      } else if (c === 0x3C) {
        let j = i + 1, hex = "";
        while (j < stream.length && stream[j] !== 0x3E) {
          const cc = stream[j];
          if ((cc >= 0x30 && cc <= 0x39) || (cc >= 0x41 && cc <= 0x46) || (cc >= 0x61 && cc <= 0x66)) hex += String.fromCharCode(cc);
          j++;
        }
        if (hex.length % 2) hex += "0";
        for (let k = 0; k < hex.length; k += 2) content += String.fromCharCode(parseInt(hex.substr(k, 2), 16));
        i = j + 1;
      } else { i++; }
    }
    if (i >= stream.length) return out;
    const endBracket = i;
    let k = endBracket + 1;
    while (k < stream.length && (stream[k] === 0x20 || stream[k] === 0x0A || stream[k] === 0x0D || stream[k] === 0x09)) k++;
    if (k + 1 < stream.length && stream[k] === 0x54 && stream[k + 1] === 0x4A) {
      const afterTJ = k + 2;
      if (content === s) out.push({ start, end: afterTJ });
      i = afterTJ;
    } else {
      i = endBracket + 1;
    }
  }
  return out;
}

// (kept for backwards-compat — unused after the new planner)
function replacePdfString(stream: Uint8Array, s: string, r: string): Uint8Array | null {
  // 1. Plain literal
  const lit = replacePdfLiteralString(stream, s, r);
  if (lit) return lit;
  // 2. Hex, 1 byte per char (Latin-1 / WinAnsi)
  const hex1 = hexBytes(s, false);
  const repHex1 = hexBytes(r, false);
  const hex1Rep = replaceByteRange(stream, hex1, repHex1);
  if (hex1Rep) return hex1Rep;
  // 3. Hex, 2 bytes per char big-endian (UTF-16 / Identity-H CID)
  const hex2 = hexBytes(s, true);
  const repHex2 = hexBytes(r, true);
  const hex2Rep = replaceByteRange(stream, hex2, repHex2);
  if (hex2Rep) return hex2Rep;
  // 4. TJ array with multiple literal fragments that concatenate to s
  const tjRep = replaceInTJArray(stream, s, r);
  if (tjRep) return tjRep;
  return null;
}

function hexBytes(s: string, utf16: boolean): Uint8Array {
  const parts: number[] = [0x3C]; // <
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (utf16) {
      parts.push(...hexOfByte((c >> 8) & 0xFF));
      parts.push(...hexOfByte(c & 0xFF));
    } else {
      parts.push(...hexOfByte(c & 0xFF));
    }
  }
  parts.push(0x3E); // >
  return new Uint8Array(parts);
}
function hexOfByte(b: number): number[] {
  const hi = (b >> 4) & 0xF, lo = b & 0xF;
  return [hi < 10 ? 0x30 + hi : 0x41 + hi - 10, lo < 10 ? 0x30 + lo : 0x41 + lo - 10];
}

function replaceByteRange(stream: Uint8Array, needle: Uint8Array, repl: Uint8Array): Uint8Array | null {
  if (needle.length <= 2) return null; // bracket-only match, too permissive
  const idx = indexOfBytes(stream, needle);
  if (idx < 0) return null;
  const out = new Uint8Array(stream.length - needle.length + repl.length);
  out.set(stream.subarray(0, idx), 0);
  out.set(repl, idx);
  out.set(stream.subarray(idx + needle.length), idx + repl.length);
  return out;
}

// Walk `[...] TJ` blocks, parse their string fragments (literal or hex),
// and if the concatenation equals `s`, rewrite the whole array as a single
// literal holding `r`. We preserve the trailing ` TJ` token.
function replaceInTJArray(stream: Uint8Array, s: string, r: string): Uint8Array | null {
  let i = 0;
  while (i < stream.length) {
    if (stream[i] !== 0x5B) { i++; continue; } // '['
    const start = i;
    i++;
    let content = "";
    while (i < stream.length && stream[i] !== 0x5D) { // until ']'
      const c = stream[i];
      if (c === 0x28) { // (literal)
        let j = i + 1, depth = 1, text = "";
        while (j < stream.length && depth > 0) {
          const cc = stream[j];
          if (cc === 0x5C && j + 1 < stream.length) {
            const esc = stream[j + 1];
            if (esc === 0x6E) { text += "\n"; j += 2; }
            else if (esc === 0x72) { text += "\r"; j += 2; }
            else if (esc === 0x74) { text += "\t"; j += 2; }
            else if (esc >= 0x30 && esc <= 0x37) {
              // octal up to 3 digits
              let oct = esc - 0x30, k = j + 2;
              while (k < j + 4 && stream[k] >= 0x30 && stream[k] <= 0x37) {
                oct = oct * 8 + (stream[k] - 0x30); k++;
              }
              text += String.fromCharCode(oct & 0xFF);
              j = k;
            }
            else { text += String.fromCharCode(esc); j += 2; }
          } else if (cc === 0x28) { depth++; text += "("; j++; }
          else if (cc === 0x29) { depth--; if (depth > 0) text += ")"; j++; }
          else { text += String.fromCharCode(cc); j++; }
        }
        content += text;
        i = j;
      } else if (c === 0x3C) { // <hex>
        let j = i + 1, hex = "";
        while (j < stream.length && stream[j] !== 0x3E) {
          const cc = stream[j];
          if ((cc >= 0x30 && cc <= 0x39) || (cc >= 0x41 && cc <= 0x46) || (cc >= 0x61 && cc <= 0x66)) {
            hex += String.fromCharCode(cc);
          }
          j++;
        }
        if (hex.length % 2) hex += "0";
        // Decode both as 1-byte and 2-byte; we'll try 1-byte first and if it
        // produces non-printable we'll treat as 2-byte later. Here we just
        // collect 1-byte decoding.
        let text = "";
        for (let k = 0; k < hex.length; k += 2) {
          text += String.fromCharCode(parseInt(hex.substr(k, 2), 16));
        }
        content += text;
        i = j + 1;
      } else {
        // number or whitespace — skip
        i++;
      }
    }
    if (i >= stream.length) return null;
    // Now stream[i] === ']'
    const endBracket = i;
    // Look for next non-whitespace token after ']'
    let k = endBracket + 1;
    while (k < stream.length && (stream[k] === 0x20 || stream[k] === 0x0A || stream[k] === 0x0D || stream[k] === 0x09)) k++;
    // Must be "TJ"
    if (k + 1 >= stream.length || stream[k] !== 0x54 || stream[k + 1] !== 0x4A) {
      i = endBracket + 1; continue;
    }
    const afterTJ = k + 2;
    if (content === s) {
      // Replace the whole "[...] TJ" with "(r) Tj"
      const newLit = encodePdfLiteral(r);
      const tj = new Uint8Array([0x20, 0x54, 0x6A]); // " Tj"
      const replacement = new Uint8Array(newLit.length + tj.length);
      replacement.set(newLit, 0); replacement.set(tj, newLit.length);
      const origLen = afterTJ - start;
      const out = new Uint8Array(stream.length - origLen + replacement.length);
      out.set(stream.subarray(0, start), 0);
      out.set(replacement, start);
      out.set(stream.subarray(afterTJ), start + replacement.length);
      return out;
    }
    i = endBracket + 1;
  }
  return null;
}

function indexOfBytes(hay: Uint8Array, needle: Uint8Array, from = 0): number {
  const n = needle.length;
  if (n === 0) return from;
  outer: for (let i = from; i <= hay.length - n; i++) {
    for (let j = 0; j < n; j++) {
      if (hay[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/* ─── Editable text item ─────────────────────────────────────── */
function EditableTextItem({ item, scale, active, onActivate, onDeactivate, onPatch }: {
  item: PdfTextItem;
  scale: number;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onPatch: (p: Partial<PdfTextItem>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Deactivate on outside click
  useEffect(() => {
    if (!active) return;
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-textitem='" + item.id + "']")) return;
      if (el?.closest("[data-toolbar='" + item.id + "']")) return;
      setEditing(false);
      onDeactivate();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [active, item.id, onDeactivate]);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onActivate();
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }
  function commit(v: string) {
    setEditing(false);
    onPatch({ current: v });
  }

  // Visual style computed from current overrides (so the live preview
  // matches what export will produce).
  const fontWeight = item.bold ? 700 : 400;
  const dispSize = item.fontSize * item.sizeMul;
  const dispLeft = item.left + item.offsetX * scale;
  const dispTop = item.top + -item.offsetY * scale; // PDF y grows up, CSS down
  const ringClass = active
    ? "ring-2 ring-indigo-500 bg-indigo-50/40 rounded"
    : item.edited
      ? "ring-1 ring-indigo-400 bg-indigo-50/30 rounded"
      : "hover:ring-1 hover:ring-indigo-300 hover:bg-blue-50/30 hover:rounded";

  // If the item has format overrides, we must paint the new text over the
  // original image (and hide the original glyphs by using a bg-colored
  // span), otherwise we keep the span transparent so the underlying canvas
  // image shows the original unaltered.
  const showsOverride =
    item.bold || item.sizeMul !== 1 || item.colorOverride != null
    || item.offsetX !== 0 || item.offsetY !== 0;
  const dispColor = item.colorOverride
    ? `rgb(${Math.round(item.colorOverride.r * 255)}, ${Math.round(item.colorOverride.g * 255)}, ${Math.round(item.colorOverride.b * 255)})`
    : `rgb(${Math.round(item.textColor.r * 255)}, ${Math.round(item.textColor.g * 255)}, ${Math.round(item.textColor.b * 255)})`;
  const bgCss = `rgb(${Math.round(item.bgColor.r * 255)}, ${Math.round(item.bgColor.g * 255)}, ${Math.round(item.bgColor.b * 255)})`;

  return (
    <div
      data-textitem={item.id}
      onClick={startEdit}
      style={{
        position: "absolute",
        left: dispLeft,
        top: dispTop,
        width: Math.max(item.width, dispSize * item.current.length * 0.6) + 8,
        minWidth: 20,
        height: dispSize + 4,
        fontSize: dispSize,
        lineHeight: 1,
        cursor: "text",
        fontFamily: "Helvetica, Arial, sans-serif",
        fontWeight,
        zIndex: active ? 30 : 10,
        background: showsOverride ? bgCss : undefined,
      }}
      className={`group ${ringClass}`}
      title={editing ? undefined : "Cliquer pour modifier"}
    >
      {editing ? (
        <input
          ref={inputRef}
          defaultValue={item.current}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") { setEditing(false); }
          }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", border: "none", outline: "none",
            background: "rgba(238,242,255,0.9)",
            fontSize: dispSize, fontWeight,
            fontFamily: "Helvetica, Arial, sans-serif",
            lineHeight: 1, padding: 0, margin: 0, color: "#0f172a",
            boxShadow: "0 0 0 2px #6366f1",
            borderRadius: 2,
          }}
        />
      ) : (
        <span style={{
          display: "block", whiteSpace: "pre",
          color: showsOverride
            ? dispColor
            : (item.edited ? "#4338ca" : "transparent"),
          overflow: "visible",
        }}>
          {item.current}
        </span>
      )}
    </div>
  );
}

/* ─── Floating text toolbar (Sejda-like) ─────────────────────── */
function TextToolbar({ item, scale, onPatch, onClose }: {
  item: PdfTextItem;
  scale: number;
  onPatch: (p: Partial<PdfTextItem>) => void;
  onClose: () => void;
}) {
  const colors: { label: string; rgb: [number, number, number] }[] = [
    { label: "Noir", rgb: [0.1, 0.1, 0.12] },
    { label: "Bleu", rgb: [0.13, 0.28, 0.82] },
    { label: "Rouge", rgb: [0.75, 0.12, 0.14] },
    { label: "Vert", rgb: [0.10, 0.50, 0.30] },
    { label: "Orange", rgb: [0.90, 0.50, 0.10] },
    { label: "Blanc", rgb: [1, 1, 1] },
  ];
  const [openColor, setOpenColor] = useState(false);

  // Position: above the item, clamped so it stays inside the page area
  const top = Math.max(0, item.top - 48);
  const left = Math.max(0, item.left);

  return (
    <div
      data-toolbar={item.id}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: "absolute", left, top, zIndex: 100 }}
      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 px-1.5 py-1 shadow-lg shadow-slate-900/10 backdrop-blur"
    >
      <button
        onClick={() => onPatch({ bold: !item.bold })}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition ${item.bold ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
        title="Gras"
      ><Bold className="h-3.5 w-3.5" /></button>

      <div className="mx-0.5 h-5 w-px bg-slate-200" />

      <button
        onClick={() => onPatch({ sizeMul: Math.max(0.4, item.sizeMul - 0.1) })}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
        title="Réduire la taille"
      ><Minus className="h-3.5 w-3.5" /></button>
      <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-slate-600">
        {Math.round(item.fontSize * item.sizeMul / scale * 10) / 10}
      </span>
      <button
        onClick={() => onPatch({ sizeMul: Math.min(3, item.sizeMul + 0.1) })}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
        title="Agrandir"
      ><Plus className="h-3.5 w-3.5" /></button>

      <div className="mx-0.5 h-5 w-px bg-slate-200" />

      <div className="relative">
        <button
          onClick={() => setOpenColor(o => !o)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
          title="Couleur"
        ><Palette className="h-3.5 w-3.5" /></button>
        {openColor && (
          <div className="absolute top-full left-0 mt-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
            {colors.map(c => (
              <button key={c.label} title={c.label}
                onClick={() => { onPatch({ colorOverride: { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] } }); setOpenColor(false); }}
                className="h-5 w-5 rounded border border-slate-200 hover:scale-110 transition"
                style={{ background: `rgb(${c.rgb[0]*255},${c.rgb[1]*255},${c.rgb[2]*255})` }}
              />
            ))}
            <button title="Original"
              onClick={() => { onPatch({ colorOverride: null }); setOpenColor(false); }}
              className="h-5 w-5 rounded border border-slate-300 bg-gradient-to-br from-white to-slate-200"
            />
          </div>
        )}
      </div>

      <div className="mx-0.5 h-5 w-px bg-slate-200" />

      <div className="flex items-center gap-0.5" title="Déplacer">
        <Move className="h-3 w-3 text-slate-400" />
        <button onClick={() => onPatch({ offsetX: item.offsetX - 1 })}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 text-xs">←</button>
        <button onClick={() => onPatch({ offsetY: item.offsetY + 1 })}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 text-xs">↑</button>
        <button onClick={() => onPatch({ offsetY: item.offsetY - 1 })}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 text-xs">↓</button>
        <button onClick={() => onPatch({ offsetX: item.offsetX + 1 })}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 text-xs">→</button>
      </div>

      <div className="mx-0.5 h-5 w-px bg-slate-200" />

      <button
        onClick={() => onPatch({ bold: false, sizeMul: 1, colorOverride: null, offsetX: 0, offsetY: 0 })}
        className="h-7 px-2 rounded-md text-[11px] text-slate-600 hover:bg-slate-100"
        title="Réinitialiser la mise en forme"
      >Reset</button>

      <button
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
        title="Fermer"
      ><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ─── Annotation overlay (existing feature) ─────────────────── */
function AnnotationOverlay({ overlay, selected, onSelect, onUpdate, onDelete, pageRef }: {
  overlay: Overlay; selected: boolean;
  onSelect: () => void; onUpdate: (p: Partial<Overlay>) => void;
  onDelete: () => void; pageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [editing, setEditing] = useState(false);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  function onMouseDown(e: React.MouseEvent) {
    if (editing) return;
    e.stopPropagation();
    onSelect();
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - (rect.left + overlay.x * rect.width),
      y: e.clientY - (rect.top + overlay.y * rect.height),
    };
    dragging.current = true;
    function onMove(ev: MouseEvent) {
      if (!dragging.current || !pageRef.current) return;
      const r = pageRef.current.getBoundingClientRect();
      onUpdate({
        x: Math.max(0, Math.min(1, (ev.clientX - r.left - offset.current.x) / r.width)),
        y: Math.max(0, Math.min(1, (ev.clientY - r.top - offset.current.y) / r.height)),
      });
    }
    function onUp() { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      onMouseDown={onMouseDown} onClick={e => e.stopPropagation()} onDoubleClick={() => setEditing(true)}
      style={{
        position: "absolute", left: `${overlay.x * 100}%`, top: `${overlay.y * 100}%`,
        fontSize: overlay.fontSize,
        fontFamily: overlay.kind === "signature" ? "'Brush Script MT', cursive" : "Helvetica, Arial, sans-serif",
        fontWeight: overlay.kind === "check" ? 700 : 400,
        color: "#0f172a", zIndex: 20,
      }}
      className={`inline-block whitespace-pre cursor-move rounded ${selected ? "outline outline-2 outline-indigo-500 bg-indigo-50/20" : "hover:outline hover:outline-1 hover:outline-indigo-300"}`}
    >
      {editing ? (
        <input autoFocus value={overlay.value} style={{ fontSize: overlay.fontSize, background: "transparent", border: "none", outline: "none", width: `${Math.max(6, overlay.value.length + 2)}ch` }}
          onChange={e => onUpdate({ value: e.target.value })}
          onBlur={() => setEditing(false)} onKeyDown={e => e.key === "Enter" && setEditing(false)} />
      ) : <span>{overlay.value}</span>}
      {selected && !editing && (
        <button onClick={onDelete} className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow">×</button>
      )}
    </div>
  );
}
