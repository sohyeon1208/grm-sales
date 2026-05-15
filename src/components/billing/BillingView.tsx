"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { BillingRow } from "@/lib/billing";
import { useTheme } from "@/components/layout/ThemeContext";
import { DARK, LIGHT } from "@/lib/theme";
import NewBillingModal from "./NewBillingModal";
import EditBillingModal from "./EditBillingModal";

type TaxInfo = { issued: boolean; date: string };
type DateEdit = { rowIndex: number; field: "tax" | "pay" } | null;

const INIT_KEY = "billing_init_v2";
const PAGE_SIZES = [50, 100, 200, 500];
const today = () => new Date().toISOString().slice(0, 10);

const fmtMoney = (v: string) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) || v === "" ? v || "—" : n.toLocaleString("ko-KR") + "원";
};
const autoVat = (공급가액: string) => {
  const n = parseFloat(String(공급가액).replace(/,/g, ""));
  return isNaN(n) || 공급가액 === "" ? "—" : Math.round(n * 1.1).toLocaleString("ko-KR") + "원";
};

export default function BillingView({ rows, masterCustomers = [] }: { rows: BillingRow[]; masterCustomers?: string[] }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [search, setSearch] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BillingRow | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [taxStatus, setTaxStatus] = useState<Record<number, TaxInfo>>({});
  const [payStatus, setPayStatus] = useState<Record<number, string>>({});
  const [payDates, setPayDates] = useState<Record<number, string>>({});

  // 날짜 변경용 인라인 에디터
  const [dateEdit, setDateEdit] = useState<DateEdit>(null);
  const [editDate, setEditDate] = useState(today());

  // 기존 청구 고객사명 자동완성 소스
  const customers = useMemo(
    () => Array.from(new Set(rows.map((r) => r.고객사).filter(Boolean))).sort(),
    [rows]
  );

  useEffect(() => {
    if (!localStorage.getItem(INIT_KEY)) {
      rows.forEach((r) => {
        if (!r.날짜 && !r.고객사) return;
        localStorage.setItem(`billing_tax_${r.rowIndex}`, JSON.stringify({ issued: true, date: r.날짜 }));
        localStorage.setItem(`billing_pay_${r.rowIndex}`, "O");
      });
      localStorage.setItem(INIT_KEY, "1");
    }
    const tax: Record<number, TaxInfo> = {};
    const pay: Record<number, string> = {};
    const pd: Record<number, string> = {};
    rows.forEach((r) => {
      try {
        const t = localStorage.getItem(`billing_tax_${r.rowIndex}`);
        if (t) tax[r.rowIndex] = JSON.parse(t);
        const p = localStorage.getItem(`billing_pay_${r.rowIndex}`);
        if (p) pay[r.rowIndex] = p;
        const d = localStorage.getItem(`billing_pay_date_${r.rowIndex}`);
        if (d) pd[r.rowIndex] = d;
      } catch {}
    });
    setTaxStatus(tax);
    setPayStatus(pay);
    setPayDates(pd);
  }, [rows]);

  useEffect(() => { setPage(1); setSelected(new Set()); }, [yearFilter, monthFilter, search, pageSize]);

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.연도).filter(Boolean))).sort().reverse(),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => {
          if (yearFilter && r.연도 !== yearFilter) return false;
          if (monthFilter && r.월 !== monthFilter) return false;
          if (search && !r.고객사.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        })
        .sort((a, b) => b.날짜.localeCompare(a.날짜)),
    [rows, yearFilter, monthFilter, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalSupply = filtered.reduce((s, r) => s + (parseFloat(String(r.공급가액).replace(/,/g, "")) || 0), 0);
  const totalVat = filtered.reduce((s, r) => {
    const n = r.부가세포함
      ? parseFloat(String(r.부가세포함).replace(/,/g, ""))
      : Math.round(parseFloat(String(r.공급가액).replace(/,/g, "")) * 1.1);
    return s + (isNaN(n) ? 0 : n);
  }, 0);

  // ─── 선택 ───
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.rowIndex));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageRows.forEach((r) => next.delete(r.rowIndex));
      else pageRows.forEach((r) => next.add(r.rowIndex));
      return next;
    });
  };
  const toggleSelect = (rowIndex: number) => {
    setSelected((prev) => { const next = new Set(prev); next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex); return next; });
  };

  // ─── 일괄 상태 변경 ───
  const bulkMarkTax = () => {
    const updates: Record<number, TaxInfo> = {};
    selected.forEach((ri) => {
      const row = rows.find((r) => r.rowIndex === ri);
      const info = { issued: true, date: row?.날짜 || today() };
      localStorage.setItem(`billing_tax_${ri}`, JSON.stringify(info));
      updates[ri] = info;
    });
    setTaxStatus((p) => ({ ...p, ...updates }));
    setSelected(new Set());
  };
  const bulkMarkPay = () => {
    const updates: Record<number, string> = {};
    selected.forEach((ri) => { localStorage.setItem(`billing_pay_${ri}`, "O"); updates[ri] = "O"; });
    setPayStatus((p) => ({ ...p, ...updates }));
    setSelected(new Set());
  };
  const bulkClearTax = () => {
    selected.forEach((ri) => localStorage.removeItem(`billing_tax_${ri}`));
    setTaxStatus((p) => { const n = { ...p }; selected.forEach((ri) => delete n[ri]); return n; });
    setSelected(new Set());
  };
  const bulkClearPay = () => {
    selected.forEach((ri) => { localStorage.removeItem(`billing_pay_${ri}`); localStorage.removeItem(`billing_pay_date_${ri}`); });
    setPayStatus((p) => { const n = { ...p }; selected.forEach((ri) => delete n[ri]); return n; });
    setPayDates((p) => { const n = { ...p }; selected.forEach((ri) => delete n[ri]); return n; });
    setSelected(new Set());
  };

  // ─── 개별 상태 토글 (원클릭 = 오늘 날짜로 즉시 적용) ───
  const markTax = (ri: number, row: BillingRow) => {
    const info = { issued: true, date: row.날짜 || today() };
    localStorage.setItem(`billing_tax_${ri}`, JSON.stringify(info));
    setTaxStatus((p) => ({ ...p, [ri]: info }));
  };
  const clearTax = (ri: number) => {
    localStorage.removeItem(`billing_tax_${ri}`);
    setTaxStatus((p) => { const n = { ...p }; delete n[ri]; return n; });
  };
  const markPay = (ri: number) => {
    localStorage.setItem(`billing_pay_${ri}`, "O");
    setPayStatus((p) => ({ ...p, [ri]: "O" }));
  };
  const clearPay = (ri: number) => {
    localStorage.removeItem(`billing_pay_${ri}`); localStorage.removeItem(`billing_pay_date_${ri}`);
    setPayStatus((p) => { const n = { ...p }; delete n[ri]; return n; });
    setPayDates((p) => { const n = { ...p }; delete n[ri]; return n; });
  };

  // ─── 날짜 변경 (날짜 텍스트 클릭 시) ───
  const openDateEdit = (rowIndex: number, field: "tax" | "pay") => {
    const current = field === "tax" ? taxStatus[rowIndex]?.date : payDates[rowIndex];
    setEditDate(current || today());
    setDateEdit({ rowIndex, field });
  };
  const confirmDateEdit = () => {
    if (!dateEdit) return;
    const { rowIndex, field } = dateEdit;
    if (field === "tax") {
      const info = { issued: true, date: editDate };
      localStorage.setItem(`billing_tax_${rowIndex}`, JSON.stringify(info));
      setTaxStatus((p) => ({ ...p, [rowIndex]: info }));
    } else {
      localStorage.setItem(`billing_pay_${rowIndex}`, "O");
      localStorage.setItem(`billing_pay_date_${rowIndex}`, editDate);
      setPayStatus((p) => ({ ...p, [rowIndex]: "O" }));
      setPayDates((p) => ({ ...p, [rowIndex]: editDate }));
    }
    setDateEdit(null);
  };

  // ─── 삭제 ───
  const doDelete = async (rowIndex: number) => {
    setDeleting(true);
    try {
      await fetch("/api/billing/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rowIndex }) });
      ["tax", "pay", "pay_date"].forEach((k) => localStorage.removeItem(`billing_${k}_${rowIndex}`));
      setDeleteConfirm(null);
      router.refresh();
    } finally { setDeleting(false); }
  };

  // ─── 스타일 ───
  const thStyle: React.CSSProperties = {
    padding: "10px 12px", textAlign: "left", color: T.text.muted, fontWeight: 600, fontSize: 12,
    borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(26,28,51,0.04)",
  };
  const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: `1px solid ${T.border}`, verticalAlign: "middle" };
  const dateInp: React.CSSProperties = { padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg.page, color: T.text.primary, fontSize: 12, outline: "none" };
  const btnSm = (bg: string, color: string, border?: string): React.CSSProperties => ({ padding: "4px 10px", borderRadius: 6, background: bg, color, border: border ?? "none", fontSize: 12, cursor: "pointer", fontWeight: 500 });
  const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", padding: "3px 5px", borderRadius: 4, color: T.text.muted, fontSize: 13 };

  const pageNums = () => {
    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) pages.push(i);
      else if (pages[pages.length - 1] !== "...") pages.push("...");
    }
    return pages;
  };

  return (
    <div style={{ padding: "28px 32px", color: T.text.primary, minHeight: "100vh" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>청구/정산관리</h1>
          <p style={{ fontSize: 12, color: T.text.muted, margin: "4px 0 0" }}>세금계산서 발행 · 입금 현황을 관리합니다</p>
        </div>
        <button onClick={() => setNewOpen(true)} style={{ padding: "9px 18px", borderRadius: 8, background: "linear-gradient(90deg, #7B70EE, #00CFAA)", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + 신규 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "총 공급가액", value: totalSupply.toLocaleString("ko-KR") + "원" },
          { label: "부가세 포함 합계", value: totalVat.toLocaleString("ko-KR") + "원" },
          { label: "세금계산서 발행완료", value: `${filtered.filter((r) => taxStatus[r.rowIndex]?.issued).length} / ${filtered.length}건` },
          { label: "입금완료", value: `${filtered.filter((r) => payStatus[r.rowIndex] === "O").length} / ${filtered.length}건` },
        ].map((c) => (
          <div key={c.label} style={{ flex: 1, padding: "14px 18px", borderRadius: 12, background: T.bg.card, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, padding: "14px 18px", borderRadius: 12, background: T.bg.card, border: `1px solid ${T.border}`, alignItems: "center", flexWrap: "wrap" }}>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg.page, color: T.text.primary, fontSize: 13, cursor: "pointer" }}>
          <option value="">전체 연도</option>
          {years.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg.page, color: T.text.primary, fontSize: 13, cursor: "pointer" }}>
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>)}
        </select>
        <input type="text" placeholder="고객사 검색..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160, padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg.page, color: T.text.primary, fontSize: 13, outline: "none" }} />
        <span style={{ color: T.text.muted, fontSize: 12, whiteSpace: "nowrap" }}>{filtered.length}건</span>
        {(yearFilter || monthFilter || search) && (
          <button onClick={() => { setYearFilter(""); setMonthFilter(""); setSearch(""); }} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.text.muted, fontSize: 12, cursor: "pointer" }}>초기화</button>
        )}
      </div>

      {/* 일괄 선택 액션 바 */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: 10, borderRadius: 10, background: isDark ? "rgba(123,112,238,0.15)" : "rgba(123,112,238,0.08)", border: `1px solid rgba(123,112,238,0.3)`, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#7B70EE" }}>{selected.size}개 선택됨</span>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <button onClick={bulkMarkTax} style={btnSm("rgba(0,207,170,0.12)", "#00CFAA")}>세금계산서 발행완료</button>
          <button onClick={bulkClearTax} style={btnSm("rgba(245,158,11,0.1)", "#F59E0B")}>세금계산서 미발행으로</button>
          <button onClick={bulkMarkPay} style={btnSm("rgba(59,130,246,0.12)", "#3B82F6")}>입금완료로 변경</button>
          <button onClick={bulkClearPay} style={btnSm("rgba(239,68,68,0.1)", "#EF4444")}>입금 취소</button>
          <button onClick={() => setSelected(new Set())} style={btnSm("transparent", T.text.muted, `1px solid ${T.border}`)}>선택 해제</button>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg.card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36, textAlign: "center" }}>
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
              </th>
              {["날짜", "고객사", "서비스", "서비스분류", "공급가액", "부가세포함", "세금계산서", "입금여부", "사업부문", ""].map((h) => (
                <th key={h} style={{ ...thStyle, ...(h === "" ? { width: 70 } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: "center", padding: "48px 0", color: T.text.muted }}>
                {search ? `"${search}"에 해당하는 고객사가 없습니다` : "데이터가 없습니다"}
              </td></tr>
            ) : pageRows.map((row) => {
              const tax = taxStatus[row.rowIndex];
              const paid = payStatus[row.rowIndex] === "O";
              const payDate = payDates[row.rowIndex];
              const isDateEditTax = dateEdit?.rowIndex === row.rowIndex && dateEdit.field === "tax";
              const isDateEditPay = dateEdit?.rowIndex === row.rowIndex && dateEdit.field === "pay";
              const isDelConfirm = deleteConfirm === row.rowIndex;
              const vatDisplay = row.부가세포함 ? fmtMoney(row.부가세포함) : autoVat(row.공급가액);

              return (
                <tr key={row.rowIndex}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(26,28,51,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <input type="checkbox" checked={selected.has(row.rowIndex)} onChange={() => toggleSelect(row.rowIndex)} style={{ cursor: "pointer" }} />
                  </td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap", color: T.text.secondary }}>{row.날짜}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{row.고객사}</td>
                  <td style={{ ...tdStyle, color: T.text.secondary }}>{row.서비스 || "—"}</td>
                  <td style={{ ...tdStyle, color: T.text.secondary }}>{row.서비스분류 || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500, whiteSpace: "nowrap" }}>{fmtMoney(row.공급가액)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: T.text.secondary, whiteSpace: "nowrap" }}>{vatDisplay}</td>

                  {/* 세금계산서 */}
                  <td style={{ ...tdStyle, minWidth: 160 }}>
                    {isDateEditTax ? (
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={dateInp} />
                        <button onClick={confirmDateEdit} style={btnSm("#7B70EE", "#fff")}>확인</button>
                        <button onClick={() => setDateEdit(null)} style={btnSm("transparent", T.text.muted, `1px solid ${T.border}`)}>취소</button>
                      </div>
                    ) : tax?.issued ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(0,207,170,0.12)", color: "#00CFAA", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>발행완료</span>
                        <span
                          onClick={() => openDateEdit(row.rowIndex, "tax")}
                          style={{ fontSize: 11, color: T.text.muted, cursor: "pointer", textDecoration: "underline dotted", whiteSpace: "nowrap" }}
                          title="날짜 변경"
                        >{tax.date || "날짜 없음"}</span>
                        <button onClick={() => clearTax(row.rowIndex)} style={{ ...iconBtn, fontSize: 15 }} title="발행 취소">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => markTax(row.rowIndex, row)}
                        style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
                        title="클릭하면 발행완료로 변경"
                      >미발행</button>
                    )}
                  </td>

                  {/* 입금여부 */}
                  <td style={{ ...tdStyle, minWidth: 140 }}>
                    {isDateEditPay ? (
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={dateInp} />
                        <button onClick={confirmDateEdit} style={btnSm("#7B70EE", "#fff")}>확인</button>
                        <button onClick={() => setDateEdit(null)} style={btnSm("transparent", T.text.muted, `1px solid ${T.border}`)}>취소</button>
                      </div>
                    ) : paid ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(59,130,246,0.12)", color: "#3B82F6", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>입금완료</span>
                        <span
                          onClick={() => openDateEdit(row.rowIndex, "pay")}
                          style={{ fontSize: 11, color: T.text.muted, cursor: "pointer", textDecoration: "underline dotted", whiteSpace: "nowrap" }}
                          title="날짜 변경"
                        >{payDate || "날짜 미설정"}</span>
                        <button onClick={() => clearPay(row.rowIndex)} style={{ ...iconBtn, fontSize: 15 }} title="입금 취소">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => markPay(row.rowIndex)}
                        style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
                        title="클릭하면 입금완료로 변경"
                      >미입금</button>
                    )}
                  </td>

                  <td style={{ ...tdStyle, color: T.text.muted, fontSize: 12 }}>{row.사업부문 || "—"}</td>

                  {/* 수정 / 삭제 */}
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    {isDelConfirm ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => doDelete(row.rowIndex)} disabled={deleting} style={btnSm("#EF4444", "#fff")}>{deleting ? "…" : "삭제확인"}</button>
                        <button onClick={() => setDeleteConfirm(null)} style={btnSm("transparent", T.text.muted, `1px solid ${T.border}`)}>취소</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => setEditTarget(row)} style={iconBtn} title="수정">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(row.rowIndex)} style={{ ...iconBtn, color: "#EF4444" }} title="삭제">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${T.border}`, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: T.text.muted }}>페이지당</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg.page, color: T.text.primary, fontSize: 12, cursor: "pointer" }}
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}개</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: page === 1 ? T.text.muted : T.text.primary, cursor: page === 1 ? "default" : "pointer", fontSize: 12 }}>
              이전
            </button>
            {pageNums().map((p, i) =>
              p === "..." ? (
                <span key={`dot-${i}`} style={{ padding: "0 4px", color: T.text.muted, fontSize: 12 }}>…</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)}
                  style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${p === page ? "#7B70EE" : T.border}`, background: p === page ? "rgba(123,112,238,0.12)" : "transparent", color: p === page ? "#7B70EE" : T.text.primary, fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12 }}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: page === totalPages ? T.text.muted : T.text.primary, cursor: page === totalPages ? "default" : "pointer", fontSize: 12 }}>
              다음
            </button>
          </div>

          <span style={{ fontSize: 12, color: T.text.muted }}>
            {filtered.length === 0 ? "0건" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} / ${filtered.length}건`}
          </span>
        </div>
      </div>

      <NewBillingModal open={newOpen} onClose={() => setNewOpen(false)} customers={customers} masterCustomers={masterCustomers} />
      <EditBillingModal row={editTarget} open={!!editTarget} onClose={() => setEditTarget(null)} customers={customers} masterCustomers={masterCustomers} />
    </div>
  );
}
