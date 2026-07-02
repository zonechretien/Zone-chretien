'use client'

import { useParams, notFound } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { artistesAPI } from '@/lib/api'
import { usePlayerStore } from '@/lib/store/playerStore'
import { Play, Facebook, Youtube, Instagram, ArrowLeft, Music, Share2, Headphones } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

function getTrackPlatform(url?: string): 'soundcloud' | 'youtube' | null {
  if (!url) return null
  const u = url.toLowerCase()
  if (u.includes('soundcloud.com')) return 'soundcloud'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  return null
}

export default function ArtisteDetailPage() {
  const { slug } = useParams()
  const { setQueue } = usePlayerStore()

  const { data: artiste, isLoading, isError } = useQuery({
    queryKey: ['artiste', slug],
    queryFn: async () => {
      const res = await artistesAPI.get(slug as string)
      return res.data
    },
  })

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #E8A020', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (isError || !artiste) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Artiste introuvable</p>
        <Link href="/artistes" style={{ color: '#E8A020' }}>← Retour aux artistes</Link>
      </div>
    </div>
  )

  const musiques = artiste.musiques || []

  const handlePlayAll = () => {
    if (!musiques.length) return
    const tracks = musiques.map((m: any) => ({
      id: m.id,
      titre: m.titre,
      artiste: artiste.nom,
      audioUrl: m.fichierUrl || m.audioUrl,
      coverUrl: m.couvertureUrl || m.coverUrl,
    }))
    setQueue(tracks, 0)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: '6rem' }}>
      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: '280px', background: 'linear-gradient(135deg, #0F2040, #1E3A6E)', overflow: 'hidden' }}>
          {artiste.photoUrl && (
            <img src={artiste.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, filter: 'blur(8px)', transform: 'scale(1.1)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0A1628, transparent)' }} />
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
          {/* Photo */}
          <div style={{ width: '140px', height: '140px', borderRadius: '16px', overflow: 'hidden', border: '4px solid #0A1628', flexShrink: 0, background: 'linear-gradient(135deg, #E8A020, #1E5FA8)' }}>
            {artiste.photoUrl
              ? <img src={artiste.photoUrl} alt={artiste.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'white', fontWeight: 700 }}>{artiste.nom?.[0]}</div>
            }
          </div>
          {/* Info */}
          <div>
            <p style={{ color: '#E8A020', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{artiste.genre?.replace(/_/g, ' ')}</p>
            <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 700, margin: '0 0 8px' }}>{artiste.nom}</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>{musiques.length} titre{musiques.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {musiques.length > 0 && (
            <button onClick={handlePlayAll}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#E8A020', border: 'none', borderRadius: '99px', color: '#0A1628', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>
              <Play size={16} fill="#0A1628" /> Tout écouter
            </button>
          )}
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Lien copié !'))}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', cursor: 'pointer' }}
            title="Partager">
            <Share2 size={18} />
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            {artiste.facebook && (
              <a href={artiste.facebook} target="_blank" rel="noopener noreferrer"
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none' }}>
                <Facebook size={18} />
              </a>
            )}
            {artiste.youtube && (
              <a href={artiste.youtube} target="_blank" rel="noopener noreferrer"
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none' }}>
                <Youtube size={18} />
              </a>
            )}
            {artiste.instagram && (
              <a href={artiste.instagram} target="_blank" rel="noopener noreferrer"
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none' }}>
                <Instagram size={18} />
              </a>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: artiste.biographie ? '2fr 1fr' : '1fr', gap: '2rem' }}>
          {/* Musiques */}
          <div>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              Titres ({musiques.length})
            </h2>
            {musiques.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <Music size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
                <p>Aucun titre disponible</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden' }}>
                {musiques.map((m: any, i: number) => (
                  <div key={m.id}
                    onClick={() => setQueue(musiques.map((t: any) => ({
                      id: t.id, titre: t.titre, artiste: artiste.nom,
                      audioUrl: t.fichierUrl || t.audioUrl,
                      coverUrl: t.couvertureUrl || t.coverUrl,
                    })), i)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    {(m.couvertureUrl || m.coverUrl)
                      ? <img src={m.couvertureUrl || m.coverUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music size={16} color="rgba(255,255,255,0.3)" /></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.titre}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>{m.genre?.replace(/_/g, ' ')}</p>
                    </div>
                    {m.ecoutes > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', flexShrink: 0 }}>
                        <Headphones size={12} />
                        {m.ecoutes.toLocaleString()}
                      </span>
                    )}
                    {(() => {
                      const platform = getTrackPlatform(m.fichierUrl || m.audioUrl)
                      if (platform === 'soundcloud') return (
                        <span style={{ color: '#ff5500', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', border: '1px solid rgba(255,85,0,.35)', borderRadius: '4px', padding: '2px 5px', flexShrink: 0 }}>SC</span>
                      )
                      if (platform === 'youtube') return (
                        <Youtube size={14} color="rgba(255,0,0,0.7)" style={{ flexShrink: 0 }} />
                      )
                      return <Play size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Biographie */}
          {artiste.biographie && (
            <div>
              <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Biographie</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontSize: '14px' }}>{artiste.biographie}</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <Link href="/artistes" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Retour aux artistes
          </Link>
        </div>
      </div>
    </main>
  )
}
