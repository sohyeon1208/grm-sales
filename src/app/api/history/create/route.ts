import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { addHistory } from "@/lib/history";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userName = session?.user?.name ?? null;

    const body = await req.json();
    const 날짜 = String(body.날짜 ?? "").trim();
    const 유형 = String(body.유형 ?? "").trim();
    const 영업활동명 = String(body.영업활동명 ?? "").trim();
    const 내용Raw = String(body.내용 ?? "").trim();

    if (!날짜 || !유형 || !영업활동명 || !내용Raw) {
      return NextResponse.json(
        { ok: false, reason: "날짜·유형·영업활동명·내용은 필수입니다" },
        { status: 400 }
      );
    }

    // 작성자 정보를 내용 끝에 포함 (시트에 별도 열 추가 없이)
    const 내용 = userName ? `${내용Raw}\n\n✍ 작성: ${userName}` : 내용Raw;

    await addHistory({
      날짜,
      유형,
      영업활동명,
      그룹ID: String(body.그룹ID ?? "").trim(),
      영업단계: String(body.영업단계 ?? "").trim(),
      내용,
    });

    revalidateTag("history", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/history/create] failed", err);
    return NextResponse.json({ ok: false, reason: "서버 오류" }, { status: 500 });
  }
}
