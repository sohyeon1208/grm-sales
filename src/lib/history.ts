import { unstable_cache } from "next/cache";
import { hasGoogleEnv, readRange, appendRow, updateRange, deleteSheetRow } from "@/lib/google";

export const HISTORY_ARCHIVE_SHEET = "히스토리 전체";
export const HISTORY_INPUT_SHEET = "히스토리 입력";

export type HistoryEntry = {
  rowIndex: number;
  source: "archive" | "input";
  날짜: string;
  유형: string;
  영업활동명: string;
  그룹ID: string;
  영업단계: string;
  내용: string;
};

const s = (v: unknown): string => (v == null ? "" : String(v));

function colIdx(header: string[], candidates: string[]): number {
  const norm = (h: string) => h.replace(/\s+/g, "").toLowerCase();
  for (const c of candidates) {
    const i = header.findIndex((h) => norm(h) === norm(c));
    if (i >= 0) return i;
  }
  return -1;
}

function normDate(d: string): string {
  if (!d) return "";
  const m = d.match(/(\d{4})[년.\-\/]?\s*(\d{1,2})[월.\-\/]?\s*(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return d;
}

/**
 * 히스토리 시트 컬럼 구조 (전체/입력 동일):
 *   A=순번(무시), B=날짜(1), C=유형(2), D=영업활동명(3),
 *   E=그룹ID(4), F=영업단계(5), G=내용(6)
 */
async function readSheetDynamic(
  sheetName: string,
  source: "archive" | "input"
): Promise<HistoryEntry[]> {
  try {
    const allRows = await readRange(`${sheetName}!A1:H`);
    if (allRows.length < 2) return [];

    const headerRow = allRows[0].map((h) => s(h));

    // 헤더 행 유효성 확인
    const hasValidHeader =
      colIdx(headerRow, ["날짜", "date"]) >= 0 ||
      colIdx(headerRow, ["영업활동명", "영업 활동명"]) >= 0 ||
      colIdx(headerRow, ["내용", "히스토리내용", "히스토리 내용"]) >= 0;

    const header   = hasValidHeader ? headerRow : [];
    const dataRows = hasValidHeader ? allRows.slice(1) : allRows;
    const startRow = hasValidHeader ? 2 : 1;

    // 헤더에서 컬럼 위치 탐지, 없으면 시트 구조 기준 fallback
    const iDate    = colIdx(header, ["날짜", "date"]);
    const iType    = colIdx(header, ["유형", "type"]);
    const iName    = colIdx(header, ["영업활동명", "영업 활동명", "활동명"]);
    const iGroupId = colIdx(header, ["그룹id", "그룹 id", "그룹아이디", "groupid"]);
    const iStage   = colIdx(header, ["영업단계", "영업 단계", "단계"]);
    const iContent = colIdx(header, ["내용", "히스토리내용", "히스토리 내용", "content"]);

    // fallback: A=순번(무시), B=날짜(1), C=유형(2), D=영업활동명(3), E=그룹ID(4), F=영업단계(5), G=내용(6)
    const get = (row: string[], dynamic: number, fallback: number): string =>
      s(row[dynamic >= 0 ? dynamic : fallback]);

    return dataRows
      .map((row, idx) => ({
        rowIndex: startRow + idx,
        source,
        날짜:      get(row, iDate,    1),
        유형:      get(row, iType,    2),
        영업활동명: get(row, iName,    3),
        그룹ID:    get(row, iGroupId, 4),
        영업단계:  get(row, iStage,   5),
        내용:      get(row, iContent, 6),
      }))
      // 영업활동명이 없는 행(안내문, 빈 행 등) 제외
      .filter((e) => e.영업활동명.trim());
  } catch (err) {
    console.error(`[history.readSheet] failed for "${sheetName}"`, err);
    return [];
  }
}

/** 두 탭의 모든 히스토리 — 최신 날짜 먼저 */
export const getHistory = unstable_cache(
  async (): Promise<HistoryEntry[]> => {
    if (!hasGoogleEnv()) return [];
    const [archive, input] = await Promise.all([
      readSheetDynamic(HISTORY_ARCHIVE_SHEET, "archive"),
      readSheetDynamic(HISTORY_INPUT_SHEET, "input"),
    ]);
    const all = [...archive, ...input];
    return all.sort((a, b) => normDate(b.날짜).localeCompare(normDate(a.날짜)));
  },
  ["history-data"],
  { tags: ["history"] }
);

/**
 * 특정 고객의 히스토리.
 * 1순위: 영업활동명 정확일치
 * 2순위: 그룹ID 정확일치
 * 3순위: 영업활동명 부분일치 (영업활동명 있는 행만)
 */
export async function getHistoryFor(
  영업활동명: string,
  options?: { 그룹ID?: string }
): Promise<HistoryEntry[]> {
  const all = await getHistory();
  const norm = (s: string) => s.trim().replace(/\s+/g, " ");
  const key = norm(영업활동명);

  const exact = all.filter((e) => norm(e.영업활동명) === key);
  if (exact.length > 0) return exact;

  if (options?.그룹ID) {
    const gid = options.그룹ID.trim();
    const byId = all.filter((e) => e.그룹ID.trim() === gid);
    if (byId.length > 0) return byId;
  }

  if (key.length >= 2) {
    return all.filter(
      (e) =>
        e.영업활동명.trim() &&
        (norm(e.영업활동명).includes(key) || key.includes(norm(e.영업활동명)))
    );
  }

  return [];
}

function sheetNameFor(source: "archive" | "input"): string {
  return source === "archive" ? HISTORY_ARCHIVE_SHEET : HISTORY_INPUT_SHEET;
}

/** 히스토리 행 삭제 */
export async function deleteHistory(
  source: "archive" | "input",
  rowIndex: number
): Promise<void> {
  await deleteSheetRow(sheetNameFor(source), rowIndex);
}

/** 히스토리 행 수정 — 날짜(B), 유형(C), 내용(G)만 업데이트 */
export async function updateHistory(
  source: "archive" | "input",
  rowIndex: number,
  fields: { 날짜: string; 유형: string; 내용: string }
): Promise<void> {
  const sheet = sheetNameFor(source);
  await updateRange(`${sheet}!B${rowIndex}:C${rowIndex}`, [[fields.날짜, fields.유형]]);
  await updateRange(`${sheet}!G${rowIndex}`, [[fields.내용]]);
}

/**
 * 새 히스토리 추가 — "히스토리 입력" 탭 B:G에 append
 * B=날짜, C=유형, D=영업활동명, E=그룹ID, F=영업단계, G=내용
 */
export async function addHistory(entry: {
  날짜: string;
  유형: string;
  영업활동명: string;
  그룹ID?: string;
  영업단계?: string;
  내용: string;
}): Promise<void> {
  await appendRow(`${HISTORY_INPUT_SHEET}!A:G`, [
    "",                   // A: no. (공란)
    entry.날짜,           // B: 날짜
    entry.유형,           // C: 유형
    entry.영업활동명,     // D: 영업활동명
    entry.그룹ID ?? "",   // E: 그룹ID
    entry.영업단계 ?? "", // F: 영업단계
    entry.내용,           // G: 히스토리내용
  ]);
}
