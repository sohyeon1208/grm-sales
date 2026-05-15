import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { updateHistory } from "@/lib/history";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, reason: "인증 필요" }, { status: 401 });

    const body = await req.json();
    const source = body.source as "archive" | "input";
    const rowIndex = Number(body.rowIndex);
    const 날짜 = String(body.날짜 ?? "").trim();
    const 유형 = String(body.유형 ?? "").trim();
    const 내용 = String(body.내용 ?? "").trim();

    if (!source || !rowIndex || isNaN(rowIndex) || !날짜 || !유형 || !내용) {
      return NextResponse.json({ ok: false, reason: "필수 항목이 누락됐습니다" }, { status: 400 });
    }

    await updateHistory(source, rowIndex, { 날짜, 유형, 내용 });
    revalidateTag("history", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/history/update] failed", err);
    return NextResponse.json({ ok: false, reason: "서버 오류" }, { status: 500 });
  }
}
