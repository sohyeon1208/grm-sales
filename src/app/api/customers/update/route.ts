import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { updateCustomerFields } from "@/lib/customers";
import type { Customer } from "@/lib/customers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, patch } = body as {
      key: string;
      patch: Partial<Omit<Customer, "rowIndex">>;
    };

    if (!key || !patch) {
      return NextResponse.json({ ok: false, reason: "key와 patch가 필요합니다" }, { status: 400 });
    }

    const result = await updateCustomerFields(key, patch);
    if (!result.ok) {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: 404 });
    }
    revalidateTag("customers", { expire: 0 });
    return NextResponse.json({ ok: true, rowIndex: result.rowIndex });
  } catch (err) {
    console.error("[api/customers/update]", err);
    return NextResponse.json({ ok: false, reason: "서버 오류" }, { status: 500 });
  }
}
