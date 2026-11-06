import { NextRequest, NextResponse } from "next/server";
import { getPayment, confirmPayment } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payment_id, method } = body;

    if (!payment_id) {
      return NextResponse.json({ message: "ID Pembayaran tidak valid." }, { status: 400 });
    }

    const currentPayment = await getPayment(payment_id);
    if (!currentPayment) {
      return NextResponse.json({ message: "Pembayaran tidak ditemukan." }, { status: 404 });
    }

    const defaultWaGroup =
      process.env.WA_GROUP_INVITE_URL || "https://chat.whatsapp.com/SrcHkFunRun2026Official";

    const selectedMethod = (method as "QRIS" | "Dana" | "GoPay") || currentPayment.method;

    const result = await confirmPayment(payment_id, selectedMethod, defaultWaGroup);

    // Build base URL for the one-time link
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const waJoinUrl = `${protocol}://${host}/wa/${result.token}`;

    // Trigger confirmation email
    await sendConfirmationEmail({
      to: currentPayment.registration.email,
      fullName: currentPayment.registration.full_name,
      schoolOrigin: currentPayment.registration.school_origin,
      category: currentPayment.registration.category || "Fun Run",
      paymentCode: currentPayment.payment_code,
      amount: currentPayment.amount,
      method: selectedMethod,
      paidAt: new Date().toISOString(),
      waJoinUrl,
    });

    return NextResponse.json({ success: true, token: result.token });
  } catch (err) {
    console.error("Confirm payment API error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Terjadi kesalahan saat konfirmasi." },
      { status: 500 }
    );
  }
}
