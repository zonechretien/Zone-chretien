import Link from 'next/link'
import Image from 'next/image'
import { publicationsAPI } from '@/lib/api'
import { Calendar, ArrowRight } from 'lucide-react'

export const revalidate = 60

async function getPublications(page = 1) {
  try {
    const res = await publicationsAPI.list({ page, limit: 12, status: 'PUBLIE' })
    return { publications: res.data?.data || [], pagination: res.data?.meta }
  } catch { return { publications: [], pagination: null } }
}

export default async function ActualitesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams?.page || '1')
  const data = await getPublications(page)

  return (
    <main className="min-h-screen bg-navy-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 border-b border-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-bebas text-5xl lg:text-6xl text-white tracking-wider mb-3">Actualités</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Les dernières nouvelles du gospel haïtien et de la communauté chrétienne
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {data.publications?.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Aucun article publié pour le moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.publications?.map((pub: any) => (
              <Link key={pub.id} href={`/actualites/${pub.slug}`}
                className="group bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden hover:border-gold-500/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40">
                <div className="relative h-48 bg-navy-800 overflow-hidden">
                  {pub.imageUrl || pub.imageUne ? (
                    <img src={pub.imageUrl || pub.imageUne} alt={pub.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-700">
                      <span className="font-bebas text-6xl text-navy-600">GS</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {pub.categorie && (
                    <span className="text-xs text-gold-400 font-semibold uppercase tracking-wider">
                      {pub.categorie?.nom || pub.categorie}
                    </span>
                  )}
                  <h2 className="text-white font-semibold text-lg mt-1 mb-2 line-clamp-2 group-hover:text-gold-400 transition-colors">
                    {pub.titre}
                  </h2>
                  {pub.extrait && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{pub.extrait}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(pub.publishedAt || pub.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                    <span className="text-gold-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Lire <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data.pagination?.totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-12">
            {page > 1 && (
              <Link href={`/actualites?page=${page - 1}`}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-xl transition-colors">
                ← Précédent
              </Link>
            )}
            <span className="px-5 py-2.5 text-gray-400">Page {page} / {data.pagination.totalPages}</span>
            {page < data.pagination.totalPages && (
              <Link href={`/actualites?page=${page + 1}`}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-xl transition-colors">
                Suivant →
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
