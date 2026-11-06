import { NextRequest, NextResponse } from "next/server";
import { createRegistration, createPayment, findActivePaymentByEmailOrPhone } from "@/lib/db";
import { sendPaymentInstructionsEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Format payload JSON tidak valid." },
      { status: 400 }
    );
  }

  try {
    const { full_name, email, phone, school_origin } = body || {};

    if (!full_name || !email || !phone || !school_origin) {
      return NextResponse.json(
        { message: "Semua kolom formulir wajib diisi, termasuk asal sekolah." },
        { status: 400 }
      );
    }

    const trimmedName = full_name.trim();
    if (trimmedName.length < 3) {
      return NextResponse.json(
        { message: "Nama lengkap harus diisi dengan benar (minimal 3 karakter)." },
        { status: 400 }
      );
    }

    // Validasi email: wajib domain @gmail.com
    const normalizedEmail = email.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Wajib menggunakan alamat email resmi @gmail.com yang aktif (contoh: nama@gmail.com)." },
        { status: 400 }
      );
    }

    // Validasi nomor WhatsApp: nomor ponsel Indonesia aktif (08xx / 628xx, 10-13 digit)
    const cleanPhone = phone.trim().replace(/[\s-]/g, "");
    const indonesianPhoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
    if (!indonesianPhoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { message: "Nomor WhatsApp harus nomor ponsel aktif Indonesia yang valid (diawali 08 atau 628, 10–13 digit)." },
        { status: 400 }
      );
    }

    const validSchools = ["SMAN 1 SLAWI", "SMAN 1 KRAMAT"];
    if (!validSchools.includes(school_origin.trim())) {
      return NextResponse.json(
        { message: "Pilih asal sekolah yang valid (SMAN 1 SLAWI atau SMAN 1 KRAMAT)." },
        { status: 400 }
      );
    }

    // Cek apakah email atau nomor WA sudah memiliki sesi tagihan aktif yang belum kadaluarsa
    const existing = await findActivePaymentByEmailOrPhone(normalizedEmail, cleanPhone);
    if (existing) {
      if (existing.status === "paid") {
        return NextResponse.json(
          {
            message: "Email atau nomor WhatsApp ini sudah terdaftar dan berstatus LUNAS. Silakan cek tiket di menu konfirmasi.",
            payment_id: existing.paymentId,
            status: "paid",
          },
          { status: 400 }
        );
      }

      if (existing.active) {
        // Tagihan masih dalam batas waktu 24 jam (pending atau waiting_verification)
        return NextResponse.json({
          payment_id: existing.paymentId,
          resumed: true,
          message: "Sesi tagihan pembayaran sebelumnya masih aktif. Mengalihkan ke pembayaran...",
        });
      }
    }

    // Biaya pendaftaran Rp 10.000 + Kode Unik 3 Digit (100 - 999) untuk verifikasi otomatis/panitia
    const uniqueCode = Math.floor(Math.random() * 900) + 100;
    const amount = 10000 + uniqueCode;
    const paymentCode = `SRCXHK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;

    const registration = await createRegistration({
      full_name: trimmedName,
      email: normalizedEmail,
      phone: cleanPhone,
      school_origin: school_origin.trim(),
      category: "Fun Run",
    });

    const payment = await createPayment(registration.id, amount, paymentCode, uniqueCode);

    // Kirim email instruksi pembayaran awal (invoice link) ke peserta
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const paymentUrl = `${protocol}://${host}/pembayaran/${payment.id}`;

    await sendPaymentInstructionsEmail({
      to: normalizedEmail,
      fullName: trimmedName,
      schoolOrigin: school_origin.trim(),
      paymentCode,
      amount,
      uniqueCode,
      expiresAt: payment.expires_at,
      paymentUrl,
    });

    return NextResponse.json({ payment_id: payment.id, resumed: false });
  } catch (err) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
