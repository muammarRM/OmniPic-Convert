import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Cpu, Zap, Lock } from 'lucide-react';

export const metadata = {
  title: 'Tentang Kami - OmniPic-Convert',
  description: 'Mengenal OmniPic-Convert: platform konversi dan optimasi grafis instan.',
};

export default function AboutPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Tentang OmniPic-Convert</h1>
            <p className="text-xs text-slate-400 mt-1">
              Solusi utilitas gambar modern untuk pengguna di Indonesia dan seluruh dunia.
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              <strong>OmniPic-Convert</strong> lahir dari kebutuhan nyata sehari-hari: betapa rumitnya mengecilkan foto hingga di bawah ukuran tertentu (seperti syarat unggah dokumen SSCASN CPNS, BUMN, registrasi kampus, atau kartu KTP) tanpa merusak ketajaman gambar dan tanpa harus mengunggah foto sensitif ke server asing yang tidak jelas keamanannya.
            </p>

            <h2 className="text-lg font-semibold text-white pt-3">Kelebihan Utama Arsitektur Kami:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="p-2 rounded bg-blue-500/10 text-blue-400 w-fit">
                  <Lock className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-white text-sm">Privasi 100% Klien</h3>
                <p className="text-xs text-slate-400">
                  Data gambar Anda tidak pernah dikirim ke awan (cloud). Semua proses kompresi terjadi di RAM perangkat Anda.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 w-fit">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-white text-sm">Target KB Presisi</h3>
                <p className="text-xs text-slate-400">
                  Algoritma pencarian biner otomatis menyesuaikan kualitas dan resolusi agar tepat di bawah batas ukuran yang Anda inginkan.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 w-fit">
                  <Cpu className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-white text-sm">Format Modern & Apple HEIC</h3>
                <p className="text-xs text-slate-400">
                  Mendukung file foto iPhone (.HEIC / .HEIF), JPG, PNG, WebP generasi terbaru, hingga ekspor PDF.
                </p>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-white pt-4">Tersedia dalam 2 Versi</h2>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Versi Web:</strong> Akses langsung dari ponsel pintar (Android/iPhone) atau laptop tanpa perlu install apa pun.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Versi Desktop Windows (.exe):</strong> Aplikasi offline portabel tanpa instalasi dengan fitur native Drag and Drop untuk konversi ribuan foto sekaligus.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
