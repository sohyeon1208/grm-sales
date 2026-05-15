import { unstable_cache } from "next/cache";
import { hasGoogleEnv, readRange } from "@/lib/google";

/**
 * 매출 마스터 데이터 (📋 마스터데이터 탭)
 *
 * 실제 시트 컬럼 구조 (A~K)
 * A:번호 B:날짜 C:연도 D:월 E:고객사 F:서비스 G:서비스분류 H:공급가액 I:부가세포함 J:입금확인 K:사업부문
 */
export type SalesRow = {
  연도: number;
  월: number;
  거래처: string;
  서비스: string;
  서비스분류: string;
  매출액: number;
  사업부문: string;
};

export const SALES_SHEET_NAME = "📋 마스터데이터";
const START_ROW = 2;

function toNumber(value: string | undefined | null): number {
  if (!value) return 0;
  return Number(value.replace(/,/g, "")) || 0;
}

export const getSalesData = unstable_cache(
  async (): Promise<SalesRow[]> => {
    if (!hasGoogleEnv()) return [];

    try {
      const rows = await readRange(`${SALES_SHEET_NAME}!A${START_ROW}:K`);
      if (rows.length === 0) return [];

      return rows
        .filter((row) => row[2])
        .map((row) => ({
          연도: toNumber(row[2]),
          월: toNumber(row[3]),
          거래처: row[4] ?? "",
          서비스: row[5] ?? "",
          서비스분류: row[6] ?? "",
          매출액: toNumber(row[7]),
          사업부문: row[10] ?? "",
        }));
    } catch (err) {
      console.error("[sheets.getSalesData] failed", err);
      return [];
    }
  },
  ["sales-data"],
  { tags: ["billing"] }
);
