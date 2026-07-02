// src/app/(public)/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { HeroSection } from '@/components/public/HeroSection';
import {
  LatestMusicSection,
  FeaturedArtistsSection,
  UpcomingEventsSection,
  LatestNewsSection,
  NewsletterSection,
  LatestVideosSection,
} from '@/components/public/Sections';

export const metadata: Metadata = {
  title: 'Zone-Chrétien — Plateforme Gospel & Musique Chrétienne',
  description: 'La plateforme gospel en Haïti. Musique, artistes, concerts et Parole de Dieu.',
};

// Server-side data fetching — runs on every request (ISR)
async function getHomeData() {
  try {
    const [publications, musiques, artistes, evenements, videos] = await Promise.allSettled([
      api.get('/publications?limit=6&status=PUBLIE'),
      api.get('/musiques?limit=8&status=PUBLIE'),
      api.get('/artistes?featured=true&limit=6'),
      api.get('/evenements?upcoming=true&limit=4'),
      api.get('/videos?limit=6&status=PUBLIE'),
    ]);

    return {
      publications: publications.status === 'fulfilled' ? publications.value.data.data : [],
      musiques: musiques.status === 'fulfilled' ? musiques.value.data.data : [],
      artistes: artistes.status === 'fulfilled' ? artistes.value.data.data : [],
      evenements: evenements.status === 'fulfilled' ? evenements.value.data.data : [],
      videos: videos.status === 'fulfilled' ? videos.value.data.data : [],
    };
  } catch {
    return { publications: [], musiques: [], artistes: [], evenements: [], videos: [] };
  }
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const { publications, musiques, artistes, evenements, videos } = await getHomeData();

  return (
    <main>
      <HeroSection latestMusic={musiques[0]} latestEvent={evenements[0]} />
      <LatestMusicSection musiques={musiques} />
      <LatestVideosSection videos={videos} />
      <FeaturedArtistsSection artistes={artistes} />
      <UpcomingEventsSection evenements={evenements} />
      <LatestNewsSection publications={publications} />
      <NewsletterSection />
    </main>
  );
}
