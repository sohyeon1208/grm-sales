import Link from "next/link";
import { findCustomerByKey } from "@/lib/customers";
import { getHistoryFor } from "@/lib/history";
import CustomerHeader from "@/components/customer/CustomerHeader";
import ContractCard from "@/components/customer/ContractCard";
import SettlementCard from "@/components/customer/SettlementCard";
import HistoryTimeline from "@/components/customer/HistoryTimeline";

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
        <p className="mt-4 text-xs opacity-60">
          영업활동명 → 그룹ID → 그룹명 순서로 매칭하지만 일치하는 행이 없습니다.
          시트의 탭 이름이 코드 상수(<code>고객사 마스터</code>)와 다르거나, 입력 키에 오타가 있을 수 있습니다.
        </p>
      </div>
    );
  }

  const history = await getHistoryFor(customer.영업활동명, {
    그룹ID: customer.그룹ID || undefined,
  });

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      <CustomerHeader customer={customer} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-5">
        {/* 왼쪽 — 계약/정산 */}
        <div className="space-y-5">
          <ContractCard customer={customer} />
          <SettlementCard customer={customer} />
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
