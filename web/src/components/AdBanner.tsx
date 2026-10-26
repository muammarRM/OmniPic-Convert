'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { getMonetagDirectLink } from '@/lib/monetag';

interface AdBannerProps {
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
  label?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdBanner({
  slotId = '0000000000',
  format = 'auto',
  className = '',
  label = 'Sponsor',
}: AdBannerProps) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const [directLinkUrl, setDirectLinkUrl] = useState('https://uplcm.com/4/12131009');

  useEffect(() => {
    setDirectLinkUrl(getMonetagDirectLink());
  }, []);

  useEffect(() => {
    if (adsenseClientId && typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense push error:', e);
      }
    }
  }, [adsenseClientId]);

  // Live Google AdSense Container (if AdSense ID configured)
  if (adsenseClientId) {
    return (
      <div className={`my-6 flex flex-col items-center justify-center overflow-hidden ${className}`}>
        <span className="text-[10px] tracking-wider uppercase text-slate-500 mb-1">{label}</span>
        <ins
          className="adsbygoogle block"
          style={{ display: 'block', minHeight: '90px', width: '100%' }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Active Sponsored Visual Banner (Direct Monetization via Monetag SmartLink)
  return (
    <div className={`my-6 mx-auto w-full max-w-4xl ${className}`}>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 font-mono">
          {label}
        </span>
        <span className="text-[10px] text-blue-400 font-medium">Iklan Terverifikasi</span>
      </div>

      <a
        href={directLinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-indigo-950/40 p-4 sm:p-5 hover:border-blue-500/60 transition-all shadow-lg hover:shadow-blue-500/10 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                <span>Penawaran Spesial &amp; Rekomendasi Hari Ini</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Klaim reward gratis, bonus aplikasi produktivitas, dan penawaran terbaik dari mitra sponsor kami.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors w-full sm:w-auto justify-center">
            <span>Buka Penawaran</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        </div>
      </a>
    </div>
  );
}
