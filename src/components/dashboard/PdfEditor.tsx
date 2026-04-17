"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Type, Signature, Calendar, Square,
  Download, Sparkles, Lock, ChevronLeft, ChevronRight, FileText, Edit3,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
  // Sampled background + text color (0-1) — so we can erase with the right
  // color and redraw the new text in the original ink color, whether the
  // document uses dark-on-light or light-on-colored text.
  bgColor: { r: number; g: number; b: number };
  textColor: { r: number; g: number; b: number };
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

        // Extract text layer
        const tc = await page.getTextContent();
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
            bgColor: bg,
            textColor: ink,
          });
        }
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
  function updateText(id: string, val: string) {
    setTextItems(all => all.map(t =>
      t.id === id ? { ...t, current: val, edited: val !== t.original } : t
    ));
  }

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

      // 1. Apply edited text items — erase ONLY the original glyph shapes (no
      // rectangle), then redraw. This preserves surrounding lines, boxes and
      // colored form fields instead of masking them with a block of color.
      for (const t of textItems.filter(t => t.edited)) {
        const p = pdfPages[t.page - 1];
        if (!p) continue;

        const bg = rgb(t.bgColor.r, t.bgColor.g, t.bgColor.b);

        // Redraw the original glyphs in the background color with a dense
        // grid of small offsets to cover AA halos. We keep the regular font
        // and the original size so the eraser stays within the original
        // letter shapes — it must not grow wider than the original text,
        // otherwise it would start covering surrounding lines/fields.
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

        // Auto-scale the new text down if it would overflow the original width
        let size = t.pdfFontSize;
        const origW = font.widthOfTextAtSize(t.original, size);
        const newW = font.widthOfTextAtSize(t.current, size);
        const budget = Math.max(t.pdfWidth, origW);
        if (budget > 0 && newW > budget) {
          size = Math.max(6, size * (budget / newW));
        }

        p.drawText(t.current, {
          x: t.pdfX,
          y: t.pdfY,
          size,
          font,
          color: rgb(t.textColor.r, t.textColor.g, t.textColor.b),
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
                <EditableTextItem key={t.id} item={t} onChange={val => updateText(t.id, val)} />
              ))}

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

/* ─── Editable text item ─────────────────────────────────────── */
function EditableTextItem({ item, onChange }: {
  item: PdfTextItem;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit(v: string) {
    setEditing(false);
    onChange(v);
  }

  return (
    <div
      onClick={startEdit}
      style={{
        position: "absolute",
        left: item.left,
        top: item.top,
        width: item.width + 8,
        minWidth: 20,
        height: item.fontSize + 4,
        fontSize: item.fontSize,
        lineHeight: 1,
        cursor: "text",
        fontFamily: "Helvetica, Arial, sans-serif",
        zIndex: 10,
      }}
      className={`group ${item.edited ? "ring-1 ring-indigo-400 ring-offset-0 bg-indigo-50/40 rounded" : "hover:ring-1 hover:ring-indigo-300 hover:bg-blue-50/30 hover:rounded"}`}
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
            fontSize: item.fontSize, fontFamily: "Helvetica, Arial, sans-serif",
            lineHeight: 1, padding: 0, margin: 0, color: "#0f172a",
            boxShadow: "0 0 0 2px #6366f1",
            borderRadius: 2,
          }}
        />
      ) : (
        <span style={{
          display: "block", whiteSpace: "pre",
          color: item.edited ? "#4338ca" : "transparent",
          overflow: "visible",
        }}>
          {item.current}
        </span>
      )}
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
