import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { setBillingPayment } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rowIndex, value } = await req.json();
  await setBillingPayment(Number(rowIndex), String(value ?? ""));

  return NextResponse.json({ ok: true });
}
