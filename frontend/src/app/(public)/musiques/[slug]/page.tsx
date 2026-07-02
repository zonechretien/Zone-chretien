import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Headphones, Calendar, ArrowLeft, Music } from 'lucide-react';
import { musiquesAPI } from '@/lib/api';
import { PlayButton, ShareButton, RelatedTracks } from './MusiqueDetailClient';

export const revalidate = 60;

const GENRE_LABELS: Record<string, string> = {
  GOSPEL_CONTEMPORAIN: 'Gospel Contemporain',
  GOSPEL_HAITIEN: 'Gospel Haïtien',
  LOUANGE_ADORATION: 'Louange & Adoration',
  CHORALE: 'Chorale',
  CHRISTIAN_RAP: 'Christian Rap',
  AUTRE: 'Autre',
};

const formatDuree = (sec?: number | null) => {
  if (!sec) return '--:--';
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const res = await musiquesAPI.get(slug);
    const m = res.data;
    return {
      title: m?.metaTitre || `${m?.titre} — ${m?.artiste?.nom}`,
      description: m?.metaDescription || `Écoutez "${m?.titre}" de ${m?.artiste?.nom} sur Zone-Chrétien.`,
      openGraph: { images: m?.couvertureUrl ? [m.couvertureUrl] : [] },
    };
  } catch { return { title: 'Musique' }; }
}

export default async function MusiquePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let musique: any;

  try {
    const res = await musiquesAPI.get(slug);
    musique = res.data;
  } catch { notFound(); }

  if (!musique) notFound();

  let related: any[] = [];
  try {
    const res = await musiquesAPI.list({ artisteId: musique.artisteId, limit: 7 });
    related = (res.data?.data ?? []).filter((m: any) => m.id !== musique.id).slice(0, 6);
  } catch {}

  const dateSortie = musique.dateSortie
    ? new Date(musique.dateSortie).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <main className="min-h-screen pb-28" style={{ background: '#060E1A' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-8" style={{ color: 'rgba(255,255,255,.35)' }}>
          <Link href="/" className="hover:text-white transition-colors" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
          <span>/</span>
          <Link href="/musiques" className="hover:text-white transition-colors" style={{ color: 'inherit', textDecoration: 'none' }}>Musiques</Link>
          <span>/</span>
          <span className="truncate max-w-48" style={{ color: 'rgba(255,255,255,.2)' }}>{musique.titre}</span>
        </div>

        {/* En-tête */}
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-8 mb-12">
          {/* Cover */}
          <div className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: '100%', aspectRatio: '1/1', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
            {musique.couvertureUrl ? (
              <img src={musique.couvertureUrl} alt={musique.titre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-16 h-16 opacity-30 text-white" />
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex flex-col justify-end">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 w-fit"
              style={{ background: 'rgba(232,160,32,.15)', color: '#E8A020', border: '1px solid rgba(232,160,32,.25)' }}>
              {GENRE_LABELS[musique.genre] || musique.genre}
            </span>

            <h1 className="text-white font-display text-3xl md:text-5xl font-bold leading-tight mb-3">
              {musique.titre}
            </h1>

            <Link href={`/artistes/${musique.artiste.slug}`} className="text-lg font-semibold mb-4 w-fit hover:opacity-80 transition-opacity"
              style={{ color: '#E8A020', textDecoration: 'none' }}>
              {musique.artiste.nom}
            </Link>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-6" style={{ color: 'rgba(255,255,255,.5)' }}>
              <span className="flex items-center gap-1.5">
                <Headphones className="w-4 h-4" /> {(musique.ecoutes ?? 0).toLocaleString('fr')} écoutes
              </span>
              <span>{formatDuree(musique.duree)}</span>
              {dateSortie && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {dateSortie}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <PlayButton musique={musique} related={related} />
              <ShareButton titre={musique.titre} />
            </div>
          </div>
        </div>

        {/* Paroles */}
        {musique.paroles && musique.paroles.trim() && (
          <div className="rounded-2xl p-6 mb-12"
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
            <h2 className="text-white font-display text-xl font-bold mb-4">Paroles</h2>
            <p className="whitespace-pre-line leading-relaxed" style={{ color: 'rgba(255,255,255,.7)', lineHeight: 1.8 }}>
              {musique.paroles}
            </p>
          </div>
        )}

        {/* Autres chansons de l'artiste */}
        {related.length > 0 && (
          <div className="mb-12">
            <h2 className="text-white font-display text-xl font-bold mb-5">
              Autres chansons de <span style={{ color: '#E8A020' }}>{musique.artiste.nom}</span>
            </h2>
            <RelatedTracks musique={musique} related={related} />
          </div>
        )}

        {/* Retour */}
        <Link href="/musiques"
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,.35)', textDecoration: 'none' }}>
          <ArrowLeft className="w-4 h-4" /> Retour aux musiques
        </Link>
      </div>
    </main>
  );
}
