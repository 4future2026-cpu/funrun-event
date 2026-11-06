import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Sanitasi filename untuk mencegah directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), ".data", "proofs", safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "File bukti pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("Serve proof error:", err);
    return NextResponse.json(
      { message: "Gagal memuat gambar bukti pembayaran." },
      { status: 500 }
    );
  }
}
