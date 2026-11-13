import { NextRequest, NextResponse } from "next/server";
import { createRegistration, createPayment, findActivePaymentByEmailOrPhone } from "@/lib/db";
import { sendPaymentInstructionsEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { message: "Mohon maaf, pendaftaran resmi SRC X HK X SAKRARUN 2026 telah ditutup karena kuota peserta telah terpenuhi." },
    { status: 403 }
  );
}
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
