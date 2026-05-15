import { unstable_cache } from "next/cache";
import { hasGoogleEnv, readRange, updateRange, appendRow, deleteSheetRow } from "@/lib/google";

/**
 * 고객사 마스터 데이터.
 *
 * 시트 구조 (총 18컬럼):
 *  A 그룹명
 *  B 영업활동명          ← 1순위 식별자
 *  C 그룹 ID            ← 2순위 식별자
 *  D 영업 단계
 *  E 최근 활동일
 *  F 그룹유형
 *  G 정산주기
 *  H 정산일
 *  I 요금
 *  J 청구방법
 *  K 계약 비고
 *  L 정산 담당자 / 수신처
 *  M 정산방법
 *  N 계약항목(이용서비스)
 *  O 세금계산서 고객사명
 *  P 계약 만료일
 *  Q 라이선스 수
 *  R MAU
 */

// 시트의 정확한 탭 이름. 다르면 이 상수만 수정하면 됨.
// 디버깅: scripts/list-sheets.mjs 로 확인.
export const CUSTOMERS_SHEET_NAME = "👥 고객사 마스터";
const DATA_START_ROW = 2;

export type Customer = {
  rowIndex: number;
  그룹명: string;
  영업활동명: string;
  그룹ID: string;
  영업단계: string;
  최근활동일: string;
  그룹유형: string;
  정산주기: string;
  정산일: string;
  요금: string;
  청구방법: string;
  계약비고: string;
  정산담당자: string;
  정산방법: string;
  계약항목: string;
  세금계산서고객사명: string;
  계약만료일: string;
  라이선스수: string;
  MAU: string;
  계약시작일: string; // 열 S (index 18)
};

const s = (v: unknown): string => (v == null ? "" : String(v));

function rowToCustomer(row: string[], rowIndex: number): Customer {
  return {
    rowIndex,
    그룹명: s(row[0]),
    영업활동명: s(row[1]),
    그룹ID: s(row[2]),
    영업단계: s(row[3]),
    최근활동일: s(row[4]),
    그룹유형: s(row[5]),
    정산주기: s(row[6]),
    정산일: s(row[7]),
    요금: s(row[8]),
    청구방법: s(row[9]),
    계약비고: s(row[10]),
    정산담당자: s(row[11]),
    정산방법: s(row[12]),
    계약항목: s(row[13]),
    세금계산서고객사명: s(row[14]),
    계약만료일: s(row[15]),
    라이선스수: s(row[16]),
    MAU: s(row[17]),
    계약시작일: s(row[18]),
  };
}

function customerToRow(c: Omit<Customer, "rowIndex">): string[] {
  return [
    c.그룹명,
    c.영업활동명,
    c.그룹ID,
    c.영업단계,
    c.최근활동일,
    c.그룹유형,
    c.정산주기,
    c.정산일,
    c.요금,
    c.청구방법,
    c.계약비고,
    c.정산담당자,
    c.정산방법,
    c.계약항목,
    c.세금계산서고객사명,
    c.계약만료일,
    c.라이선스수,
    c.MAU,
    c.계약시작일,
  ];
}

function isRealCustomer(c: Customer): boolean {
  if (!c.그룹명 && !c.영업활동명) return false;
  if (c.그룹명 === "자동" || c.영업활동명 === "자동") return false;
  return true;
}

export const getCustomers = unstable_cache(
  async (): Promise<Customer[]> => {
    if (!hasGoogleEnv()) return [];
    try {
      const rows = await readRange(`${CUSTOMERS_SHEET_NAME}!A${DATA_START_ROW}:S`);
      return rows
        .map((row, idx) => rowToCustomer(row, DATA_START_ROW + idx))
        .filter(isRealCustomer);
    } catch (err) {
      console.error("[customers.getCustomers] failed", err);
      return [];
    }
  },
  ["customers-data"],
  { tags: ["customers"] }
);

/**
 * 식별 우선순위: 영업활동명 → 그룹ID → 그룹명
 */
export async function findCustomerByKey(key: string): Promise<Customer | null> {
  const list = await getCustomers();
  return (
    list.find((c) => c.영업활동명 === key) ||
    list.find((c) => c.그룹ID === key) ||
    list.find((c) => c.그룹명 === key) ||
    null
  );
}

export async function searchCustomers(query: string, limit = 50): Promise<Customer[]> {
  const list = await getCustomers();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return list
    .filter(
      (c) =>
        c.영업활동명.toLowerCase().includes(q) ||
        c.그룹ID.toLowerCase().includes(q) ||
        c.그룹명.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

const EMPTY_CUSTOMER: Omit<Customer, "rowIndex"> = {
  그룹명: "",
  영업활동명: "",
  그룹ID: "",
  영업단계: "",
  최근활동일: "",
  그룹유형: "",
  정산주기: "",
  정산일: "",
  요금: "",
  청구방법: "",
  계약비고: "",
  정산담당자: "",
  정산방법: "",
  계약항목: "",
  세금계산서고객사명: "",
  계약만료일: "",
  라이선스수: "",
  MAU: "",
  계약시작일: "",
};

export async function addCustomer(
  partial: Partial<Omit<Customer, "rowIndex">> & {
    그룹명: string;
    영업활동명: string;
  }
): Promise<void> {
  const merged: Omit<Customer, "rowIndex"> = { ...EMPTY_CUSTOMER, ...partial };
  await appendRow(`${CUSTOMERS_SHEET_NAME}!A:S`, customerToRow(merged));
}

export async function deleteCustomer(
  key: string
): Promise<{ ok: boolean; reason?: string }> {
  const target = await findCustomerByKey(key);
  if (!target) return { ok: false, reason: "고객을 찾을 수 없습니다" };
  await deleteSheetRow(CUSTOMERS_SHEET_NAME, target.rowIndex);
  return { ok: true };
}

export async function updateCustomerFields(
  key: string,
  patch: Partial<Omit<Customer, "rowIndex">>
): Promise<{ ok: boolean; rowIndex?: number; reason?: string }> {
  const target = await findCustomerByKey(key);
  if (!target) return { ok: false, reason: "고객을 찾을 수 없습니다" };

  const { rowIndex, ...current } = target;
  const merged: Omit<Customer, "rowIndex"> = { ...current, ...patch };

  await updateRange(
    `${CUSTOMERS_SHEET_NAME}!A${rowIndex}:S${rowIndex}`,
    [customerToRow(merged)]
  );
  return { ok: true, rowIndex };
}
