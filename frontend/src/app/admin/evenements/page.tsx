'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Calendar, X, Save, Loader2, MapPin, Users } from 'lucide-react'
import { evenementsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-2xl mt-8 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-navy-800 rounded-lg text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// EventType enum values must match the Prisma schema: CONCERT, CROISADE, CONFERENCE, EVANGELISATION
const EVENT_TYPES = [
  ['CONCERT', 'Concert'],
  ['CROISADE', 'Croisade / Culte'],
  ['CONFERENCE', 'Conférence'],
  ['EVANGELISATION', 'Évangélisation'],
]

function EvenementForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    titre: initial?.titre || '',
    description: initial?.description || '',
    dateDebut: initial?.dateDebut ? new Date(initial.dateDebut).toISOString().slice(0, 16) : '',
    dateFin: initial?.dateFin ? new Date(initial.dateFin).toISOString().slice(0, 16) : '',
    lieu: initial?.lieu || '',
    adresse: initial?.adresse || '',
    imageUrl: initial?.imageUrl || '',
    type: initial?.type || 'CONCERT',
    capacite: initial?.capacite || '',
    entree: initial?.entree || 'Gratuit',
    status: initial?.status || 'PUBLIE',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
        <input required value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Date début *</label>
          <input required type="datetime-local" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Date fin</label>
          <input type="datetime-local" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors">
            {EVENT_TYPES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Statut</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors">
            <option value="PUBLIE">Publié</option>
            <option value="BROUILLON">Brouillon</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Lieu / Salle *</label>
          <input required value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })}
            placeholder="Nom de la salle..."
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse / Ville</label>
          <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })}
            placeholder="Port-au-Prince..."
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Capacité max</label>
          <input type="number" value={form.capacite} onChange={e => setForm({ ...form, capacite: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Entrée</label>
          <input value={form.entree} onChange={e => setForm({ ...form, entree: e.target.value })}
            placeholder="Gratuit ou prix..."
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">URL Image</label>
        <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://..."
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-navy-600 text-gray-300 hover:text-white rounded-xl transition-colors">Annuler</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-900 font-bold rounded-xl flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default function EvenementsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-evenements', page, search],
    queryFn: () => evenementsAPI.list({ page, limit: 12 }),
    // backend returns { data: [...], meta: {...} }
    select: r => ({ evenements: r.data?.data || [], meta: r.data?.meta }),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => evenementsAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-evenements'] }); toast.success('Événement créé !'); setModal(null) },
    onError: () => toast.error('Erreur lors de la création'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => evenementsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-evenements'] }); toast.success('Événement mis à jour !'); setModal(null) },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => evenementsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-evenements'] }); toast.success('Événement supprimé') },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const isPast = (date: string) => new Date(date) < new Date()

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Calendar className="w-7 h-7 text-gold-400" />Événements</h1>
          <p className="text-gray-400 text-sm mt-1">Concerts, cultes, conférences</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />Nouvel événement
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher un événement..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors" />
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
        ) : data?.evenements?.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun événement</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-navy-800 border-b border-navy-700">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Événement</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Lieu</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Inscrits</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Statut</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {data?.evenements?.map((e: any) => (
                <tr key={e.id} className="hover:bg-navy-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{e.titre}</p>
                        {isPast(e.dateDebut) && <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">Passé</span>}
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-navy-700 text-gray-400 rounded-full">{e.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-gray-300 text-sm">
                    {new Date(e.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {e.lieu}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Users className="w-3.5 h-3.5" />
                      {e.inscriptions ?? 0}
                      {e.capacite ? ` / ${e.capacite}` : ''}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status === 'PUBLIE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {e.status === 'PUBLIE' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelected(e); setModal('edit') }} className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-gold-400"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm(`Supprimer "${e.titre}" ?`)) deleteMutation.mutate(e.id) }} className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'create' && (
        <Modal title="Nouvel événement" onClose={() => setModal(null)}>
          <EvenementForm onSave={async (d: any) => { await createMutation.mutateAsync(d) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title="Modifier l'événement" onClose={() => setModal(null)}>
          <EvenementForm initial={selected} onSave={async (d: any) => { await updateMutation.mutateAsync({ id: selected.id, data: d }) }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
