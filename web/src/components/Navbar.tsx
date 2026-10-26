'use client';

import React from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Download } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-tight">OmniPic</span>
            <span className="text-[11px] text-slate-400 font-normal">Kompres &amp; Konversi Foto</span>
          </div>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden sm:flex items-center gap-5 text-xs font-medium text-slate-300">
            <Link href="/#kompresor" className="hover:text-white transition-colors">
              Kompresor
            </Link>
            <Link href="/#instagram" className="hover:text-white transition-colors">
              Instagram
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              Tentang
            </Link>
          </nav>

          <a
            href="https://github.com/muammarRM/OmniPic-Convert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-md transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>Versi Desktop (.exe)</span>
          </a>
        </div>
      </div>
    </header>
  );
}
