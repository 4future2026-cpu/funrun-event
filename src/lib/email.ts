export interface EmailPayload {
  to: string;
  fullName: string;
  schoolOrigin?: string;
  category?: string;
  paymentCode: string;
  amount: number;
  method: string;
  paidAt: string;
  waJoinUrl: string;
}

export function generateReceiptEmailHtml(payload: EmailPayload): string {
  const formattedAmount = `Rp ${payload.amount.toLocaleString("id-ID")}`;
  const formattedDate = new Date(payload.paidAt).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Bukti Pendaftaran SRC X HK X SAKRARUN</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1320; margin: 0; padding: 24px; color: #f1f5f9;">
  <div style="max-width: 580px; margin: 0 auto; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; overflow: hidden; backdrop-filter: blur(20px);">
    <div style="background: rgba(15, 23, 42, 0.85); padding: 24px; text-align: center; color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">SRC X HK X SAKRARUN</h1>
      <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Bukti Pembayaran & Konfirmasi Pendaftaran</p>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Halo <strong>${payload.fullName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px;">
        Pembayaran Anda telah berhasil diverifikasi. Berikut adalah rincian pendaftaran resmi Anda:
      </p>

      <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #f1f5f9;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Kode Pembayaran</td>
            <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right;">${payload.paymentCode}</td>
          </tr>
          ${payload.schoolOrigin ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Asal Sekolah</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${payload.schoolOrigin}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Metode Bayar</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${payload.method}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Tanggal Lunas</td>
            <td style="padding: 6px 0; text-align: right;">${formattedDate}</td>
          </tr>
          <tr style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px 0 0; font-weight: 700; color: #ffffff;">Total Dibayar</td>
            <td style="padding: 10px 0 0; font-weight: 700; color: #ffffff; text-align: right; font-size: 15px;">${formattedAmount}</td>
          </tr>
        </table>
      </div>

      <div style="border-left: 3px solid #38bdf8; padding-left: 14px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #ffffff;">Link Grup WhatsApp Peserta (1x Pakai)</h3>
        <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Gunakan tautan di bawah untuk bergabung ke grup WhatsApp resmi peserta. Tautan ini bersifat privat dan hanya dapat dibuka satu kali.
        </p>
        <a href="${payload.waJoinUrl}" style="display: inline-block; background-color: #ffffff; color: #0f172a; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 6px;">
          Gabung Grup WhatsApp &rarr;
        </a>
      </div>

      <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px;">
        <p style="margin: 0 0 4px;"><strong>Info Pengambilan Race Pack:</strong></p>
        <p style="margin: 0 0 12px;">Pengambilan BIB & Race Pack pada H-1 di Venue Utama pukul 09.00 - 18.00 WIB. Tunjukkan email bukti ini beserta kartu identitas.</p>
        <p style="margin: 0;">Butuh bantuan? Hubungi WhatsApp panitia di +62 831-8206-1336.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendConfirmationEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "SRC X HK X SAKRARUN <noreply@srchkfunrun.com>",
          to: payload.to,
          subject: "Bukti Pembayaran & Pendaftaran SRC X HK X SAKRARUN",
          html: generateReceiptEmailHtml(payload),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Resend API error:", errorData);
      } else {
        console.log(`[Email] Sukses terkirim via Resend ke ${payload.to}`);
      }
      return;
    } catch (err) {
      console.error("Failed to send email via Resend:", err);
    }
  }

  console.log("--------------------------------------------------");
  console.log(`[EMAIL SIMULATION] To: ${payload.to}`);
  console.log(`[EMAIL SIMULATION] Subject: Bukti Pendaftaran SRC X HK X SAKRARUN`);
  console.log(`[EMAIL SIMULATION] WhatsApp Join URL: ${payload.waJoinUrl}`);
  console.log("--------------------------------------------------");
}

export interface PaymentInstructionsPayload {
  to: string;
  fullName: string;
  schoolOrigin?: string;
  paymentCode: string;
  amount: number;
  uniqueCode?: number;
  expiresAt: string;
  paymentUrl: string;
}

