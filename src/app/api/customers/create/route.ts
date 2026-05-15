import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { addCustomer, findCustomerByKey } from "@/lib/customers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const 그룹명 = String(body.그룹명 ?? "").trim();
    const 영업활동명 = String(body.영업활동명 ?? "").trim();

    if (!그룹명 || !영업활동명) {
      return NextResponse.json(
        { ok: false, reason: "그룹명과 영업활동명은 필수입니다" },
        { status: 400 }
      );
    }

    // 영업활동명 중복 체크
    const existing = await findCustomerByKey(영업활동명);
    if (existing) {
      return NextResponse.json(
        { ok: false, reason: "이미 같은 영업활동명의 고객이 있습니다" },
        { status: 409 }
      );
    }

    await addCustomer({
      그룹명,
      영업활동명,
      그룹ID: String(body.그룹ID ?? "").trim(),
      영업단계: String(body.영업단계 ?? "").trim(),
      그룹유형: String(body.그룹유형 ?? "").trim(),
      정산주기: String(body.정산주기 ?? "").trim(),
      정산일: String(body.정산일 ?? "").trim(),
      요금: String(body.요금 ?? "").trim(),
      청구방법: String(body.청구방법 ?? "").trim(),
      계약비고: String(body.계약비고 ?? "").trim(),
      정산담당자: String(body.정산담당자 ?? "").trim(),
      정산방법: String(body.정산방법 ?? "").trim(),
      계약항목: String(body.계약항목 ?? "").trim(),
      세금계산서고객사명: String(body.세금계산서고객사명 ?? "").trim(),
      계약만료일: String(body.계약만료일 ?? "").trim(),
      라이선스수: String(body.라이선스수 ?? "").trim(),
      MAU: String(body.MAU ?? "").trim(),
      계약시작일: String(body.계약시작일 ?? "").trim(),
    });

    revalidateTag("customers", { expire: 0 });
    return NextResponse.json({ ok: true, key: 영업활동명 });
  } catch (err) {
    console.error("[api/customers/create] failed", err);
    return NextResponse.json({ ok: false, reason: "서버 오류" }, { status: 500 });
  }
}
