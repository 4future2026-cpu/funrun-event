import { NextRequest, NextResponse } from "next/server";
import { getWaLinkByToken, markWaLinkUsed } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ message: "Token diperlukan" }, { status: 400 });
    }

    const link = await getWaLinkByToken(token);

    if (!link) {
      return NextResponse.json({ message: "Link tidak ditemukan atau tidak valid." }, { status: 404 });
    }

    if (link.used) {
      return NextResponse.json({
        message: "Link ini sudah pernah digunakan.",
        used: true,
        used_at: link.used_at,
      }, { status: 410 });
    }

    // Mark as used
    await markWaLinkUsed(token);

    return NextResponse.json({
      success: true,
      redirect_url: link.wa_group_url,
    });
  } catch (err) {
    console.error("Redeem WA link error:", err);
    return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token diperlukan" }, { status: 400 });
  }

  const link = await getWaLinkByToken(token);

  if (!link) {
    return NextResponse.json({ message: "Link tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    used: link.used,
    used_at: link.used_at,
    participant_name: link.registration?.full_name || "Peserta",
  });
}
