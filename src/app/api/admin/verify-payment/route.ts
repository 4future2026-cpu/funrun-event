import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentByAdmin } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("admin_session")?.value;
    const authHeader = req.headers.get("authorization");

    if (
      session !== "authenticated_sakrarun_2026" &&
      authHeader !== "Bearer authenticated_sakrarun_2026"
    ) {
      return NextResponse.json(
        { message: "Akses tidak diizinkan. Silakan login sebagai admin." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { payment_id, action, reason } = body || {};

    if (!payment_id || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { message: "Parameter payment_id dan action (approve/reject) wajib diisi." },
        { status: 400 }
      );
    }

    const defaultWaGroup =
      process.env.WA_GROUP_INVITE_URL || "https://chat.whatsapp.com/D6XbT9VoNkz0SPQ6A2OfgF?s=cl&p=i&mlu=4&ilr=4&iam=2";

    const result = await verifyPaymentByAdmin(payment_id, action, {
      reason,
      waGroupUrl: defaultWaGroup,
    });

    // Jika disetujui, kirimkan email konfirmasi + link WA
    if (action === "approve" && result.registration && result.payment && result.token) {
      const host = req.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      const waJoinUrl = `${protocol}://${host}/wa/${result.token}`;

      await sendConfirmationEmail({
        to: result.registration.email,
        fullName: result.registration.full_name,
        schoolOrigin: result.registration.school_origin,
        category: result.registration.category || "Fun Run",
        paymentCode: result.payment.payment_code,
        amount: result.payment.amount,
        method: result.payment.method,
        paidAt: result.payment.paid_at || new Date().toISOString(),
        waJoinUrl,
      });
    }

    return NextResponse.json({
      success: true,
      action,
      status: result.status,
      message:
        action === "approve"
          ? "Pembayaran berhasil diverifikasi dan disetujui. Tiket & link grup WhatsApp telah diterbitkan."
          : "Pembayaran telah ditolak.",
    });
  } catch (err) {
    console.error("Admin verify payment error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Terjadi kesalahan saat memverifikasi pembayaran." },
      { status: 500 }
    );
  }
}
