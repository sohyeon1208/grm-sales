"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { BillingRow } from "@/lib/billing";
import { useTheme } from "@/components/layout/ThemeContext";
import { DARK, LIGHT } from "@/lib/theme";
import NewBillingModal from "./NewBillingModal";

type TaxInfo = { issued: boolean; date: string };
type StatusEdit = { rowIndex: number; field: "tax" | "pay" } | null;

const today = () => new Date().toISOString().slice(0, 10);

const fmtMoney = (v: string) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  if (isNaN(n) || v === "") return v || "—";
  return n.toLocaleString("ko-KR") + "원";
};

const autoVat = (공급가액: string) => {
  const n = parseFloat(String(공급가액).replace(/,/g, ""));
  if (isNaN(n) || 공급가액 === "") return "—";
  return Math.round(n * 1.1).toLocaleString("ko-KR") + "원";
};

export default function BillingView({ rows }: { rows: BillingRow[] }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  // 세금계산서: localStorage only
  const [taxStatus, setTaxStatus] = useState<Record<number, TaxInfo>>({});
  // 입금일자: localStorage only
  const [payDates, setPayDates] = useState<Record<number, string>>({});
  // 입금확인: optimistic override (sheet J열 업데이트 후 새로고침 전까지 반영)
  const [payOverride, setPayOverride] = useState<Record<number, string>>({});

  const [editing, setEditing] = useState<StatusEdit>(null);
  const [editDate, setEditDate] = useState(today());

  useEffect(() => {
    const tax: Record<number, TaxInfo> = {};
    const pd: Record<number, string> = {};
    rows.forEach((r) => {
      try {
        const t = localStorage.getItem(`billing_tax_${r.rowIndex}`);
        if (t) tax[r.rowIndex] = JSON.parse(t);
        const d = localStorage.getItem(`billing_pay_date_${r.rowIndex}`);
        if (d) pd[r.rowIndex] = d;
      } catch {}
    });
    setTaxStatus(tax);
    setPayDates(pd);
  }, [rows]);

  const years = Array.from(new Set(rows.map((r) => r.연도).filter(Boolean))).sort().reverse();

  const filtered = rows.filter((r) => {
    if (yearFilter && r.연도 !== yearFilter) return false;
    if (monthFilter && r.월 !== monthFilter) return false;
    if (search && !r.고객사.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // 합계 (필터된 행 기준)
  const totalSupply = filtered.reduce((sum, r) => {
    const n = parseFloat(String(r.공급가액).replace(/,/g, ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const totalVat = filtered.reduce((sum, r) => {
    const raw = r.부가세포함 || "";
    const base = r.공급가액 || "";
    const n = parseFloat((raw || String(Math.round(parseFloat(base.replace(/,/g, "")) * 1.1))).replace(/,/g, ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const startEdit = (rowIndex: number, field: "tax" | "pay") => {
    setEditDate(
      field === "tax"
        ? taxStatus[rowIndex]?.date || today()
        : payDates[rowIndex] || today()
    );
    setEditing({ rowIndex, field });
  };

  const confirmEdit = async () => {
    if (!editing) return;
    const { rowIndex, field } = editing;

    if (field === "tax") {
      const info: TaxInfo = { issued: true, date: editDate };
      localStorage.setItem(`billing_tax_${rowIndex}`, JSON.stringify(info));
      setTaxStatus((p) => ({ ...p, [rowIndex]: info }));
    } else {
      await fetch("/api/billing/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex, value: "O" }),
      });
      localStorage.setItem(`billing_pay_date_${rowIndex}`, editDate);
      setPayDates((p) => ({ ...p, [rowIndex]: editDate }));
      setPayOverride((p) => ({ ...p, [rowIndex]: "O" }));
    }
    setEditing(null);
  };

  const clearTax = (rowIndex: number) => {
    localStorage.removeItem(`billing_tax_${rowIndex}`);
    setTaxStatus((p) => {
      const n = { ...p };
      delete n[rowIndex];
      return n;
    });
  };

  const clearPay = async (rowIndex: number) => {
    await fetch("/api/billing/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex, value: "" }),
    });
    localStorage.removeItem(`billing_pay_date_${rowIndex}`);
    setPayDates((p) => { const n = { ...p }; delete n[rowIndex]; return n; });
    setPayOverride((p) => { const n = { ...p }; delete n[rowIndex]; return n; });
  };

  const getPayStatus = (row: BillingRow) => payOverride[row.rowIndex] ?? row.입금확인;

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    color: T.text.muted,
    fontWeight: 600,
    fontSize: 12,
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: "nowrap",
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(26,28,51,0.04)",
  };
  const tdStyle: React.CSSProperties = {
    padding: "11px 14px",
    borderBottom: `1px solid ${T.border}`,
    verticalAlign: "middle",
  };
  const dateInp: React.CSSProperties = {
    padding: "4px 8px",
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: T.bg.page,
    color: T.text.primary,
    fontSize: 12,
    outline: "none",
  };
  const btnSmall = (bg: string, color: string): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: 6,
    background: bg,
    color,
    border: "none",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
  });

  return (
    <div style={{ padding: "28px 32px", color: T.text.primary, minHeight: "100vh" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>청구/정산관리</h1>
          <p style={{ fontSize: 12, color: T.text.muted, margin: "4px 0 0" }}>
            세금계산서 발행 · 입금 현황을 관리합니다
          </p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            background: "linear-gradient(90deg, #7B70EE, #00CFAA)",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + 신규 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "총 공급가액", value: totalSupply.toLocaleString("ko-KR") + "원" },
          { label: "부가세 포함 합계", value: totalVat.toLocaleString("ko-KR") + "원" },
          { label: "세금계산서 발행완료", value: `${Object.values(taxStatus).filter((t) => t.issued).length}건` },
          {
            label: "입금완료",
            value: `${filtered.filter((r) => getPayStatus(r) === "O").length}건`,
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 12,
              background: T.bg.card,
              border: `1px solid ${T.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          padding: "14px 18px",
          borderRadius: 12,
          background: T.bg.card,
          border: `1px solid ${T.border}`,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg.page, color: T.text.primary, fontSize: 13, cursor: "pointer" }}
        >
          <option value="">전체 연도</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg.page, color: T.text.primary, fontSize: 13, cursor: "pointer" }}
        >
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="고객사 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 160,
            padding: "7px 12px",
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.bg.page,
            color: T.text.primary,
            fontSize: 13,
            outline: "none",
          }}
        />

        <span style={{ color: T.text.muted, fontSize: 12, whiteSpace: "nowrap" }}>
          {filtered.length}건
        </span>

        {(yearFilter || monthFilter || search) && (
          <button
            onClick={() => { setYearFilter(""); setMonthFilter(""); setSearch(""); }}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.text.muted, fontSize: 12, cursor: "pointer" }}
          >
            초기화
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          background: T.bg.card,
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["날짜", "고객사", "서비스", "서비스분류", "공급가액", "부가세포함", "세금계산서", "입금여부", "사업부문"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px 0", color: T.text.muted }}>
                  {search ? `"${search}"에 해당하는 고객사가 없습니다` : "데이터가 없습니다"}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const tax = taxStatus[row.rowIndex];
                const payConf = getPayStatus(row);
                const payDate = payDates[row.rowIndex];
                const isEditTax = editing?.rowIndex === row.rowIndex && editing.field === "tax";
                const isEditPay = editing?.rowIndex === row.rowIndex && editing.field === "pay";
                const vatDisplay = row.부가세포함 ? fmtMoney(row.부가세포함) : autoVat(row.공급가액);

                return (
                  <tr key={row.rowIndex} style={{ transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(26,28,51,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", color: T.text.secondary }}>{row.날짜}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.고객사}</td>
                    <td style={{ ...tdStyle, color: T.text.secondary }}>{row.서비스 || "—"}</td>
                    <td style={{ ...tdStyle, color: T.text.secondary }}>{row.서비스분류 || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500, whiteSpace: "nowrap" }}>{fmtMoney(row.공급가액)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: T.text.secondary, whiteSpace: "nowrap" }}>{vatDisplay}</td>

                    {/* 세금계산서 */}
                    <td style={{ ...tdStyle, minWidth: 160 }}>
                      {isEditTax ? (
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={dateInp} />
                          <button onClick={confirmEdit} style={btnSmall("#7B70EE", "#fff")}>완료</button>
                          <button onClick={() => setEditing(null)} style={btnSmall("transparent", T.text.muted)}>취소</button>
                        </div>
                      ) : tax?.issued ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(0,207,170,0.12)", color: "#00CFAA", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                            발행완료
                          </span>
                          <span
                            style={{ fontSize: 11, color: T.text.muted, cursor: "pointer", textDecoration: "underline dotted" }}
                            onClick={() => startEdit(row.rowIndex, "tax")}
                            title="날짜 수정"
                          >
                            {tax.date}
                          </span>
                          <button
                            onClick={() => clearTax(row.rowIndex)}
                            style={{ background: "none", border: "none", color: T.text.muted, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                            title="발행 취소"
                          >×</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(row.rowIndex, "tax")}
                          style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
                        >
                          미발행
                        </button>
                      )}
                    </td>

                    {/* 입금여부 */}
                    <td style={{ ...tdStyle, minWidth: 160 }}>
                      {isEditPay ? (
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={dateInp} />
                          <button onClick={confirmEdit} style={btnSmall("#7B70EE", "#fff")}>완료</button>
                          <button onClick={() => setEditing(null)} style={btnSmall("transparent", T.text.muted)}>취소</button>
                        </div>
                      ) : payConf === "O" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(59,130,246,0.12)", color: "#3B82F6", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                            입금완료
                          </span>
                          <span
                            style={{ fontSize: 11, color: T.text.muted, cursor: "pointer", textDecoration: "underline dotted" }}
                            onClick={() => startEdit(row.rowIndex, "pay")}
                            title="날짜 수정"
                          >
                            {payDate || ""}
                          </span>
                          <button
                            onClick={() => clearPay(row.rowIndex)}
                            style={{ background: "none", border: "none", color: T.text.muted, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                            title="입금 취소"
                          >×</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(row.rowIndex, "pay")}
                          style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}
                        >
                          미입금
                        </button>
                      )}
                    </td>

                    <td style={{ ...tdStyle, color: T.text.muted, fontSize: 12 }}>{row.사업부문 || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <NewBillingModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