export function generatePaymentInstructionsEmailHtml(payload: PaymentInstructionsPayload): string {
  const formattedAmount = `Rp ${payload.amount.toLocaleString("id-ID")}`;
  const formattedExpiry = new Date(payload.expiresAt).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Instruksi Pembayaran SRC X HK X SAKRARUN</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1320; margin: 0; padding: 24px; color: #f1f5f9;">
  <div style="max-width: 580px; margin: 0 auto; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; overflow: hidden; backdrop-filter: blur(20px);">
    <div style="background: rgba(15, 23, 42, 0.85); padding: 24px; text-align: center; color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">SRC X HK X SAKRARUN</h1>
      <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Instruksi Pembayaran Pendaftaran</p>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Halo <strong>${payload.fullName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px;">
        Pendaftaran Anda telah tercatat di sistem kami. Silakan selesaikan pembayaran dan unggah bukti transfer sebelum batas waktu berakhir untuk mengamankan slot Anda.
      </p>

      <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #f1f5f9;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Kode Transaksi</td>
            <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right;">${payload.paymentCode}</td>
          </tr>
          ${payload.schoolOrigin ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Asal Sekolah</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right;">${payload.schoolOrigin}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Batas Waktu (24 Jam)</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #fbbf24;">${formattedExpiry}</td>
          </tr>
          <tr style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px 0 0; font-weight: 700; color: #ffffff;">Total Transfer Tepat</td>
            <td style="padding: 10px 0 0; font-weight: 700; color: #ffffff; text-align: right; font-size: 16px;">${formattedAmount}</td>
          </tr>
        </table>
        ${payload.uniqueCode ? `<p style="margin: 8px 0 0; font-size: 11px; color: #38bdf8; text-align: right;">(Termasuk kode unik verifikasi: Rp ${payload.uniqueCode})</p>` : ""}
      </div>

      <div style="border-left: 3px solid #38bdf8; padding-left: 14px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #ffffff;">Lanjutkan Pembayaran Kapan Saja</h3>
        <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Jika Anda menutup browser atau ingin membayar dari perangkat lain, Anda tidak perlu mengisi formulir pendaftaran ulang. Klik tombol di bawah ini:
        </p>
        <a href="${payload.paymentUrl}" style="display: inline-block; background-color: #ffffff; color: #0f172a; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 22px; border-radius: 8px;">
          Buka Halaman Pembayaran & Unggah Bukti &rarr;
        </a>
      </div>

      <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px;">
        <p style="margin: 0 0 4px;"><strong>Penting:</strong></p>
        <p style="margin: 0 0 12px;">Transfer tepat hingga 3 digit terakhir untuk memudahkan verifikasi mutasi panitia. Bukti pendaftaran resmi dan tautan grup WhatsApp akan diterbitkan otomatis setelah verifikasi.</p>
        <p style="margin: 0;">Butuh bantuan? Hubungi WhatsApp panitia di +62 831-8206-1336.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPaymentInstructionsEmail(payload: PaymentInstructionsPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "SRC X HK X SAKRARUN <noreply@srchkfunrun.com>",
          to: payload.to,
          subject: "Instruksi Pembayaran SRC X HK X SAKRARUN",
          html: generatePaymentInstructionsEmailHtml(payload),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Resend API error:", errorData);
      } else {
        console.log(`[Email] Sukses terkirim instruksi pembayaran ke ${payload.to}`);
      }
      return;
    } catch (err) {
      console.error("Failed to send payment instructions email via Resend:", err);
    }
  }

  console.log("--------------------------------------------------");
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] To: ${payload.to}`);
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] Subject: Instruksi Pembayaran SRC X HK X SAKRARUN`);
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] Payment URL: ${payload.paymentUrl}`);
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] Amount: Rp ${payload.amount}`);
  console.log("--------------------------------------------------");
}
