import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { deleteHistory } from "@/lib/history";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, reason: "인증 필요" }, { status: 401 });

    const body = await req.json();
    const source = body.source as "archive" | "input";
    const rowIndex = Number(body.rowIndex);

    if (!source || !rowIndex || isNaN(rowIndex)) {
      return NextResponse.json({ ok: false, reason: "source·rowIndex는 필수입니다" }, { status: 400 });
    }

    await deleteHistory(source, rowIndex);
    revalidateTag("history", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/history/delete] failed", err);
    return NextResponse.json({ ok: false, reason: "서버 오류" }, { status: 500 });
  }
}
