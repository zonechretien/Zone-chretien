'use client';
// src/components/public/ArtistSpotlight.tsx
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Music } from 'lucide-react';
import { artistesAPI } from '@/lib/api';

interface SpotlightArtiste {
  id: string;
  nom: string;
  slug: string;
  photoUrl?: string | null;
}

const INTERVAL_MS = 10 * 60 * 1000;
const INITIAL_DELAY_MS = 15 * 1000;
const AUTO_DISMISS_MS = 30 * 1000;

export function ArtistSpotlight() {
  const [artiste, setArtiste] = useState<SpotlightArtiste | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const showRandomArtist = async () => {
      try {
        const { data } = await artistesAPI.list({ featured: true, limit: 50 });
        const artistes: SpotlightArtiste[] = data?.data ?? [];
        if (cancelled || artistes.length === 0) return;
        setArtiste(artistes[Math.floor(Math.random() * artistes.length)]);
      } catch {
        // Spotlight is a non-critical enhancement — fail silently.
      }
    };

    const initial = setTimeout(showRandomArtist, INITIAL_DELAY_MS);
    const interval = setInterval(showRandomArtist, INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!artiste) return;
    dismissTimer.current = setTimeout(() => setArtiste(null), AUTO_DISMISS_MS);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [artiste]);

  const close = () => setArtiste(null);

  return (
    <AnimatePresence>
      {artiste && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed flex items-center gap-3 rounded-2xl shadow-2xl"
          style={{
            bottom: '100px',
            right: '20px',
            zIndex: 60,
            width: '300px',
            padding: '16px',
            background: '#0A1628',
            border: '1px solid rgba(232,160,32,.25)',
          }}
          role="status"
        >
          <button
            onClick={close}
            aria-label="Fermer"
            className="absolute flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{
              top: '8px',
              right: '8px',
              width: '22px',
              height: '22px',
              background: 'rgba(255,255,255,.08)',
              color: 'rgba(255,255,255,.6)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
          </button>

          <div
            className="rounded-xl overflow-hidden shrink-0"
            style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg,#1E5FA8,#E8A020)' }}
          >
            {artiste.photoUrl ? (
              <img src={artiste.photoUrl} alt={artiste.nom} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={20} color="white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p style={{ color: '#E8A020', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>
              🎵 Artiste en vedette
            </p>
            <p className="truncate" style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: '2px 0 8px' }}>
              {artiste.nom}
            </p>
            <Link
              href={`/artistes/${artiste.slug}`}
              onClick={close}
              className="inline-flex items-center justify-center no-underline"
              style={{ background: '#E8A020', color: '#0A1628', fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px' }}
            >
              Voir le profil
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
