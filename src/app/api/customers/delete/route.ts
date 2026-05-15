import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { deleteCustomer } from "@/lib/customers";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, reason: "인증 필요" }, { status: 401 });

    const body = await req.json();
    const key = String(body.key ?? "").trim();
    if (!key) {
      return NextResponse.json({ ok: false, reason: "key가 필요합니다" }, { status: 400 });
    }

    const result = await deleteCustomer(key);
    if (!result.ok) {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: 404 });
    }
    revalidateTag("customers", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/customers/delete] failed", err);
    return NextResponse.json({ ok: false, reason: "서버 오류" }, { status: 500 });
  }
}
