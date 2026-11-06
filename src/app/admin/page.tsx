"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ParticipantItem {
  id: string;
  amount: number;
  unique_code?: number;
  method: string;
  status: "pending" | "waiting_verification" | "paid" | "rejected" | "expired";
  payment_code: string;
  paid_at: string | null;
  proof_image?: string | null;
  sender_name?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  wa_token: string | null;
  registration: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    school_origin?: string;
  };
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("SEMUA");
  const [statusFilter, setStatusFilter] = useState<"SEMUA" | "waiting_verification" | "paid" | "pending" | "rejected">("SEMUA");

  // State modal bukti transfer
  const [selectedProofParticipant, setSelectedProofParticipant] = useState<ParticipantItem | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<ParticipantItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("sakrarun_admin_token");
      if (savedToken) {
        setAuthToken(savedToken);
        setIsAuthenticated(true);
        fetchParticipants(savedToken);
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  // Handle escape key to close modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedProofParticipant(null);
        setRejectingItem(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogin(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoginError("");

    const clean = password.trim();
    if (!clean) return;

    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Password salah");
      }

      const token = data.token || "authenticated_sakrarun_2026";
      try {
        localStorage.setItem("sakrarun_admin_token", token);
      } catch {}
      setAuthToken(token);
      setIsAuthenticated(true);
      fetchParticipants(token);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    try {
      localStorage.removeItem("sakrarun_admin_token");
    } catch {}
    setIsAuthenticated(false);
    setAuthToken("");
    setPassword("");
    setParticipants([]);
  }

  async function fetchParticipants(token?: string) {
    setLoading(true);
    const validToken = typeof token === "string" && token ? token : (authToken || "authenticated_sakrarun_2026");
    try {
      const res = await fetch("/api/admin/participants", {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(paymentId: string, action: "approve" | "reject", reason?: string) {
    setVerifyingId(paymentId);
    setActionSuccessMessage("");

    const validToken = authToken || "authenticated_sakrarun_2026";
    try {
      const res = await fetch("/api/admin/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          action,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses validasi pembayaran.");
      }

      setActionSuccessMessage(
        action === "approve"
          ? "Pembayaran berhasil disetujui! Status berubah menjadi LUNAS dan tiket telah diterbitkan."
          : "Pembayaran telah ditolak."
      );
      setTimeout(() => setActionSuccessMessage(""), 5000);

      setSelectedProofParticipant(null);
      setRejectingItem(null);
      setRejectionReasonInput("");

      // Refresh data
      await fetchParticipants(validToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setVerifyingId(null);
    }
  }

  const waitingCount = participants.filter((p) => p.status === "waiting_verification").length;
  const totalPaid = participants.filter((p) => p.status === "paid");
  const pendingCount = participants.filter((p) => p.status === "pending").length;
  const rejectedCount = participants.filter((p) => p.status === "rejected").length;
  const totalDana = totalPaid.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalSlawi = totalPaid.filter(
    (p) => (p.registration?.school_origin || "SMAN 1 SLAWI") === "SMAN 1 SLAWI"
  ).length;
  const totalKramat = totalPaid.filter(
    (p) => p.registration?.school_origin === "SMAN 1 KRAMAT"
  ).length;

  const filtered = participants.filter((p) => {
    const fullName = p.registration?.full_name || "";
    const phone = p.registration?.phone || "";
    const email = p.registration?.email || "";
    const paymentCode = p.payment_code || "";
    const senderName = p.sender_name || "";
    const schoolOrigin = p.registration?.school_origin || "SMAN 1 SLAWI";

    const matchSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paymentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      senderName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSchool =
      schoolFilter === "SEMUA" || schoolOrigin === schoolFilter;

    const matchStatus =
      statusFilter === "SEMUA" || p.status === statusFilter;

    return matchSearch && matchSchool && matchStatus;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-8 md:py-14">
        <div className="max-w-6xl mx-auto px-4">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto">
              <div className="liquid-glass rounded-3xl p-7 sm:p-10 text-center border border-white/85 shadow-2xl">
                <div className="w-14 h-14 rounded-full liquid-glass-pill text-sky-600 flex items-center justify-center mx-auto mb-4 shadow-md border-2 border-white/90">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-1">
                  Portal Panitia FUN RUN
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium">
                  Masukkan PIN keamanan panitia untuk verifikasi bukti transfer dan kelola pendaftar.
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="admin-pin-input" className="block text-xs font-bold text-slate-800 mb-1.5 text-left">
                      PIN Akses Panitia
                    </label>
                    <div className="relative">
                      <input
                        id="admin-pin-input"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan PIN panitia..."
                        autoComplete="current-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        className="liquid-input w-full px-4 py-3 rounded-2xl text-sm pr-20 text-slate-900 font-mono tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 transition z-20 min-h-[36px]"
                      >
                        {showPassword ? "Tutup" : "Lihat"}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="bg-red-500/20 border border-red-500/40 text-red-950 text-xs p-3 rounded-2xl font-medium">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoggingIn || !password}
                    className="w-full glass-btn-blue font-bold py-3.5 px-4 text-sm shadow-xl min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? "Memverifikasi..." : "Masuk ke Panel Panitia"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Panitia */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/30">
                      Panel Panitia Aktif
                    </span>
                    {waitingCount > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                        {waitingCount} Perlu Verifikasi
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Verifikasi Pembayaran & Data Peserta
                  </h1>
                  <p className="text-xs text-white/70">
                    SRC X HK X SAKRARUN 2026 &middot; Hutan Kota Unfinished
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchParticipants()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/15 min-h-[44px]"
                    title="Muat ulang data"
                  >
                    <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <a
                    href="/api/admin/export/csv"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md min-h-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Excel (CSV)
                  </a>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl text-xs font-semibold transition min-h-[44px]"
                    title="Keluar dari Panel Admin"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                  </button>
                </div>
              </div>

              {actionSuccessMessage && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {actionSuccessMessage}
                </div>
              )}

              {/* Ringkasan Statistik */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="liquid-glass rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-slate-600 uppercase">Total Terdaftar</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{participants.length}</p>
                </div>
                <div className="liquid-glass rounded-2xl p-4 border border-amber-300 bg-amber-50/60">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-amber-900 uppercase">Perlu Verifikasi</p>
                    {waitingCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-2xl font-extrabold text-amber-800 mt-1">{waitingCount}</p>
                </div>
                <div className="liquid-glass rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-slate-600 uppercase">Sudah Lunas</p>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">{totalPaid.length}</p>
                </div>
                <div className="liquid-glass rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-slate-600 uppercase">Dana Diterima</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    Rp {totalDana.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Tabs Status & Filter */}
              <div className="liquid-glass rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 pb-3">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("SEMUA")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition min-h-[36px] ${
                      statusFilter === "SEMUA"
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-white/60"
                    }`}
                  >
                    Semua ({participants.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("waiting_verification")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 min-h-[36px] ${
                      statusFilter === "waiting_verification"
                        ? "bg-amber-500 text-slate-950"
                        : "text-amber-800 bg-amber-100 hover:bg-amber-200"
                    }`}
                  >
                    Perlu Verifikasi
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px]">
                      {waitingCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("paid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition min-h-[36px] ${
                      statusFilter === "paid"
                        ? "bg-emerald-600 text-white"
                        : "text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    Lunas ({totalPaid.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("pending")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition min-h-[36px] ${
                      statusFilter === "pending"
                        ? "bg-slate-700 text-white"
                        : "text-slate-700 hover:bg-white/60"
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("rejected")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition min-h-[36px] ${
                      statusFilter === "rejected"
                        ? "bg-red-600 text-white"
                        : "text-red-800 hover:bg-red-50"
                    }`}
                  >
                    Ditolak ({rejectedCount})
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      placeholder="Cari nama, WhatsApp, mutasi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="liquid-input w-full pl-9 pr-3.5 py-2 rounded-xl text-xs text-slate-900"
                    />
                    <svg
                      className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-700 shrink-0">Filter Sekolah:</span>
                    <select
                      value={schoolFilter}
                      onChange={(e) => setSchoolFilter(e.target.value)}
                      className="liquid-input px-3 py-2 rounded-xl text-xs text-slate-900 font-semibold"
                    >
                      <option value="SEMUA">Semua Sekolah</option>
                      <option value="SMAN 1 SLAWI">SMAN 1 SLAWI</option>
                      <option value="SMAN 1 KRAMAT">SMAN 1 KRAMAT</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabel Peserta & Verifikasi Panitia */}
              <div className="liquid-glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/10 text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="px-4 py-3.5">Peserta</th>
                        <th className="px-4 py-3.5">Asal Sekolah</th>
                        <th className="px-4 py-3.5">Nominal Transfer</th>
                        <th className="px-4 py-3.5">Bukti Transfer</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Aksi Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-600 font-medium">
                            Memuat data pendaftar...
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-600 font-medium">
                            Tidak ada data pendaftar yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((item) => {
                          const safeName = item.registration?.full_name || "Peserta";
                          const safeSchool = item.registration?.school_origin || "SMAN 1 SLAWI";
                          const cleanNameForFile = safeName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
                          const cleanSchoolForFile = safeSchool.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
                          const isProcessing = verifyingId === item.id;

                          return (
                            <tr
                              key={item.id}
                              className={`transition ${
                                item.status === "waiting_verification"
                                  ? "bg-amber-50/70 hover:bg-amber-100/60"
                                  : "hover:bg-white/50"
                              }`}
                            >
                              {/* Kolom Peserta */}
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-slate-900 text-sm">{safeName}</p>
                                <p className="text-[11px] text-slate-600 font-mono">
                                  {item.registration?.phone || "-"} &middot; {item.registration?.email}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {new Date(item.created_at).toLocaleString("id-ID")}
                                </p>
                              </td>

                              {/* Asal Sekolah */}
                              <td className="px-4 py-3.5">
                                <span className="inline-block px-2.5 py-1 rounded-md bg-slate-900/10 text-slate-900 font-bold text-[11px]">
                                  {safeSchool}
                                </span>
                              </td>

                              {/* Nominal & Kode Unik */}
                              <td className="px-4 py-3.5">
                                <p className="font-extrabold text-slate-900 text-sm">
                                  Rp {item.amount.toLocaleString("id-ID")}
                                </p>
                                {item.unique_code && (
                                  <span className="inline-block text-[10px] text-emerald-800 font-semibold">
                                    Kode Unik: {item.unique_code}
                                  </span>
                                )}
                                {item.sender_name && (
                                  <p className="text-[11px] text-slate-600 mt-0.5 truncate max-w-[140px]" title={item.sender_name}>
                                    A.N. {item.sender_name}
                                  </p>
                                )}
                              </td>

                              {/* Bukti Transfer */}
                              <td className="px-4 py-3.5">
                                {item.proof_image ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProofParticipant(item)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-800 rounded-lg text-slate-800 hover:text-slate-950 font-bold text-xs transition shadow-sm min-h-[36px]"
                                  >
                                    <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Lihat Bukti
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-500 italic">
                                    Belum diunggah
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                    item.status === "paid"
                                      ? "bg-emerald-500/20 text-emerald-900 border border-emerald-500/30"
                                      : item.status === "waiting_verification"
                                      ? "bg-amber-500/20 text-amber-900 border border-amber-500/40 animate-pulse"
                                      : item.status === "rejected"
                                      ? "bg-red-500/20 text-red-900 border border-red-500/30"
                                      : "bg-slate-200 text-slate-800"
                                  }`}
                                >
                                  {item.status === "paid"
                                    ? "LUNAS"
                                    : item.status === "waiting_verification"
                                    ? "PERLU VERIFIKASI"
                                    : item.status === "rejected"
                                    ? "DITOLAK"
                                    : "PENDING"}
                                </span>
                                {item.status === "rejected" && item.rejection_reason && (
                                  <p className="text-[10px] text-red-700 mt-1 max-w-[130px] truncate" title={item.rejection_reason}>
                                    {item.rejection_reason}
                                  </p>
                                )}
                              </td>

                              {/* Aksi Validasi Panitia */}
                              <td className="px-4 py-3.5 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  {/* Tombol Terima & Tolak untuk yang waiting_verification */}
                                  {item.status === "waiting_verification" && (
                                    <>
                                      <button
                                        type="button"
                                        disabled={isProcessing}
                                        onClick={() => handleVerify(item.id, "approve")}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-50 min-h-[36px]"
                                        title="Setujui transfer ini dan tandai LUNAS"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Terima
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isProcessing}
                                        onClick={() => {
                                          setRejectingItem(item);
                                          setRejectionReasonInput("Nominal tidak cocok dengan mutasi rekening panitia.");
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold text-xs transition min-h-[36px]"
                                        title="Tolak bukti transfer"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Tolak
                                      </button>
                                    </>
                                  )}

                                  {/* Jika status lunas: tombol unduh JSON */}
                                  {item.status === "paid" && (
                                    <a
                                      href={`/api/admin/download/${item.id}`}
                                      title={`Unduh file ${cleanNameForFile}_${cleanSchoolForFile}.json`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold text-[11px] min-h-[36px]"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      JSON
                                    </a>
                                  )}

                                  {/* Jika status ditolak atau pending, beri opsi verifikasi manual atau tolak */}
                                  {(item.status === "pending" || item.status === "rejected") && (
                                    <>
                                      <button
                                        type="button"
                                        disabled={isProcessing}
                                        onClick={() => handleVerify(item.id, "approve")}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition min-h-[36px]"
                                        title="Tandai lunas manual"
                                      >
                                        Tandai Lunas
                                      </button>
                                      {item.status !== "rejected" && (
                                        <button
                                          type="button"
                                          disabled={isProcessing}
                                          onClick={() => {
                                            setRejectingItem(item);
                                            setRejectionReasonInput("Pendaftaran dibatalkan atau bukti transfer tidak diterima.");
                                          }}
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[11px] font-semibold transition min-h-[36px]"
                                          title="Tolak pendaftaran ini"
                                        >
                                          Tolak
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL LIHAT BUKTI TRANSFER */}
      {selectedProofParticipant && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSelectedProofParticipant(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Detail Bukti Transfer
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedProofParticipant.registration.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofParticipant(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Total Wajib:</span>
                  <span className="text-base font-extrabold text-slate-900">
                    Rp {selectedProofParticipant.amount.toLocaleString("id-ID")}
                  </span>
                  {selectedProofParticipant.unique_code && (
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      Kode Unik: {selectedProofParticipant.unique_code}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block">Nama Pengirim:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedProofParticipant.sender_name || "(Tidak diisi)"}
                  </span>
                </div>
              </div>

              {/* Tampilan Gambar Bukti */}
              {selectedProofParticipant.proof_image && (
                <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProofParticipant.proof_image}
                    alt={`Bukti transfer ${selectedProofParticipant.registration.full_name}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className="img-fallback hidden p-4 text-center text-slate-500">
                    <p className="font-semibold">Gagal memuat preview gambar.</p>
                    <a
                      href={selectedProofParticipant.proof_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block px-3 py-1 bg-sky-600 text-white rounded font-bold text-xs"
                    >
                      Buka Gambar di Tab Baru
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Aksi di dalam modal */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(selectedProofParticipant);
                  setRejectionReasonInput("Nominal tidak sesuai mutasi atau bukti tidak terbaca.");
                  setSelectedProofParticipant(null);
                }}
                className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition min-h-[44px]"
              >
                Tolak Pembayaran
              </button>
              <button
                type="button"
                disabled={verifyingId === selectedProofParticipant.id}
                onClick={() => handleVerify(selectedProofParticipant.id, "approve")}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 min-h-[44px]"
              >
                {verifyingId === selectedProofParticipant.id ? "Memproses..." : "Terima / Tandai Lunas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT ALASAN PENOLAKAN */}
      {rejectingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setRejectingItem(null)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Tolak Pembayaran Peserta
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Peserta: <strong>{rejectingItem.registration.full_name}</strong> (Rp {rejectingItem.amount.toLocaleString("id-ID")})
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="rejection-reason-textarea" className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan (Akan tampil di layar peserta):
                </label>
                <textarea
                  id="rejection-reason-textarea"
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Contoh: Nominal transfer kurang dari Rp 10.xxx / Mutasi belum masuk ke rekening panitia."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={verifyingId === rejectingItem.id}
                  onClick={() => handleVerify(rejectingItem.id, "reject", rejectionReasonInput)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition min-h-[44px]"
                >
                  {verifyingId === rejectingItem.id ? "Memproses..." : "Konfirmasi Tolak"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
