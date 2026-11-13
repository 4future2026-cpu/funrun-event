import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      message:
        "Mohon maaf, pendaftaran resmi SRC X HK X SAKRARUN 2026 telah ditutup karena kuota peserta telah terpenuhi.",
    },
    { status: 403 }
  );
}
