import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await getPayment(id);

    if (!payment) {
      return NextResponse.json({ message: "Data peserta tidak ditemukan." }, { status: 404 });
    }

    const cleanName = payment.registration.full_name
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanSchool = (payment.registration.school_origin || "UMUM")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const fileName = `${cleanName}_${cleanSchool}.json`;

    const content = {
      nama_peserta: payment.registration.full_name,
      asal_sekolah: payment.registration.school_origin,
      email: payment.registration.email,
      no_whatsapp: payment.registration.phone,
      event: "SRC X HK X SAKRARUN",
      kode_pembayaran: payment.payment_code,
      nominal: payment.amount,
      status_pembayaran: payment.status === "paid" ? "LUNAS" : payment.status,
      waktu_pembayaran: payment.paid_at || null,
      metode_pembayaran: payment.method,
      diunduh_pada: new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(content, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ message: "Gagal mengunduh file data peserta." }, { status: 500 });
  }
}
