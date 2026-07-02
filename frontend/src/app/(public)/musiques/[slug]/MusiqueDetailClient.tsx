'use client';
import Link from 'next/link';
import { Play, Pause, Share2, Music } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePlayerStore, Track } from '@/lib/store/playerStore';

interface TrackData {
  id: string;
  titre: string;
  slug: string;
  couvertureUrl?: string | null;
  fichierUrl: string;
  duree?: number | null;
  artiste: { nom: string; slug: string };
}

interface Props {
  musique: TrackData;
  related: TrackData[];
}

const toTrack = (m: TrackData): Track => ({
  id: m.id,
  titre: m.titre,
  artiste: m.artiste.nom,
  audioUrl: m.fichierUrl,
  coverUrl: m.couvertureUrl || undefined,
  duree: m.duree || undefined,
});

const formatDuree = (sec?: number | null) => {
  if (!sec) return '--:--';
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
};

export function PlayButton({ musique, related }: Props) {
  const { currentTrack, isPlaying, setQueue, togglePlay } = usePlayerStore();
  const isActive = currentTrack?.id === musique.id;

  const handleClick = () => {
    if (isActive) { togglePlay(); return; }
    setQueue([musique, ...related].map(toTrack), 0);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 active:scale-95"
      style={{ background: '#E8A020', color: '#0A1628' }}>
      {isActive && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      {isActive && isPlaying ? 'Pause' : 'Lire'}
    </button>
  );
}

export function ShareButton({ titre }: { titre: string }) {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success(`Lien de "${titre}" copié !`))
      .catch(() => toast.error('Impossible de copier le lien'));
  };

  return (
    <button
      onClick={handleShare}
      title="Copier le lien"
      className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors"
      style={{ background: 'rgba(255,255,255,.08)', color: 'white', border: '1px solid rgba(255,255,255,.15)' }}>
      <Share2 className="w-4 h-4" />
      Partager
    </button>
  );
}

export function RelatedTracks({ musique, related }: Props) {
  const { currentTrack, setQueue } = usePlayerStore();

  if (!related.length) return null;

  const combined = [musique, ...related];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {related.map((track, i) => {
        const isActive = currentTrack?.id === track.id;
        return (
          <div key={track.id} className="group">
            <button
              onClick={() => setQueue(combined.map(toTrack), i + 1)}
              className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 block"
              style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
              {track.couvertureUrl ? (
                <img src={track.couvertureUrl} alt={track.titre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 opacity-30 text-white" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,.45)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E8A020' }}>
                  <Play className="w-4 h-4 fill-current" style={{ color: '#0A1628', marginLeft: 1 }} />
                </div>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#E8A020' }} />
              )}
            </button>
            <Link href={`/musiques/${track.slug}`} className="no-underline">
              <p className="text-sm font-semibold truncate hover:opacity-70 transition-opacity" style={{ color: 'white' }}>
                {track.titre}
              </p>
            </Link>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,.45)' }}>{formatDuree(track.duree)}</p>
          </div>
        );
      })}
    </div>
  );
}
