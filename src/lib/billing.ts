import { getSheetsClient, getSheetId } from "./google";

// [📋 마스터데이터] — 대괄호가 포함된 시트명은 Google Sheets API range 파싱이 불가능하므로
// values API 대신 spreadsheets.get (includeGridData) + batchUpdate 방식을 사용
const SHEET_TITLE = "[📋 마스터데이터]";

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

async function getNumericId(): Promise<number> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSheetId() });
  const found = meta.data.sheets?.find((sh) => sh.properties?.title === SHEET_TITLE);
  const sid = found?.properties?.sheetId;
  if (sid == null) throw new Error(`Sheet "${SHEET_TITLE}" not found`);
  return sid;
}

async function readAllRows(): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: getSheetId(),
    includeGridData: true,
  });
  const sheet = res.data.sheets?.find((sh) => sh.properties?.title === SHEET_TITLE);
  if (!sheet?.data?.[0]?.rowData) return [];
  return sheet.data[0].rowData.map((row) =>
    (row.values ?? []).map((cell) => s(cell.formattedValue))
  );
}

export async function getBillingData(): Promise<BillingRow[]> {
  const rows = await readAllRows();
  return rows
    .slice(1) // 1행은 헤더
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
  const sheets = getSheetsClient();
  const sheetId = await getNumericId();

  const values = [
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
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          appendCells: {
            sheetId,
            rows: [
              {
                values: values.map((v) => ({
                  userEnteredValue: { stringValue: String(v) },
                })),
              },
            ],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });
}

export async function setBillingPayment(rowIndex: number, value: string) {
  const sheets = getSheetsClient();
  const sheetId = await getNumericId();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          updateCells: {
            rows: [
              {
                values: [{ userEnteredValue: { stringValue: value } }],
              },
            ],
            fields: "userEnteredValue",
            start: {
              sheetId,
              rowIndex: rowIndex - 1, // 0-based
              columnIndex: 9,         // J열 (0-based)
            },
          },
        },
      ],
    },
  });
}
