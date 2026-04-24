"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-4 left-1/2 z-50 w-[min(1100px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-slate-200/60 bg-white/70 px-5 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/" className="flex items-center gap-2 justify-self-start">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/40">
            <FileText className="h-4 w-4 text-white" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            GenDoc
          </span>
        </Link>

        <div className="hidden items-center gap-7 justify-self-center md:flex">
          <Link href="/#features" className="text-sm text-slate-600 transition hover:text-slate-900">
            Fonctionnalités
          </Link>
          <Link href="/#categories" className="text-sm text-slate-600 transition hover:text-slate-900">
            Modèles
          </Link>
          <Link href="/pricing" className="text-sm text-slate-600 transition hover:text-slate-900">
            Tarifs
          </Link>
          <Link href="/#faq" className="text-sm text-slate-600 transition hover:text-slate-900">
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Commencer
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
