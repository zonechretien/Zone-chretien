'use client';
// src/app/(admin)/dashboard/page.tsx
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsAPI.dashboard().then((r) => r.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = data?.stats;

  const STAT_CARDS = [
    { label: 'Publications', value: stats?.totalPublications, icon: '📰', color: 'var(--blue)', bg: 'rgba(30,95,168,.08)' },
    { label: 'Vidéos', value: stats?.totalVideos, icon: '🎬', color: '#7c3aed', bg: 'rgba(124,58,237,.08)' },
    { label: 'Artistes', value: stats?.totalArtistes, icon: '🎤', color: 'var(--gold)', bg: 'rgba(232,160,32,.1)' },
    { label: 'Événements', value: stats?.totalEvenements, icon: '🎉', color: 'var(--red)', bg: 'rgba(217,79,59,.08)' },
    { label: 'Utilisateurs', value: stats?.totalUsers, icon: '👥', color: '#0891b2', bg: 'rgba(8,145,178,.08)' },
    { label: 'Visiteurs/mois', value: stats?.visiteursMois?.toLocaleString(), icon: '👁', color: '#16a34a', bg: 'rgba(22,163,74,.08)' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'rgba(255,255,255,.9)' }}>
            Bonjour, <span style={{ color: 'var(--gold)' }}>{user?.prenom}</span> 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,.45)' }}>
            {new Date().toLocaleDateString('fr', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#e6f4ee', color: '#16a34a', fontWeight: 600 }}>
          ● Synchronisé en temps réel
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1"
            style={{ border: '1.5px solid var(--gray-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-3"
              style={{ background: card.bg }}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold" style={{ color: card.color }}>
              {isLoading ? <div className="skeleton h-6 w-12"></div> : (card.value ?? '—')}
            </div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--gray-dark)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Content rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Top publications */}
        <div className="bg-white rounded-xl" style={{ border: '1.5px solid var(--gray-light)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--gray-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>🔥 Publications les plus consultées</h3>
          </div>
          <div className="p-2">
            {isLoading
              ? Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-10 mb-2 rounded"></div>)
              : (data?.topPublications?.length
                  ? data.topPublications.map((pub: { id: string; titre: string; vues: number }, i: number) => (
                      <div key={pub.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors"
                        style={{ cursor: 'default' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--off-white)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--gold)' }}>#{i+1}</span>
                        <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{pub.titre}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(30,95,168,.1)', color: 'var(--blue)' }}>
                          {pub.vues.toLocaleString()} vues
                        </span>
                      </div>
                    ))
                  : <p className="text-sm p-4 text-center" style={{ color: 'var(--gray-dark)' }}>Aucune publication</p>
                )}
          </div>
        </div>

        {/* Pending testimonials */}
        <div className="bg-white rounded-xl" style={{ border: '1.5px solid var(--gray-light)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--gray-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>⏳ Témoignages en attente</h3>
            {data?.derniersTemoignages?.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(217,79,59,.1)', color: 'var(--red)' }}>
                {data.derniersTemoignages.length} à valider
              </span>
            )}
          </div>
          <div className="p-3">
            {isLoading
              ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 mb-2 rounded"></div>)
              : (data?.derniersTemoignages?.length
                  ? data.derniersTemoignages.map((t: { id: string; auteurNom: string; type: string; contenu?: string }) => (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg"
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--off-white)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: 'rgba(232,160,32,.15)', color: '#b87d10' }}>
                          {t.auteurNom.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.auteurNom}</div>
                          <div className="text-xs truncate" style={{ color: 'var(--gray-dark)' }}>{t.contenu?.slice(0, 60)}…</div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                            style={{ background: '#dcfce7', color: '#15803d' }}>✓</button>
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                            style={{ background: '#fee2e2', color: '#b91c1c' }}>✕</button>
                        </div>
                      </div>
                    ))
                  : <p className="text-sm p-4 text-center" style={{ color: 'var(--gray-dark)' }}>Aucun témoignage en attente</p>
                )}
          </div>
        </div>
      </div>

      {/* Newsletter stats */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid var(--gray-light)' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>📧 Newsletter</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl p-3" style={{ background: 'rgba(8,145,178,.07)' }}>
            <div className="text-2xl font-bold" style={{ color: '#0891b2' }}>{stats?.totalAbonnes?.toLocaleString() || '—'}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--gray-dark)' }}>Abonnés</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(22,163,74,.07)' }}>
            <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>42%</div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--gray-dark)' }}>Taux ouverture</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(30,95,168,.07)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--blue)' }}>8.3%</div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--gray-dark)' }}>Taux de clic</div>
          </div>
        </div>
      </div>
    </div>
  );
}
