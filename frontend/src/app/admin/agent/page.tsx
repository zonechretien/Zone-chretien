'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentAPI } from '@/lib/api';
import toast from 'react-hot-toast';

type LogEntry = { type: string; detail: string; success: boolean; at: string };

const TYPE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  publication: { icon: '📰', label: 'Publication', color: '#1E5FA8' },
  evenement:   { icon: '🎉', label: 'Événement',   color: '#7c3aed' },
  suggestions: { icon: '🎵', label: 'Suggestion',  color: '#E8A020' },
  video:       { icon: '🎬', label: 'Vidéo',        color: '#ef4444' },
  musique:     { icon: '🎧', label: 'Musique',      color: '#16a34a' },
  reponse:     { icon: '✉️', label: 'Email',        color: '#16a34a' },
};

function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</div>
    </div>
  );
}

export default function AgentPage() {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loadingTrigger, setLoadingTrigger] = useState<string | null>(null);
  const [showGenMenu, setShowGenMenu] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['agent-status'],
    queryFn: () => agentAPI.status().then((r) => r.data),
    refetchInterval: 15000,
  });

  const toggleMutation = useMutation({
    mutationFn: (enable: boolean) => enable ? agentAPI.enable() : agentAPI.disable(),
    onSuccess: (_, enable) => {
      queryClient.invalidateQueries({ queryKey: ['agent-status'] });
      toast.success(enable ? '🤖 Agent IA activé !' : 'Agent IA désactivé.');
    },
    onError: () => toast.error('Erreur lors du changement d\'état.'),
  });

  async function trigger(action: 'publication' | 'evenement' | 'suggestions' | 'video' | 'musique') {
    setLoadingTrigger(action);
    setShowGenMenu(false);
    try {
      if (action === 'publication') {
        await agentAPI.triggerPublication();
        toast.success('📰 Publication générée et publiée !');
        queryClient.invalidateQueries({ queryKey: ['agent-status'] });
      } else if (action === 'evenement') {
        await agentAPI.triggerEvenement();
        toast.success('🎉 Événement créé et publié !');
        queryClient.invalidateQueries({ queryKey: ['agent-status'] });
      } else if (action === 'video') {
        await agentAPI.triggerVideo();
        toast.success('🎬 Vidéo publiée !');
        queryClient.invalidateQueries({ queryKey: ['agent-status'] });
      } else if (action === 'musique') {
        await agentAPI.triggerMusique();
        toast.success('🎧 Musique suggérée en brouillon — à valider dans Musiques.');
        queryClient.invalidateQueries({ queryKey: ['agent-status'] });
      } else {
        const res = await agentAPI.triggerSuggestions();
        setSuggestions(res.data.suggestions);
        toast.success('🎵 Analyse terminée !');
        queryClient.invalidateQueries({ queryKey: ['agent-status'] });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur lors du déclenchement.';
      toast.error(msg);
    } finally {
      setLoadingTrigger(null);
    }
  }

  const enabled = data?.enabled ?? false;
  const apiOk = data?.apiConfigured ?? false;

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            🤖 Agent IA <span style={{ color: 'var(--gold)' }}>Zone-Chrétien</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,.45)' }}>
            Génération automatique de contenu gospel avec Claude AI
          </p>
        </div>

        {/* Toggle ON/OFF */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,.45)' }}>
              État de l'agent
            </div>
            <div className="text-sm font-bold" style={{ color: enabled ? '#22c55e' : 'rgba(255,255,255,.3)' }}>
              {isLoading ? '…' : enabled ? '● Actif' : '○ Inactif'}
            </div>
          </div>
          <button
            onClick={() => toggleMutation.mutate(!enabled)}
            disabled={toggleMutation.isPending || isLoading}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            style={{
              background: enabled ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)',
              color: enabled ? '#ef4444' : '#22c55e',
              border: `1px solid ${enabled ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`,
            }}>
            {toggleMutation.isPending ? '…' : enabled ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>

      {/* API Key warning */}
      {!apiOk && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5' }}>
          ⚠️ <strong>ANTHROPIC_API_KEY</strong> non configurée dans <code>backend/.env</code>.
          Ajoutez votre clé API Anthropic pour activer la génération de contenu.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon="📰" value={data?.todayPublications ?? 0} label="Publications aujourd'hui" color="#1E5FA8" />
        <StatCard icon="🎬" value={data?.todayVideos ?? 0} label="Vidéos aujourd'hui" color="#ef4444" />
        <StatCard icon="🎧" value={data?.todayMusiques ?? 0} label="Musiques suggérées" color="#16a34a" />
        <StatCard icon="🎉" value={data?.todayEvenements ?? 0} label="Événements créés" color="#7c3aed" />
        <StatCard icon="📋" value={data?.totalLogs ?? 0} label="Total actions" color="#E8A020" />
      </div>

      {/* Planification */}
      <div className="rounded-xl p-5 mb-5" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
        <h2 className="text-sm font-bold text-white mb-3">⏰ Planification automatique</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '📰', label: 'Publications', schedule: '7h · 12h30 · 19h', freq: '3 par jour', color: '#1E5FA8' },
            { icon: '🎬', label: 'Vidéos',        schedule: '10h · 16h',       freq: '2 par jour', color: '#ef4444' },
            { icon: '🎧', label: 'Musiques',      schedule: 'Chaque jour 9h',  freq: '1 brouillon/jour', color: '#16a34a' },
            { icon: '🎉', label: 'Événements',   schedule: 'Chaque lundi 8h',  freq: '1 par semaine', color: '#7c3aed' },
            { icon: '🎵', label: 'Suggestions',  schedule: 'Chaque jeudi 10h', freq: '1 par semaine', color: '#E8A020' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span>{item.icon}</span>
                <span className="text-sm font-semibold text-white">{item.label}</span>
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,.45)' }}>{item.schedule}</div>
              <div className="text-xs font-bold mt-1" style={{ color: item.color }}>{item.freq}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Déclenchement manuel */}
      <div className="rounded-xl p-5 mb-5" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
        <h2 className="text-sm font-bold text-white mb-3">⚡ Déclenchement manuel</h2>
        <div className="flex flex-wrap gap-3">
          {/* Générer une publication — choix du type : Article / Vidéo / Musique */}
          <div className="relative">
            <button
              onClick={() => setShowGenMenu((v) => !v)}
              disabled={!!loadingTrigger}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: '#1E5FA822', color: '#1E5FA8', border: '1px solid #1E5FA844' }}>
              {['publication', 'video', 'musique'].includes(loadingTrigger || '') ? (
                <span className="animate-spin">⟳</span>
              ) : '✨'}
              {['publication', 'video', 'musique'].includes(loadingTrigger || '') ? 'Génération…' : 'Générer une publication'} ▾
            </button>
            {showGenMenu && (
              <div className="absolute z-10 mt-2 w-56 rounded-xl overflow-hidden shadow-xl"
                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)' }}>
                {([
                  { action: 'publication' as const, icon: '📰', label: 'Article',  needsApi: true },
                  { action: 'video'       as const, icon: '🎬', label: 'Vidéo',    needsApi: false },
                  { action: 'musique'     as const, icon: '🎧', label: 'Musique',  needsApi: true },
                ]).map(({ action, icon, label, needsApi }) => (
                  <button
                    key={action}
                    onClick={() => trigger(action)}
                    disabled={!!loadingTrigger || (needsApi && !apiOk)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors disabled:opacity-40 hover:bg-white/5"
                    style={{ color: 'white' }}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {([
            { action: 'evenement'   as const, icon: '🎉', label: 'Créer un événement',       color: '#7c3aed' },
            { action: 'suggestions' as const, icon: '🎵', label: 'Analyser les tendances',   color: '#E8A020' },
          ]).map(({ action, icon, label, color }) => (
            <button
              key={action}
              onClick={() => trigger(action)}
              disabled={!!loadingTrigger || !apiOk}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
              {loadingTrigger === action ? (
                <span className="animate-spin">⟳</span>
              ) : icon}
              {loadingTrigger === action ? 'Génération…' : label}
            </button>
          ))}
        </div>
        {!apiOk && (
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,.3)' }}>
            Configurez ANTHROPIC_API_KEY pour utiliser les déclenchements manuels.
          </p>
        )}
      </div>

      {/* Résultat suggestions */}
      {suggestions && (
        <div className="rounded-xl p-5 mb-5" style={{ background: '#0f172a', border: '1px solid rgba(232,160,32,.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--gold)' }}>🎵 Suggestions musicales IA</h2>
            <button onClick={() => setSuggestions(null)}
              className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>✕ Fermer</button>
          </div>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,.8)', fontFamily: 'inherit' }}>
            {suggestions}
          </pre>
        </div>
      )}

      {/* Journal d'activité */}
      <div className="rounded-xl" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
          <h2 className="text-sm font-bold text-white">📋 Journal d'activité récent</h2>
        </div>
        <div className="p-2">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-10 rounded-lg mb-1" style={{ background: 'rgba(255,255,255,.04)' }} />
            ))
          ) : !data?.recentLogs?.length ? (
            <p className="text-sm p-4 text-center" style={{ color: 'rgba(255,255,255,.3)' }}>
              Aucune activité pour l'instant. Activez l'agent ou déclenchez une action manuellement.
            </p>
          ) : (
            data.recentLogs.map((log: LogEntry, i: number) => {
              const meta = TYPE_LABELS[log.type] || { icon: '•', label: log.type, color: '#fff' };
              return (
                <div key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                  style={{ background: i % 2 === 0 ? 'rgba(255,255,255,.02)' : 'transparent' }}>
                  <span className="text-base flex-shrink-0">{log.success ? meta.icon : '❌'}</span>
                  <span className="text-xs font-bold flex-shrink-0 w-20" style={{ color: log.success ? meta.color : '#ef4444' }}>
                    {meta.label}
                  </span>
                  <span className="flex-1 text-sm truncate" style={{ color: log.success ? 'rgba(255,255,255,.7)' : 'rgba(239,68,68,.8)' }}>
                    {log.detail}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,.25)' }}>
                    {new Date(log.at).toLocaleString('fr', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
