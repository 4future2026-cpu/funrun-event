import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const payment = await getPayment(id);

    if (!payment) {
      return NextResponse.json({ message: "Data pembayaran tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (err) {
    console.error("Get payment error for id:", id, err);
    return NextResponse.json({ message: "Gagal memuat data pembayaran.", error: String(err) }, { status: 500 });
  }
}
