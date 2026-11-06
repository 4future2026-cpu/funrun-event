import nodemailer from "nodemailer";

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

function getMailTransporter() {
  const smtpUser = process.env.BREVO_SMTP_USER;
  const smtpPass = process.env.BREVO_SMTP_KEY;

  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendConfirmationEmail(payload: EmailPayload) {
  try {
    const transporter = getMailTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: '"SRC X HK X SAKRARUN" <4future2026@gmail.com>',
        to: payload.to,
        subject: "Bukti Pembayaran & Tiket SRC X HK X SAKRARUN 2026",
        html: generateReceiptEmailHtml(payload),
      });
      console.log(`[Email] Sukses terkirim via Brevo ke ${payload.to} (${info.messageId})`);
      return;
    }
  } catch (err) {
    console.error("Gagal mengirim email konfirmasi via Brevo:", err);
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
        Terima kasih telah mendaftar di ajang <strong>SRC X HK X SAKRARUN 2026</strong>. Silakan selesaikan pembayaran sebelum batas waktu berikut:
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
          ${payload.uniqueCode ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Kode Unik</td>
            <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right; color: #38bdf8;">+${payload.uniqueCode}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Batas Waktu</td>
            <td style="padding: 6px 0; text-align: right; color: #f59e0b;">${formattedExpiry}</td>
          </tr>
          <tr style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 10px 0 0; font-weight: 700; color: #ffffff;">Total Transfer</td>
            <td style="padding: 10px 0 0; font-weight: 700; color: #38bdf8; text-align: right; font-size: 16px;">${formattedAmount}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px;">
          Klik tombol di bawah untuk melihat kode QRIS dan mengunggah bukti transfer Anda:
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
  try {
    const transporter = getMailTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: '"SRC X HK X SAKRARUN" <4future2026@gmail.com>',
        to: payload.to,
        subject: "Instruksi Pembayaran SRC X HK X SAKRARUN 2026",
        html: generatePaymentInstructionsEmailHtml(payload),
      });
      console.log(`[Email] Sukses terkirim instruksi pembayaran via Brevo ke ${payload.to} (${info.messageId})`);
      return;
    }
  } catch (err) {
    console.error("Gagal mengirim email instruksi via Brevo:", err);
  }

  console.log("--------------------------------------------------");
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] To: ${payload.to}`);
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] Subject: Instruksi Pembayaran SRC X HK X SAKRARUN`);
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] Payment URL: ${payload.paymentUrl}`);
  console.log(`[EMAIL SIMULATION - INSTRUCTIONS] Amount: Rp ${payload.amount}`);
  console.log("--------------------------------------------------");
}
