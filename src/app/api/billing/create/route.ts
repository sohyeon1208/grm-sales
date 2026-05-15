import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { addBillingRow } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const 날짜 = String(body.날짜 ?? "").trim();
    const [year, month] = 날짜.split("-");

    const rowIndex = await addBillingRow({
      날짜,
      연도: year ?? "",
      월: month ? String(Number(month)) : "",
      고객사: String(body.고객사 ?? "").trim(),
      서비스: String(body.서비스 ?? "").trim(),
      서비스분류: String(body.서비스분류 ?? "").trim(),
      공급가액: String(body.공급가액 ?? "").trim(),
      부가세포함: String(body.부가세포함 ?? "").trim(),
      사업부문: String(body.사업부문 ?? "").trim(),
    });

    revalidateTag("billing", { expire: 0 });
    return NextResponse.json({ ok: true, rowIndex });
  } catch (err) {
    console.error("[billing/create] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
