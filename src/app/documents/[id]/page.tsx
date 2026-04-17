import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTemplate, CATEGORIES } from "@/lib/templates";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { DeleteButton } from "@/components/dashboard/DeleteButton";

export default async function DocumentDetail({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc || doc.userId !== user.id) notFound();

  const cat = CATEGORIES.find((c) => c.id === doc.category);
  const tpl =
    doc.category && doc.templateId ? getTemplate(doc.category, doc.templateId) : null;
  const parsed = doc.data ? (JSON.parse(doc.data) as Record<string, string>) : {};
  const rendered = tpl ? tpl.render(parsed) : null;

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <Link
        href="/documents"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Mes documents
      </Link>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            {cat?.name || "Document"} · {formatDate(doc.createdAt)}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {doc.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <DeleteButton docId={doc.id} />
          <a
            href={`/api/documents/${doc.id}/download`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 px-5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl"
          >
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </a>
        </div>
      </div>

      {rendered && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xl shadow-slate-900/5">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Aperçu du document
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">A4</div>
          </div>
          <div className="max-h-[720px] overflow-auto p-10 doc-preview scrollbar-thin">
            <h1>{rendered.title}</h1>
            {rendered.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {rendered.footer && <div className="footer">{rendered.footer}</div>}
          </div>
        </div>
      )}
    </AppShell>
  );
}
