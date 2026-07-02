import { notFound } from 'next/navigation'
import Link from 'next/link'
import { evenementsAPI } from '@/lib/api'
import { Calendar, MapPin, Clock, Users, ArrowLeft, Ticket } from 'lucide-react'
import { InscriptionButton } from './InscriptionButton'
import { PhotoCarousel } from '@/components/public/PhotoCarousel'

export const revalidate = 60

const TYPE_LABELS: Record<string, string> = {
  CONCERT: 'Concert',
  CROISADE: 'Croisade',
  CONFERENCE: 'Conférence',
  EVANGELISATION: 'Évangélisation',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const res = await evenementsAPI.get(slug)
    const ev = res.data
    return {
      title: ev?.metaTitre || ev?.titre,
      description: ev?.metaDescription || ev?.description?.replace(/<[^>]+>/g, '').slice(0, 160),
      openGraph: { images: ev?.imageUrl ? [ev.imageUrl] : [] },
    }
  } catch { return { title: 'Événement' } }
}

export default async function EvenementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let ev: any

  try {
    const res = await evenementsAPI.get(slug)
    ev = res.data
  } catch { notFound() }

  if (!ev) notFound()

  const dateDebut = new Date(ev.dateDebut)
  const dateFin = ev.dateFin ? new Date(ev.dateFin) : null
  const isPast = dateDebut < new Date()
  const isFull = ev.capacite && ev.inscriptions >= ev.capacite

  const dateFormatted = dateDebut.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const hasGalerie = ev.mediaGalerie?.length > 0

  return (
    <main className="min-h-screen" style={{ background: '#060E1A' }}>
      {/* Hero image */}
      {!hasGalerie && (ev.imageUrl ? (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={ev.imageUrl} alt={ev.titre} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #060E1A 15%, rgba(6,14,26,0.5) 60%, transparent)' }} />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-navy-900 to-navy-950" />
      ))}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20" style={{ marginTop: hasGalerie ? '1.5rem' : ev.imageUrl ? '-4rem' : '2rem' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'rgba(255,255,255,.35)' }}>
          <Link href="/" className="hover:text-white transition-colors" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
          <span>/</span>
          <Link href="/evenements" className="hover:text-white transition-colors" style={{ color: 'inherit', textDecoration: 'none' }}>Événements</Link>
          <span>/</span>
          <span className="truncate max-w-48" style={{ color: 'rgba(255,255,255,.2)' }}>{ev.titre}</span>
        </div>

        {/* Galerie principale (carousel) */}
        {hasGalerie && (
          <div className="mb-8">
            <PhotoCarousel photos={ev.mediaGalerie} variant="hero" aspectRatio="16/9" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {/* Type badge + titre */}
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: 'rgba(232,160,32,.15)', color: '#E8A020', border: '1px solid rgba(232,160,32,.25)' }}>
              {TYPE_LABELS[ev.type] || ev.type}
            </span>

            {isPast && (
              <span className="inline-block ml-2 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.35)', border: '1px solid rgba(255,255,255,.1)' }}>
                Événement passé
              </span>
            )}

            <h1 className="text-white font-display text-3xl md:text-4xl font-bold leading-tight mb-6">
              {ev.titre}
            </h1>

            {ev.description && (
              <div
                className="prose-custom text-gray-300 leading-relaxed"
                style={{ lineHeight: 1.8, fontSize: '1rem', color: 'rgba(255,255,255,.7)' }}
                dangerouslySetInnerHTML={{ __html: ev.description }}
              />
            )}
          </div>

          {/* Carte latérale */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl p-5 sticky top-6"
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
              {/* Date */}
              <div className="flex items-start gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(232,160,32,.12)', border: '1px solid rgba(232,160,32,.2)' }}>
                  <span className="text-lg font-bold leading-none" style={{ color: '#E8A020' }}>{dateDebut.getDate()}</span>
                  <span className="text-xs uppercase" style={{ color: 'rgba(232,160,32,.7)' }}>
                    {dateDebut.toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold capitalize">{dateFormatted}</p>
                  {dateFin && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>
                      Jusqu'au {dateFin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Heure */}
              {ev.heure && (
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#E8A020' }} />
                  <span className="text-sm text-gray-300">{ev.heure}</span>
                </div>
              )}

              {/* Lieu */}
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#E8A020' }} />
                <div>
                  <p className="text-sm text-white font-medium">{ev.lieu}</p>
                  {ev.adresse && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>{ev.adresse}</p>}
                </div>
              </div>

              {/* Entrée */}
              {ev.entree && (
                <div className="flex items-center gap-3 mb-3">
                  <Ticket className="w-4 h-4 flex-shrink-0" style={{ color: '#E8A020' }} />
                  <span className="text-sm" style={{ color: ev.entree === 'Gratuit' ? '#22c55e' : 'rgba(255,255,255,.7)' }}>
                    {ev.entree === 'Gratuit' ? '✓ Entrée gratuite' : ev.entree}
                  </span>
                </div>
              )}

              {/* Inscriptions */}
              {ev.capacite && (
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-4 h-4 flex-shrink-0" style={{ color: '#E8A020' }} />
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,.45)' }}>
                      {ev.inscriptions} / {ev.capacite} inscrits
                    </p>
                    <div className="mt-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.08)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (ev.inscriptions / ev.capacite) * 100)}%`,
                          background: isFull ? '#ef4444' : '#22c55e',
                        }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton d'inscription */}
              {!isPast && (
                <InscriptionButton
                  eventId={ev.id}
                  isFull={!!isFull}
                  inscriptionUrl={ev.inscriptionUrl}
                />
              )}

              {isPast && (
                <div className="w-full py-3 rounded-xl text-center text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.3)' }}>
                  Événement terminé
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-10">
          <Link href="/evenements"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,.35)', textDecoration: 'none' }}>
            <ArrowLeft className="w-4 h-4" /> Retour aux événements
          </Link>
        </div>
      </div>
    </main>
  )
}
