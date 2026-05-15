import Link from "next/link";
import { findCustomerByKey } from "@/lib/customers";
import { getHistoryFor } from "@/lib/history";
import { getBillingData } from "@/lib/billing";
import CustomerHeader from "@/components/customer/CustomerHeader";
import ContractCard from "@/components/customer/ContractCard";
import SettlementCard from "@/components/customer/SettlementCard";
import HistoryTimeline from "@/components/customer/HistoryTimeline";
import BillingHistoryCard from "@/components/customer/BillingHistoryCard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ key: string }>;
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);

  const customer = await findCustomerByKey(key);

  if (!customer) {
    return (
      <div className="px-6 py-10">
        <div className="text-sm opacity-60 mb-2">
          <Link href="/customers">← 검색으로 돌아가기</Link>
        </div>
        <h1 className="text-lg font-semibold mb-2">고객을 찾을 수 없습니다</h1>
        <p className="text-sm opacity-70">
          검색 키: <span className="font-mono">{key}</span>
        </p>
      </div>
    );
  }

  const [history, allBillingRows] = await Promise.all([
    getHistoryFor(customer.영업활동명, { 그룹ID: customer.그룹ID || undefined }),
    getBillingData(),
  ]);

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      <CustomerHeader customer={customer} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-5">
        {/* 왼쪽 — 계약/정산/세금계산서 */}
        <div className="space-y-5">
          <ContractCard customer={customer} />
          <SettlementCard customer={customer} />
          {/* allRows 전체를 넘기고, 클라이언트에서 영업활동명으로 필터링 */}
          <BillingHistoryCard allRows={allBillingRows} 영업활동명={customer.영업활동명} />
        </div>

        {/* 오른쪽 — 히스토리 */}
        <div>
          <HistoryTimeline
            entries={history}
            영업활동명={customer.영업활동명}
            그룹ID={customer.그룹ID}
            영업단계={customer.영업단계}
          />
        </div>
      </div>
    </div>
  );
}
