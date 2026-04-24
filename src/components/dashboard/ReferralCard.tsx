"use client";
import { useEffect, useState } from "react";
import { Copy, Check, Users, Gift, Share2 } from "lucide-react";

type Props = {
  code: string;
  invitedCount: number;
  creditsEarned: number;
};

export function ReferralCard({ code, invitedCount, creditsEarned }: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/register?ref=${code}` : `.../register?ref=${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "GenDoc — 10 crédits offerts",
          text: "Inscris-toi sur GenDoc avec mon lien et reçois 15 crédits gratuits.",
          url: link,
        });
      } catch {}
    } else {
      copy();
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <Gift className="h-4 w-4" />
          Programme de parrainage
        </div>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          Invitez un ami, recevez <span className="text-emerald-600">10 crédits</span>
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Votre filleul reçoit aussi 10 crédits en plus des 5 crédits de bienvenue.
        </p>

        <div className="mt-4 flex items-stretch gap-2">
          <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm">
            <div className="truncate font-mono text-slate-700">{link}</div>
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" /> Copié
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copier
              </>
            )}
          </button>
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Share2 className="h-4 w-4" /> Partager
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-slate-700">
            <Users className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{invitedCount}</span> filleul{invitedCount > 1 ? "s" : ""}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-slate-700">
            <Gift className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{creditsEarned}</span> crédit{creditsEarned > 1 ? "s" : ""} gagné{creditsEarned > 1 ? "s" : ""}
          </div>
          <div className="text-xs text-slate-500">
            Code : <span className="font-mono font-semibold text-slate-700">{code}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
