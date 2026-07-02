// src/app/(public)/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { HeroSection } from '@/components/public/HeroSection';
import { Top50Gospel } from '@/components/public/Top50Gospel';
import { LanguageSection, LangItem } from '@/components/public/LanguageSection';
import {
  LatestMusicSection,
  FeaturedArtistsSection,
  UpcomingEventsSection,
  LatestNewsSection,
  NewsletterSection,
  LatestVideosSection,
} from '@/components/public/Sections';

const LANGUES = [
  { value: 'CREOLE', flag: '🇭🇹', titre: 'GOSPEL KREYÒL', bgColor: 'linear-gradient(135deg, #0A1628, #132238)', badgeColor: '#1E5FA8' },
  { value: 'FRANCAIS', flag: '🇫🇷', titre: 'GOSPEL FRANÇAIS', bgColor: 'linear-gradient(135deg, #6b1d2e, #4a1420)', badgeColor: '#9f1239' },
  { value: 'ANGLAIS', flag: '🇺🇸', titre: 'GOSPEL ENGLISH', bgColor: 'linear-gradient(135deg, #E8A020, #c8880e)', badgeColor: '#0A1628', textColor: '#0A1628', mutedColor: 'rgba(10,22,40,.65)', navBg: 'rgba(10,22,40,.12)' },
  { value: 'ESPAGNOL', flag: '🇪🇸', titre: 'GOSPEL ESPAÑOL', bgColor: 'linear-gradient(135deg, #14532d, #0f3d21)', badgeColor: '#16a34a' },
] as const;

function toLangItems(musiques: any[], videos: any[]): LangItem[] {
  const fromMusiques: LangItem[] = musiques.map((m) => ({
    id: m.id, type: 'musique', titre: m.titre, slug: m.slug,
    artiste: m.artiste?.nom || '', imageUrl: m.couvertureUrl, duree: m.duree,
    vues: m.ecoutes ?? 0, fichierUrl: m.fichierUrl,
  }));
  const fromVideos: LangItem[] = videos.map((v) => ({
    id: v.id, type: 'video', titre: v.titre, slug: v.slug,
    artiste: v.artiste?.nom || '', imageUrl: v.miniatureUrl, duree: v.duree,
    vues: v.vues ?? 0, embedId: v.embedId,
  }));
  return [...fromMusiques, ...fromVideos].slice(0, 6);
}

export const metadata: Metadata = {
  title: 'Zone-Chrétien — Plateforme Gospel & Musique Chrétienne',
  description: 'La plateforme gospel en Haïti. Musique, artistes, concerts et Parole de Dieu.',
};

// Server-side data fetching — runs on every request (ISR)
async function getHomeData() {
  try {
    const [publications, musiques, artistes, evenements, videos, top50, ...langueResults] = await Promise.allSettled([
      api.get('/publications?limit=6&status=PUBLIE'),
      api.get('/musiques?limit=8&status=PUBLIE'),
      api.get('/artistes?featured=true&limit=6'),
      api.get('/evenements?upcoming=true&limit=4'),
      api.get('/videos?limit=6&status=PUBLIE'),
      api.get('/musiques/top50'),
      ...LANGUES.flatMap((l) => [
        api.get(`/musiques?limit=4&status=PUBLIE&langue=${l.value}`),
        api.get(`/videos?limit=4&status=PUBLIE&langue=${l.value}`),
      ]),
    ]);

    const parse = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value.data.data : []);
    const langueSections = LANGUES.map((l, i) => ({
      ...l,
      items: toLangItems(parse(langueResults[i * 2]), parse(langueResults[i * 2 + 1])),
    }));

    return {
      publications: publications.status === 'fulfilled' ? publications.value.data.data : [],
      musiques: musiques.status === 'fulfilled' ? musiques.value.data.data : [],
      artistes: artistes.status === 'fulfilled' ? artistes.value.data.data : [],
      evenements: evenements.status === 'fulfilled' ? evenements.value.data.data : [],
      videos: videos.status === 'fulfilled' ? videos.value.data.data : [],
      top50Tracks: top50.status === 'fulfilled' ? top50.value.data.musiques : [],
      top50Week: top50.status === 'fulfilled' ? top50.value.data.weekNumber : 1,
      langueSections,
    };
  } catch {
    return { publications: [], musiques: [], artistes: [], evenements: [], videos: [], top50Tracks: [], top50Week: 1, langueSections: [] };
  }
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const { publications, musiques, artistes, evenements, videos, top50Tracks, top50Week, langueSections } = await getHomeData();

  return (
    <main>
      <HeroSection latestMusic={musiques[0]} latestEvent={evenements[0]} />
      <LatestMusicSection musiques={musiques} />
      <LatestVideosSection videos={videos} />
      <FeaturedArtistsSection artistes={artistes} />
      <UpcomingEventsSection evenements={evenements} />
      <LatestNewsSection publications={publications} />
      <Top50Gospel tracks={top50Tracks} weekNumber={top50Week} preview />
      {langueSections.map((s: any) => (
        <LanguageSection
          key={s.value}
          flag={s.flag}
          titre={s.titre}
          langueValue={s.value}
          bgColor={s.bgColor}
          badgeColor={s.badgeColor}
          textColor={s.textColor}
          mutedColor={s.mutedColor}
          navBg={s.navBg}
          items={s.items}
        />
      ))}
      <NewsletterSection />
    </main>
  );
}
