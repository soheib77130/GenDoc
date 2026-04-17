import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getQuotaStatus, UNIT_PRICE_CTS } from "@/lib/quota";
import { PdfEditor } from "@/components/dashboard/PdfEditor";

export default async function EditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const status = await getQuotaStatus(user.id, "edit");

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Éditeur PDF
        </h1>
        <p className="mt-1.5 text-slate-600">
          Uploadez un PDF et ajoutez du texte, une signature, des annotations directement dessus.
        </p>
      </div>
      <PdfEditor
        usage={{
          planName: status.planName,
          usingQuota: status.usingQuota,
          remaining: status.remaining,
          credits: status.credits,
          needsPayment: status.needsPayment,
          unitPriceCts: UNIT_PRICE_CTS,
        }}
      />
    </AppShell>
  );
}
