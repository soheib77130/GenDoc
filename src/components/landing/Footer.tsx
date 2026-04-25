import Link from "next/link";
import { FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200/70 bg-gradient-to-b from-transparent to-slate-50/70 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-md">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-slate-900">
                GenDoc
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-slate-600">
              La plateforme simple pour générer et modifier vos documents
              professionnels. Rapide, moderne, sécurisé.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Produit
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><Link className="hover:text-slate-900" href="/#features">Fonctionnalités</Link></li>
              <li><Link className="hover:text-slate-900" href="/#categories">Modèles</Link></li>
              <li><Link className="hover:text-slate-900" href="/pricing">Tarifs</Link></li>
              <li><Link className="hover:text-slate-900" href="/edit">Éditeur PDF</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Compte
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><Link className="hover:text-slate-900" href="/login">Connexion</Link></li>
              <li><Link className="hover:text-slate-900" href="/register">Inscription</Link></li>
              <li><Link className="hover:text-slate-900" href="/dashboard">Tableau de bord</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 md:flex-row">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} GenDoc. Tous droits réservés.</p>
          <p className="text-xs text-slate-400">Fait avec passion en France.</p>
        </div>
      </div>
    </footer>
  );
}
