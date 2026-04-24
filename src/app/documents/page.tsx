import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/templates";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const docs = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Mes documents
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          {docs.length} document{docs.length > 1 ? "s" : ""} au total.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-14 text-center backdrop-blur">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-600">
            Vous n'avez aucun document pour l'instant.
          </p>
          <Link
            href="/generate"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Générer un document
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {docs.map((d) => {
            const cat = CATEGORIES.find((c) => c.id === d.category);
            return (
              <Link
                key={d.id}
                href={`/documents/${d.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:shadow-lg backdrop-blur"
              >
                <div
                  className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl text-xl ${
                    cat
                      ? `bg-gradient-to-br ${cat.color} text-white shadow`
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {cat?.emoji || "📄"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium text-slate-900">
                      {d.title}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        d.kind === "generated"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-fuchsia-50 text-fuchsia-700"
                      }`}
                    >
                      {d.kind === "generated" ? "Généré" : "Modifié"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {cat?.name || "Divers"} · {formatDate(d.createdAt)}
                  </div>
                </div>
                <div className="flex-shrink-0 text-sm font-medium text-indigo-600 transition md:opacity-0 md:group-hover:opacity-100">
                  Ouvrir →
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
