'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Users, Send, Trash2, Loader2, CheckCircle, XCircle, Plus, X } from 'lucide-react'
import { newsletterAPI } from '@/lib/api'
import toast from 'react-hot-toast'

function CampagneModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ sujet: '', contenu: '', nomExpediteur: 'Zone-Chrétien', emailExpediteur: 'newsletter@glorysound.ht' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await newsletterAPI.envoyerCampagne(form)
      toast.success('Campagne envoyée avec succès !')
      qc.invalidateQueries({ queryKey: ['admin-campagnes'] })
      onClose()
    } catch {
      toast.error("Erreur lors de l'envoi de la campagne")
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-2xl mt-8 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h2 className="text-white font-semibold text-lg">Nouvelle campagne e-mail</h2>
          <button onClick={onClose} className="p-2 hover:bg-navy-800 rounded-lg text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Sujet *</label>
            <input required value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })}
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom expéditeur</label>
              <input value={form.nomExpediteur} onChange={e => setForm({ ...form, nomExpediteur: e.target.value })}
                className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email expéditeur</label>
              <input type="email" value={form.emailExpediteur} onChange={e => setForm({ ...form, emailExpediteur: e.target.value })}
                className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Contenu HTML *</label>
            <textarea required rows={10} value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })}
              placeholder="<h1>Bonjour !</h1><p>Contenu de la newsletter...</p>"
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-y font-mono text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-navy-600 text-gray-300 hover:text-white rounded-xl transition-colors">Annuler</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-900 font-bold rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Envoi en cours…' : 'Envoyer la campagne'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewsletterPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'abonnes' | 'campagnes'>('abonnes')
  const [campagneModal, setCampagneModal] = useState(false)

  const { data: abonnesData, isLoading: loadingAbonnes } = useQuery({
    queryKey: ['admin-abonnes'],
    // backend returns { data: [...], meta: {...} }
    queryFn: () => newsletterAPI.getAbonnes({ limit: 100 }),
    select: r => r.data?.data || [],
  })

  const { data: campagnesData, isLoading: loadingCampagnes } = useQuery({
    queryKey: ['admin-campagnes'],
    // backend returns array directly
    queryFn: () => newsletterAPI.getCampagnes({ limit: 20 }),
    select: r => Array.isArray(r.data) ? r.data : [],
  })

  const desinscrireMutation = useMutation({
    mutationFn: (email: string) => newsletterAPI.desinscrire(email),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-abonnes'] }); toast.success('Abonné supprimé') },
  })

  const confirmes = (abonnesData as any[] || []).filter((a: any) => a.confirme)
  const nonConf = (abonnesData as any[] || []).filter((a: any) => !a.confirme)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Mail className="w-7 h-7 text-gold-400" />Newsletter</h1>
          <p className="text-gray-400 text-sm mt-1">Gestion des abonnés et campagnes e-mail</p>
        </div>
        <button onClick={() => setCampagneModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />Nouvelle campagne
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/20 rounded-xl"><CheckCircle className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{confirmes.length}</p>
              <p className="text-gray-400 text-sm">Abonnés confirmés</p>
            </div>
          </div>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/20 rounded-xl"><Loader2 className="w-5 h-5 text-yellow-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{nonConf.length}</p>
              <p className="text-gray-400 text-sm">En attente de confirmation</p>
            </div>
          </div>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl"><Send className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{(campagnesData as any[])?.length || 0}</p>
              <p className="text-gray-400 text-sm">Campagnes envoyées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-navy-700">
        {[['abonnes', 'Abonnés'], ['campagnes', 'Campagnes']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === key ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'abonnes' && (
        <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
          {loadingAbonnes ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
          ) : (
            <table className="w-full">
              <thead className="bg-navy-800 border-b border-navy-700">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">E-mail</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Statut</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                {(abonnesData as any[] || []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-navy-800/50 transition-colors group">
                    <td className="px-5 py-3.5 text-white text-sm">{a.email}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${a.confirme ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {a.confirme ? <CheckCircle className="w-3 h-3" /> : <Loader2 className="w-3 h-3" />}
                        {a.confirme ? 'Confirmé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-gray-400 text-sm">
                      {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { if (confirm(`Désinscrire ${a.email} ?`)) desinscrireMutation.mutate(a.email) }}
                          className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'campagnes' && (
        <div className="space-y-4">
          {loadingCampagnes ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
          ) : !(campagnesData as any[])?.length ? (
            <div className="text-center py-20 bg-navy-900 border border-navy-700 rounded-2xl text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune campagne envoyée</p>
            </div>
          ) : (campagnesData as any[]).map((c: any) => (
            <div key={c.id} className="bg-navy-900 border border-navy-700 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">{c.objet || c.sujet}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Envoyé le {new Date(c.envoyeAt || c.createdAt).toLocaleDateString('fr-FR')} · {c.envoyes ?? '—'} destinataires
                  </p>
                </div>
                <span className="bg-green-500/20 text-green-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <CheckCircle className="w-3 h-3" />Envoyée
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {campagneModal && <CampagneModal onClose={() => setCampagneModal(false)} />}
    </div>
  )
}
