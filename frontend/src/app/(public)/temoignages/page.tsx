// src/app/(public)/temoignages/page.tsx
import type { Metadata } from 'next';
import TemoignagesClient from './TemoignagesClient';

export const metadata: Metadata = {
  title: 'Témoignages — GlorySound',
  description: 'Partagez comment Dieu a transformé votre vie. Découvrez les témoignages de la communauté GlorySound.',
  openGraph: {
    title: 'Témoignages — GlorySound',
    description: 'Partagez comment Dieu a transformé votre vie.',
    type: 'website',
  },
};

async function getTemoignages() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const res = await fetch(`${baseUrl}/temoignages?statut=APPROUVE&limit=12`, {
      next: { revalidate: 300 }, // 5 minutes
    });
    if (!res.ok) return { temoignages: [], total: 0 };
    return res.json();
  } catch {
    return { temoignages: [], total: 0 };
  }
}

export default async function TemoignagesPage() {
  const data = await getTemoignages();
  return <TemoignagesClient initialData={data} />;
}
