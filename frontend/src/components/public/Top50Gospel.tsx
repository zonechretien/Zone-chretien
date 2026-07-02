'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { musiquesAPI } from '@/lib/api';

export interface Top50Track {
  id: string;
  titre: string;
  slug: string;
  couvertureUrl?: string | null;
  ecoutes: number;
  position: number;
  variation: number | null;
  isNew: boolean;
  artiste: { id: string; nom: string; slug: string };
}

interface Props {
  tracks: Top50Track[];
  weekNumber: number;
  /** nombre de cartes affichées en mode carousel (homepage) */
  preview?: boolean;
}

function VariationBadge({ variation, isNew }: { variation: number | null; isNew: boolean }) {
  if (isNew) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
        style={{ background: 'rgba(232,160,32,.2)', color: '#E8A020' }}>
        NEW
      </span>
    );
  }
  if (variation === null || variation === 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold"
        style={{ color: 'rgba(255,255,255,.3)' }}>
        <Minus className="w-3 h-3" />
      </span>
    );
  }
  if (variation > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold"
        style={{ color: '#22c55e' }}>
        <TrendingUp className="w-3 h-3" />+{variation}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold"
      style={{ color: '#ef4444' }}>
      <TrendingDown className="w-3 h-3" />{variation}
    </span>
  );
}

function TrackCard({ track, compact = false }: { track: Top50Track; compact?: boolean }) {
  const handlePlay = async () => {
    try { await musiquesAPI.trackPlay(track.id); } catch {}
  };

  return (
    <Link
      href={`/musiques/${track.slug}`}
      onClick={handlePlay}
      className="flex-shrink-0 group cursor-pointer no-underline"
      style={{ width: compact ? 140 : 160, textDecoration: 'none' }}>
      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden mb-2"
        style={{ width: '100%', aspectRatio: '1/1' }}>
        {/* Rang */}
        <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)', color: 'white', boxShadow: '0 2px 8px rgba(225,29,72,.5)' }}>
          {track.position}
        </div>

        {/* Variation */}
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md flex items-center"
          style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}>
          <VariationBadge variation={track.variation} isNew={track.isNew} />
        </div>

        {/* Image */}
        {track.couvertureUrl ? (
          <img
            src={track.couvertureUrl}
            alt={track.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = '/images/default-cover.svg'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
            <span className="text-4xl opacity-30">♪</span>
          </div>
        )}

        {/* Overlay au hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(232,160,32,.9)' }}>
            <span className="text-navy-900 text-lg ml-0.5">▶</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <p className="text-white text-sm font-semibold truncate group-hover:text-gold-400 transition-colors"
        style={{ lineHeight: 1.3 }}>
        {track.titre}
      </p>
      <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,.45)' }}>
        {track.artiste.nom}
      </p>
    </Link>
  );
}

export function Top50Gospel({ tracks, weekNumber, preview = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const CARD_W = 168; // card width + gap

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const visible = Math.floor(el.clientWidth / CARD_W);
    el.scrollBy({ left: dir === 'right' ? CARD_W * visible : -CARD_W * visible, behavior: 'smooth' });
  };

  const displayed = preview ? tracks.slice(0, 20) : tracks;

  return (
    <section className="py-10">
      {/* Header rouge BGospel */}
      <div className="mx-4 sm:mx-6 lg:mx-8 max-w-7xl xl:mx-auto">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #e11d48 0%, #9f1239 50%, #881337 100%)' }}>
          {/* Bande titre */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.6)' }}>
                  Semaine {weekNumber}
                </p>
                <h2 className="font-bebas text-2xl sm:text-3xl text-white tracking-widest leading-none">
                  TOP 50 GOSPEL HAÏTIEN
                </h2>
              </div>
              {preview && (
                <Link href="/top50"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide no-underline transition-all hover:bg-white/20"
                  style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.25)' }}>
                  Voir le classement complet →
                </Link>
              )}
            </div>
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,.2)', color: 'white' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,.2)', color: 'white' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lien mobile */}
          {preview && (
            <div className="px-5 pb-3 sm:hidden">
              <Link href="/top50"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase no-underline"
                style={{ background: 'rgba(255,255,255,.15)', color: 'white' }}>
                Voir le classement complet →
              </Link>
            </div>
          )}

          {/* Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-3 px-5 pb-5 overflow-x-auto scrollbar-hide"
            style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
            {displayed.length === 0 ? (
              <p className="py-8 text-sm" style={{ color: 'rgba(255,255,255,.4)' }}>
                Aucune chanson publiée pour le moment.
              </p>
            ) : (
              displayed.map((track) => (
                <div key={track.id} style={{ scrollSnapAlign: 'start' }}>
                  <TrackCard track={track} compact={false} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
