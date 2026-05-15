import { readRange, appendRow, updateRange } from "./google";

export const BILLING_SHEET = "📋 마스터데이터";

const s = (v: unknown) => (v == null ? "" : String(v).trim());

export type BillingRow = {
  rowIndex: number;
  날짜: string;
  연도: string;
  월: string;
  고객사: string;
  서비스: string;
  서비스분류: string;
  공급가액: string;
  부가세포함: string;
  입금확인: string;
  사업부문: string;
};

export async function getBillingData(): Promise<BillingRow[]> {
  const rows = await readRange(`${BILLING_SHEET}!A2:K`);
  return rows
    .map((row, i) => ({
      rowIndex: i + 2,
      날짜: s(row[1]),
      연도: s(row[2]),
      월: s(row[3]),
      고객사: s(row[4]),
      서비스: s(row[5]),
      서비스분류: s(row[6]),
      공급가액: s(row[7]),
      부가세포함: s(row[8]),
      입금확인: s(row[9]),
      사업부문: s(row[10]),
    }))
    .filter((r) => r.날짜 || r.고객사);
}

export async function addBillingRow(data: {
  날짜: string;
  연도: string;
  월: string;
  고객사: string;
  서비스: string;
  서비스분류: string;
  공급가액: string;
  부가세포함: string;
  사업부문: string;
}) {
  await appendRow(`${BILLING_SHEET}!A:K`, [
    "",               // A: 번호 (공란)
    data.날짜,        // B
    data.연도,        // C
    data.월,          // D
    data.고객사,      // E
    data.서비스,      // F
    data.서비스분류,  // G
    data.공급가액,    // H
    data.부가세포함,  // I
    "",               // J: 입금확인 (초기 공란)
    data.사업부문,    // K
  ]);
}

export async function setBillingPayment(rowIndex: number, value: string) {
  await updateRange(`${BILLING_SHEET}!J${rowIndex}`, [[value]]);
}
