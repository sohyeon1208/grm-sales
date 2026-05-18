"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { BillingRow } from "@/lib/billing";
import { useTheme } from "@/components/layout/ThemeContext";
import { DARK, LIGHT } from "@/lib/theme";
import { calcSalesDivision } from "./NewBillingModal";

const SERVICE_TYPES = [
  "구루미Biz Enterprise", "Oligo", "캠스터디", "유지보수",
  "개발,구축", "API 서비스", "기타프로젝트", "클라우드서비스", "S.Pin",
];

type Form = {
  날짜: string; 고객사: string; 서비스: string;
  서비스분류: string; 공급가액: string; 부가세포함: string; 사업부문: string;
};

export default function EditBillingModal({
  row, open, onClose, customers, masterCustomers = [],
}: {
  row: BillingRow | null; open: boolean; onClose: () => void; customers: string[]; masterCustomers?: string[];
}) {
  const router = useRouter();
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;
  const [form, setForm] = useState<Form | null>(null);
  const [linkedName, setLinkedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSugg, setShowSugg] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSugg영업, setShowSugg영업] = useState(false);
  const [highlightIdx영업, setHighlightIdx영업] = useState(-1);
  const blurTimer영업 = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (open && row && !form) {
    setForm({
      날짜: row.날짜, 고객사: row.고객사, 서비스: row.서비스,
      서비스분류: row.서비스분류, 공급가액: row.공급가액,
      부가세포함: row.부가세포함, 사업부문: row.사업부문,
    });
    setLinkedName(localStorage.getItem(`billing_linked_name_${row.rowIndex}`) ?? "");
  }

  if (!open || !row) return null;
  if (!form) return null;

  const suggestions = form.고객사
    ? customers.filter((c) => c.toLowerCase().includes(form.고객사.toLowerCase()) && c !== form.고객사).slice(0, 10)
    : [];

  const sugg영업 = linkedName
    ? masterCustomers.filter((c) => c.toLowerCase().includes(linkedName.toLowerCase())).slice(0, 10)
    : [];

  const set = (key: keyof Form, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      if (key === "공급가액") {
        const n = parseFloat(value.replace(/[^0-9.]/g, ""));
        next.부가세포함 = isNaN(n) ? "" : Math.round(n * 1.1).toString();
      }
      if (key === "서비스분류" || key === "서비스") {
        const 분류 = key === "서비스분류" ? value : prev.서비스분류;
        const 서비스 = key === "서비스" ? value : prev.서비스;
        next.사업부문 = calcSalesDivision(분류, 서비스);
      }
      return next;
    });
  };

  const selectSuggestion = (c: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    set("고객사", c);
    setShowSugg(false);
    setHighlightIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSugg || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setShowSugg(false);
      setHighlightIdx(-1);
    }
  };

  const select영업Suggestion = (c: string) => {
    if (blurTimer영업.current) clearTimeout(blurTimer영업.current);
    setLinkedName(c);
    setShowSugg영업(false);
    setHighlightIdx영업(-1);
  };

  const handleKeyDown영업 = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSugg영업 || sugg영업.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx영업((i) => Math.min(i + 1, sugg영업.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx영업((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && highlightIdx영업 >= 0) { e.preventDefault(); select영업Suggestion(sugg영업[highlightIdx영업]); }
    else if (e.key === "Escape") { setShowSugg영업(false); setHighlightIdx영업(-1); }
  };

  const handleClose = () => { setForm(null); setLinkedName(""); setShowSugg영업(false); setHighlightIdx영업(-1); setError(""); onClose(); };

  const submit = async () => {
    if (!form.날짜 || !form.고객사) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/billing/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: row.rowIndex, ...form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(`저장 실패: ${data.error || res.status}`);
        return;
      }
      if (linkedName) {
        localStorage.setItem(`billing_linked_name_${row.rowIndex}`, linkedName);
      } else {
        localStorage.removeItem(`billing_linked_name_${row.rowIndex}`);
      }
      setForm(null);
      setLinkedName("");
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.bg.page,
    color: T.text.primary, fontSize: 13, boxSizing: "border-box", outline: "none",
  };
  const lbl: React.CSSProperties = { fontSize: 12, color: T.text.muted, marginBottom: 4, display: "block" };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div style={{ width: 480, maxHeight: "90vh", overflowY: "auto", background: T.bg.card, borderRadius: 16, padding: "28px 32px", border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 700, color: T.text.primary }}>청구 내역 수정</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>날짜 *</label>
            <input type="date" value={form.날짜} onChange={(e) => set("날짜", e.target.value)} style={inp} />
          </div>

          <div style={{ gridColumn: "1 / -1", position: "relative" }}>
            <label style={lbl}>고객사 *</label>
            <input
              type="text"
              value={form.고객사}
              onChange={(e) => { set("고객사", e.target.value); setShowSugg(true); setHighlightIdx(-1); }}
              onFocus={() => setShowSugg(true)}
              onBlur={() => { blurTimer.current = setTimeout(() => { setShowSugg(false); setHighlightIdx(-1); }, 150); }}
              onKeyDown={handleKeyDown}
              style={inp}
            />
            {showSugg && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: T.bg.card, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", maxHeight: 200, overflowY: "auto" }}>
                {suggestions.map((c, i) => (
                  <div
                    key={c}
                    onMouseDown={() => selectSuggestion(c)}
                    style={{
                      padding: "9px 14px", fontSize: 13, cursor: "pointer", color: T.text.primary,
                      borderBottom: `1px solid ${T.border}`,
                      background: i === highlightIdx
                        ? (isDark ? "rgba(123,112,238,0.2)" : "rgba(123,112,238,0.1)")
                        : "transparent",
                    }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    onMouseLeave={() => setHighlightIdx(-1)}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1", position: "relative" }}>
            <label style={lbl}>영업활동명(계약관리 고객과연결)</label>
            <input
              type="text"
              placeholder="영업활동명 입력"
              value={linkedName}
              onChange={(e) => { setLinkedName(e.target.value); setShowSugg영업(true); setHighlightIdx영업(-1); }}
              onFocus={() => setShowSugg영업(true)}
              onBlur={() => { blurTimer영업.current = setTimeout(() => { setShowSugg영업(false); setHighlightIdx영업(-1); }, 150); }}
              onKeyDown={handleKeyDown영업}
              style={inp}
            />
            {showSugg영업 && sugg영업.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: T.bg.card, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", maxHeight: 200, overflowY: "auto" }}>
                {sugg영업.map((c, i) => (
                  <div
                    key={c}
                    onMouseDown={() => select영업Suggestion(c)}
                    style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", color: T.text.primary, borderBottom: `1px solid ${T.border}`, background: i === highlightIdx영업 ? (isDark ? "rgba(123,112,238,0.2)" : "rgba(123,112,238,0.1)") : "transparent" }}
                    onMouseEnter={() => setHighlightIdx영업(i)}
                    onMouseLeave={() => setHighlightIdx영업(-1)}
                  >{c}</div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>서비스</label>
            <input type="text" value={form.서비스} onChange={(e) => set("서비스", e.target.value)} style={inp} />
          </div>

          <div>
            <label style={lbl}>서비스분류</label>
            <select value={form.서비스분류} onChange={(e) => set("서비스분류", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="">선택하세요</option>
              {SERVICE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>공급가액 (원)</label>
            <input type="number" value={form.공급가액} onChange={(e) => set("공급가액", e.target.value)} style={inp} />
          </div>

          <div>
            <label style={lbl}>부가세포함</label>
            <input type="number" value={form.부가세포함} onChange={(e) => set("부가세포함", e.target.value)} style={inp} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>사업부문</label>
            <input type="text" value={form.사업부문} onChange={(e) => set("사업부문", e.target.value)} style={inp} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={handleClose} style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.text.secondary, fontSize: 13, cursor: "pointer" }}>취소</button>
          <button
            onClick={submit}
            disabled={saving || !form.날짜 || !form.고객사}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(90deg, #7B70EE, #00CFAA)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >{saving ? "저장 중..." : "수정 완료"}</button>
        </div>
      </div>
    </div>
  );
}
