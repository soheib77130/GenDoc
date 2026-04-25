import Link from "next/link";
import { FileText } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-400/30 via-sky-300/20 to-cyan-300/20 blur-3xl" />

      <header className="relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 sm:py-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/40">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              GenDoc
            </span>
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← <span className="hidden sm:inline">Retour à l'accueil</span>
            <span className="sm:hidden">Accueil</span>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-md flex-col items-center justify-center px-5 pt-4 pb-16 sm:px-6 sm:pt-6 sm:pb-20">
        {children}
      </main>
    </div>
  );
}
