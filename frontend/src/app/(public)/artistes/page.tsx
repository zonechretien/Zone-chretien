import Link from 'next/link'
import { artistesAPI } from '@/lib/api'
import { Music } from 'lucide-react'

export const revalidate = 300

async function getArtistes() {
  try {
    const res = await artistesAPI.list({ limit: 100 })
    return res.data?.data || res.data?.artistes || []
  } catch { return [] }
}

export default async function ArtistesPage() {
  const artistes = await getArtistes()

  return (
    <main className="min-h-screen bg-navy-950">
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 border-b border-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-bebas text-5xl lg:text-6xl text-white tracking-wider mb-3">Artistes</h1>
          <p className="text-gray-400 text-lg">Découvrez les voix du gospel haïtien</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {artistes.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Aucun artiste disponible.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {artistes.map((artiste: any) => (
              <Link key={artiste.id} href={`/artistes/${artiste.slug}`}
                className="group text-center">
                <div className="relative mx-auto w-full aspect-square rounded-2xl overflow-hidden bg-navy-800 mb-3 ring-2 ring-transparent group-hover:ring-gold-500/50 transition-all">
                  {artiste.photoUrl ? (
                    <img src={artiste.photoUrl} alt={artiste.nom || artiste.nomArtiste}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-navy-700 to-navy-600">
                      <span className="font-bebas text-4xl text-navy-400">{artiste.nom || artiste.nomArtiste?.[0]}</span>
                    </div>
                  )}
                  {artiste.estEnVedette && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">★</span>
                    </div>
                  )}
                </div>
                <p className="text-white font-semibold text-sm group-hover:text-gold-400 transition-colors">{artiste.nom || artiste.nomArtiste}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {artiste.genre} · {artiste._count?.musiques || 0 || 0} titres
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
