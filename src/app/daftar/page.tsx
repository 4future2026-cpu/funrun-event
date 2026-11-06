"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ActivePaymentSession {
  paymentId: string;
  fullName: string;
  amount: number;
  expiresAt: string;
  status: string;
}

export default function DaftarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSession, setActiveSession] = useState<ActivePaymentSession | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sakrarun_active_payment");
      if (stored) {
        const parsed = JSON.parse(stored) as ActivePaymentSession;
        const isNotExpired = new Date(parsed.expiresAt) > new Date();
        const isUnpaid = parsed.status !== "paid";

        if (isNotExpired && isUnpaid && parsed.paymentId) {
          setActiveSession(parsed);
        } else {
          localStorage.removeItem("sakrarun_active_payment");
        }
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  function handleDismissSession() {
    try {
      localStorage.removeItem("sakrarun_active_payment");
    } catch {}
    setActiveSession(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const fullName = (form.get("full_name") as string)?.trim();
    const email = (form.get("email") as string)?.trim().toLowerCase();
    const phone = (form.get("phone") as string)?.trim().replace(/[\s-]/g, "");
    const schoolOrigin = form.get("school_origin") as string;

    // Validasi Nama Lengkap
    if (!fullName || fullName.length < 3) {
      setError("Nama lengkap harus diisi dengan benar (minimal 3 karakter).");
      return;
    }

    // Validasi Email: Wajib @gmail.com
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!email || !gmailRegex.test(email)) {
      setError("Email wajib menggunakan akun resmi @gmail.com yang aktif (contoh: nama@gmail.com).");
      return;
    }

    // Validasi Nomor WhatsApp: Nomor aktif Indonesia (08/628, 10-13 digit)
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
    if (!phone || !phoneRegex.test(phone)) {
      setError("Nomor WhatsApp harus nomor ponsel aktif Indonesia yang valid (diawali 08 atau 628, 10–13 digit).");
      return;
    }

    // Validasi Asal Sekolah
    if (!schoolOrigin) {
      setError("Silakan pilih asal sekolah Anda.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          school_origin: schoolOrigin,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal mendaftar");
      }

      router.push(`/pembayaran/${result.payment_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-8 md:py-14">
        <div className="max-w-xl mx-auto px-4">
          <div className="mb-6 text-center md:text-left">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold text-white/80 hover:text-white mb-2 transition min-h-[44px]"
            >
              &larr; Kembali ke Beranda
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
              Formulir Pendaftaran
            </h1>
            <p className="mt-1 text-white/80 text-sm">
              Lengkapi data dirimu untuk mengamankan slot resmi <strong>SRC X HK X SAKRARUN</strong>.
            </p>
          </div>

          {/* BANNER TAGIHAN AKTIF JIKA SEBELUMNYA SUDAH MENDAFTAR */}
          {activeSession && (
            <div className="liquid-glass rounded-3xl p-5 mb-6 border-2 border-amber-300 bg-amber-50/85 shadow-xl text-slate-900">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900">
                      Tagihan Pendaftaran Anda Masih Aktif
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      Sesi Berjalan
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    Pendaftaran atas nama <strong>{activeSession.fullName}</strong> dengan total transfer{" "}
                    <strong>Rp {activeSession.amount.toLocaleString("id-ID")}</strong> belum diselesaikan. Batas waktu pembayaran 24 jam Anda masih berlangsung.
                  </p>
                  <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Link
                      href={`/pembayaran/${activeSession.paymentId}`}
                      className="glass-btn-blue text-xs font-bold px-4 py-2.5 inline-flex items-center justify-center gap-1.5 shadow-md min-h-[44px]"
                    >
                      <span>Lanjutkan Pembayaran Sekarang</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={handleDismissSession}
                      className="glass-btn-white text-xs font-semibold px-4 py-2 text-slate-700 hover:text-slate-900 min-h-[44px]"
                    >
                      Bukan Anda? Isi Data Baru
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-5 border border-white/85 shadow-2xl">
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-950 text-sm p-4 rounded-2xl font-medium flex items-start gap-2.5">
                <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Nama Lengkap Sesuai Identitas
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                minLength={3}
                placeholder="Masukkan nama lengkap asli"
                className="liquid-input w-full px-4 py-3 rounded-2xl text-sm text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Alamat Email (@gmail.com)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="nama.anda@gmail.com"
                className="liquid-input w-full px-4 py-3 rounded-2xl text-sm text-slate-900 placeholder-slate-400 font-medium"
              />
              <p className="mt-1.5 text-[11px] text-slate-600 font-medium">
                Wajib domain <strong>@gmail.com</strong>. Tautan invoice & tiket resmi akan dikirim ke email ini.
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Nomor WhatsApp Aktif
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="Contoh: 081234567890"
                className="liquid-input w-full px-4 py-3 rounded-2xl text-sm text-slate-900 placeholder-slate-400 font-medium font-mono"
              />
              <p className="mt-1.5 text-[11px] text-slate-600 font-medium">
                Format nomor ponsel Indonesia (diawali 08 atau 628, 10–13 digit).
              </p>
            </div>

            <div>
              <label htmlFor="school_origin" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Asal Sekolah
              </label>
              <select
                id="school_origin"
                name="school_origin"
                required
                defaultValue=""
                className="liquid-input w-full px-4 py-3 rounded-2xl text-sm text-slate-900 font-bold"
              >
                <option value="" disabled>
                  -- Pilih Asal Sekolah --
                </option>
                <option value="SMAN 1 SLAWI">SMAN 1 SLAWI</option>
                <option value="SMAN 1 KRAMAT">SMAN 1 KRAMAT</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full glass-btn-blue font-bold py-3.5 px-4 text-sm sm:text-base shadow-xl min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Pendaftaran...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Pembayaran</span>
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
