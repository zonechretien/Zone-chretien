'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, CheckCircle, XCircle, Clock, Loader2, Trash2 } from 'lucide-react'
import { temoignagesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// Status values must match Prisma enum: EN_ATTENTE, APPROUVE, REFUSE
const STATUS: Record<string, { label: string; color: string; icon: any }> = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  APPROUVE:   { label: 'Approuvé',   color: 'bg-green-500/20 text-green-400',   icon: CheckCircle },
  REFUSE:     { label: 'Refusé',     color: 'bg-red-500/20 text-red-400',       icon: XCircle },
}

export default function TemoignagesPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('EN_ATTENTE')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-temoignages', filter],
    // calls GET /api/temoignages/admin/tous?status=... — returns array directly
    queryFn: () => temoignagesAPI.getAll({ status: filter }),
    select: r => Array.isArray(r.data) ? r.data : [],
  })

  const statutMutation = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: string }) =>
      temoignagesAPI.updateStatut(id, statut),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-temoignages'] }); toast.success('Statut mis à jour') },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => temoignagesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-temoignages'] }); toast.success('Témoignage supprimé') },
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-gold-400" />Témoignages
        </h1>
        <p className="text-gray-400 text-sm mt-1">Modérer les témoignages de la communauté</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(STATUS).map(([key, val]) => {
          const Icon = val.icon
          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === key ? 'bg-gold-500 text-navy-900' : 'bg-navy-800 text-gray-300 hover:bg-navy-700'}`}>
              <Icon className="w-4 h-4" />{val.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
      ) : !data?.length ? (
        <div className="text-center py-20 bg-navy-900 border border-navy-700 rounded-2xl text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun témoignage {filter === 'EN_ATTENTE' ? 'en attente de modération' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((t: any) => {
            const statusInfo = STATUS[t.status as keyof typeof STATUS]
            const StatusIcon = statusInfo?.icon
            return (
              <div key={t.id} className="bg-navy-900 border border-navy-700 rounded-2xl p-6 hover:border-navy-600 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                      <span className="text-gold-400 font-bold text-lg">{t.auteurNom?.[0] || '?'}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.auteurNom || 'Anonyme'}</p>
                      <p className="text-gray-400 text-xs">{new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusInfo?.color}`}>
                    {StatusIcon && <StatusIcon className="w-3 h-3" />}
                    {statusInfo?.label}
                  </span>
                </div>

                <p className="text-gray-200 text-sm leading-relaxed mb-4">{t.contenu}</p>

                <div className="flex gap-3 flex-wrap">
                  {t.status !== 'APPROUVE' && (
                    <button onClick={() => statutMutation.mutate({ id: t.id, statut: 'APPROUVE' })}
                      disabled={statutMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-xl transition-colors disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" />Approuver
                    </button>
                  )}
                  {t.status !== 'REFUSE' && (
                    <button onClick={() => statutMutation.mutate({ id: t.id, statut: 'REFUSE' })}
                      disabled={statutMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-xl transition-colors disabled:opacity-50">
                      <XCircle className="w-4 h-4" />Refuser
                    </button>
                  )}
                  <button onClick={() => { if (confirm('Supprimer ce témoignage ?')) deleteMutation.mutate(t.id) }}
                    className="flex items-center gap-2 px-4 py-2 bg-navy-700 hover:bg-navy-600 text-gray-300 hover:text-red-400 text-sm rounded-xl transition-colors ml-auto">
                    <Trash2 className="w-4 h-4" />Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
