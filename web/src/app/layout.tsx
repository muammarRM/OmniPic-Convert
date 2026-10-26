import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'OmniPic - Kompres & Konversi Foto Online Gratis',
  description:
    'Kecilkan ukuran foto ke target KB (200 KB untuk CPNS/KTP), ubah format JPG, PNG, WebP, HEIC iPhone, dan simpan foto Instagram secara cepat, gratis, dan 100% aman di browser.',
  keywords: [
    'kompres foto 200 kb',
    'kompres foto cpns',
    'heic to jpg',
    'convert heic online',
    'pas foto 3x4',
    'pas foto 4x6',
    'instagram photo downloader',
    'image converter free',
  ],
  authors: [{ name: 'OmniPic' }],
  other: {
    monetag: '6299037324741d2d89d09b8da71c3d53',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="id" className="dark">
      <head>
        <meta name="monetag" content="6299037324741d2d89d09b8da71c3d53" />
        {adsenseId && (
          <Script
            id="adsbygoogle-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
