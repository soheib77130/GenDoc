"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref") || "";
    setReferralCode(ref.trim().toUpperCase());
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        referralCode: referralCode || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Créez votre compte ✨
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          5 crédits offerts — commencez à générer vos documents en 20 secondes.
        </p>
      </div>

      {referralCode && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
          <Gift className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <div>
            Parrainage <span className="font-mono font-semibold">{referralCode}</span>{" "}
            appliqué — vous recevrez <strong>15 crédits</strong> à l'inscription
            (5 offerts + 10 bonus parrainage).
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Nom (optionnel)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              minLength={6}
              required
            />
          </div>
          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Créer mon compte
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
