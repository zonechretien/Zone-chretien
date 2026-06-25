'use client';
import Link from 'next/link';
import { Play, Calendar, Music } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/playerStore';

interface HeroProps {
  latestMusic?: { id: string; titre: string; fichierUrl?: string; couvertureUrl?: string; artiste: { nom: string } };
  latestEvent?: { titre: string; slug: string; dateDebut: string; lieu: string };
}

export function HeroSection({ latestMusic, latestEvent }: HeroProps) {
  const setTrack = usePlayerStore((s) => s.setTrack);

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #0d2b55 60%, #1a1a2e 100%)', minHeight: '520px' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #E8A020 1px, transparent 1px), radial-gradient(circle at 80% 20%, #1E5FA8 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6"
            style={{ background: 'rgba(232,160,32,.15)', color: '#E8A020', border: '1px solid rgba(232,160,32,.3)' }}>
            <span style={{ width: '6px', height: '6px', background: '#E8A020', borderRadius: '50%' }}></span>
            Plateforme Gospel &amp; Chrétienne
          </div>

          <h1 className="font-display text-5xl lg:text-7xl font-black text-white leading-tight mb-4">
            La Gloire<br />
            <span style={{ color: '#E8A020' }}>de Dieu</span><br />
            en Musique
          </h1>

          <p className="text-lg mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,.7)', lineHeight: '1.7' }}>
            Découvrez les artistes gospel haïtiens, les dernières chansons de louange, les concerts à venir et la Parole de Dieu.
          </p>

          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <Link href="/musiques"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm no-underline"
              style={{ background: '#E8A020', color: '#0A1628' }}>
              <Music size={16} /> Écouter maintenant
            </Link>
            <Link href="/evenements"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm no-underline border"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,.3)' }}>
              <Calendar size={16} /> Voir les concerts
            </Link>
          </div>
        </div>

        {latestMusic && (
          <div className="w-72 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            <div className="h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E5FA8, #E8A020)' }}>
              {latestMusic.couvertureUrl
                ? <img src={latestMusic.couvertureUrl} alt={latestMusic.titre} className="w-full h-full object-cover" />
                : <span style={{ fontSize: '64px' }}>🎵</span>
              }
            </div>
            <div className="p-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#E8A020' }}>À la une</div>
              <div className="text-base font-bold text-white mb-1">{latestMusic.titre}</div>
              <div className="text-sm mb-3" style={{ color: 'rgba(255,255,255,.6)' }}>{latestMusic.artiste.nom}</div>
              <button
                onClick={() => setTrack({ id: latestMusic.id, titre: latestMusic.titre, artiste: latestMusic.artiste.nom, audioUrl: latestMusic.fichierUrl || '', coverUrl: latestMusic.couvertureUrl })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#E8A020', color: '#0A1628' }}>
                <Play size={14} /> Écouter
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
