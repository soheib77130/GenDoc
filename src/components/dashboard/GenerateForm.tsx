"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Eye, Sparkles, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

type FieldDef = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
};

type PreviewData = {
  title: string;
  body: string[];
  footer?: string;
};

export function GenerateForm({
  categoryId,
  categoryName,
  templateId,
  templateName,
  templateDescription,
  fields,
  usage,
}: {
  categoryId: string;
  categoryName: string;
  templateId: string;
  templateName: string;
  templateDescription: string;
  fields: FieldDef[];
  usage: {
    planName: string;
    usingQuota: boolean;
    remaining: number;
    credits: number;
    cost: number;
    needsPayment: boolean;
    unitPriceCts: number;
  };
}) {
  const router = useRouter();
  const initial = useMemo(() => {
    const d: Record<string, string> = {};
    for (const f of fields) d[f.id] = f.defaultValue ?? "";
    return d;
  }, [fields]);
  const [data, setData] = useState<Record<string, string>>(initial);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState<"preview" | "save" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function update(id: string, v: string) {
    setData((d) => ({ ...d, [id]: v }));
  }

  async function generatePreview() {
    setErr(null);
    setLoading("preview");
    const res = await fetch("/api/generate/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId, templateId, data }),
    });
    setLoading(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Erreur");
      return;
    }
    const j = await res.json();
    setPreview(j.rendered);
  }

  async function saveDocument() {
    setErr(null);
    setLoading("save");
    const res = await fetch("/api/generate/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId, templateId, data }),
    });
    setLoading(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j.needsPayment) {
        router.push("/pricing?need=generate");
        return;
      }
      setErr(j.error || "Erreur");
      return;
    }
    const j = await res.json();
    router.push(`/documents/${j.id}`);
  }

  const billLabel = usage.usingQuota
    ? `Inclus dans votre plan ${usage.planName} (reste ${usage.remaining})`
    : usage.credits >= usage.cost
    ? `Utilisera ${usage.cost} crédit${usage.cost > 1 ? "s" : ""} (reste ${usage.credits})`
    : `Crédits insuffisants — il vous manque ${usage.cost - usage.credits} crédit${usage.cost - usage.credits > 1 ? "s" : ""}`;

  return (
    <div>
      <Link
        href={`/generate/${categoryId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour — {categoryName}
      </Link>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {templateName}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">{templateDescription}</p>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6"
        >
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Informations
          </h2>
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.id}>
                <Label htmlFor={f.id}>
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.id}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={data[f.id]}
                    onChange={(e) => update(f.id, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select
                    id={f.id}
                    required={f.required}
                    value={data[f.id]}
                    onChange={(e) => update(f.id, e.target.value)}
                  >
                    <option value="">—</option>
                    {(f.options || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={f.id}
                    type={f.type}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={data[f.id]}
                    onChange={(e) => update(f.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {err && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={generatePreview}
              loading={loading === "preview"}
              className="w-full"
            >
              <Eye className="h-4 w-4" />
              Aperçu gratuit
            </Button>

            <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-3 text-xs text-indigo-800">
              <div className="flex items-center gap-1.5 font-semibold">
                {usage.usingQuota ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                Facturation
              </div>
              <div className="mt-1 text-slate-700">{billLabel}</div>
            </div>

            <Button
              onClick={saveDocument}
              loading={loading === "save"}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4" />
              {usage.needsPayment ? "Payer et générer" : "Générer le PDF"}
            </Button>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-fit lg:sticky lg:top-6"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Aperçu en direct
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                A4
              </div>
            </div>
            <div className="max-h-[500px] overflow-auto p-5 doc-preview scrollbar-thin sm:max-h-[720px] sm:p-10">
              {preview ? (
                <>
                  <h1>{preview.title}</h1>
                  {preview.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {preview.footer && <div className="footer">{preview.footer}</div>}
                </>
              ) : (
                <div className="flex h-80 items-center justify-center text-center text-sm text-slate-400">
                  <div>
                    <Eye className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                    Cliquez sur « Aperçu gratuit »<br />
                    pour visualiser votre document.
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
