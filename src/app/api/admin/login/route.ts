import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanPassword = typeof body?.password === "string" ? body.password.trim() : "";

    const correctPassword = process.env.ADMIN_PIN || "funrun5k2026";

    if (!cleanPassword || cleanPassword.toLowerCase() !== correctPassword.toLowerCase()) {
      return NextResponse.json({ message: "Password / PIN panitia salah." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      token: "authenticated_sakrarun_2026",
    });
    response.cookies.set("admin_session", "authenticated_sakrarun_2026", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
