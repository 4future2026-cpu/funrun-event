import { NextRequest, NextResponse } from "next/server";
import { getAllRegistrationsWithPayments } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("admin_session")?.value;
    const authHeader = req.headers.get("authorization");

    // Validasi session cookie atau bearer
    if (session !== "authenticated_sakrarun_2026" && authHeader !== "Bearer authenticated_sakrarun_2026") {
      return NextResponse.json({ message: "Akses tidak diizinkan. Silakan login." }, { status: 401 });
    }

    const participants = await getAllRegistrationsWithPayments();
    return NextResponse.json({ participants });
  } catch (err) {
    console.error("Admin participants error:", err);
    return NextResponse.json({ message: "Gagal memuat daftar peserta." }, { status: 500 });
  }
}
