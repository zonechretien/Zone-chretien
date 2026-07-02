'use client';
import React from 'react';

// src/components/public/LatestMusicSection.tsx
import Link from 'next/link';
import { Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/playerStore';

interface Musique {
  id: string;
  titre: string;
  slug: string;
  fichierUrl?: string;
  couvertureUrl?: string;
  artiste: { nom: string; slug: string };
  ecoutes: number;
  duree?: number;
}

const formatTime = (s?: number) => {
  if (!s) return '--:--';
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

export function LatestMusicSection({ musiques }: { musiques: Musique[] }) {
  const { setQueue } = usePlayerStore();

  const tracks = musiques.map((m) => ({
    id: m.id,
    titre: m.titre,
    artiste: m.artiste.nom,
    audioUrl: m.fichierUrl || '',
    coverUrl: m.couvertureUrl,
    duree: m.duree,
  }));

  return (
    <section className="py-16" style={{ background: 'var(--off-white)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Bibliothèque</div>
            <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--navy)' }}>Dernières <span style={{ color: 'var(--blue)' }}>Chansons</span></h2>
          </div>
          <Link href="/musiques" className="text-sm font-semibold no-underline" style={{ color: 'var(--blue)' }}>Voir tout →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {musiques.map((m, i) => (
            <div
              key={m.id}
              className="bg-white rounded-xl overflow-hidden card-hover cursor-pointer"
              style={{ border: '1.5px solid var(--gray-light)' }}
              onClick={() => setQueue(tracks, i)}
            >
              <div className="h-36 flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, var(--navy), var(--blue))' }}>
                {m.couvertureUrl && <img src={m.couvertureUrl} alt={m.titre} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,.4)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                    <Play size={16} fill="currentColor" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(10,22,40,.7)', color: 'var(--gold)' }}>#{i + 1}</div>
              </div>
              <div className="p-3">
                <div className="text-sm font-bold truncate" style={{ color: 'var(--navy)' }}>{m.titre}</div>
                <Link
                  href={`/artistes/${m.artiste.slug}`}
                  className="text-xs no-underline"
                  style={{ color: 'var(--gray)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {m.artiste.nom}
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: 'var(--gray)' }}>{m.ecoutes.toLocaleString()} écoutes</span>
                  <span className="text-xs" style={{ color: 'var(--gray)' }}>{formatTime(m.duree)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// src/components/public/FeaturedArtistsSection.tsx (inline export)
export function FeaturedArtistsSection({ artistes }: { artistes: Array<{ id: string; nom: string; slug: string; photoUrl?: string; genre: string; _count: { musiques: number; videos: number } }> }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Gospel</div>
            <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--navy)' }}>Artistes <span style={{ color: 'var(--blue)' }}>en vedette</span></h2>
          </div>
          <Link href="/artistes" className="text-sm font-semibold no-underline" style={{ color: 'var(--blue)' }}>Tous les artistes →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {artistes.map((a) => (
            <Link key={a.id} href={`/artistes/${a.slug}`} className="group text-center no-underline card-hover">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--navy), var(--blue))', color: 'var(--gold)' }}>
                {a.photoUrl ? <img src={a.photoUrl} alt={a.nom} className="w-full h-full object-cover" /> : a.nom.charAt(0)}
              </div>
              <div className="text-sm font-bold" style={{ color: 'var(--navy)' }}>{a.nom}</div>
              <div className="text-xs" style={{ color: 'var(--gray)' }}>{a._count.musiques} chansons</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// src/components/public/UpcomingEventsSection.tsx
export function UpcomingEventsSection({ evenements }: { evenements: Array<{ id: string; titre: string; slug: string; dateDebut: string; lieu: string; type: string; inscriptions: number; imageUrl?: string }> }) {
  return (
    <section className="py-16" style={{ background: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>À venir</div>
            <h2 className="font-display text-3xl font-bold text-white">Événements <span style={{ color: 'var(--gold)' }}>& Concerts</span></h2>
          </div>
          <Link href="/evenements" className="text-sm font-semibold no-underline" style={{ color: 'var(--gold)' }}>Voir tout →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {evenements.map((ev) => {
            const date = new Date(ev.dateDebut);
            return (
              <Link key={ev.id} href={`/evenements/${ev.slug}`} className="flex no-underline rounded-xl overflow-hidden card-hover" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, var(--blue), var(--gold))' }}>
                  <div className="font-accent text-3xl text-white leading-none">{date.getDate()}</div>
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.8)' }}>{date.toLocaleString('fr', { month: 'short' })}</div>
                </div>
                <div className="p-4 flex-1">
                  <div className="text-sm font-bold text-white mb-1">{ev.titre}</div>
                  <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,.6)' }}>📍 {ev.lieu}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(232,160,32,.2)', color: 'var(--gold)' }}>{ev.type}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,.5)' }}>{ev.inscriptions} inscrits</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// src/components/public/LatestNewsSection.tsx
export function LatestNewsSection({ publications }: { publications: Array<{ id: string; titre: string; slug: string; extrait?: string; imageUrl?: string; publishedAt: string; categorie: { nom: string; couleur?: string }; auteur: { nom: string; prenom: string } }> }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Actualités</div>
            <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--navy)' }}>Dernières <span style={{ color: 'var(--blue)' }}>Nouvelles</span></h2>
          </div>
          <Link href="/actualites" className="text-sm font-semibold no-underline" style={{ color: 'var(--blue)' }}>Tout voir →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publications.slice(0,3).map((pub) => (
            <Link key={pub.id} href={`/actualites/${pub.slug}`} className="group no-underline rounded-xl overflow-hidden card-hover" style={{ background: 'white', border: '1.5px solid var(--gray-light)' }}>
              <div className="h-44" style={{ background: pub.imageUrl ? undefined : 'linear-gradient(135deg, var(--navy), var(--blue-bright))' }}>
                {pub.imageUrl && <img src={pub.imageUrl} alt={pub.titre} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(30,95,168,.1)', color: 'var(--blue)' }}>{pub.categorie?.nom || 'Général'}</span>
                  <span className="text-xs" style={{ color: 'var(--gray)' }}>{pub.publishedAt ? new Date(pub.publishedAt).toLocaleDateString('fr') : ''}</span>
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--navy)', lineHeight: '1.4' }}>{pub.titre}</h3>
                {pub.extrait && <p className="text-sm line-clamp-2" style={{ color: 'var(--gray-dark)' }}>{pub.extrait}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// src/components/public/LatestVideosSection.tsx
export function LatestVideosSection({ videos }: { videos: Array<{ id: string; titre: string; slug: string; miniatureUrl?: string; embedId?: string; platform: string; vues: number; artiste?: { nom: string } }> }) {
  const [activeVideo, setActiveVideo] = React.useState<any>(null);

  const getThumb = (v: any) => {
    if (v.miniatureUrl) return v.miniatureUrl;
    if (v.embedId && v.platform === 'YOUTUBE') return `https://img.youtube.com/vi/${v.embedId}/hqdefault.jpg`;
    return null;
  };

  const getEmbedUrl = (v: any) => {
    if (!v.embedId) return null;
    if (v.platform === 'YOUTUBE') return `https://www.youtube.com/embed/${v.embedId}?autoplay=1&rel=0`;
    if (v.platform === 'VIMEO') return `https://player.vimeo.com/video/${v.embedId}?autoplay=1`;
    return null;
  };

  return (
    <>
      <section className="py-16" style={{ background: 'var(--off-white)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>Vidéoclips</div>
              <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--navy)' }}>Dernières <span style={{ color: 'var(--blue)' }}>Vidéos</span></h2>
            </div>
            <Link href="/videos" className="text-sm font-semibold no-underline" style={{ color: 'var(--blue)' }}>Voir tout →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {videos.slice(0,6).map((v) => {
              const thumb = getThumb(v);
              return (
                <button key={v.id} onClick={() => setActiveVideo(v)}
                  className="rounded-xl overflow-hidden card-hover text-left w-full"
                  style={{ background: 'white', border: '1.5px solid var(--gray-light)', cursor: 'pointer', padding: 0 }}>
                  <div className="h-36 relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))' }}>
                    {thumb && <img src={thumb} alt={v.titre} className="w-full h-full object-cover absolute inset-0" />}
                    <div className="relative w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,160,32,.9)', color: 'var(--navy)', zIndex: 1 }}>
                      ▶
                    </div>
                    <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,.7)', color: 'white' }}>{v.platform}</span>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-bold" style={{ color: 'var(--navy)' }}>{v.titre}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--gray)' }}>{(v.vues||0).toLocaleString()} vues{v.artiste && ` · ${v.artiste.nom}`}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setActiveVideo(null)}>
          <div style={{ width: '100%', maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: '1.1rem' }}>{activeVideo.titre}</h3>
                {activeVideo.artiste && <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontSize: '13px' }}>{activeVideo.artiste.nom}</p>}
              </div>
              <button onClick={() => setActiveVideo(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>
                ✕
              </button>
            </div>
            <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
              {getEmbedUrl(activeVideo) ? (
                <iframe src={getEmbedUrl(activeVideo)!}
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
    </>
  );
}

// src/components/public/NewsletterSection.tsx
export function NewsletterSection() {
  return (
    <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))' }}>
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="font-display text-3xl font-bold text-white mb-3">Restez connecté à <span style={{ color: 'var(--gold)' }}>Zone-Chrétien</span></h2>
        <p className="mb-8" style={{ color: 'rgba(255,255,255,.7)' }}>Recevez les dernières chansons, concerts et actualités gospel directement dans votre boîte mail.</p>
        <form className="flex gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Votre email" required
            className="flex-1 px-4 py-3 rounded-xl border-none outline-none text-sm"
            style={{ background: 'rgba(255,255,255,.1)', color: 'white', border: '1px solid rgba(255,255,255,.2)' }} />
          <button type="submit" className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
            S'inscrire ✦
          </button>
        </form>
        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,.4)' }}>3,842 abonnés · Désabonnement en 1 clic</p>
      </div>
    </section>
  );
}
