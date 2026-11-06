import { NextRequest, NextResponse } from "next/server";
import { getAllRegistrationsWithPayments } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("admin_session")?.value;
    const authHeader = req.headers.get("authorization");

    if (session !== "authenticated_sakrarun_2026" && authHeader !== "Bearer authenticated_sakrarun_2026") {
      return NextResponse.json({ message: "Akses tidak diizinkan." }, { status: 401 });
    }

    const participants = await getAllRegistrationsWithPayments();

    const headers = [
      "No",
      "Nama Lengkap",
      "Asal Sekolah",
      "Email",
      "No WhatsApp",
      "Nominal (Rp)",
      "Status",
      "Metode Pembayaran",
      "Kode Transaksi",
      "Waktu Pembayaran",
      "Token WhatsApp",
    ];

    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = participants.map((p, idx) => [
      idx + 1,
      escapeCsv(p.registration.full_name),
      escapeCsv(p.registration.school_origin),
      escapeCsv(p.registration.email),
      escapeCsv(`'${p.registration.phone}`), // Format string untuk Excel agar 0 di depan tidak hilang
      p.amount,
      escapeCsv(p.status.toUpperCase()),
      escapeCsv(p.method),
      escapeCsv(p.payment_code),
      escapeCsv(p.paid_at ? new Date(p.paid_at).toLocaleString("id-ID") : "-"),
      escapeCsv(p.wa_token || "-"),
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM agar terbaca sempurna di Microsoft Excel
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rekap_peserta_SRC_X_HK_X_SAKRARUN.csv"',
      },
    });
  } catch (err) {
    console.error("Export CSV error:", err);
    return NextResponse.json({ message: "Gagal mengunduh CSV." }, { status: 500 });
  }
}
