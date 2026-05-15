"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { DARK, LIGHT } from "@/lib/theme";
import { signOut } from "next-auth/react";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  match?: (path: string) => boolean;
};

type UserInfo = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const ICON = (path: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const MENU: MenuItem[] = [
  {
    label: "매출 대시보드",
    href: "/",
    match: (p) => p === "/" || p === "/light",
    icon: ICON("M3 3v18h18 M7 14l3-3 4 4 5-7"),
  },
  {
    label: "계약 관리",
    href: "/customers",
    match: (p) => p.startsWith("/customers"),
    icon: ICON("M21 21l-4.35-4.35 M10 18a8 8 0 100-16 8 8 0 000 16z"),
  },
  {
    label: "청구/정산관리",
    href: "/billing",
    match: (p) => p.startsWith("/billing"),
    icon: ICON("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"),
  },
  {
    label: "정산 캘린더",
    href: "/settlement",
    match: (p) => p.startsWith("/settlement"),
    icon: ICON("M3 4h18v18H3z M3 10h18 M8 2v4 M16 2v4"),
  },
];

type Props = { user?: UserInfo };

export default function Sidebar({ user }: Props) {
  const pathname = usePathname() || "/";
  const { isDark, toggle, mounted } = useTheme();
  const T = isDark ? DARK : LIGHT;

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 220,
        height: "100vh",
        background: T.bg.card,
        borderRight: `1px solid ${T.border}`,
        color: T.text.primary,
        position: "sticky",
        top: 0,
      }}
    >
      {/* 로고 영역 */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "linear-gradient(90deg, #7B70EE, #00CFAA)" }}
          />
          <span className="font-semibold text-sm" style={{ color: T.text.primary }}>
            Gooroomee Sales
          </span>
        </div>
        <div className="mt-1 text-[11px]" style={{ color: T.text.muted }}>
          매출 + 고객 관리
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {MENU.map((m) => {
          const active = m.match ? m.match(pathname) : pathname === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                background: active
                  ? isDark
                    ? "rgba(123,112,238,0.18)"
                    : "rgba(123,112,238,0.10)"
                  : "transparent",
                color: active ? (isDark ? "#bcb3ff" : "#5b50d6") : T.text.secondary,
              }}
            >
              <span style={{ color: active ? (isDark ? "#bcb3ff" : "#5b50d6") : T.text.muted }}>
                {m.icon}
              </span>
              <span>{m.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 */}
      <div className="px-3 py-3 space-y-2" style={{ borderTop: `1px solid ${T.border}` }}>
        {/* 로그인된 사용자 정보 */}
        {user && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md"
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(26,28,51,0.04)" }}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? ""}
                width={24}
                height={24}
                className="rounded-full shrink-0"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{ background: "linear-gradient(135deg, #7B70EE, #00CFAA)", color: "#fff" }}
              >
                {user.name?.[0] ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate" style={{ color: T.text.primary }}>
                {user.name ?? "—"}
              </p>
              <p className="text-[10px] truncate" style={{ color: T.text.muted }}>
                {user.email ?? ""}
              </p>
            </div>
          </div>
        )}

        {/* 로그아웃 */}
        {user && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: T.text.muted, cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>로그아웃</span>
          </button>
        )}

        {/* 테마 토글 */}
        <button
          onClick={toggle}
          disabled={!mounted}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(26,28,51,0.04)",
            color: T.text.secondary,
          }}
        >
          <span>{isDark ? "다크 모드" : "라이트 모드"}</span>
          <span style={{ color: T.text.muted }}>
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
              </svg>
            )}
          </span>
        </button>
      </div>
    </aside>
  );
}
