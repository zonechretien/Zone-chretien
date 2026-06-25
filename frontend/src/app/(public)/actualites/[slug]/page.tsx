import { notFound } from 'next/navigation'
import Link from 'next/link'
import { publicationsAPI } from '@/lib/api'
import { Calendar, ArrowLeft, Eye } from 'lucide-react'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const res = await publicationsAPI.getBySlug(slug)
    const pub = res.data
    return {
      title: pub?.metaTitre || pub?.titre,
      description: pub?.metaDescription || pub?.extrait,
      openGraph: { images: pub?.imageUrl ? [pub.imageUrl] : [] },
    }
  } catch { return { title: 'Article' } }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let publication: any

  try {
    const res = await publicationsAPI.getBySlug(slug)
    publication = res.data
  } catch { notFound() }

  if (!publication) notFound()

  return (
    <main className="min-h-screen" style={{ background: '#0A1628' }}>
      {publication.imageUrl && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img src={publication.imageUrl} alt={publication.titre} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0A1628, rgba(10,22,40,0.5), transparent)' }} />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-2 text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-white">Accueil</Link>
          <span>/</span>
          <Link href="/actualites" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-white">Actualités</Link>
          <span>/</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{publication.titre}</span>
        </div>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: '1.5rem' }}>
          {publication.titre}
        </h1>

        <div className="flex flex-wrap items-center gap-4 pb-6 mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            {new Date(publication.publishedAt || publication.createdAt).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </span>
          {publication.auteur && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Par {publication.auteur.prenom} {publication.auteur.nom}
            </span>
          )}
        </div>

        {publication.extrait && (
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '2rem', fontStyle: 'italic', paddingLeft: '1rem', borderLeft: '3px solid #E8A020' }}>
            {publication.extrait}
          </p>
        )}

        <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontSize: '1rem' }}
          dangerouslySetInnerHTML={{ __html: publication.contenu }} />

        <div style={{ marginTop: '3rem' }}>
          <Link href="/actualites" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Retour aux actualités
          </Link>
        </div>
      </div>
    </main>
  )
}
