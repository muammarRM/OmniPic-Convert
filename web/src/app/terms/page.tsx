import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Syarat & Ketentuan Layanan - OmniPic-Convert',
  description: 'Syarat dan ketentuan penggunaan layanan OmniPic-Convert.',
};

export default function TermsPage() {
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
              Syarat dan Ketentuan Layanan (Terms of Service)
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <h2 className="text-lg font-semibold text-white">1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mengakses dan menggunakan situs web OmniPic-Convert, Anda menyatakan setuju untuk terikat oleh Syarat dan Ketentuan Layanan ini serta seluruh hukum dan peraturan perundang-undangan yang berlaku. Jika Anda tidak menyetujui ketentuan ini, Anda dipersilakan untuk tidak menggunakan situs ini.
            </p>

            <h2 className="text-lg font-semibold text-white">2. Lisensi dan Penggunaan</h2>
            <p>
              Layanan OmniPic-Convert disediakan secara gratis untuk keperluan pribadi maupun komersial. Anda diperbolehkan mengonversi, mengubah ukuran, mengompres foto, dan mengunduh hasil gambar untuk keperluan apa pun yang sah menurut hukum.
            </p>

            <h2 className="text-lg font-semibold text-white">3. Tanggung Jawab Konten</h2>
            <p>
              Pengguna bertanggung jawab penuh atas hak cipta dan kepemilikan materi foto yang diproses. Dilarang keras menggunakan alat ini untuk memproses konten yang melanggar hak cipta pihak ketiga, materi pornografi ilegal, atau gambar yang melanggar hukum yurisdiksi Anda.
            </p>

            <h2 className="text-lg font-semibold text-white">4. Penafian Jaminan (Disclaimer)</h2>
            <p>
              Layanan ini disediakan berdasarkan basis &quot;sebagaimana adanya&quot; (as is) tanpa jaminan apa pun, baik tersurat maupun tersirat. Kami tidak bertanggung jawab atas kegagalan kompresi, kehilangan data pada perangkat pengguna, atau ketidaksesuaian spesifikasi pendaftaran instansi tertentu di luar kontrol kami.
            </p>

            <h2 className="text-lg font-semibold text-white">5. Perubahan Ketentuan</h2>
            <p>
              Kami berhak memperbarui atau mengubah Syarat dan Ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Pembaruan akan berlaku segera setelah dipublikasikan pada halaman ini.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
