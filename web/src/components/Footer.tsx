import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/60 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-white text-base">OmniPic-Convert Web</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Aplikasi web serbaguna untuk konversi format gambar (JPG, PNG, WebP, HEIC iPhone), kompresi ukuran file target (misal &lt; 200 KB untuk CPNS/KTP), pas foto instan (2x3, 3x4, 4x6), dan pengunduh foto Instagram publik.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Privasi Terjamin: Pemrosesan gambar 100% lokal di browser Anda.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-mono">
              Fitur Populer
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#converter" className="hover:text-blue-400 transition-colors">
                  Kompres Target KB (CPNS/BUMN)
                </Link>
              </li>
              <li>
                <Link href="/#converter" className="hover:text-blue-400 transition-colors">
                  Konversi HEIC iPhone ke JPG
                </Link>
              </li>
              <li>
                <Link href="/#converter" className="hover:text-blue-400 transition-colors">
                  Resize Pas Foto 2x3, 3x4, 4x6
                </Link>
              </li>
              <li>
                <Link href="/#instagram" className="hover:text-blue-400 transition-colors">
                  Instagram Photo Grabber
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policy for Google AdSense */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-mono">
              Kebijakan & Dukungan
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Kebijakan Privasi (Privacy Policy)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Syarat Layanan (Terms of Service)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  Tentang OmniPic
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Hubungi Pengembang (Contact)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OmniPic-Convert. Open-source & Bebas Digunakan.</p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" />
            <span>untuk produktivitas tanpa ribet.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
