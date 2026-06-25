'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { galerieAPI } from '@/lib/api'

function LightboxModal({ photos, initialIndex, onClose }: { photos: any[]; initialIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(initialIndex)

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(i => (i - 1 + photos.length) % photos.length)
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(i => (i + 1) % photos.length)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl text-white">
        <X className="w-6 h-6" />
      </button>

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 hover:bg-white/10 rounded-xl text-white">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img src={photos[current]?.url} alt={photos[current]?.legende || ''}
          className="max-w-full max-h-[80vh] object-contain rounded-xl" />
      </div>

      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 hover:bg-white/10 rounded-xl text-white">
        <ChevronRight className="w-6 h-6" />
      </button>

      {photos[current]?.legende && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-sm max-w-lg text-center">
          {photos[current].legende}
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-gray-400 text-sm">
        {current + 1} / {photos.length}
      </div>
    </div>
  )
}

export default function GaleriePage() {
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null)
  const [lightbox, setLightbox] = useState<{ photos: any[]; index: number } | null>(null)

  const { data: albums, isLoading } = useQuery({
    queryKey: ['galerie-albums'],
    queryFn: () => galerieAPI.getAlbums({ limit: 20 }),
    select: r => r.data?.albums,
  })

  const { data: albumDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['album-detail', selectedAlbum?.id],
    queryFn: () => galerieAPI.getAlbum(selectedAlbum.id),
    enabled: !!selectedAlbum,
    select: r => r.data?.album,
  })

  const allPhotos = albumDetail?.photos || []

  return (
    <main className="min-h-screen bg-navy-950">
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 border-b border-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-bebas text-5xl lg:text-6xl text-white tracking-wider mb-3">Galerie</h1>
          <p className="text-gray-400 text-lg">Souvenirs et moments précieux en images</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Album detail */}
        {selectedAlbum ? (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-gold-400 transition-colors">
                <ChevronLeft className="w-5 h-5" />Retour aux albums
              </button>
              <div>
                <h2 className="text-white font-bold text-2xl">{selectedAlbum.titre}</h2>
                {selectedAlbum.description && <p className="text-gray-400 text-sm">{selectedAlbum.description}</p>}
              </div>
            </div>

            {loadingDetail ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-navy-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
                {allPhotos.map((photo: any, i: number) => (
                  <div key={photo.id}
                    onClick={() => setLightbox({ photos: allPhotos, index: i })}
                    className="break-inside-avoid cursor-pointer group overflow-hidden rounded-xl hover:opacity-90 transition-opacity">
                    <img src={photo.url} alt={photo.legende || ''}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Albums grid */
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 bg-navy-900 border border-navy-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : albums?.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun album disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albums?.map((album: any) => (
                <div key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="group cursor-pointer bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden hover:border-gold-500/40 hover:-translate-y-1 transition-all hover:shadow-xl hover:shadow-black/40">
                  <div className="relative h-48 bg-navy-800 overflow-hidden">
                    {album.couvertureUrl ? (
                      <img src={album.couvertureUrl} alt={album.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-navy-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent" />
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                      {album._count?.photos || 0} photos
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold group-hover:text-gold-400 transition-colors">{album.titre}</h3>
                    {album.description && <p className="text-gray-400 text-sm mt-1 line-clamp-1">{album.description}</p>}
                    {album.dateEvenement && (
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(album.dateEvenement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {lightbox && (
        <LightboxModal photos={lightbox.photos} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </main>
  )
}
