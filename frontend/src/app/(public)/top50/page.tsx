import { Metadata } from 'next'
import Link from 'next/link'
import { musiquesAPI } from '@/lib/api'
import { TrendingUp, TrendingDown, Minus, Headphones, ArrowLeft, RefreshCw } from 'lucide-react'

export const revalidate = 3600 // revalidate toutes les heures

export const metadata: Metadata = {
  title: 'Top 50 Gospel Haïtien — Zone-Chrétien',
  description: 'Le classement hebdomadaire des 50 chansons gospel haïtiennes les plus écoutées sur Zone-Chrétien.',
}

async function getTop50() {
  try {
    const res = await musiquesAPI.top50()
    return res.data
  } catch { return { musiques: [], weekNumber: 1, total: 0 } }
}

function VariationCell({ variation, isNew }: { variation: number | null; isNew: boolean }) {
  if (isNew) return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(232,160,32,.15)', color: '#E8A020' }}>NEW</span>
  )
  if (variation === null || variation === 0) return (
    <Minus className="w-4 h-4 mx-auto" style={{ color: 'rgba(255,255,255,.25)' }} />
  )
  if (variation > 0) return (
    <span className="flex items-center justify-center gap-0.5 text-xs font-bold" style={{ color: '#22c55e' }}>
      <TrendingUp className="w-3.5 h-3.5" />+{variation}
    </span>
  )
  return (
    <span className="flex items-center justify-center gap-0.5 text-xs font-bold" style={{ color: '#ef4444' }}>
      <TrendingDown className="w-3.5 h-3.5" />{variation}
    </span>
  )
}

export default async function Top50Page() {
  const { musiques, weekNumber, total } = await getTop50()

  return (
    <main className="min-h-screen" style={{ background: '#060E1A' }}>
      {/* Hero header rouge */}
      <div style={{ background: 'linear-gradient(135deg, #e11d48 0%, #9f1239 60%, #060E1A 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 no-underline transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,.55)' }}>
                Classement hebdomadaire · Semaine {weekNumber}
              </p>
              <h1 className="font-bebas text-5xl sm:text-6xl text-white tracking-widest leading-none">
                TOP 50
              </h1>
              <h2 className="font-bebas text-3xl sm:text-4xl tracking-widest leading-none"
                style={{ color: 'rgba(255,255,255,.7)' }}>
                Gospel Haïtien
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,.45)' }}>
              <RefreshCw className="w-3.5 h-3.5" />
              Mis à jour chaque lundi
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {musiques.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'rgba(255,255,255,.3)' }}>
            <Headphones className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune chanson publiée pour le moment.</p>
            <p className="text-sm mt-1">Ajoutez des musiques via le panneau admin.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {musiques.map((track: any) => (
              <Link
                key={track.id}
                href={`/musiques/${track.slug}`}
                className="flex items-center gap-4 px-3 py-3 rounded-xl group transition-all no-underline hover:bg-white/[0.04]"
                style={{ textDecoration: 'none' }}>

                {/* Rang */}
                <div className="w-8 text-center flex-shrink-0">
                  {track.position <= 3 ? (
                    <span className="text-lg font-black"
                      style={{ color: track.position === 1 ? '#FFD700' : track.position === 2 ? '#C0C0C0' : '#CD7F32' }}>
                      {track.position}
                    </span>
                  ) : (
                    <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,.35)' }}>
                      {track.position}
                    </span>
                  )}
                </div>

                {/* Cover */}
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                  {track.couvertureUrl ? (
                    <img src={track.couvertureUrl} alt={track.titre}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-cover.svg'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                      <span className="text-xl opacity-30">♪</span>
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(232,160,32,.8)' }}>
                    <span className="text-navy-900 text-sm font-bold ml-0.5">▶</span>
                  </div>
                </div>

                {/* Titre + artiste */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-white group-hover:text-gold-400 transition-colors">
                    {track.titre}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>
                    {track.artiste?.nom}
                  </p>
                </div>

                {/* Écoutes */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,.3)' }}>
                  <Headphones className="w-3.5 h-3.5" />
                  {track.ecoutes.toLocaleString('fr')}
                </div>

                {/* Variation */}
                <div className="w-14 text-center flex-shrink-0">
                  <VariationCell variation={track.variation} isNew={track.isNew} />
                </div>

                {/* Semaine badge */}
                <div className="hidden sm:block flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(225,29,72,.2)', color: '#fb7185' }}>
                    Sem. {weekNumber}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,.2)' }}>
          {total} chanson{total > 1 ? 's' : ''} • Classement basé sur le nombre d'écoutes cumulées
        </p>
      </div>
    </main>
  )
}
