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

  // If no direct display unit configured, render nothing so no empty placeholder confuses users
  return null;
}
