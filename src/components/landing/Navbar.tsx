"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/#features", label: "Fonctionnalités" },
  { href: "/#categories", label: "Modèles" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-3 left-1/2 z-50 w-[min(1100px,calc(100%-1.5rem))] -translate-x-1/2 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-2.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:top-4 sm:px-5 sm:py-3"
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
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-slate-600 transition hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
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
            className="hidden items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 sm:inline-flex"
          >
            Commencer
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden md:hidden"
          >
            <div className="mt-3 flex flex-col gap-1 border-t border-slate-200/70 pt-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-200/70 pt-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white"
                >
                  Commencer
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
