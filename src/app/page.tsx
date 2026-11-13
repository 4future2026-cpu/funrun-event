import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            {/* Liquid Glass Pill Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full liquid-glass-pill mb-4 shadow-md">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-900 font-mono">
                5K FUN RUN 2026
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              SRC X HK X<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-white">
                SAKRARUN
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base md:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed drop-shadow">
              Bergabunglah bersama ratusan pelari dalam ajang 5K paling seru di Hutan Kota Unfinished.
              Raih ritme larimu, nikmati kesegaran waterstation, dan amankan slot resmi Anda hari ini.
            </p>

            {/* Liquid Glass CTA Card: Pendaftaran Ditutup */}
            <div className="mt-8 max-w-md mx-auto">
              <div className="liquid-glass rounded-3xl p-6 md:p-8 text-center border border-white/85 shadow-2xl">
                <span className="inline-block text-[11px] font-extrabold text-red-700 uppercase tracking-widest bg-red-100/90 px-3.5 py-1 rounded-full mb-2 border border-red-200">
                  Pendaftaran Ditutup
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                  Kuota Peserta Telah Terpenuhi
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Terima kasih atas antusiasme yang luar biasa! Pendaftaran resmi <strong>SRC X HK X SAKRARUN 2026</strong> telah resmi ditutup karena batas kuota telah tercapai.
                </p>
                <div className="mt-5">
                  <div className="bg-slate-900/10 border border-slate-900/15 text-slate-800 text-xs sm:text-sm font-bold py-3.5 px-6 rounded-2xl">
                    Sampai Jumpa di Race Day! 🏃‍♂️💨
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Informasi Event Section */}
        <section className="py-10 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <span className="text-xs font-bold tracking-widest text-white/80 uppercase">
                Rincian Acara
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 drop-shadow-sm">
                Informasi Pelaksanaan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tanggal & Waktu */}
              <div className="liquid-glass rounded-3xl p-6 hover:translate-y-[-2px] transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/80 text-sky-600 flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Tanggal & Waktu
                </p>
                <p className="text-lg font-extrabold text-slate-900 leading-snug">
                  Minggu, 15 November 2026
                </p>
                <p className="text-xs font-semibold text-sky-700 mt-1">
                  Start pukul 05.30 WIB
                </p>
              </div>

              {/* Lokasi */}
              <div className="liquid-glass rounded-3xl p-6 hover:translate-y-[-2px] transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/80 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Venue Acara
                </p>
                <p className="text-lg font-bold text-slate-900 font-venue uppercase tracking-wider leading-snug">
                  Hutan Kota Unfinished
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Lokasi resmi titik start & finish
                </p>
              </div>

              {/* Benefit Peserta */}
              <div className="liquid-glass rounded-3xl p-6 hover:translate-y-[-2px] transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/80 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Benefit Peserta
                </p>
                <ul className="text-xs font-semibold text-slate-800 space-y-1.5 list-disc list-inside">
                  <li>Gelang lanyard resmi</li>
                  <li>Waterstation penyegaran</li>
                  <li>Start and finish venue</li>
                  <li>Voucher diskon spesial peserta</li>
                </ul>
              </div>
            </div>

            {/* Google Maps Card */}
            <div className="mt-6 liquid-glass rounded-3xl p-5 sm:p-7 overflow-hidden border border-white/85 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Peta Lokasi: Hutan Kota Unfinished
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Panduan titik kumpul dan rute menuju lokasi fun run.
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Hutan+Kota+Unfinished"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn-white text-xs font-bold py-2.5 px-4 inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[44px]"
                >
                  <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Buka di Google Maps</span>
                </a>
              </div>

              <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-white/70 shadow-inner bg-slate-100">
                <iframe
                  title="Google Maps Lokasi Hutan Kota Unfinished"
                  src="https://maps.google.com/maps?q=Hutan%20Kota%20Unfinished&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
