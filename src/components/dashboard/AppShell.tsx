"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  FileSignature,
  Pencil,
  CreditCard,
  Files,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/generate", label: "Générer", icon: FileSignature },
  { href: "/edit", label: "Modifier PDF", icon: Pencil },
  { href: "/documents", label: "Mes documents", icon: Files },
  { href: "/pricing", label: "Abonnement", icon: CreditCard },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string | null; email: string; plan: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="pointer-events-none fixed inset-0 grid-bg radial-fade opacity-50" />

      {/* Top mobile bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">GenDoc</span>
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-slate-200 bg-white p-2">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  pathname === n.href
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </nav>
        )}
      </header>

      <div className="relative mx-auto flex max-w-7xl">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200/70 bg-white/60 p-5 backdrop-blur md:flex">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/40">
              <FileText className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">
                GenDoc
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Documents smart
              </div>
            </div>
          </Link>

          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-indigo-500/10 to-cyan-500/5 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-400" />
                  )}
                  <n.icon
                    className={cn(
                      "h-4 w-4 transition",
                      active ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700"
                    )}
                  />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-semibold text-white">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="truncate text-[11px] uppercase tracking-wider text-indigo-600">
                  Plan {user.plan}
                </div>
              </div>
              <button
                onClick={logout}
                title="Déconnexion"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
