'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Image as ImageIcon, Film, DownloadCloud, BookOpen, Download, Menu, X } from 'lucide-react';

function NavbarContent() {
  const searchParams = useSearchParams();
  const currentTool = searchParams.get('tool') || 'photo';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-tight">OmniPic</span>
            <span className="text-[11px] text-slate-400 font-normal">Studio Foto, Video &amp; Media</span>
          </div>
        </Link>

        {/* Center / Right Navigation Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1 lg:gap-2 text-xs font-medium">
            <Link
              href="/?tool=photo"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                currentTool === 'photo' ? 'text-blue-400 bg-blue-950/40' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Studio Foto</span>
            </Link>

            <Link
              href="/?tool=video"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                currentTool === 'video' ? 'text-blue-400 bg-blue-950/40' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Video &amp; GIF</span>
            </Link>

            <Link
              href="/?tool=downloader"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                currentTool === 'downloader' ? 'text-blue-400 bg-blue-950/40' : 'text-slate-300 hover:text-white'
              }`}
            >
              <DownloadCloud className="h-3.5 w-3.5" />
              <span>Unduh Media</span>
            </Link>

            <Link
              href="/panduan"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              <span>Panduan &amp; FAQ</span>
            </Link>
          </nav>

          {/* Desktop App Link */}
          <a
            href="https://github.com/muammarRM/OmniPic-Convert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-md transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>Desktop (.exe)</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            aria-label="Toggle Menu Navigasi"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/?tool=photo"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
              currentTool === 'photo' ? 'text-blue-400 bg-blue-950/40' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Studio Foto &amp; Kompresi (200 KB)</span>
          </Link>

          <Link
            href="/?tool=video"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
              currentTool === 'video' ? 'text-blue-400 bg-blue-950/40' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Film className="h-4 w-4" />
            <span>Studio Video &amp; Animasi GIF</span>
          </Link>

          <Link
            href="/?tool=downloader"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
              currentTool === 'downloader' ? 'text-blue-400 bg-blue-950/40' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <DownloadCloud className="h-4 w-4" />
            <span>Unduh Media Multi-Platform</span>
          </Link>

          <Link
            href="/panduan"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-900"
          >
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span>Panduan &amp; Tanya Jawab (FAQ)</span>
          </Link>

          <div className="pt-2 border-t border-slate-800">
            <a
              href="https://github.com/muammarRM/OmniPic-Convert"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
            >
              <Download className="h-4 w-4 text-blue-400" />
              <span>Unduh OmniPic Desktop (.exe)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-tight">OmniPic</span>
              <span className="text-[11px] text-slate-400 font-normal">Studio Foto, Video &amp; Media</span>
            </div>
          </Link>
        </div>
      </header>
    }>
      <NavbarContent />
    </Suspense>
  );
}
