"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/layout/ThemeContext";
import { DARK, LIGHT } from "@/lib/theme";
import type { BillingRow } from "@/lib/billing";
import Link from "next/link";

type TaxInfo = { issued: boolean; date: string };

const fmtMoney = (v: string) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) || v === "" ? v || "—" : n.toLocaleString("ko-KR") + "원";
};

export default function BillingHistoryCard({
  allRows,
  영업활동명,
}: {
  allRows: BillingRow[];
  영업활동명: string;
}) {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [rows, setRows] = useState<BillingRow[]>([]);
  const [taxStatus, setTaxStatus] = useState<Record<number, TaxInfo>>({});
  const [payStatus, setPayStatus] = useState<Record<number, string>>({});
  const [payDates, setPayDates] = useState<Record<number, string>>({});

  useEffect(() => {
    // 매칭 기준:
    // 1) row.고객사 === 영업활동명 (고객사 필드에 영업활동명과 동일한 값 입력된 경우)
    // 2) localStorage billing_linked_name_${rowIndex} === 영업활동명 (신규 추가 시 영업활동명 연결 선택)
    const matched = allRows.filter((r) => {
      if (r.고객사 === 영업활동명) return true;
      const linked = localStorage.getItem(`billing_linked_name_${r.rowIndex}`);
      return linked === 영업활동명;
    });
    matched.sort((a, b) => b.날짜.localeCompare(a.날짜));
    setRows(matched);

    const tax: Record<number, TaxInfo> = {};
    const pay: Record<number, string> = {};
    const pd: Record<number, string> = {};
    allRows.forEach((r) => {
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
  }, [allRows, 영업활동명]);

  const totalSupply = rows.reduce(
    (s, r) => s + (parseFloat(String(r.공급가액).replace(/,/g, "")) || 0),
    0
  );

  const sectionStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
    borderRadius: 14,
    border: `1px solid ${T.border}`,
    padding: "22px 24px",
  };

  const noteStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: T.text.muted,
    padding: "3px 9px",
    borderRadius: 20,
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(26,28,51,0.04)",
    border: `1px solid ${T.border}`,
  };

  return (
    <section style={sectionStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: T.text.primary }}>세금계산서 발행 이력</h3>
          <span style={noteStyle}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            26년 5월 이전 내역은{" "}
            <Link href="/billing" style={{ color: "#7B70EE", textDecoration: "none", fontWeight: 600 }}>
              청구/정산관리
            </Link>
            {" "}메뉴에서 확인
          </span>
        </div>
        {rows.length > 0 && (
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: T.text.muted, alignItems: "center" }}>
            <span>{rows.length}건</span>
            <span style={{ color: T.text.primary, fontWeight: 600 }}>
              합계 {totalSupply.toLocaleString("ko-KR")}원
            </span>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: T.text.muted, margin: 0 }}>
          연결된 청구 이력이 없습니다.{" "}
          <Link href="/billing" style={{ color: "#7B70EE", textDecoration: "none" }}>청구/정산관리</Link>에서
          신규 추가 시 영업활동명을 선택하면 여기에 표시됩니다.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(26,28,51,0.04)" }}>
                {["날짜", "고객사", "서비스", "공급가액", "세금계산서", "입금"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T.text.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const tax = taxStatus[row.rowIndex];
                const paid = payStatus[row.rowIndex] === "O";
                const payDate = payDates[row.rowIndex];
                return (
                  <tr
                    key={row.rowIndex}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(26,28,51,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "8px 10px", color: T.text.secondary, whiteSpace: "nowrap" }}>{row.날짜}</td>
                    <td style={{ padding: "8px 10px", color: T.text.secondary, fontSize: 12 }}>{row.고객사}</td>
                    <td style={{ padding: "8px 10px", color: T.text.secondary }}>{row.서비스 || "—"}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 500, textAlign: "right", whiteSpace: "nowrap" }}>{fmtMoney(row.공급가액)}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {tax?.issued ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ padding: "2px 7px", borderRadius: 20, background: "rgba(0,207,170,0.12)", color: "#00CFAA", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>발행완료</span>
                          {tax.date && <span style={{ fontSize: 11, color: T.text.muted }}>{tax.date}</span>}
                        </div>
                      ) : (
                        <span style={{ padding: "2px 7px", borderRadius: 20, background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 11, fontWeight: 600 }}>미발행</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      {paid ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ padding: "2px 7px", borderRadius: 20, background: "rgba(59,130,246,0.12)", color: "#3B82F6", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>입금완료</span>
                          {payDate && <span style={{ fontSize: 11, color: T.text.muted }}>{payDate}</span>}
                        </div>
                      ) : (
                        <span style={{ padding: "2px 7px", borderRadius: 20, background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 11, fontWeight: 600 }}>미입금</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
