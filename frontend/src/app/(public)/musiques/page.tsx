'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Music, Play, Search, Headphones, Share2 } from 'lucide-react'
import { musiquesAPI } from '@/lib/api'
import { usePlayerStore } from '@/lib/store/playerStore'
import toast from 'react-hot-toast'

const GENRES = [
  { label: 'Tous',               value: 'Tous' },
  { label: 'Gospel Contemporain', value: 'GOSPEL_CONTEMPORAIN' },
  { label: 'Gospel Haïtien',      value: 'GOSPEL_HAITIEN' },
  { label: 'Louange & Adoration', value: 'LOUANGE_ADORATION' },
  { label: 'Chorale',             value: 'CHORALE' },
  { label: 'Christian Rap',       value: 'CHRISTIAN_RAP' },
  { label: 'Autre',               value: 'AUTRE' },
]

const LANGUES = [
  { label: 'Toutes',       value: 'Toutes', flag: '' },
  { label: 'Kreyòl',       value: 'CREOLE', flag: '🇭🇹' },
  { label: 'Français',     value: 'FRANCAIS', flag: '🇫🇷' },
  { label: 'English',      value: 'ANGLAIS', flag: '🇺🇸' },
  { label: 'Español',      value: 'ESPAGNOL', flag: '🇪🇸' },
]

function MusiquesPageContent() {
  const searchParams = useSearchParams()
  const initialLangue = searchParams.get('langue')?.toUpperCase() || 'Toutes'

  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('Tous')
  const [langue, setLangue] = useState(LANGUES.some(l => l.value === initialLangue) ? initialLangue : 'Toutes')
  const [page, setPage] = useState(1)
  const { setQueue, currentTrack, isPlaying } = usePlayerStore()

  const { data, isLoading } = useQuery({
    queryKey: ['musiques-public', page, search, genre, langue],
    queryFn: () => musiquesAPI.list({
      page,
      limit: 20,
      q: search || undefined,
      genre: genre === 'Tous' ? undefined : genre,
      langue: langue === 'Toutes' ? undefined : langue,
    }),
    select: r => ({
      musiques: (r.data?.data ?? []) as any[],
      meta: r.data?.meta,
    }),
  })

  const handlePlay = (index: number) => {
    if (!data?.musiques?.length) return
    const tracks = data.musiques.map((m: any) => ({
      id: m.id,
      titre: m.titre,
      artiste: m.artiste?.nom || '',
      audioUrl: m.fichierUrl || '',
      coverUrl: m.couvertureUrl,
      duree: m.duree,
    }))
    setQueue(tracks, index)
  }

  const formatDuree = (sec?: number) => {
    if (!sec) return '--'
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  }

  const totalPages = data?.meta?.pages ?? 1

  const handleShare = (slug: string, titre: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/musiques/${slug}`)
      .then(() => toast.success(`Lien de "${titre}" copié !`))
      .catch(() => toast.error('Impossible de copier le lien'))
  }

  return (
    <main className="min-h-screen bg-navy-950 pb-28">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 border-b border-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-bebas text-5xl lg:text-6xl text-white tracking-wider mb-3">Musiques</h1>
          <p className="text-gray-400 text-lg">Gospel, louange et adoration haïtienne</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filtres langue */}
        <div className="flex gap-2 flex-wrap mb-4">
          {LANGUES.map(l => (
            <button
              key={l.value}
              onClick={() => { setLangue(l.value); setPage(1) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${langue === l.value ? 'bg-gold-500 text-navy-900' : 'bg-navy-800 text-gray-300 hover:bg-navy-700'}`}
            >
              {l.flag && <span className="mr-1.5">{l.flag}</span>}{l.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher un titre, artiste..."
              className="w-full pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {GENRES.map(g => (
              <button
                key={g.value}
                onClick={() => { setGenre(g.value); setPage(1) }}
                className={`px-3 py-2 rounded-xl text-sm transition-colors ${genre === g.value ? 'bg-gold-500 text-navy-900 font-bold' : 'bg-navy-800 text-gray-300 hover:bg-navy-700'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Play all button */}
        {(data?.musiques?.length ?? 0) > 0 && (
          <button
            onClick={() => handlePlay(0)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors mb-6"
          >
            <Play className="w-4 h-4 fill-current" />
            Tout lire ({data!.musiques.length} titres)
          </button>
        )}

        {/* List */}
        <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.musiques?.length ? (
            <div className="text-center py-20 text-gray-500">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune musique disponible</p>
            </div>
          ) : (
            <div>
              {data.musiques.map((m: any, i: number) => {
                const isActive = currentTrack?.id === m.id
                return (
                  <div
                    key={m.id}
                    onClick={() => handlePlay(i)}
                    className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors group border-b border-navy-700/50 last:border-0
                      ${isActive ? 'bg-gold-500/10 border-l-2 border-l-gold-500' : 'hover:bg-navy-800/50'}`}
                  >
                    {/* Number / Play indicator */}
                    <div className="w-8 text-center shrink-0">
                      {isActive && isPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-5">
                          {[1, 2, 3].map(b => (
                            <div key={b} className="w-1 bg-gold-400 rounded-sm animate-bounce"
                              style={{ height: `${[60, 100, 40][b - 1]}%`, animationDelay: `${b * 0.15}s` }} />
                          ))}
                        </div>
                      ) : (
                        <>
                          <span className="text-gray-500 text-sm group-hover:hidden">{i + 1}</span>
                          <Play className="w-4 h-4 text-gold-400 hidden group-hover:block mx-auto fill-current" />
                        </>
                      )}
                    </div>

                    {/* Cover */}
                    {m.couvertureUrl ? (
                      <img src={m.couvertureUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-gray-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-gold-400' : 'text-white'}`}>{m.titre}</p>
                      <p className="text-gray-400 text-xs truncate">{m.artiste?.nom}</p>
                    </div>

                    {/* Genre */}
                    <span className="text-xs text-gray-500 hidden md:block shrink-0">
                      {m.genre?.replace(/_/g, ' ')}
                    </span>

                    {/* Écoutes */}
                    <span className="text-xs text-gray-500 hidden lg:flex items-center gap-1 shrink-0">
                      <Headphones className="w-3.5 h-3.5" />
                      {(m.ecoutes ?? 0).toLocaleString()}
                    </span>

                    {/* Durée */}
                    <span className="text-xs text-gray-400 shrink-0 w-10 text-right">{formatDuree(m.duree)}</span>

                    {/* Partage */}
                    <button
                      onClick={e => { e.stopPropagation(); handleShare(m.slug, m.titre) }}
                      title="Copier le lien"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gold-400 hover:bg-navy-700 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            {page > 1 && (
              <button onClick={() => setPage(p => p - 1)}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-xl transition-colors">
                ← Précédent
              </button>
            )}
            <span className="px-5 py-2.5 text-gray-400">Page {page} / {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => setPage(p => p + 1)}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-xl transition-colors">
                Suivant →
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default function MusiquesPage() {
  return (
    <Suspense fallback={null}>
      <MusiquesPageContent />
    </Suspense>
  )
}
