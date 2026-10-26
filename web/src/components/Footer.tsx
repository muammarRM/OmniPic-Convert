import React from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Heart, Shield, BookOpen } from 'lucide-react';

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
              Studio serbabisa untuk kompres foto, olah video, buat animasi GIF, dan unduh media online. Diproses 100% di browser demi keamanan data pribadi Anda.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <Shield className="h-3.5 w-3.5" />
              <span>Privasi Terjamin: File tidak disimpan di server</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Fitur Studio
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/?tool=photo" className="hover:text-white transition-colors">
                  Studio Kompres Foto (200 KB)
                </Link>
              </li>
              <li>
                <Link href="/?tool=photo" className="hover:text-white transition-colors">
                  Preset Pas Foto (3x4 &amp; 4x6)
                </Link>
              </li>
              <li>
                <Link href="/?tool=video" className="hover:text-white transition-colors">
                  Studio Video &amp; Animasi GIF
                </Link>
              </li>
              <li>
                <Link href="/?tool=downloader" className="hover:text-white transition-colors">
                  Unduh Media Multi-Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides & Legal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Bantuan &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/panduan" className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>Panduan &amp; Tanya Jawab</span>
                </Link>
              </li>
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
                  Tentang OmniPic
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Kontak Bantuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OmniPic. Layanan gratis tanpa login.</p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" />
            <span>untuk kemudahan dokumen &amp; karya Anda.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
