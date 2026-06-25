import { evenementsAPI } from '@/lib/api'
import { Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

async function getEvenements() {
  try {
    const res = await evenementsAPI.getAll({ limit: 20, statut: 'PUBLIE' })
    return res.data?.evenements || []
  } catch { return [] }
}

export default async function EvenementsPage() {
  const evenements = await getEvenements()
  const now = new Date()
  const upcoming = evenements.filter((e: any) => new Date(e.dateDebut) >= now)
  const past = evenements.filter((e: any) => new Date(e.dateDebut) < now)

  const EventCard = ({ event }: { event: any }) => {
    const isPast = new Date(event.dateDebut) < now
    const dateObj = new Date(event.dateDebut)

    return (
      <div className={`bg-navy-900 border rounded-2xl overflow-hidden hover:border-gold-500/40 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 ${isPast ? 'border-navy-700 opacity-70' : 'border-navy-700'}`}>
        {event.imageUrl && (
          <div className="relative h-40 overflow-hidden">
            <img src={event.imageUrl} alt={event.titre} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
            {isPast && (
              <div className="absolute top-3 right-3 bg-gray-700/80 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                Événement passé
              </div>
            )}
          </div>
        )}

        <div className="p-5">
          {/* Date badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl px-3 py-2 shrink-0">
              <div className="text-center">
                <p className="text-gold-400 font-bold text-lg leading-none">{dateObj.getDate()}</p>
                <p className="text-gold-300 text-xs uppercase">{dateObj.toLocaleDateString('fr-FR', { month: 'short' })}</p>
              </div>
            </div>
            <div className="flex-1">
              <span className="text-xs bg-navy-700 text-gray-300 px-2 py-0.5 rounded-full">{event.type}</span>
              <h3 className="text-white font-semibold mt-1 line-clamp-2">{event.titre}</h3>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              {event.dateFin && (
                <span>– {new Date(event.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
            {event.lieu && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{event.lieu}, {event.ville}</span>
              </div>
            )}
            {event.capaciteMax && (
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{event._count?.inscriptions || 0} inscrits / {event.capaciteMax} places</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${event.estGratuit ? 'text-green-400' : 'text-gold-400'}`}>
              {event.estGratuit ? '✓ Entrée gratuite' : `${event.prix} HTG`}
            </span>
            {!isPast && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-sm rounded-lg transition-colors">
                <CheckCircle className="w-3.5 h-3.5" />S'inscrire
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-navy-950">
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 border-b border-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-bebas text-5xl lg:text-6xl text-white tracking-wider mb-3">Événements</h1>
          <p className="text-gray-400 text-lg">Concerts, cultes, conférences et rassemblements</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {upcoming.length > 0 && (
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-gold-400" />
              Prochains événements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.map((e: any) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-400 mb-5">Événements passés</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {past.map((e: any) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {evenements.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun événement pour le moment</p>
          </div>
        )}
      </div>
    </main>
  )
}
