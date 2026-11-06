import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SRC X HK X SAKRARUN: Pendaftaran Resmi",
  description:
    "Daftarkan dirimu di SRC X HK X SAKRARUN! Selesaikan pendaftaran resmi hanya Rp 10.000, bayar lewat QRIS, dan dapatkan akses grup WhatsApp eksklusif.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${cinzel.variable}`}>
      <body className={`${plusJakartaSans.className} relative min-h-screen text-slate-900 antialiased selection:bg-sky-500/30 selection:text-slate-900`}>
        {/* Fixed Background Photo: Runners in City (Blurred per user request) */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 filter blur-[6px] brightness-[0.85] saturate-[1.15]"
            style={{
              backgroundImage: "url('/bg-running.jpg')",
              transform: "scale(1.06) translateZ(0)",
              willChange: "transform",
            }}
          />
          {/* Ambient Lighting & Depth Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/25 to-slate-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-slate-950/40" />
        </div>

        {/* Page Content */}
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
