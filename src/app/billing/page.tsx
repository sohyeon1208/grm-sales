import { Suspense } from "react";
import { getBillingData } from "@/lib/billing";
import BillingView from "@/components/billing/BillingView";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const rows = await getBillingData();
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>로딩 중...</div>}>
      <BillingView rows={rows} />
    </Suspense>
  );
}
