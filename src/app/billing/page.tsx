import { Suspense } from "react";
import { getBillingData } from "@/lib/billing";
import { getCustomers } from "@/lib/customers";
import BillingView from "@/components/billing/BillingView";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const [rows, allCustomers] = await Promise.all([
    getBillingData(),
    getCustomers(),
  ]);

  // 고객사 마스터의 영업활동명 목록 (신규 청구 추가 자동완성 소스)
  const masterNames = allCustomers
    .map((c) => c.영업활동명)
    .filter(Boolean)
    .sort();

  return (
    <Suspense fallback={<div style={{ padding: 40 }}>로딩 중...</div>}>
      <BillingView rows={rows} masterCustomers={masterNames} />
    </Suspense>
  );
}
