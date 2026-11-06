import { NextRequest, NextResponse } from "next/server";
import { submitPaymentProof, getPayment } from "@/lib/db";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const paymentId = formData.get("payment_id") as string | null;
    const senderName = (formData.get("sender_name") as string | null) || "";

    if (!paymentId) {
      return NextResponse.json(
        { message: "ID Pembayaran tidak valid." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { message: "Silakan pilih foto / screenshot bukti transfer." },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Format file harus berupa gambar (JPG, PNG, atau WEBP)." },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maksimal 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "Ukuran gambar terlalu besar. Maksimal 5 MB." },
        { status: 400 }
      );
    }

    const currentPayment = await getPayment(paymentId);
    if (!currentPayment) {
      return NextResponse.json(
        { message: "Data pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan folder .data/proofs ada
    const proofsDir = path.join(process.cwd(), ".data", "proofs");
    if (!fs.existsSync(proofsDir)) {
      fs.mkdirSync(proofsDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dapatkan ekstensi yang aman
    const rawExt = path.extname(file.name || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(rawExt)
      ? rawExt
      : file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
      ? ".webp"
      : ".jpg";

    const fileName = `proof_${paymentId.slice(0, 8)}_${Date.now()}_${randomUUID().slice(0, 4)}${safeExt}`;
    const filePath = path.join(proofsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const proofUrl = `/api/proof/${fileName}`;

    await submitPaymentProof(paymentId, {
      proofImage: proofUrl,
      senderName: senderName.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi panitia.",
      proof_url: proofUrl,
    });
  } catch (err) {
    console.error("Upload proof API error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Gagal mengunggah bukti pembayaran." },
      { status: 500 }
    );
  }
}
