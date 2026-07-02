'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface PhotoItem {
  id?: string;
  url: string;
  caption?: string | null;
}

interface Props {
  photos: PhotoItem[];
  /** "default" = points sous l'image (articles) · "hero" = miniatures + compteur (événements) */
  variant?: 'default' | 'hero';
  aspectRatio?: string;
}

export function PhotoCarousel({ photos, variant = 'default', aspectRatio = '16/9' }: Props) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!photos.length) return null;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + photos.length) % photos.length);
  const current = photos[index];

  return (
    <div>
      {/* Image principale */}
      <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio, background: '#0f172a' }}>
        <img
          key={current.url}
          src={current.url}
          alt={current.caption || ''}
          onClick={() => setLightboxOpen(true)}
          className="w-full h-full object-cover cursor-zoom-in"
        />

        {variant === 'hero' && (
          <div className="absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,.6)', color: 'white' }}>
            Photo {index + 1} / {photos.length}
          </div>
        )}

        {photos.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Précédent"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,.5)', color: 'white' }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Suivant"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,.5)', color: 'white' }}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {current.caption && (
        <p className="text-sm mt-3 text-center" style={{ color: 'rgba(255,255,255,.6)' }}>{current.caption}</p>
      )}

      {/* Points indicateurs (articles) */}
      {variant === 'default' && photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {photos.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`}
              className="rounded-full transition-all"
              style={{ width: i === index ? 20 : 8, height: 8, background: i === index ? '#E8A020' : 'rgba(255,255,255,.25)' }} />
          ))}
        </div>
      )}

      {/* Miniatures (événements) */}
      {variant === 'hero' && photos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {photos.map((p, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`}
              className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
              style={{ width: 72, height: 54, border: i === index ? '2px solid #E8A020' : '2px solid transparent', opacity: i === index ? 1 : 0.6 }}>
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox plein écran */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.95)' }}
          onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} aria-label="Fermer"
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.1)', color: 'white' }}>
            <X className="w-5 h-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Précédent"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,.1)', color: 'white' }}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Suivant"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,.1)', color: 'white' }}>
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt={current.caption || ''} className="w-full max-h-[80vh] object-contain rounded-lg" />
            {current.caption && <p className="text-center text-white mt-4">{current.caption}</p>}
            <p className="text-center text-xs mt-1" style={{ color: 'rgba(255,255,255,.4)' }}>{index + 1} / {photos.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
