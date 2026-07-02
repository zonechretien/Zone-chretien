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

const CARD_WIDTH = 160;
const CARD_GAP = 16;

function VariationBadge({ variation, isNew }: { variation: number | null; isNew: boolean }) {
  if (isNew) {
    return (
      <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: '#E8A020', color: 'white' }}>
        NEW
      </span>
    );
  }
  if (variation === null || variation === 0) {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full"
        style={{ background: 'white', color: '#999' }}>
        <Minus className="w-3 h-3" />
      </span>
    );
  }
  if (variation > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: 'white', color: '#16a34a' }}>
        <TrendingUp className="w-3 h-3" />{variation}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: 'white', color: '#dc2626' }}>
      <TrendingDown className="w-3 h-3" />{Math.abs(variation)}
    </span>
  );
}

function TrackCard({ track, weekNumber }: { track: Top50Track; weekNumber: number }) {
  const handlePlay = async () => {
    try { await musiquesAPI.trackPlay(track.id); } catch {}
  };

  return (
    <Link
      href={`/musiques/${track.slug}`}
      onClick={handlePlay}
      className="group cursor-pointer no-underline"
      style={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH, textDecoration: 'none' }}>
      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden mb-2"
        style={{ width: CARD_WIDTH, height: CARD_WIDTH, boxShadow: '0 1px 3px rgba(0,0,0,.12)' }}>
        {/* Rang */}
        <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: '#c0392b', color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,.35)' }}>
          {track.position}
        </div>

        {/* Variation */}
        <div className="absolute bottom-2 left-2 z-10">
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
            <span className="text-4xl opacity-30 text-white">♪</span>
          </div>
        )}

        {/* Overlay au hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,.35)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: '#E8A020' }}>
            <span className="text-navy-900 text-lg ml-0.5">▶</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <p className="text-sm font-semibold truncate group-hover:opacity-70 transition-opacity"
        style={{ color: '#1a1a2e', lineHeight: 1.3, width: CARD_WIDTH }}>
        {track.titre}
      </p>
      <p className="text-xs truncate mt-0.5" style={{ color: '#666', width: CARD_WIDTH }}>
        {track.artiste.nom}
      </p>
      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(192,57,43,.1)', color: '#c0392b' }}>
        Semaine {weekNumber}
      </span>
    </Link>
  );
}

export function Top50Gospel({ tracks, weekNumber, preview = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const step = CARD_WIDTH + CARD_GAP;

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const visible = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir === 'right' ? step * visible : -step * visible, behavior: 'smooth' });
  };

  const displayed = preview ? tracks.slice(0, 20) : tracks;

  return (
    <section className="py-16" style={{ background: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header rouge — uniquement la barre de titre */}
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: '#c0392b' }}>
          <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.65)' }}>
                Semaine {weekNumber}
              </p>
              <h2 className="font-bebas text-2xl sm:text-3xl text-white tracking-widest leading-none">
                TOP 50 GOSPEL HAÏTIEN
              </h2>
            </div>
            {preview && (
              <Link href="/top50"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide no-underline transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.25)' }}>
                Voir le classement complet →
              </Link>
            )}
          </div>
        </div>

        {/* Navigation — gris sur fond blanc */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <button onClick={() => scroll('left')}
            aria-label="Précédent"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: '#f1f1f1', color: '#555', border: '1px solid #e5e5e5' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')}
            aria-label="Suivant"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: '#f1f1f1', color: '#555', border: '1px solid #e5e5e5' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide"
          style={{ gap: CARD_GAP, scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
          {displayed.length === 0 ? (
            <p className="py-8 text-sm" style={{ color: '#999' }}>
              Aucune chanson publiée pour le moment.
            </p>
          ) : (
            displayed.map((track) => (
              <div key={track.id} style={{ scrollSnapAlign: 'start' }}>
                <TrackCard track={track} weekNumber={weekNumber} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
