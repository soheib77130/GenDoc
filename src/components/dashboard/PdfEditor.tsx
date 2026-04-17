"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Type,
  Signature,
  Calendar,
  Square,
  Trash2,
  Download,
  Sparkles,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Button } from "@/components/ui/button";

type Overlay = {
  id: string;
  page: number;
  x: number; // 0-1 relative
  y: number; // 0-1 relative
  kind: "text" | "date" | "signature" | "check";
  value: string;
  fontSize: number;
};

type PageImage = {
  page: number;
  dataUrl: string;
  width: number;
  height: number;
};

export function PdfEditor({
  usage,
}: {
  usage: {
    planName: string;
    usingQuota: boolean;
    remaining: number;
    credits: number;
    needsPayment: boolean;
    unitPriceCts: number;
  };
}) {
  const router = useRouter();
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [pages, setPages] = useState<PageImage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [tool, setTool] = useState<Overlay["kind"]>("text");
  const [fontSize, setFontSize] = useState(14);
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    setRendering(true);
    const buf = new Uint8Array(await file.arrayBuffer());
    setFileBytes(buf);
    setFileName(file.name);
    setOverlays([]);
    setCurrentPage(0);

    // Render pages to images via pdfjs-dist
    try {
      const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs" as any);
      // Use worker from CDN for simplicity
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data: buf.slice() }).promise;
      const images: PageImage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        images.push({
          page: i,
          dataUrl: canvas.toDataURL("image/png"),
          width: viewport.width,
          height: viewport.height,
        });
      }
      setPages(images);
    } catch (e) {
      setErr("Impossible de lire ce PDF. Assurez-vous qu'il n'est pas protégé.");
    } finally {
      setRendering(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") handleFile(f);
  }

  function addOverlayAt(e: React.MouseEvent<HTMLDivElement>) {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    let value = "";
    if (tool === "text") value = "Texte";
    else if (tool === "date") value = new Date().toLocaleDateString("fr-FR");
    else if (tool === "signature") value = "Signature";
    else if (tool === "check") value = "✓";

    const o: Overlay = {
      id: Math.random().toString(36).slice(2),
      page: currentPage + 1,
      x,
      y,
      kind: tool,
      value,
      fontSize:
        tool === "check" ? 22 : tool === "signature" ? 18 : fontSize,
    };
    setOverlays((all) => [...all, o]);
    setSelected(o.id);
  }

  function updateOverlay(id: string, patch: Partial<Overlay>) {
    setOverlays((all) => all.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function deleteOverlay(id: string) {
    setOverlays((all) => all.filter((o) => o.id !== id));
    if (selected === id) setSelected(null);
  }

  async function renderAndDownload(save: boolean) {
    if (!fileBytes) return;
    setErr(null);
    if (save && usage.needsPayment) {
      router.push("/pricing?need=edit");
      return;
    }
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(fileBytes.slice() as unknown as ArrayBuffer);
      const pdfPages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const scriptFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      for (const o of overlays) {
        const page = pdfPages[o.page - 1];
        if (!page) continue;
        const { width, height } = page.getSize();
        const x = o.x * width;
        // PDF origin is bottom-left
        const y = height - o.y * height - o.fontSize;
        const chosenFont =
          o.kind === "signature" ? scriptFont : o.kind === "check" ? boldFont : font;
        page.drawText(o.value, {
          x,
          y,
          size: o.fontSize,
          font: chosenFont,
          color: rgb(0.05, 0.08, 0.2),
        });
      }

      const bytes = await pdfDoc.save();

      if (save) {
        // send to server
        let base64 = "";
        if (typeof Buffer !== "undefined") {
          base64 = Buffer.from(bytes).toString("base64");
        } else {
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          base64 = btoa(binary);
        }
        const res = await fetch("/api/edit/save", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: fileName.replace(/\.pdf$/i, "") || "Document modifié",
            fileData: base64,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          if (j.needsPayment) {
            router.push("/pricing?need=edit");
            return;
          }
          throw new Error(j.error || "Erreur");
        }
        const j = await res.json();
        router.push(`/documents/${j.id}`);
        return;
      }

      // Direct download (preview)
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (fileName.replace(/\.pdf$/i, "") || "document") + "-modifie.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Erreur";
      setErr(m);
    } finally {
      setSaving(false);
    }
  }

  const billLabel = usage.usingQuota
    ? `Inclus dans votre plan ${usage.planName} (reste ${usage.remaining})`
    : usage.credits > 0
    ? `Utilisera 1 crédit (reste ${usage.credits})`
    : `Paiement de ${(usage.unitPriceCts / 100).toFixed(2)}€ requis`;

  if (!fileBytes) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 px-8 py-24 text-center backdrop-blur transition hover:border-indigo-400 hover:bg-indigo-50/30"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/30">
          <Upload className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
          Déposez votre PDF ici
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
          Glissez-déposez un PDF, ou cliquez ci-dessous. Vos documents restent privés.
        </p>
        <label className="mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800">
          <Upload className="h-4 w-4" />
          Sélectionner un PDF
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
        {rendering && (
          <div className="mt-5 text-sm text-indigo-600">Chargement du PDF…</div>
        )}
      </motion.div>
    );
  }

  const page = pages[currentPage];

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Toolbar */}
      <aside className="space-y-5">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div className="truncate text-sm font-medium text-slate-900">
              <FileText className="mr-1.5 inline h-4 w-4 text-slate-500" />
              {fileName || "Document"}
            </div>
            <button
              onClick={() => {
                setFileBytes(null);
                setPages([]);
                setOverlays([]);
              }}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Changer
            </button>
          </div>
          <div className="text-xs text-slate-500">
            {pages.length} page{pages.length > 1 ? "s" : ""} · {overlays.length} annotation(s)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Outils
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { k: "text", icon: Type, label: "Texte" },
              { k: "date", icon: Calendar, label: "Date" },
              { k: "signature", icon: Signature, label: "Signature" },
              { k: "check", icon: Square, label: "Coche" },
            ] as const).map((t) => (
              <button
                key={t.k}
                onClick={() => setTool(t.k)}
                className={`inline-flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition ${
                  tool === t.k
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-1 text-xs text-slate-500">Taille texte : {fontSize}px</div>
            <input
              type="range"
              min={10}
              max={40}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Cliquez sur la page pour placer l'élément sélectionné.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/40 p-4 text-xs text-indigo-800">
          <div className="flex items-center gap-1.5 font-semibold">
            {usage.usingQuota ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            Facturation
          </div>
          <div className="mt-1 text-slate-700">{billLabel}</div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => renderAndDownload(false)}
            loading={saving}
            className="w-full"
          >
            <Download className="h-4 w-4" />
            Télécharger (aperçu)
          </Button>
          <Button onClick={() => renderAndDownload(true)} loading={saving} className="w-full">
            <Download className="h-4 w-4" />
            {usage.needsPayment ? "Payer et enregistrer" : "Enregistrer"}
          </Button>
        </div>

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
      </aside>

      {/* Canvas */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
        {pages.length > 1 && (
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédente
            </button>
            <span className="text-sm text-slate-600">
              Page {currentPage + 1} / {pages.length}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
              disabled={currentPage >= pages.length - 1}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-40"
            >
              Suivante
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="relative mx-auto flex max-h-[78vh] justify-center overflow-auto scrollbar-thin">
          {page ? (
            <div
              ref={pageRef}
              onClick={addOverlayAt}
              className="relative cursor-crosshair shadow-2xl shadow-slate-900/10"
              style={{ width: page.width, maxWidth: "100%" }}
            >
              <img
                src={page.dataUrl}
                alt=""
                draggable={false}
                className="pointer-events-none block h-auto w-full select-none"
              />
              {overlays
                .filter((o) => o.page === currentPage + 1)
                .map((o) => (
                  <OverlayItem
                    key={o.id}
                    overlay={o}
                    selected={selected === o.id}
                    onSelect={() => setSelected(o.id)}
                    onUpdate={(patch) => updateOverlay(o.id, patch)}
                    onDelete={() => deleteOverlay(o.id)}
                    pageRef={pageRef}
                  />
                ))}
            </div>
          ) : (
            <div className="py-20 text-sm text-slate-500">Chargement...</div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverlayItem({
  overlay,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  pageRef,
}: {
  overlay: Overlay;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (p: Partial<Overlay>) => void;
  onDelete: () => void;
  pageRef: React.RefObject<HTMLDivElement | null>;
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
      const nx = (ev.clientX - r.left - offset.current.x) / r.width;
      const ny = (ev.clientY - r.top - offset.current.y) / r.height;
      onUpdate({
        x: Math.max(0, Math.min(1, nx)),
        y: Math.max(0, Math.min(1, ny)),
      });
    }
    function onUp() {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={() => setEditing(true)}
      style={{
        position: "absolute",
        left: `${overlay.x * 100}%`,
        top: `${overlay.y * 100}%`,
        fontSize: overlay.fontSize,
        fontFamily:
          overlay.kind === "signature" ? "'Brush Script MT', cursive" : "Helvetica, Arial, sans-serif",
        fontWeight: overlay.kind === "check" ? 700 : 400,
        color: "#0f172a",
      }}
      className={`group inline-block whitespace-pre cursor-move rounded ${
        selected ? "outline outline-2 outline-indigo-500 bg-indigo-50/20" : "hover:outline hover:outline-1 hover:outline-indigo-300"
      }`}
    >
      {editing ? (
        <input
          autoFocus
          value={overlay.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          className="border-none bg-transparent outline-none"
          style={{ fontSize: overlay.fontSize, width: `${Math.max(6, overlay.value.length + 2)}ch` }}
        />
      ) : (
        <span>{overlay.value}</span>
      )}
      {selected && !editing && (
        <button
          onClick={onDelete}
          className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow"
          title="Supprimer"
        >
          ×
        </button>
      )}
    </div>
  );
}
