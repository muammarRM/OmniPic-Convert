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
  label = 'Iklan',
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

  // Live Google AdSense Container
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

  // Clean, non-intrusive preview container (no developer jargon or dashed alert borders)
  return (
    <div
      className={`my-6 mx-auto w-full max-w-4xl rounded-lg bg-slate-900/40 border border-slate-800/60 py-6 px-4 text-center transition-opacity ${className}`}
    >
      <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{label}</span>
      <div className="h-16 sm:h-20 flex items-center justify-center text-xs text-slate-400">
        Ruang Sponsor &amp; Iklan
      </div>
    </div>
  );
}
