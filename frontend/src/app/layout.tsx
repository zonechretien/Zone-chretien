// src/app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'GlorySound — Plateforme Gospel & Musique Chrétienne', template: '%s | GlorySound' },
  description: 'Découvrez les meilleures chansons gospel, artistes chrétiens, concerts et actualités de la foi sur GlorySound.',
  keywords: ['gospel', 'musique chrétienne', 'Haïti', 'louange', 'adoration', 'artistes gospel'],
  authors: [{ name: 'GlorySound' }],
  openGraph: {
    type: 'website',
    locale: 'fr_HT',
    url: 'https://glorysound.ht',
    siteName: 'GlorySound',
    title: 'GlorySound — Gospel & Musique Chrétienne 🎵',
    description: 'La plateforme gospel en Haïti. Musique, artistes, concerts et Parole de Dieu.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'GlorySound' }],
  },
  twitter: { card: 'summary_large_image', title: 'GlorySound', description: 'La plateforme gospel en Haïti.' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable} ${bebasNeue.variable} font-body`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
