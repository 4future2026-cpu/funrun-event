"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ActivePayment {
  paymentId: string;
  fullName: string;
  amount: number;
  expiresAt: string;
  status: string;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<ActivePayment | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sakrarun_active_payment");
      if (stored) {
        const parsed = JSON.parse(stored) as ActivePayment;
        const isNotExpired = new Date(parsed.expiresAt) > new Date();
        const isUnpaid = parsed.status !== "paid";

        if (isNotExpired && isUnpaid && parsed.paymentId) {
          setActivePayment(parsed);
        }
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  return (
    <header className="sticky top-3 sm:top-4 z-50 max-w-4xl mx-auto px-3 sm:px-4 w-full transition-all duration-300">
      <nav
        className={`liquid-glass-navbar px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-300 ${
          isScrolled ? "liquid-glass-navbar-scrolled shadow-2xl" : ""
        }`}
        aria-label="Navigasi Utama"
      >
        <Link
          href="/"
          className="group flex items-center py-1 hover:opacity-90 transition min-h-[44px]"
          aria-label="SRC X HK X SAKRARUN Beranda"
        >
          <img
            src="/logo-event.png"
            alt="Logo SRC X HK X SAKRARUN"
            className="h-7 sm:h-8 md:h-9 w-auto object-contain drop-shadow-sm"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 px-3 py-1.5 rounded-full hover:bg-white/40 transition min-h-[44px] flex items-center"
          >
            Beranda
          </Link>

          {activePayment ? (
            <Link
              href={`/pembayaran/${activePayment.paymentId}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400/90 to-amber-300/90 hover:from-amber-400 hover:to-amber-300 px-4 py-2 rounded-full transition shadow-md shadow-amber-400/25 border border-white/70 min-h-[44px]"
              title="Lanjutkan pembayaran aktif"
            >
              <span className="w-2 h-2 rounded-full bg-amber-700 animate-ping" />
              Lanjut Bayar (Rp {activePayment.amount.toLocaleString("id-ID")}) &rarr;
            </Link>
          ) : (
            <Link
              href="/daftar"
              className="glass-btn-blue text-xs sm:text-sm font-bold px-5 py-2.5 inline-flex items-center justify-center min-h-[44px]"
            >
              Daftar Sekarang
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-slate-800 hover:text-slate-950 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-white/40 transition"
          aria-label="Toggle menu navigasi"
          aria-expanded={menuOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Dropdown as Frosted Glass Pill Card */}
      {menuOpen && (
        <div className="md:hidden mt-2 liquid-glass rounded-3xl p-4 space-y-2 border border-white/80 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {activePayment && (
            <Link
              href={`/pembayaran/${activePayment.paymentId}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 text-xs font-bold text-amber-950 bg-amber-300/90 hover:bg-amber-300 p-3 rounded-full text-center shadow-md border border-white/60 min-h-[44px]"
            >
              <span className="w-2 h-2 rounded-full bg-amber-700 animate-ping" />
              Lanjut Bayar (Rp {activePayment.amount.toLocaleString("id-ID")}) &rarr;
            </Link>
          )}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center text-sm font-semibold text-slate-800 hover:text-slate-950 p-2.5 rounded-2xl hover:bg-white/40 transition min-h-[44px]"
          >
            Beranda
          </Link>
          <Link
            href="/daftar"
            onClick={() => setMenuOpen(false)}
            className="glass-btn-blue text-sm font-bold p-3 text-center flex items-center justify-center min-h-[44px] shadow-lg"
          >
            Daftar Sekarang
          </Link>
        </div>
      )}
    </header>
  );
}
