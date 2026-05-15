import { readRange, updateRange, deleteSheetRow } from "./google";

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
  날짜: string; 연도: string; 월: string;
  고객사: string; 서비스: string; 서비스분류: string;
  공급가액: string; 부가세포함: string; 사업부문: string;
}) {
  // B열(날짜)을 기준으로 마지막 행 번호를 계산 — A열(번호)은 항상 공란이라 사용 불가
  const existing = await readRange(`${BILLING_SHEET}!B:B`);
  const nextRow = existing.length + 1; // 1-based row number

  // 번호(A)는 공란, 날짜(B)부터 사업부문(K)까지 기록
  await updateRange(`${BILLING_SHEET}!B${nextRow}:K${nextRow}`, [[
    data.날짜, data.연도, data.월, data.고객사,
    data.서비스, data.서비스분류, data.공급가액, data.부가세포함, "", data.사업부문,
  ]]);
}

export async function updateBillingRow(
  rowIndex: number,
  data: {
    날짜: string; 연도: string; 월: string;
    고객사: string; 서비스: string; 서비스분류: string;
    공급가액: string; 부가세포함: string; 사업부문: string;
  }
) {
  await updateRange(`${BILLING_SHEET}!B${rowIndex}:I${rowIndex}`, [[
    data.날짜, data.연도, data.월, data.고객사,
    data.서비스, data.서비스분류, data.공급가액, data.부가세포함,
  ]]);
  await updateRange(`${BILLING_SHEET}!K${rowIndex}`, [[data.사업부문]]);
}

export async function deleteBillingRow(rowIndex: number) {
  await deleteSheetRow(BILLING_SHEET, rowIndex);
}

export async function setBillingPayment(rowIndex: number, value: string) {
  await updateRange(`${BILLING_SHEET}!J${rowIndex}`, [[value]]);
}
