'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/playerStore';

export interface LangItem {
  id: string;
  type: 'musique' | 'video';
  titre: string;
  slug: string;
  artiste: string;
  imageUrl?: string | null;
  duree?: number | null;
  vues: number;
  fichierUrl?: string;
  embedId?: string | null;
}

interface Props {
  flag: string;
  titre: string;
  langueValue: string;
  bgColor: string;
  badgeColor: string;
  items: LangItem[];
  textColor?: string;
  mutedColor?: string;
  navBg?: string;
}

const CARD_W = 180;
const CARD_GAP = 16;

const formatDuree = (sec?: number | null) => {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
};

export function LanguageSection({
  flag, titre, langueValue, bgColor, badgeColor, items,
  textColor = 'white', mutedColor = 'rgba(255,255,255,.6)', navBg = 'rgba(255,255,255,.15)',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setQueue } = usePlayerStore();
  const [activeVideo, setActiveVideo] = useState<LangItem | null>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = CARD_W + CARD_GAP;
    const visible = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir === 'right' ? step * visible : -step * visible, behavior: 'smooth' });
  };

  const handleClick = (item: LangItem) => {
    if (item.type === 'musique') {
      const tracks = items
        .filter((i) => i.type === 'musique')
        .map((i) => ({
          id: i.id, titre: i.titre, artiste: i.artiste,
          audioUrl: i.fichierUrl || '', coverUrl: i.imageUrl || undefined, duree: i.duree || undefined,
        }));
      const idx = tracks.findIndex((t) => t.id === item.id);
      setQueue(tracks, idx >= 0 ? idx : 0);
    } else {
      setActiveVideo(item);
    }
  };

  if (!items.length) return null;

  return (
    <section className="py-12" style={{ background: bgColor }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{flag}</span>
            <div>
              <h2 className="font-bebas text-2xl sm:text-3xl tracking-widest leading-none" style={{ color: textColor }}>{titre}</h2>
              <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: badgeColor, color: 'white' }}>
                {langueValue}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/musiques?langue=${langueValue.toLowerCase()}`}
              className="text-sm font-semibold no-underline hover:opacity-80 transition-opacity"
              style={{ color: textColor, textDecoration: 'none' }}>
              Voir tout →
            </Link>
            <button onClick={() => scroll('left')} aria-label="Précédent"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: navBg, color: textColor }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scroll('right')} aria-label="Suivant"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: navBg, color: textColor }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide"
          style={{ gap: CARD_GAP, scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
          {items.map((item) => (
            <button key={`${item.type}-${item.id}`} onClick={() => handleClick(item)}
              className="flex-shrink-0 text-left group cursor-pointer"
              style={{ width: CARD_W, scrollSnapAlign: 'start' }}>
              <div className="relative rounded-xl overflow-hidden mb-2"
                style={{ width: CARD_W, height: CARD_W, background: 'rgba(255,255,255,.08)' }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl opacity-30 text-white">♪</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                  style={{ background: 'rgba(0,0,0,.6)', color: 'white' }}>
                  {item.type === 'video' ? '▶ Vidéo' : '♪ Musique'}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,.4)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: badgeColor }}>
                    <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
              <p className="text-sm font-semibold leading-tight mb-0.5"
                style={{ color: textColor, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.titre}
              </p>
              <p className="text-xs truncate" style={{ color: mutedColor }}>{item.artiste}</p>
              <p className="text-xs mt-0.5" style={{ color: mutedColor }}>
                {formatDuree(item.duree) || `${item.vues.toLocaleString('fr')} ${item.type === 'video' ? 'vues' : 'écoutes'}`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setActiveVideo(null)}>
          <div style={{ width: '100%', maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: '1.1rem' }}>{activeVideo.titre}</h3>
              <button onClick={() => setActiveVideo(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>
                ✕
              </button>
            </div>
            <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
              {activeVideo.embedId ? (
                <iframe src={`https://www.youtube.com/embed/${activeVideo.embedId}?autoplay=1&rel=0`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen allow="autoplay; fullscreen" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)' }}>
                  Lecteur non disponible
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
