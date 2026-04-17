import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { CATEGORIES } from "@/lib/templates";
import { formatDate } from "@/lib/utils";
import {
  FileSignature,
  Pencil,
  ArrowRight,
  TrendingUp,
  Coins,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = getPlan(user.plan);
  const recent = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const genPct = plan.quotaGen > 0 ? (user.quotaGenUsed / plan.quotaGen) * 100 : 0;
  const editPct = plan.quotaEdit > 0 ? (user.quotaEditUsed / plan.quotaEdit) * 100 : 0;

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Bonjour {user.name || user.email.split("@")[0]} 👋
        </h1>
        <p className="mt-1.5 text-slate-600">
          Voici un aperçu de votre activité et de vos crédits.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/generate"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 p-6 text-white shadow-xl shadow-indigo-500/20 transition hover:-translate-y-1"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <FileSignature className="h-7 w-7" />
          <h2 className="mt-4 text-xl font-semibold">Générer un document</h2>
          <p className="mt-1 text-sm text-white/80">
            Choisissez un modèle et remplissez un formulaire guidé.
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
            Commencer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/edit"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-200/20 blur-2xl transition-opacity group-hover:opacity-100" />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-md">
            <Pencil className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Modifier un PDF</h2>
          <p className="mt-1 text-sm text-slate-600">
            Uploadez un PDF et modifiez son contenu directement.
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
            Ouvrir l'éditeur <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Quotas */}
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Générations
            </div>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-slate-900">
              {user.quotaGenUsed}
            </span>
            <span className="text-sm text-slate-500">
              / {plan.quotaGen > 0 ? plan.quotaGen : "—"} ce mois
            </span>
          </div>
          {plan.quotaGen > 0 && (
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                style={{ width: `${Math.min(100, genPct)}%` }}
              />
            </div>
          )}
          {plan.quotaGen === 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Plan sans forfait — 0,99€ par document.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Modifications
            </div>
            <Pencil className="h-4 w-4 text-fuchsia-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-slate-900">
              {user.quotaEditUsed}
            </span>
            <span className="text-sm text-slate-500">
              / {plan.quotaEdit > 0 ? plan.quotaEdit : "—"} ce mois
            </span>
          </div>
          {plan.quotaEdit > 0 && (
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all"
                style={{ width: `${Math.min(100, editPct)}%` }}
              />
            </div>
          )}
          {plan.quotaEdit === 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Plan sans forfait — 0,99€ par document.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Crédits
            </div>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-slate-900">{user.credits}</span>
            <span className="text-sm text-slate-500">disponibles</span>
          </div>
          <Link
            href="/pricing#credits"
            className="mt-3 inline-flex text-xs font-medium text-indigo-600 hover:underline"
          >
            Acheter des crédits →
          </Link>
        </div>
      </div>

      {/* Recent documents */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Documents récents</h2>
          <Link
            href="/documents"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Tout voir →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center backdrop-blur">
            <p className="text-sm text-slate-600">
              Aucun document pour l'instant. Commencez par en générer un !
            </p>
            <Link
              href="/generate"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Générer un document
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Titre</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Catégorie</th>
                  <th className="px-5 py-3 font-medium">Créé le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((d) => (
                  <tr key={d.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-900">{d.title}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.kind === "generated"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-fuchsia-50 text-fuchsia-700"
                        }`}
                      >
                        {d.kind === "generated" ? "Généré" : "Modifié"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {CATEGORIES.find((c) => c.id === d.category)?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/api/documents/${d.id}/download`}
                        className="text-indigo-600 hover:underline"
                      >
                        Télécharger
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
