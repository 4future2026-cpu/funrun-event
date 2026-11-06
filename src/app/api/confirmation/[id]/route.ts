import { NextRequest, NextResponse } from "next/server";
import { getConfirmation } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const confirmation = await getConfirmation(id);

    if (!confirmation) {
      return NextResponse.json({ message: "Data konfirmasi tidak ditemukan atau belum lunas." }, { status: 404 });
    }

    return NextResponse.json(confirmation);
  } catch (err) {
    console.error("Get confirmation error:", err);
    return NextResponse.json({ message: "Gagal memuat data konfirmasi." }, { status: 500 });
  }
}
