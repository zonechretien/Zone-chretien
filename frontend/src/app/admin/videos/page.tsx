'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Video, X, Save, Loader2, ExternalLink } from 'lucide-react'
import { videosAPI, artistesAPI } from '@/lib/api'
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

function VideoForm({ initial, artistes, onSave, onClose }: any) {
  const [form, setForm] = useState({
    titre: initial?.titre || '',
    description: initial?.description || '',
    videoUrl: initial?.url || initial?.videoUrl || '',
    plateforme: initial?.platform || initial?.plateforme || 'YOUTUBE',
    artisteId: initial?.artisteId || '',
    estEnVedette: false,
    statut: initial?.status || initial?.statut || 'PUBLIE',
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
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">URL Vidéo * (YouTube / Vimeo)</label>
        <input required value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Plateforme</label>
          <select value={form.plateforme} onChange={e => setForm({ ...form, plateforme: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors">
            <option value="YOUTUBE">YouTube</option>
            <option value="VIMEO">Vimeo</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Artiste</label>
          <select value={form.artisteId} onChange={e => setForm({ ...form, artisteId: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors">
            <option value="">-- Aucun --</option>
            {artistes?.map((a: any) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="video-vedette" checked={form.estEnVedette} onChange={e => setForm({ ...form, estEnVedette: e.target.checked })} className="w-4 h-4 accent-gold-500" />
        <label htmlFor="video-vedette" className="text-sm text-gray-300">Vidéo en vedette</label>
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

export default function VideosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-videos', page, search],
    queryFn: () => videosAPI.list({ page, limit: 12, q: search }),
    select: r => ({ videos: r.data?.data || r.data?.videos || [], pagination: r.data?.meta || r.data?.pagination }),
  })

  const { data: artistesData } = useQuery({
    queryKey: ['artistes-select'],
    queryFn: () => artistesAPI.list({ limit: 100 }),
    select: r => r.data?.data || [],
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => videosAPI.create({
      titre: d.titre,
      url: d.videoUrl,
      platform: d.plateforme,
      description: d.description,
      artisteId: d.artisteId || undefined,
      status: d.statut || 'PUBLIE',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-videos'] }); toast.success('Vidéo ajoutée !'); setModal(null) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => videosAPI.update(id, {
      titre: data.titre,
      url: data.videoUrl,
      platform: data.plateforme,
      description: data.description,
      artisteId: data.artisteId || undefined,
      status: data.statut || 'PUBLIE',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-videos'] }); toast.success('Vidéo mise à jour !'); setModal(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => videosAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-videos'] }); toast.success('Vidéo supprimée') },
  })

  const getThumb = (v: any) => {
    if (v.miniatureUrl) return v.miniatureUrl
    if (v.thumbnailUrl) return v.thumbnailUrl
    const platform = v.platform || v.plateforme
    const embedId = v.embedId
    if (embedId && platform === 'YOUTUBE') return `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`
    return null
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Video className="w-7 h-7 text-gold-400" />Vidéos</h1>
          <p className="text-gray-400 text-sm mt-1">Gérer la vidéothèque Zone-Chrétien</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />Ajouter une vidéo
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-navy-900 border border-navy-700 rounded-2xl h-52 animate-pulse" />
        )) : data?.videos?.map((v: any) => (
          <div key={v.id} className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden group hover:border-gold-500/40 transition-colors">
            <div className="relative aspect-video bg-navy-800">
              {getThumb(v) ? (
                <img src={getThumb(v)} alt={v.titre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Video className="w-10 h-10 text-navy-600" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-2 left-2 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">{v.platform || v.plateforme}</span>
            </div>
            <div className="p-4">
              <p className="text-white text-sm font-medium line-clamp-1">{v.titre}</p>
              <p className="text-gray-400 text-xs mt-0.5">{v.artiste?.nom || 'Sans artiste'}</p>
              <div className="flex justify-end gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {(v.url || v.videoUrl) && (
                  <a href={v.url || v.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-white">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => { setSelected(v); setModal('edit') }} className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-gold-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm(`Supprimer "${v.titre}" ?`)) deleteMutation.mutate(v.id) }} className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal === 'create' && (
        <Modal title="Ajouter une vidéo" onClose={() => setModal(null)}>
          <VideoForm artistes={artistesData} onSave={async (d: any) => { await createMutation.mutateAsync(d) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title="Modifier la vidéo" onClose={() => setModal(null)}>
          <VideoForm initial={selected} artistes={artistesData} onSave={async (d: any) => { await updateMutation.mutateAsync({ id: selected.id, data: d }) }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
