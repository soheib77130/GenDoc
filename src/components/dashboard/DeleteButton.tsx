"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ docId }: { docId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Supprimer définitivement ce document ?")) return;
    setLoading(true);
    await fetch(`/api/documents/${docId}/delete`, { method: "POST" });
    setLoading(false);
    router.push("/documents");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      Supprimer
    </button>
  );
}
