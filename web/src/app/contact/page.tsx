import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Code2 } from 'lucide-react';

export const metadata = {
  title: 'Hubungi Kami - OmniPic-Convert',
  description: 'Kontak dan saluran bantuan pengembang aplikasi OmniPic-Convert.',
};

export default function ContactPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Hubungi Kami (Contact Us)</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ada pertanyaan, kendala teknis, saran fitur baru, atau penawaran kerja sama? Kami siap membantu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Dukungan Email & Kemitraan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Untuk pertanyaan umum, iklan, atau laporan bug peramban:
                </p>
                <a
                  href="mailto:support@omnipic.dev"
                  className="inline-block mt-2 font-mono text-xs text-blue-400 hover:underline"
                >
                  support@omnipic.dev
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/40 text-slate-200">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Repositori GitHub Resmi</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Buka issue baru, sumbang kontribusi kode, atau unduh rilis aplikasi desktop:
                </p>
                <a
                  href="https://github.com/muammarRM/OmniPic-Convert"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 font-mono text-xs text-blue-400 hover:underline"
                >
                  github.com/muammarRM/OmniPic-Convert
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-900 p-5">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Formulir Pertanyaan Cepat
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Silakan gunakan fitur GitHub Issues atau kirimkan pesan langsung melalui email pengembang untuk respon tercepat dalam 1x24 jam.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
