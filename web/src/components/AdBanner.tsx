'use client';

import React, { useEffect } from 'react';

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
  label = 'Advertisement / Ruang Iklan',
}: AdBannerProps) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (adsenseClientId && typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense push error:', e);
      }
    }
  }, [adsenseClientId]);

  // If Google AdSense Client ID is configured, render the live script tag
  if (adsenseClientId) {
    return (
      <div className={`my-4 flex flex-col items-center justify-center overflow-hidden ${className}`}>
        <span className="text-[10px] tracking-wider uppercase text-slate-500 mb-1 font-mono">{label}</span>
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

  // Developer / Preview Placeholder - non-intrusive, clean border styling
  return (
    <div
      className={`my-4 w-full rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 p-4 text-center transition-colors hover:border-slate-600 ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <p className="text-xs text-slate-400">
          Slot Iklan Siap Pakai (Google AdSense / Mediavine / Monetag)
        </p>
        <p className="text-[11px] text-slate-500">
          Pasang <code className="font-mono text-cyan-400">NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> di Vercel Environment Variables untuk mengaktifkan iklan otomatis.
        </p>
      </div>
    </div>
  );
}
