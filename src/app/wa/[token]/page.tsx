"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface LinkStatus {
  valid: boolean;
  used: boolean;
  used_at?: string;
  participant_name?: string;
}

export default function WaRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkToken() {
      try {
        const res = await fetch(`/api/wa/redeem?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          throw new Error("Link tidak valid atau sudah kadaluarsa.");
        }
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memverifikasi tautan.");
      } finally {
        setLoading(false);
      }
    }

    checkToken();
  }, [token]);

  async function handleJoin() {
    setJoining(true);
    setError("");

    try {
      const res = await fetch("/api/wa/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal bergabung ke grup.");
      }

      window.location.href = data.redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-slate-900 border-r-transparent mb-3" />
            <p className="text-sm text-slate-700">Memeriksa tautan undangan...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md liquid-glass rounded-3xl p-7 md:p-9 text-center border border-white/85 shadow-2xl">
          {error ? (
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4 shadow-sm border border-red-200">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">Tautan Tidak Valid</h1>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">{error}</p>
              <Link
                href="/"
                className="glass-btn-white inline-flex items-center justify-center w-full py-3 px-4 text-xs sm:text-sm font-bold shadow-md min-h-[44px]"
              >
                Kembali ke Beranda
              </Link>
            </div>
          ) : status?.used ? (
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-4 shadow-sm border border-amber-300">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">Tautan Sudah Digunakan</h1>
              <p className="text-xs sm:text-sm text-slate-700 mb-3 font-medium">
                Tautan grup WhatsApp ini bersifat sekali pakai (one-time join) dan telah diakses sebelumnya
                {status.used_at ? ` pada ${new Date(status.used_at).toLocaleString("id-ID")}` : ""}.
              </p>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Tautan ini tidak dapat digunakan kembali untuk mencegah penyebaran link ke pihak luar. Jika Anda tidak sengaja keluar grup atau butuh bantuan panitia, silakan hubungi admin.
              </p>
              <div className="space-y-2.5">
                <a
                  href={`https://wa.me/6283182061336?text=Halo%20Admin%20Panitia%2C%20tautan%20grup%20WhatsApp%20saya%20sudah%20pernah%20digunakan%20dan%20saya%20butuh%20bantuan%20bergabung.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-full transition shadow-md min-h-[44px] border border-white/60"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  Hubungi Admin Panitia WhatsApp
                </a>
                <Link
                  href="/"
                  className="glass-btn-white inline-flex items-center justify-center w-full py-2.5 px-4 text-xs font-bold min-h-[44px]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full liquid-glass-pill text-emerald-600 mb-4 shadow-md border-2 border-white/90">
                <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.302c-.087.087-.179.181-.077.355.101.174.449.741.964 1.2.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.679.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.13.332.202.043.072.043.419-.101.824z" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-1">
                Grup WhatsApp Peserta
              </h1>
              <p className="text-xs text-sky-700 mb-3 uppercase tracking-widest font-extrabold font-mono">
                SRC X HK X SAKRARUN
              </p>
              <p className="text-xs sm:text-sm text-slate-700 mb-6 leading-relaxed">
                Halo <strong>{status?.participant_name}</strong>! Tautan ini disiapkan khusus untuk Anda.
                Sesuai kebijakan keamanan, tautan ini hanya dapat digunakan <strong>1 kali</strong> untuk bergabung ke dalam grup.
              </p>

              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full glass-btn-blue text-sm font-bold py-3.5 px-4 shadow-xl min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? "Mengalihkan ke WhatsApp..." : "Gabung ke Grup WhatsApp Sekarang"}
              </button>

              <p className="text-[11px] text-slate-500 mt-4 font-medium">
                Klik tombol di atas untuk membuka aplikasi WhatsApp di ponsel atau peramban Anda.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
