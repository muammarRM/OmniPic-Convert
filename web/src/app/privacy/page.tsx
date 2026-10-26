import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Kebijakan Privasi - OmniPic-Convert',
  description: 'Kebijakan privasi resmi OmniPic-Convert mengenai pemrosesan gambar dan penggunaan cookie iklan.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 sm:px-6 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Kebijakan Privasi (Privacy Policy)
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Prinsip Privasi Utama: Zero Server Storage</strong>
                Semua pemrosesan file gambar (konversi format, kompresi target ukuran KB, crop pas foto, HEIC) dieksekusi secara 100% lokal di dalam peramban (browser) web Anda menggunakan Web Canvas API. Foto Anda TIDAK PERNAH dikirim atau disimpan di server kami.
              </div>
            </div>

            <h2 className="text-lg font-semibold text-white pt-2">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              OmniPic-Convert tidak mewajibkan registrasi akun, pendaftaran nomor telepon, atau data pribadi sensitif lainnya. Kami hanya mengumpulkan informasi analitik standar web tanpa identitas langsung (anonim), seperti jenis peramban, resolusi layar, dan waktu kunjungan untuk meningkatkan kenyamanan penggunaan.
            </p>

            <h2 className="text-lg font-semibold text-white pt-2">2. Penggunaan Cookie & Iklan Pihak Ketiga</h2>
            <p>
              Situs ini dapat menggunakan jaringan iklan pihak ketiga, termasuk Google AdSense, untuk menayangkan iklan saat Anda mengunjungi situs web kami. Vendor pihak ketiga, termasuk Google, menggunakan cookie untuk menayangkan iklan berdasarkan kunjungan pengguna sebelumnya ke situs web ini atau situs web lain di internet.
            </p>
            <p>
              Penggunaan cookie periklanan oleh Google memungkinkan Google dan mitranya untuk menayangkan iklan kepada pengguna berdasarkan kunjungan Anda ke situs ini dan/atau situs lain di internet. Pengguna dapat memilih untuk menonaktifkan iklan hasil personalisasi dengan mengunjungi{' '}
              <a
                href="https://myadcenter.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Pengaturan Iklan Google
              </a>{' '}
              atau melalui{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                www.aboutads.info
              </a>.
            </p>

            <h2 className="text-lg font-semibold text-white pt-2">3. Fitur Instagram Photo Grabber</h2>
            <p>
              Fitur pengunduhan Instagram hanya mengambil metadata dari postingan akun publik melalui antarmuka web publik untuk memudahkan pengguna menyimpan foto dokumentasi mereka sendiri. Kami tidak menyimpan arsip postingan atau data profil Instagram di server permanen.
            </p>

            <h2 className="text-lg font-semibold text-white pt-2">4. Keamanan Data</h2>
            <p>
              Karena seluruh manipulasi grafis berjalan di sisi klien (client-side execution), risiko kebocoran data di server diminimalisir secara absolut. Anda dapat menggunakan alat ini secara offline setelah halaman termuat.
            </p>

            <h2 className="text-lg font-semibold text-white pt-2">5. Hubungi Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan hubungi tim kami melalui halaman{' '}
              <Link href="/contact" className="text-blue-400 underline hover:text-blue-300">
                Kontak
              </Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
