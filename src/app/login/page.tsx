import { signIn } from "@/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F0F2F8",
      }}
    >
      <div
        style={{
          width: 380,
          padding: "44px 40px",
          borderRadius: 20,
          background: "#ffffff",
          border: "1px solid rgba(26,28,51,0.08)",
          boxShadow: "0 8px 40px rgba(26,28,51,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* 로고 */}
        <div style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gooroomee-logo.png"
            alt="Gooroomee"
            style={{ width: 100, height: 76, margin: "0 auto 14px", display: "block", objectFit: "contain" }}
          />
          <h1 style={{ color: "rgba(26,28,51,0.9)", fontSize: 22, fontWeight: 700, margin: 0 }}>
            Gooroomee Sales
          </h1>
          <p style={{ color: "rgba(26,28,51,0.4)", fontSize: 13, marginTop: 6 }}>
            매출 · 고객 관리 시스템
          </p>
        </div>

        {/* 오류 메시지 */}
        <ErrorMessage searchParams={searchParams} />

        {/* Google 로그인 버튼 */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          style={{ width: "100%" }}
        >
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 10,
              border: "1px solid rgba(26,28,51,0.13)",
              background: "#ffffff",
              color: "rgba(26,28,51,0.8)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 1px 4px rgba(26,28,51,0.07)",
            }}
          >
            <GoogleIcon />
            Google 계정으로 로그인
          </button>
        </form>

        <p style={{ color: "rgba(26,28,51,0.3)", fontSize: 11, textAlign: "center" }}>
          @gooroomee.com 계정만 접속 가능합니다
        </p>
      </div>
    </div>
  );
}

async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;

  const msg =
    params.error === "AccessDenied"
      ? "@gooroomee.com 계정만 로그인할 수 있습니다"
      : "로그인 중 오류가 발생했습니다";

  return (
    <div
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 8,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "#dc2626",
        fontSize: 13,
        textAlign: "center",
      }}
    >
      {msg}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
