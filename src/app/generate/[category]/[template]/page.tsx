import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { GenerateForm } from "@/components/dashboard/GenerateForm";
import { getCurrentUser } from "@/lib/auth";
import { getCategory, getTemplate } from "@/lib/templates";
import { getQuotaStatus, UNIT_PRICE_CTS } from "@/lib/quota";

export default async function TemplatePage({
  params,
}: {
  params: { category: string; template: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cat = getCategory(params.category);
  const tpl = getTemplate(params.category, params.template);
  if (!cat || !tpl) notFound();

  const status = await getQuotaStatus(user.id, "generate");

  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      <GenerateForm
        categoryId={cat.id}
        categoryName={cat.name}
        templateId={tpl.id}
        templateName={tpl.name}
        templateDescription={tpl.description}
        fields={tpl.fields}
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
