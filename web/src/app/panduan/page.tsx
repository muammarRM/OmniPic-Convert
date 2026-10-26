import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HelpCircle, ShieldCheck, FileCheck, ArrowLeft, Camera, Sliders, Smartphone, Film } from 'lucide-react';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Panduan & Tanya Jawab - OmniPic',
  description:
    'Panduan lengkap kompresi foto 200 KB untuk CPNS/SSCASN, panduan ukuran pas foto 3x4 & 4x6, konversi HEIC iPhone, manipulasi video, dan jaminan privasi data Anda.',
};

export default function PanduanPage() {
  const faqs = [
    {
      q: 'Bagaimana cara kompres foto pas 200 KB untuk pendaftaran CPNS / SSCASN BKN?',
      a: 'Pilih preset "200 KB" pada panel kontrol, lalu masukkan foto Anda. Algoritma adaptif OmniPic akan secara otomatis menghitung tingkat kompresi biner agar ukuran file akhir berada di bawah 200 KB (biasanya berkisar antara 160 KB - 195 KB) tanpa membuat wajah atau teks dokumen menjadi pecah.',
    },
    {
      q: 'Apakah foto atau video saya aman dan diunggah ke server?',
      a: '100% Aman. OmniPic bekerja menggunakan teknologi HTML5 Canvas dan WebAssembly langsung di dalam browser perangkat Anda (Client-Side). File Anda tidak pernah diunggah, disimpan, atau dikirimkan ke server kami maupun pihak ketiga mana pun.',
    },
    {
      q: 'Apakah metadata sensitif seperti lokasi GPS otomatis dihapus?',
      a: 'Ya. Saat foto diproses dan dikonversi ulang melalui Canvas, seluruh metadata EXIF mentah (termasuk koordinat GPS, jenis perangkat, dan tanggal pengambilan foto) dibersihkan secara otomatis demi melindungi privasi Anda.',
    },
    {
      q: 'Bagaimana cara mengubah foto HEIC dari iPhone menjadi JPG?',
      a: 'Cukup tarik atau pilih file .heic langsung dari galeri atau penyimpanan Anda. OmniPic langsung membaca dan mengubah formatnya menjadi JPG atau WebP berkualitas tinggi secara instan tanpa perlu aplikasi tambahan.',
    },
    {
      q: 'Berapa ukuran piksel standar untuk pas foto 2x3, 3x4, dan 4x6 cm?',
      a: 'Dengan standar cetak 300 DPI: Pas foto 2x3 cm berukuran 236 x 354 piksel, pas foto 3x4 cm berukuran 354 x 472 piksel, dan pas foto 4x6 cm berukuran 472 x 709 piksel. Di OmniPic, Anda cukup memilih opsi rasio tersebut tanpa perlu menghitung piksel secara manual.',
    },
    {
      q: 'Bagaimana cara mengubah video menjadi animasi GIF atau mengambil foto dari video?',
      a: 'Buka tab "Studio Video & GIF" di halaman utama, pilih file video Anda, geser slider durasi untuk menentukan bagian klip yang ingin dijadikan GIF, lalu klik "Ekspor Animasi GIF". Anda juga bisa mengklik tombol "Ambil Foto (Frame HD)" untuk mengekstrak foto tajam dari detik video mana pun.',
    },
    {
      q: 'Apakah layanan OmniPic berbayar atau ada batasan jumlah file?',
      a: 'Layanan OmniPic 100% gratis untuk semua orang tanpa batas kuota harian. Anda dapat mengompres puluhan foto sekaligus dan mengunduhnya dalam satu paket file .ZIP dengan sekali klik.',
    },
  ];

  const guides = [
    {
      icon: FileCheck,
      title: 'Standar Dokumen CPNS & BKN',
      desc: 'Panduan memenuhi batas ketat 200 KB SSCASN dengan ketajaman teks maksimal agar lolos seleksi administrasi berkas.',
    },
    {
      icon: Camera,
      title: 'Preset Pas Foto Resmi',
      desc: 'Standar ukuran 2x3, 3x4, dan 4x6 cm untuk KTP, SIM, paspor, buku nikah, dan lamaran kerja.',
    },
    {
      icon: Smartphone,
      title: 'Konversi HEIC iPhone',
      desc: 'Solusi mudah membuka dan mengubah format foto kamera iPhone agar kompatibel di semua sistem pendaftaran.',
    },
    {
      icon: Film,
      title: 'Manipulasi Video & Animasi GIF',
      desc: 'Ekstrak foto beresolusi tinggi dari video dan buat animasi GIF tanpa software berat seperti Photoshop.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10 w-full">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Studio Utama</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Panduan Penggunaan &amp; Pertanyaan Umum (FAQ)
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Informasi praktis seputar kompresi dokumen resmi, standar ukuran pas foto, keamanan privasi, dan tips memaksimalkan fitur OmniPic.
          </p>
        </div>

        {/* Ad Banner */}
        <AdBanner label="Sponsor Rekomendasi" />

        {/* Quick Guide Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-500" />
            <span>Topik Panduan Utama</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guides.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed FAQ Accordion / List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            <span>Pertanyaan yang Sering Diajukan</span>
          </h2>
          <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/40 px-5">
            {faqs.map((faq, index) => (
              <div key={index} className="py-4 space-y-1.5">
                <h3 className="text-sm font-semibold text-white flex items-start gap-2">
                  <span className="text-blue-400 font-mono text-xs mt-0.5">Q{index + 1}:</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Box */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-5 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <ShieldCheck className="h-5 w-5" />
            <span>Komitmen Keamanan &amp; Privasi Mutlak</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            OmniPic dirancang dengan arsitektur privasi zero-trust. Kami tidak memiliki database file gambar Anda. Setiap proses pemotongan, kompresi, dan konversi berlangsung murni di memori RAM browser Anda sendiri.
          </p>
        </div>

        {/* Action CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white">Siap mengompres atau mengedit foto Anda?</h4>
            <p className="text-xs text-slate-400">Gunakan studio konversi instan tanpa perlu mendaftar akun.</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <span>Mulai di Studio OmniPic</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
