"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/layout/ThemeContext";
import { DARK, LIGHT } from "@/lib/theme";
import type { BillingRow } from "@/lib/billing";

type TaxInfo = { issued: boolean; date: string };

const fmtMoney = (v: string) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) || v === "" ? v || "—" : n.toLocaleString("ko-KR") + "원";
};

export default function BillingHistoryCard({ rows }: { rows: BillingRow[] }) {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [taxStatus, setTaxStatus] = useState<Record<number, TaxInfo>>({});
  const [payStatus, setPayStatus] = useState<Record<number, string>>({});
  const [payDates, setPayDates] = useState<Record<number, string>>({});

  useEffect(() => {
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

  const totalSupply = rows.reduce((s, r) => s + (parseFloat(String(r.공급가액).replace(/,/g, "")) || 0), 0);

  if (rows.length === 0) {
    return (
      <section
        style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#fff", borderRadius: 14, border: `1px solid ${T.border}`, padding: "22px 24px" }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: T.text.primary }}>청구/세금계산서 발행 이력</h3>
        <p style={{ fontSize: 13, color: T.text.muted }}>청구 이력이 없습니다.</p>
      </section>
    );
  }

  return (
    <section
      style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#fff", borderRadius: 14, border: `1px solid ${T.border}`, padding: "22px 24px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text.primary }}>청구/세금계산서 발행 이력</h3>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.text.muted }}>
          <span>총 {rows.length}건</span>
          <span style={{ color: T.text.primary, fontWeight: 600 }}>합계 {totalSupply.toLocaleString("ko-KR")}원</span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(26,28,51,0.04)" }}>
              {["날짜", "서비스", "서비스분류", "공급가액", "부가세포함", "세금계산서", "입금여부"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T.text.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tax = taxStatus[row.rowIndex];
              const paid = payStatus[row.rowIndex] === "O";
              const payDate = payDates[row.rowIndex];
              return (
                <tr key={row.rowIndex}
                  style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(26,28,51,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "9px 12px", color: T.text.secondary, whiteSpace: "nowrap" }}>{row.날짜}</td>
                  <td style={{ padding: "9px 12px", color: T.text.secondary }}>{row.서비스 || "—"}</td>
                  <td style={{ padding: "9px 12px", color: T.text.muted, fontSize: 12 }}>{row.서비스분류 || "—"}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 500, textAlign: "right", whiteSpace: "nowrap" }}>{fmtMoney(row.공급가액)}</td>
                  <td style={{ padding: "9px 12px", color: T.text.secondary, textAlign: "right", whiteSpace: "nowrap" }}>{fmtMoney(row.부가세포함)}</td>
                  <td style={{ padding: "9px 12px" }}>
                    {tax?.issued ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(0,207,170,0.12)", color: "#00CFAA", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>발행완료</span>
                        {tax.date && <span style={{ fontSize: 11, color: T.text.muted }}>{tax.date}</span>}
                      </div>
                    ) : (
                      <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontSize: 11, fontWeight: 600 }}>미발행</span>
                    )}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {paid ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(59,130,246,0.12)", color: "#3B82F6", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>입금완료</span>
                        {payDate && <span style={{ fontSize: 11, color: T.text.muted }}>{payDate}</span>}
                      </div>
                    ) : (
                      <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 11, fontWeight: 600 }}>미입금</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
