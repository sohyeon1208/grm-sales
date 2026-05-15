"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/layout/ThemeContext";
import { DARK, LIGHT } from "@/lib/theme";

type Form = {
  날짜: string;
  고객사: string;
  서비스: string;
  서비스분류: string;
  공급가액: string;
  부가세포함: string;
  사업부문: string;
};

const EMPTY: Form = {
  날짜: "",
  고객사: "",
  서비스: "",
  서비스분류: "",
  공급가액: "",
  부가세포함: "",
  사업부문: "",
};

export default function NewBillingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const set = (key: keyof Form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "공급가액") {
        const n = parseFloat(value.replace(/[^0-9.]/g, ""));
        next.부가세포함 = isNaN(n) ? "" : Math.round(n * 1.1).toString();
      }
      return next;
    });
  };

  const submit = async () => {
    if (!form.날짜 || !form.고객사) return;
    setSaving(true);
    try {
      await fetch("/api/billing/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: T.bg.page,
    color: T.text.primary,
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  };
  const lbl: React.CSSProperties = {
    fontSize: 12,
    color: T.text.muted,
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          background: T.bg.card,
          borderRadius: 16,
          padding: "28px 32px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 700, color: T.text.primary }}>
          신규 청구 추가
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>날짜 *</label>
            <input
              type="date"
              value={form.날짜}
              onChange={(e) => set("날짜", e.target.value)}
              style={inp}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>고객사 *</label>
            <input
              type="text"
              placeholder="고객사명"
              value={form.고객사}
              onChange={(e) => set("고객사", e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>서비스</label>
            <input
              type="text"
              placeholder="서비스명"
              value={form.서비스}
              onChange={(e) => set("서비스", e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>서비스분류</label>
            <input
              type="text"
              placeholder="구독 / 일회성 등"
              value={form.서비스분류}
              onChange={(e) => set("서비스분류", e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>공급가액 (원)</label>
            <input
              type="number"
              placeholder="0"
              value={form.공급가액}
              onChange={(e) => set("공급가액", e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>
              부가세 포함{" "}
              <span style={{ color: T.text.muted, fontWeight: 400 }}>(공급가액×1.1, 수정 가능)</span>
            </label>
            <input
              type="number"
              placeholder="자동 계산"
              value={form.부가세포함}
              onChange={(e) => set("부가세포함", e.target.value)}
              style={inp}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>사업부문</label>
            <input
              type="text"
              placeholder="사업부문"
              value={form.사업부문}
              onChange={(e) => set("사업부문", e.target.value)}
              style={inp}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.text.secondary,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.날짜 || !form.고객사}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(90deg, #7B70EE, #00CFAA)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: saving || !form.날짜 || !form.고객사 ? "not-allowed" : "pointer",
              opacity: saving || !form.날짜 || !form.고객사 ? 0.5 : 1,
            }}
          >
            {saving ? "저장 중..." : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
