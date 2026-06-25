'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Play } from 'lucide-react'
import { videosAPI } from '@/lib/api'

function VideoModal({ video, onClose }: { video: any; onClose: () => void }) {
  const platform = video.platform || video.plateforme || 'YOUTUBE'
  const embedId = video.embedId

  const embedUrl = embedId
    ? platform === 'YOUTUBE'
      ? `https://www.youtube.com/embed/${embedId}?autoplay=1&rel=0`
      : platform === 'VIMEO'
      ? `https://player.vimeo.com/video/${embedId}?autoplay=1`
      : null
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>{video.titre}</h3>
            {video.artiste && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0' }}>{video.artiste.nom || video.artiste.nomArtiste}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white', display: 'flex', marginLeft: '16px', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
          {embedUrl ? (
            <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen allow="autoplay; fullscreen; picture-in-picture" />
          ) : video.url ? (
            <video src={video.url} controls autoPlay style={{ width: '100%', height: '100%' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)' }}>
              Vidéo non disponible
            </div>
          )}
        </div>
        {video.description && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '12px', lineHeight: 1.6 }}>{video.description}</p>
        )}
      </div>
    </div>
  )
}

export default function VideosPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [activeVideo, setActiveVideo] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['videos-public', page, search],
    queryFn: () => videosAPI.list({ page, limit: 12, q: search }),
    select: r => ({ videos: r.data?.data || [], pagination: r.data?.meta }),
  })

  const getThumb = (v: any) => {
    if (v.miniatureUrl) return v.miniatureUrl
    const platform = v.platform || v.plateforme
    const embedId = v.embedId
    if (embedId && platform === 'YOUTUBE') return `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`
    return null
  }

  const videos = data?.videos || []

  return (
    <main style={{ minHeight: '100vh', background: '#0A1628', paddingBottom: '2rem' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F2040, #0A1628)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3.5rem', fontWeight: 700, color: 'white', letterSpacing: '0.1em', margin: '0 0 10px', textTransform: 'uppercase' }}>Vidéos</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', margin: 0 }}>Clips, lives et moments d'adoration</p>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Recherche */}
        <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '2rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher une vidéo..."
            style={{ width: '100%', padding: '11px 14px 11px 38px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Grille */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', aspectRatio: '16/9', animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: '16px' }}>Aucune vidéo disponible</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {videos.map((v: any) => {
              const thumb = getThumb(v)
              const platform = v.platform || v.plateforme
              return (
                <div key={v.id} onClick={() => setActiveVideo(v)}
                  style={{ background: '#0F2040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,160,32,0.4)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#152D4D', overflow: 'hidden' }}>
                    {thumb ? (
                      <img src={thumb} alt={v.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Play size={40} color="rgba(255,255,255,0.2)" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      <div style={{ width: '50px', height: '50px', background: 'rgba(232,160,32,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={20} color="#0A1628" fill="#0A1628" style={{ marginLeft: '2px' }} />
                      </div>
                    </div>
                    {/* Platform badge */}
                    <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: platform === 'YOUTUBE' ? '#FF0000' : platform === 'VIMEO' ? '#1AB7EA' : '#333', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                      {platform}
                    </span>
                  </div>
                  {/* Info */}
                  <div style={{ padding: '14px' }}>
                    <p style={{ color: 'white', fontWeight: 500, fontSize: '14px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.titre}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                      {v.artiste ? (v.artiste.nom || v.artiste.nomArtiste) : 'Sans artiste'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '2.5rem' }}>
            {page > 1 && (
              <button onClick={() => setPage(p => p - 1)}
                style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
                ← Précédent
              </button>
            )}
            <span style={{ padding: '9px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              {page} / {data.pagination.pages}
            </span>
            {page < data.pagination.pages && (
              <button onClick={() => setPage(p => p + 1)}
                style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
                Suivant →
              </button>
            )}
          </div>
        )}
      </div>

      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </main>
  )
}
