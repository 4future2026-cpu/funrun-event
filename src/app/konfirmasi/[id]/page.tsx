"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ConfirmationData {
  registration: {
    full_name: string;
    email: string;
    phone: string;
    school_origin?: string;
    category?: string;
  };
  payment: {
    amount: number;
    method: string;
    payment_code: string;
    paid_at: string;
  };
  wa_token: string;
}

export default function KonfirmasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchConfirmation() {
      try {
        const res = await fetch(`/api/confirmation/${id}`);
        if (!res.ok) throw new Error("Data konfirmasi tidak ditemukan atau belum lunas.");
        const result = await res.json();
        setData(result);
      } catch {
        setError("Gagal memuat bukti pendaftaran.");
      } finally {
        setLoading(false);
      }
    }
    fetchConfirmation();
  }, [id]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const waJoinUrl = data?.wa_token ? `${baseUrl}/wa/${data.wa_token}` : null;

  function handleCopyWaLink() {
    if (!waJoinUrl) return;
    navigator.clipboard.writeText(waJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-slate-900 border-r-transparent mb-2" />
            <p className="text-sm text-slate-700">Menyiapkan bukti pendaftaran...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full liquid-glass rounded-2xl p-6 text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Pemberitahuan</h2>
            <p className="text-sm text-slate-600 mb-4">{error || "Data pendaftaran tidak ditemukan."}</p>
            <Link
              href="/"
              className="inline-block py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-10 md:py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full liquid-glass-pill text-emerald-600 mb-3 shadow-xl border-2 border-white/90">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
              Pendaftaran Berhasil!
            </h1>
            <p className="mt-1.5 text-sm text-white/85 max-w-md mx-auto">
              Bukti pembayaran resmi telah dikirim ke email <strong>{data.registration.email}</strong>.
            </p>
          </div>

          <div className="liquid-glass rounded-3xl p-6 md:p-8 mb-6 border border-white/85 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.302c-.087.087-.179.181-.077.355.101.174.449.741.964 1.2.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.679.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.13.332.202.043.072.043.419-.101.824z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Gabung Grup WhatsApp Resmi Peserta
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tautan ini bersifat privat dan <strong>hanya dapat digunakan 1 kali</strong> untuk bergabung ke dalam komunitas peserta.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row gap-2.5">
              {waJoinUrl ? (
                <>
                  <a
                    href={waJoinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 glass-btn-blue text-center text-sm font-bold py-3.5 px-5 shadow-xl inline-flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Buka Link Grup WhatsApp</span>
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                  <button
                    onClick={handleCopyWaLink}
                    className="glass-btn-white py-3.5 px-5 text-xs sm:text-sm font-bold min-h-[44px]"
                  >
                    {copiedLink ? "Link Tersalin!" : "Salin Tautan"}
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-500">Tautan undangan WhatsApp sedang diproses.</p>
              )}
            </div>
          </div>

          <div className="liquid-glass rounded-3xl overflow-hidden border border-white/85 shadow-2xl" id="printable-receipt">
            <div className="bg-slate-950/85 px-6 py-4 flex items-center justify-between text-white border-b border-white/15">
              <div>
                <p className="text-[10px] text-sky-400 uppercase tracking-widest font-mono font-bold">Tanda Bukti Pendaftaran</p>
                <h2 className="text-lg font-black tracking-tight">SRC X HK X SAKRARUN</h2>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-emerald-500/90 text-white rounded-full font-mono border border-white/40 shadow-sm">
                LUNAS
              </span>
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Nama Peserta</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{data.registration.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Asal Sekolah</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">{data.registration.school_origin || "SMAN 1 SLAWI"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Email</p>
                  <p className="font-medium text-slate-900 mt-0.5 truncate">{data.registration.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">No. WhatsApp</p>
                  <p className="font-medium text-slate-900 mt-0.5">{data.registration.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Metode Pembayaran</p>
                  <p className="font-medium text-slate-900 mt-0.5">{data.payment.method}</p>
                </div>
              </div>

              <div className="border-t border-slate-200/80 pt-4 mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Nomor Transaksi</span>
                  <span className="font-mono text-xs font-bold text-slate-900">{data.payment.payment_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Waktu Pembayaran</span>
                  <span className="text-slate-900 text-xs font-medium">
                    {data.payment.paid_at
                      ? new Date(data.payment.paid_at).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          dateStyle: "full",
                          timeStyle: "short",
                        }) + " WIB"
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/60">
                  <span className="font-bold text-slate-900">Total Biaya Pendaftaran</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    Rp {data.payment.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="bg-white/60 border border-slate-200/70 rounded-xl p-3.5 text-xs text-slate-600 mt-4 leading-relaxed">
                <strong>Info Pengambilan Race Pack:</strong><br />
                Pengambilan Race Pack pada hari-H di Venue pukul 05.30 WIB. Tunjukkan email bukti ini/bukti pendaftaran di website.
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white/80 border border-slate-200/80 rounded-xl text-slate-800 hover:bg-white transition font-semibold"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak / Simpan Bukti
            </button>
            <Link
              href="/"
              className="text-white/70 hover:text-white transition text-xs font-medium"
            >
              &larr; Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
