import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/templates";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cat = getCategory(params.category);
  if (!cat) notFound();

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <Link
        href="/generate"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Toutes les catégories
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-2xl shadow-lg`}
        >
          {cat.emoji}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {cat.name}
          </h1>
          <p className="mt-1 text-slate-600">{cat.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cat.templates.map((t) => (
          <Link
            key={t.id}
            href={`/generate/${cat.id}/${t.id}`}
            className="group rounded-2xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{t.name}</h3>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
            </div>
            <p className="mt-1.5 text-sm text-slate-600">{t.description}</p>
            <div className="mt-3 text-xs text-slate-500">
              {t.fields.length} champ{t.fields.length > 1 ? "s" : ""} à remplir
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
