'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Music, Play, X, Save, Loader2, Headphones } from 'lucide-react'
import { musiquesAPI, artistesAPI } from '@/lib/api'
import { usePlayerStore } from '@/lib/store/playerStore'
import toast from 'react-hot-toast'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-2xl mt-8 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-navy-800 rounded-lg transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function MusiqueForm({ initial, artistes, onSave, onClose }: any) {
  const [form, setForm] = useState({
    titre: initial?.titre || '',
    artisteId: initial?.artisteId || '',
    audioUrl: initial?.fichierUrl || initial?.audioUrl || '',
    coverUrl: initial?.couvertureUrl || initial?.coverUrl || '',
    duree: initial?.duree || '',
    paroles: initial?.paroles || '',
    genre: initial?.genre || 'GOSPEL_HAITIEN',
    annee: initial?.annee || new Date().getFullYear(),
    estEnVedette: false,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
          <input required value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Artiste *</label>
          <select required value={form.artisteId} onChange={e => setForm({ ...form, artisteId: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
            style={{ backgroundColor: '#0F2040', color: 'white' }}>
            <option value="" style={{ backgroundColor: '#0F2040', color: 'white' }}>-- Sélectionner --</option>
            {artistes?.map((a: any) => (
              <option key={a.id} value={a.id} style={{ backgroundColor: '#0F2040', color: 'white' }}>
                {a.nom || a.nomArtiste}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Genre</label>
          <select value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
            style={{ backgroundColor: '#0F2040', color: 'white' }}>
            {[
              ['GOSPEL_HAITIEN', 'Gospel Haïtien'],
              ['GOSPEL_CONTEMPORAIN', 'Gospel Contemporain'],
              ['LOUANGE_ADORATION', 'Louange & Adoration'],
              ['CHORALE', 'Chorale'],
              ['CHRISTIAN_RAP', 'Christian Rap'],
              ['AUTRE', 'Autre'],
            ].map(([val, label]) =>
              <option key={val} value={val} style={{ backgroundColor: '#0F2040', color: 'white' }}>{label}</option>
            )}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">URL Audio *</label>
          <input required value={form.audioUrl} onChange={e => setForm({ ...form, audioUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">URL Cover</label>
          <input value={form.coverUrl} onChange={e => setForm({ ...form, coverUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Durée (sec)</label>
          <input type="number" value={form.duree} onChange={e => setForm({ ...form, duree: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Année</label>
          <input type="number" value={form.annee} onChange={e => setForm({ ...form, annee: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <input type="checkbox" id="vedette" checked={form.estEnVedette} onChange={e => setForm({ ...form, estEnVedette: e.target.checked })}
            className="w-4 h-4 rounded accent-gold-500" />
          <label htmlFor="vedette" className="text-sm text-gray-300">En vedette</label>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Paroles</label>
          <textarea rows={5} value={form.paroles} onChange={e => setForm({ ...form, paroles: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-y text-sm" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-navy-600 text-gray-300 hover:text-white rounded-xl transition-colors">Annuler</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default function MusiquesPage() {
  const qc = useQueryClient()
  const setTrack = usePlayerStore(s => s.setTrack)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-musiques', page, search],
    queryFn: () => musiquesAPI.list({ page, limit: 15, q: search }),
    select: r => ({ musiques: r.data?.data || r.data?.musiques || [], pagination: r.data?.meta }),
  })

  const { data: artistesData } = useQuery({
    queryKey: ['artistes-select'],
    queryFn: () => artistesAPI.list({ limit: 100 }),
    select: r => r.data?.data || r.data?.artistes || [],
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => musiquesAPI.create({
      titre: d.titre,
      artisteId: d.artisteId || undefined,
      fichierUrl: d.audioUrl,
      couvertureUrl: d.coverUrl,
      genre: d.genre,
      paroles: d.paroles,
      status: 'PUBLIE',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-musiques'] }); toast.success('Musique ajoutée !'); setModal(null) },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => musiquesAPI.update(id, {
      titre: data.titre,
      artisteId: data.artisteId || undefined,
      fichierUrl: data.audioUrl,
      couvertureUrl: data.coverUrl,
      genre: data.genre,
      paroles: data.paroles,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-musiques'] }); toast.success('Musique mise à jour !'); setModal(null) },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => musiquesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-musiques'] }); toast.success('Musique supprimée') },
  })

  const formatDuree = (sec: number) => {
    if (!sec) return '--'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Music className="w-7 h-7 text-gold-400" />
            Musiques
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gérer la discothèque GlorySound</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />Ajouter une musique
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Rechercher une musique ou un artiste..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors" />
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
        ) : data?.musiques?.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><Music className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune musique trouvée</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-navy-800 border-b border-navy-700">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Titre</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Artiste</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Genre</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">
                  <Headphones className="w-4 h-4 inline mr-1" />Écoutes
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Durée</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {data?.musiques?.map((m: any) => (
                <tr key={m.id} className="hover:bg-navy-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {(m.couvertureUrl || m.coverUrl) ? (
                        <img src={m.couvertureUrl || m.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">{m.titre}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-gray-300 text-sm">{m.artiste?.nom || m.artiste?.nomArtiste}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-xs px-2 py-1 bg-navy-700 text-gray-300 rounded-full">{m.genre}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-gray-400 text-sm">{(m.ecoutes ?? m.nombreEcoutes ?? 0).toLocaleString()}</td>
                  <td className="px-5 py-4 hidden sm:table-cell text-gray-400 text-sm">{formatDuree(m.duree)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setTrack({ id: m.id, titre: m.titre, artiste: m.artiste?.nom, audioUrl: m.fichierUrl || m.audioUrl, coverUrl: m.couvertureUrl || m.coverUrl })}
                        className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors text-gray-400 hover:text-green-400">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelected(m); setModal('edit') }}
                        className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors text-gray-400 hover:text-gold-400">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Supprimer "${m.titre}" ?`)) deleteMutation.mutate(m.id) }}
                        className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'create' && (
        <Modal title="Ajouter une musique" onClose={() => setModal(null)}>
          <MusiqueForm artistes={artistesData} onSave={async (d: any) => { await createMutation.mutateAsync(d) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title="Modifier la musique" onClose={() => setModal(null)}>
          <MusiqueForm initial={selected} artistes={artistesData} onSave={async (d: any) => { await updateMutation.mutateAsync({ id: selected.id, data: d }) }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
