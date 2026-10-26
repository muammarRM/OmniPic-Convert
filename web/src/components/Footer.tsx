import React from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 py-12 text-slate-400">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="font-bold text-white text-sm">OmniPic</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Alat kompresi dan konversi foto online gratis. Semua proses pengolahan gambar berlangsung langsung di peramban Anda tanpa pernah dikirim ke server.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-200">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#kompresor" className="hover:text-white transition-colors">
                  Kompres Target KB
                </Link>
              </li>
              <li>
                <Link href="/#kompresor" className="hover:text-white transition-colors">
                  Konversi HEIC iPhone
                </Link>
              </li>
              <li>
                <Link href="/#kompresor" className="hover:text-white transition-colors">
                  Resize Pas Foto
                </Link>
              </li>
              <li>
                <Link href="/#instagram" className="hover:text-white transition-colors">
                  Unduh Foto Instagram
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policy for Google AdSense */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-200">
              Kebijakan
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Syarat Layanan
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} OmniPic. Bebas digunakan tanpa registrasi.</p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" />
            <span>untuk kemudahan dokumen Anda.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
