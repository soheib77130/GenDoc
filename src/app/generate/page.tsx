import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/templates";
import { ArrowRight } from "lucide-react";

export default async function GenerateIndex() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Générer un document
        </h1>
        <p className="mt-1.5 text-slate-600">
          Choisissez une catégorie pour démarrer.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/generate/${cat.id}`}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-7 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/5 backdrop-blur"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-2xl shadow-lg`}
              >
                {cat.emoji}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-slate-900 group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">{cat.name}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{cat.description}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {cat.templates.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
