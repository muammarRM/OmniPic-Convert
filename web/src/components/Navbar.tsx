'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Download } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">OmniPic</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Universal Image Converter & Optimizer</p>
          </div>
        </Link>

        {/* Center / Right Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>100% Proses di Browser (Aman & Privat)</span>
          </div>

          <a
            href="https://github.com/muammarRM/OmniPic-Convert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>Versi Desktop (.exe)</span>
          </a>
        </div>
      </div>
    </header>
  );
}
