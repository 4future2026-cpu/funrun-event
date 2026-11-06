# Jember Fun Run 2025 — Website Pendaftaran Event

Website pendaftaran resmi **Jember Fun Run 2025** dengan gaya visual minimalis, elegan (putih & abu-abu muda), mobile-first (Android & iPhone), sistem pembayaran multi-metode (QRIS, DANA, GoPay) dengan countdown kadaluarsa 24 jam, bukti pendaftaran resmi, pengiriman email, serta sistem tautan grup WhatsApp sekali pakai (one-time join).

---

## Fitur Utama

1. **Halaman Utama (Landing Page)**:
   - Hero section elegan dengan ajakan bertindak (CTA) *"Ikuti Sekarang"*.
   - Rincian jadwal (15 Juni 2025), venue (Alun-Alun Jember), dan fasilitas race pack.
   - Pilihan kategori lari 5K (Rp 100.000) dan 10K (Rp 150.000).

2. **Formulir Pendaftaran Data Diri**:
   - Validasi nama lengkap, email, nomor WhatsApp, ukuran jersey (S - XXL), kontak darurat, dan kategori.
   - Desain responsif, touch-friendly, dan bebas distorsi di perangkat seluler.

3. **Halaman Pembayaran & Multi-Gateway (QRIS, DANA, GoPay)**:
   - Hitung mundur (countdown) kadaluarsa otomatis 24 jam secara real-time.
   - Pilihan metode: QRIS (standar nasional), DANA (Virtual Account), dan GoPay (kode transaksi).
   - Tombol salin nomor/kode bayar dalam 1 klik.
   - Tombol verifikasi instan *"Saya Sudah Melakukan Pembayaran"*.

4. **Bukti Pendaftaran Resmi (Receipt) & Kirim Email**:
   - Faktur tanda bukti pendaftaran berstatus **LUNAS** dengan nomor transaksi unik.
   - Tombol Cetak / Simpan PDF langsung dari browser ponsel/komputer.
   - Pengiriman otomatis bukti pembayaran berformat HTML ke email peserta via Resend / SMTP.

5. **Tautan Grup WhatsApp Sekali Pakai (One-Time Join Token)**:
   - Tautan unik berbasis token acak: `/wa/[token]`.
   - Melindungi link grup WhatsApp asli agar tidak bocor atau disebarluaskan secara publik.
   - Mekanisme anti-crawler: halaman perantara memastikan preview link WhatsApp/Telegram tidak menghanguskan token sebelum peserta mengkliknya.
   - Status otomatis berubah menjadi `used: true` setelah pertama kali diakses. Akses ulang akan ditolak dengan pesan peringatan.

---

## Struktur Folder

```text
funrun-event/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── confirm-payment/route.ts   # Verifikasi bayar & token WA
│   │   │   ├── confirmation/[id]/route.ts # Ambil data bukti pendaftaran
│   │   │   ├── payment/[id]/route.ts      # Ambil rincian tagihan
│   │   │   ├── register/route.ts          # Simpan data diri & buat tagihan
│   │   │   └── wa/redeem/route.ts         # Validasi & hanguskan token WA
│   │   ├── daftar/page.tsx                # Form pendaftaran peserta
│   │   ├── konfirmasi/[id]/page.tsx       # Tanda bukti pendaftaran (Lunas)
│   │   ├── pembayaran/[id]/page.tsx       # Halaman pembayaran & QRIS 24 jam
│   │   ├── wa/[token]/page.tsx            # Gerbang link WhatsApp 1x pakai
│   │   ├── globals.css                    # Styling Tailwind & warna tema
│   │   ├── layout.tsx                     # Root layout & mobile viewport
│   │   └── page.tsx                       # Landing page utama
│   ├── components/
│   │   ├── Footer.tsx                     # Footer resmi acara
│   │   └── Navbar.tsx                     # Header navigasi responsif
│   └── lib/
│       ├── db.ts                          # Database layer (Supabase + fallback)
│       ├── email.ts                       # Template & pengirim email bukti bayar
│       ├── supabase.ts                    # Inisialisasi Supabase client
│       └── types.ts                       # Definisi TypeScript
├── supabase/
│   └── schema.sql                         # Skrip SQL tabel, index, dan RLS
├── .env.example                           # Contoh konfigurasi environment
├── .env.local                             # Konfigurasi lokal
└── package.json
```

---

## Menjalankan Proyek Secara Lokal

1. Masuk ke folder proyek:
   ```bash
   cd funrun-event
   ```

2. Jalankan server development:
   ```bash
   npm run dev
   ```

3. Buka browser di [http://localhost:3000](http://localhost:3000).

> **Catatan Mode Standalone:** Proyek ini telah dilengkapi dengan *in-memory simulated database*. Anda dapat menguji seluruh alur pendaftaran, pembayaran, countdown 24 jam, bukti pendaftaran, hingga proteksi link WhatsApp 1x pakai secara langsung tanpa harus menunggu setup Supabase selesai!

---

## Konfigurasi Supabase (Database Produksi)

1. Buka dashboard Supabase di [https://supabase.com](https://supabase.com).
2. Buat proyek baru (misalnya: `jember-fun-run-2025`).
3. Masuk ke menu **SQL Editor**, buka file `supabase/schema.sql` dan klik **Run**.
4. Masuk ke **Project Settings** > **API**, salin:
   - `Project URL` &rarr; masukkan ke `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` &rarr; masukkan ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Tempelkan ke file `.env.local`.
