import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { deleteBillingRow } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rowIndex } = await req.json();
    await deleteBillingRow(Number(rowIndex));
    revalidateTag("billing", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing/delete] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
