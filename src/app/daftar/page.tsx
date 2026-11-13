"use client";

import { useState, useEffect } from "react";
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-10 md:py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="mb-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold text-white/80 hover:text-white mb-2 transition min-h-[44px]"
            >
              &larr; Kembali ke Beranda
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
              Pendaftaran Ditutup
            </h1>
            <p className="mt-1 text-white/80 text-sm">
              Event <strong>SRC X HK X SAKRARUN 2026</strong>
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
                      Anda Sudah Terdaftar Sebelumnya
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      Sesi Berjalan
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    Tagihan pendaftaran atas nama <strong>{activeSession.fullName}</strong> dengan total transfer{" "}
                    <strong>Rp {activeSession.amount.toLocaleString("id-ID")}</strong> masih aktif. Silakan selesaikan pembayaran sebelum batas waktu berakhir.
                  </p>
                  <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Link
                      href={`/pembayaran/${activeSession.paymentId}`}
                      className="glass-btn-blue text-xs font-bold px-4 py-2.5 inline-flex items-center justify-center gap-1.5 shadow-md min-h-[44px]"
                    >
                      <span>Lanjutkan Pembayaran</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="liquid-glass rounded-3xl p-6 sm:p-10 text-center border border-white/85 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100/90 text-red-600 flex items-center justify-center mx-auto shadow-md border border-red-200">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>

            <span className="inline-block text-[11px] font-extrabold text-red-700 uppercase tracking-widest bg-red-100/90 px-3.5 py-1 rounded-full border border-red-200">
              Kuota Penuh
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Pendaftaran Resmi Telah Ditutup
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-md mx-auto">
              Terima kasih atas partisipasi dan antusiasme Anda! Seluruh slot tiket pendaftaran <strong>SRC X HK X SAKRARUN 2026</strong> telah terpenuhi.
            </p>

            <div className="pt-2">
              <Link
                href="/"
                className="glass-btn-blue font-bold py-3.5 px-6 text-sm inline-flex items-center justify-center gap-2 shadow-xl min-h-[44px]"
              >
                <span>Kembali ke Halaman Utama</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
