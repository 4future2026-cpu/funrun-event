import { NextRequest, NextResponse } from "next/server";
import { deleteRegistrationAndPayment } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("admin_session")?.value;
    const authHeader = req.headers.get("authorization");

    if (
      session !== "authenticated_sakrarun_2026" &&
      authHeader !== "Bearer authenticated_sakrarun_2026"
    ) {
      return NextResponse.json({ message: "Akses tidak diizinkan." }, { status: 401 });
    }

    const body = await req.json();
    const { payment_id } = body;

    if (!payment_id) {
      return NextResponse.json({ message: "ID Pembayaran tidak valid." }, { status: 400 });
    }

    const success = await deleteRegistrationAndPayment(payment_id);
    if (!success) {
      return NextResponse.json({ message: "Data tidak ditemukan atau gagal dihapus." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Data pendaftar berhasil dihapus permanen." });
  } catch (err) {
    console.error("Delete participant error:", err);
    return NextResponse.json({ message: "Gagal menghapus data pendaftar." }, { status: 500 });
  }
}
