"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PaymentData {
  id: string;
  registration: {
    full_name: string;
    school_origin?: string;
    category?: string;
    email: string;
    phone: string;
  };
  amount: number;
  unique_code?: number;
  method: string;
  status: "pending" | "waiting_verification" | "paid" | "rejected" | "expired";
  expires_at: string;
  payment_code: string;
  proof_image?: string | null;
  sender_name?: string | null;
  rejection_reason?: string | null;
}

function CountdownTimer({
  expiresAt,
  onExpired,
}: {
  expiresAt: string;
  onExpired: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    function updateTimer() {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("00:00:00");
        onExpired();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  return (
    <div
      className={`rounded-3xl p-5 text-center transition border shadow-xl ${
        isExpired
          ? "bg-red-500/20 border-red-500/40 text-red-200"
          : "liquid-glass text-slate-900 border-white/85"
      }`}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <svg
          className={`w-4 h-4 ${isExpired ? "text-red-300" : "text-sky-700"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-700 font-mono">
          {isExpired ? "Batas Waktu Telah Habis" : "Batas Waktu Pembayaran (24 Jam)"}
        </span>
      </div>
      <p className="text-3xl font-mono font-black tracking-wider text-slate-900">{timeLeft}</p>
      <p className="text-[11px] text-slate-600 mt-1 font-medium">
        {isExpired
          ? "Tagihan ini sudah kadaluarsa. Silakan lakukan pendaftaran ulang."
          : "Selesaikan transfer sebelum batas waktu untuk mengamankan slot lomba."}
      </p>
    </div>
  );
}

export default function PembayaranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Upload proof state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isReuploading, setIsReuploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch payment details
  useEffect(() => {
    let isSubscribed = true;

    async function fetchPayment() {
      try {
        const res = await fetch(`/api/payment/${id}`);
        if (!res.ok) throw new Error("Data pembayaran tidak ditemukan");
        const data = await res.json();
        if (!isSubscribed) return;

        setPayment(data);

        try {
          if (data.status === "paid") {
            localStorage.removeItem("sakrarun_active_payment");
            localStorage.setItem("sakrarun_paid_ticket", id);
            router.push(`/konfirmasi/${id}`);
          } else if (data.status === "expired" || new Date(data.expires_at) < new Date()) {
            setIsExpired(true);
            localStorage.removeItem("sakrarun_active_payment");
          } else {
            localStorage.setItem(
              "sakrarun_active_payment",
              JSON.stringify({
                paymentId: id,
                fullName: data.registration.full_name,
                amount: data.amount,
                expiresAt: data.expires_at,
                status: data.status,
              })
            );
          }
        } catch {
          // LocalStorage fallback
        }
      } catch {
        if (isSubscribed) setError("Gagal memuat data pembayaran.");
      } finally {
        if (isSubscribed) setLoadingData(false);
      }
    }

    fetchPayment();

    return () => {
      isSubscribed = false;
    };
  }, [id, router]);

  // Polling when waiting for verification
  useEffect(() => {
    if (!payment || payment.status !== "waiting_verification") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/${id}`);
        if (res.ok) {
          const updated = await res.json();
          setPayment(updated);
          if (updated.status === "paid") {
            try {
              localStorage.removeItem("sakrarun_active_payment");
              localStorage.setItem("sakrarun_paid_ticket", id);
            } catch {}
            clearInterval(interval);
            router.push(`/konfirmasi/${id}`);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [id, payment, router]);

  function handleCopy(text: string, type: "amount" | "code") {
    navigator.clipboard.writeText(text);
    if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Format file harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar terlalu besar. Maksimal 5 MB.");
      return;
    }

    setError("");
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!proofFile) {
      setError("Pilih foto atau screenshot bukti transfer terlebih dahulu.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("payment_id", id);
      formData.append("sender_name", senderName);

      const res = await fetch("/api/payment/upload-proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengunggah bukti pembayaran.");
      }

      setUploadSuccess(true);
      setIsReuploading(false);

      // Refresh payment state
      const refetch = await fetch(`/api/payment/${id}`);
      if (refetch.ok) {
        const fresh = await refetch.json();
        setPayment(fresh);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setUploading(false);
    }
  }

  if (loadingData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-slate-900 border-r-transparent mb-2" />
            <p className="text-sm font-semibold text-slate-800">Memuat rincian pembayaran...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error && !payment) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full liquid-glass rounded-2xl p-6 text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Terjadi Kendala</h2>
            <p className="text-sm text-slate-700 mb-4">{error}</p>
            <Link
              href="/daftar"
              className="inline-block py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition min-h-[44px]"
            >
              Kembali ke Formulir Pendaftaran
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isWaitingVerification = payment?.status === "waiting_verification" && !isReuploading;
  const isRejected = payment?.status === "rejected" && !isReuploading;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-16 pt-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/daftar"
              className="inline-flex items-center text-xs text-white/80 hover:text-white mb-3 transition min-h-[44px]"
            >
              &larr; Ubah Data Diri
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Instruksi Pembayaran
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Selesaikan transaksi untuk mengamankan slot SRC X HK X SAKRARUN.
            </p>
          </div>

          <div className="space-y-4">
            {payment && (
              <CountdownTimer
                expiresAt={payment.expires_at}
                onExpired={() => setIsExpired(true)}
              />
            )}

            {/* Rincian Tagihan & Nominal Unik */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/85 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rincian Tagihan
                </span>
                <span
                  className={`text-xs px-3 py-0.5 rounded-full font-bold border ${
                    payment?.status === "waiting_verification"
                      ? "bg-amber-500/20 text-amber-900 border-amber-400"
                      : payment?.status === "rejected"
                      ? "bg-red-500/20 text-red-900 border-red-400"
                      : "bg-sky-500/15 text-sky-900 border-sky-300"
                  }`}
                >
                  {payment?.status === "waiting_verification"
                    ? "Menunggu Verifikasi Panitia"
                    : payment?.status === "rejected"
                    ? "Verifikasi Ditolak"
                    : "Menunggu Pembayaran"}
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700">Nama Peserta</span>
                  <span className="text-slate-900 font-bold">{payment?.registration.full_name}</span>
                </div>
                {payment?.registration.school_origin && (
                  <div className="flex justify-between">
                    <span className="text-slate-700">Asal Sekolah</span>
                    <span className="text-slate-900 font-bold">{payment.registration.school_origin}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Kode Transaksi</span>
                  <button
                    type="button"
                    onClick={() => payment && handleCopy(payment.payment_code, "code")}
                    className="glass-btn-white inline-flex items-center gap-1.5 font-mono text-xs text-slate-900 px-3 py-1.5 rounded-full min-h-[36px]"
                  >
                    <span>{payment?.payment_code}</span>
                    <span className="text-[10px] text-sky-700 font-sans font-bold">
                      {copiedCode ? "Tersalin!" : "Salin"}
                    </span>
                  </button>
                </div>

                <div className="border-t border-slate-200/80 pt-3 mt-3">
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>Biaya Pendaftaran</span>
                    <span>Rp 10.000</span>
                  </div>
                  {payment?.unique_code && (
                    <div className="flex justify-between text-xs text-emerald-800 font-bold mb-2">
                      <span>Kode Unik Verifikasi</span>
                      <span>+ Rp {payment.unique_code}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-sm font-bold text-slate-900">Total Transfer</span>
                      <p className="text-[11px] text-slate-600">Wajib transfer persis nominal ini</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-slate-900">
                        Rp {payment?.amount.toLocaleString("id-ID")}
                      </span>
                      <button
                        type="button"
                        onClick={() => payment && handleCopy(payment.amount.toString(), "amount")}
                        className="glass-btn-blue text-xs font-bold px-3.5 py-1.5 rounded-full min-h-[36px]"
                        title="Salin nominal transfer"
                      >
                        {copiedAmount ? "Tersalin!" : "Salin"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kotak Perhatian Kode Unik */}
                <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3 text-xs text-amber-900 mt-2 shadow-sm">
                  <p className="font-bold flex items-center gap-1 mb-0.5">
                    <svg className="w-4 h-4 text-amber-700 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Penting: Transfer Tepat Hingga 3 Digit Terakhir
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Mohon transfer persis <strong>Rp {payment?.amount.toLocaleString("id-ID")}</strong> (jangan dibulatkan). 3 digit terakhir ({payment?.unique_code}) merupakan kode unik otomatis agar panitia dapat mencocokkan mutasi rekening Anda secara instan.
                  </p>
                </div>
              </div>
            </div>

            {/* STATUS A: SEDANG DIVERIFIKASI PANITIA */}
            {isWaitingVerification && (
              <div className="liquid-glass rounded-3xl p-6 md:p-8 text-center border-2 border-amber-400/90 shadow-2xl">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 border border-amber-300 text-amber-700 mb-3 animate-pulse">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                  Bukti Pembayaran Sedang Diverifikasi Panitia
                </h2>
                <p className="text-xs text-slate-700 max-w-md mx-auto mb-4 leading-relaxed">
                  Bukti transfer Anda telah berhasil dikirim. Panitia sedang mencocokkan nominal transfer <strong>Rp {payment.amount.toLocaleString("id-ID")}</strong> dengan mutasi pembayaran QRIS (Atas Nama: FUN RUN).
                </p>

                <div className="bg-white/80 border border-slate-200 rounded-xl p-3.5 mb-4 text-left max-w-sm mx-auto text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-bold text-amber-800">Menunggu Persetujuan Panitia</span>
                  </div>
                  {payment.sender_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nama Pengirim:</span>
                      <span className="font-semibold text-slate-900">{payment.sender_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nominal Dicocokkan:</span>
                    <span className="font-bold text-slate-900">Rp {payment.amount.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Halaman ini memantau status secara langsung. Tiket dan link WhatsApp otomatis terbuka saat disetujui.</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReuploading(true)}
                  className="text-xs font-semibold text-slate-700 underline hover:text-slate-900 min-h-[36px]"
                >
                  Salah kirim bukti? Klik di sini untuk mengunggah ulang
                </button>
              </div>
            )}

            {/* STATUS B: DITOLAK PANITIA */}
            {isRejected && (
              <div className="liquid-glass rounded-2xl p-6 text-center border-2 border-red-400 bg-red-50/50">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-red-900 mb-1">
                  Verifikasi Pembayaran Ditolak
                </h2>
                <div className="bg-white border border-red-200 rounded-xl p-3 my-3 text-xs text-left max-w-md mx-auto">
                  <p className="font-bold text-red-800 mb-0.5">Alasan dari Panitia:</p>
                  <p className="text-slate-800">
                    {payment.rejection_reason || "Bukti transfer tidak sesuai atau belum tercatat pada mutasi rekening panitia."}
                  </p>
                </div>
                <p className="text-xs text-slate-700 mb-4">
                  Silakan pastikan transfer sesuai nominal <strong>Rp {payment.amount.toLocaleString("id-ID")}</strong> lalu unggah kembali bukti transfer yang benar di bawah ini.
                </p>
                <button
                  type="button"
                  onClick={() => setIsReuploading(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition min-h-[44px]"
                >
                  Unggah Bukti Baru
                </button>
              </div>
            )}

            {/* STATUS C: PENDING ATAU SEDANG UNGGAH ULANG */}
            {(!isWaitingVerification && !isRejected) && (
              <>
                {/* QRIS STANDAR NASIONAL CARD */}
                <div className="liquid-glass rounded-3xl p-6 md:p-8 text-center border border-white/85 shadow-2xl">
                  <div className="inline-block px-3 py-1 bg-emerald-500/15 text-emerald-900 text-xs font-extrabold rounded-full mb-2 border border-emerald-400/40">
                    QRIS Standar Pembayaran Nasional
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mb-1">
                    Pindai Kode QRIS di Bawah Ini
                  </h2>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mb-3 leading-relaxed">
                    Bisa dipindai dari <strong>BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay</strong>, atau aplikasi mobile banking apa pun berlogo QRIS.
                  </p>

                  {/* Gambar QRIS Resmi */}
                  <div className="relative w-full max-w-[280px] mx-auto aspect-[3/4.2] rounded-3xl overflow-hidden border-2 border-white/90 shadow-xl bg-white my-3">
                    <Image
                      src="/qris.jpg"
                      alt="QRIS Toko Djaya FUN RUN"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>

                  {/* Keterangan Merchant */}
                  <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-3 max-w-sm mx-auto text-xs text-left mb-3.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Merchant QRIS:</span>
                      <span className="font-bold text-slate-900">Toko Djaya</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Atas Nama:</span>
                      <span className="font-bold text-emerald-800">FUN RUN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">NMID:</span>
                      <span className="font-mono text-slate-900 font-semibold">ID1024687332144</span>
                    </div>
                  </div>

                  <a
                    href="/qris.jpg"
                    download="QRIS_SRCXHK_FUN_RUN.jpg"
                    className="glass-btn-white inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold transition shadow-md min-h-[44px]"
                  >
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Simpan / Unduh Gambar QRIS
                  </a>
                </div>

                {/* KOTAK BANTUAN METODE SELAIN QRIS */}
                <div className="liquid-glass rounded-3xl p-6 border border-sky-300 bg-sky-50/80 text-slate-900 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                    <div>
                      <h3 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-sky-700 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Mau Bayar Selain QRIS (Transfer Bank / E-Wallet Manual)?
                      </h3>
                      <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                        Jika Anda ingin membayar melalui transfer nomor rekening bank atau e-wallet manual, silakan langsung hubungi admin WhatsApp panitia.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/6283182061336?text=Halo%20Admin%20FUN%20RUN%2C%20saya%20ingin%20konfirmasi%20pembayaran%20pendaftaran%20SRC%20X%20HK%20Fun%20Run%20(Kode%3A%20${payment?.payment_code})%20selain%20QRIS.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition shadow-sm shrink-0 border border-white/70 min-h-[44px]"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                      </svg>
                      Chat Admin WhatsApp
                    </a>
                  </div>
                </div>

                {/* FORM UPLOAD BUKTI PEMBAYARAN */}
                <form
                  onSubmit={handleSubmitProof}
                  className="liquid-glass rounded-3xl p-6 md:p-8 space-y-5 border border-white/85 shadow-2xl"
                >
                  <div className="border-b border-slate-200/80 pb-3">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Konfirmasi Transfer (Unggah Bukti)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Unggah screenshot bukti transfer untuk divalidasi oleh panitia.
                    </p>
                  </div>

                  {/* Input Foto Bukti */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Foto / Screenshot Bukti Transfer <span className="text-red-500">*</span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="proof-upload-input"
                    />

                    {!proofPreview ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-slate-300 hover:border-slate-800 bg-white/70 hover:bg-white rounded-xl p-5 text-center transition cursor-pointer min-h-[110px] flex flex-col items-center justify-center"
                      >
                        <svg
                          className="w-8 h-8 text-slate-500 mb-1.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs font-bold text-slate-800">
                          Pilih Foto / Screenshot Bukti Transfer
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Format JPG, PNG, atau WEBP (Maksimal 5 MB)
                        </span>
                      </button>
                    ) : (
                      <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-900/5 p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-20 h-20 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-300">
                            <Image
                              src={proofPreview}
                              alt="Pratinjau Bukti Transfer"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {proofFile?.name}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {proofFile && (proofFile.size / 1024).toFixed(0)} KB
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setProofFile(null);
                                setProofPreview(null);
                              }}
                              className="text-xs text-red-600 font-semibold hover:underline mt-1"
                            >
                              Ganti Foto
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Nama Pengirim */}
                  <div>
                    <label htmlFor="sender-name-input" className="block text-xs font-bold text-slate-800 mb-1">
                      Nama Pemilik Rekening / Akun Pengirim (Opsional)
                    </label>
                    <input
                      id="sender-name-input"
                      type="text"
                      placeholder="Contoh: Budi Santoso / DANA Budi"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="liquid-input w-full px-4 py-3 rounded-2xl text-xs sm:text-sm text-slate-900 font-medium"
                    />
                    <p className="text-[11px] text-slate-600 mt-1.5 font-medium">
                      Membantu panitia memverifikasi mutasi pembayaran lebih cepat.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/40 text-red-950 text-xs p-3.5 rounded-2xl font-medium">
                      {error}
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-950 text-xs p-3.5 rounded-2xl font-bold">
                      Bukti berhasil dikirim! Halaman akan otomatis diperbarui.
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={uploading || isExpired}
                      className="w-full glass-btn-blue font-bold py-3.5 px-4 text-xs sm:text-sm shadow-xl min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengunggah Bukti...</span>
                        </>
                      ) : isExpired ? (
                        <span>Pembayaran Kadaluarsa</span>
                      ) : (
                        <>
                          <span>Kirim Bukti Pembayaran</span>
                          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-600 text-center mt-2.5 font-medium">
                      Setelah bukti terkirim, panitia akan memvalidasi nominal dan menerbitkan tiket resmi serta tautan WhatsApp group.
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
