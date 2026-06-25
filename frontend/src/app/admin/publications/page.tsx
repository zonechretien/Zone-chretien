'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Eye, CheckCircle, Clock, FileText, X, Save, Loader2, Image as ImageIcon } from 'lucide-react'
import { publicationsAPI, mediaAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-gray-500/20 text-gray-300' },
  PUBLIE: { label: 'Publié', color: 'bg-green-500/20 text-green-400' },
  ARCHIVE: { label: 'Archivé', color: 'bg-yellow-500/20 text-yellow-400' },
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-3xl mt-8 mb-8">
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

function PublicationForm({ initial, onSave, onClose }: {
  initial?: any
  onSave: (data: any) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    titre: initial?.titre || '',
    contenu: initial?.contenu || '',
    extrait: initial?.extrait || '',
    statut: initial?.status || initial?.statut || 'BROUILLON',
    imageUne: initial?.imageUrl || initial?.imageUne || '',
    metaTitle: initial?.metaTitre || initial?.metaTitle || '',
    metaDescription: initial?.metaDescription || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
        <input
          required
          value={form.titre}
          onChange={(e) => setForm({ ...form, titre: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Extrait</label>
        <textarea
          rows={2}
          value={form.extrait}
          onChange={(e) => setForm({ ...form, extrait: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Contenu *</label>
        <textarea
          required
          rows={10}
          value={form.contenu}
          onChange={(e) => setForm({ ...form, contenu: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-y font-mono text-sm"
          placeholder="Contenu HTML ou Markdown..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Statut</label>
          <select
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
          >
            <option value="BROUILLON">Brouillon</option>
            <option value="PUBLIE">Publier</option>
            <option value="ARCHIVE">Archiver</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Image à la une (URL)</label>
          <input
            value={form.imageUne}
            onChange={(e) => setForm({ ...form, imageUne: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
      </div>

      <div className="border-t border-navy-700 pt-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">SEO (optionnel)</p>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Meta Title</label>
          <input
            value={form.metaTitle}
            onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Meta Description</label>
          <textarea
            rows={2}
            value={form.metaDescription}
            onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 border border-navy-600 text-gray-300 hover:text-white rounded-xl transition-colors">
          Annuler
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default function PublicationsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-publications', page, search, statusFilter],
    queryFn: () => publicationsAPI.list({ page, limit: 15, q: search, status: statusFilter }),
    select: (r) => ({ publications: r.data?.data || [], pagination: r.data?.meta }),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => publicationsAPI.create({
      titre: d.titre,
      contenu: d.contenu,
      extrait: d.extrait,
      status: d.statut,
      imageUrl: d.imageUne,
      metaTitre: d.metaTitle,
      metaDescription: d.metaDescription,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-publications'] })
      toast.success('Publication créée !')
      setModal(null)
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => publicationsAPI.update(id, {
      titre: data.titre,
      contenu: data.contenu,
      extrait: data.extrait,
      status: data.statut,
      imageUrl: data.imageUne,
      metaTitre: data.metaTitle,
      metaDescription: data.metaDescription,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-publications'] })
      toast.success('Publication mise à jour !')
      setModal(null)
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: any) => publicationsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-publications'] })
      toast.success('Publication supprimée')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const handleDelete = (pub: any) => {
    if (!confirm(`Supprimer "${pub.titre}" ?`)) return
    deleteMutation.mutate(pub.id)
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-gold-400" />
            Publications
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gérer les articles et actualités</p>
        </div>
        <button
          onClick={() => { setSelected(null); setModal('create') }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle publication
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLIE">Publié</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="ARCHIVE">Archivé</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
          </div>
        ) : data?.publications?.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune publication trouvée</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-navy-800 border-b border-navy-700">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Titre</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Auteur</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Statut</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {data?.publications?.map((pub: any) => (
                <tr key={pub.id} className="hover:bg-navy-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {(pub.imageUrl || pub.imageUne) ? (
                        <img src={pub.imageUrl || pub.imageUne} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-medium line-clamp-1">{pub.titre}</p>
                        <p className="text-gray-500 text-xs hidden sm:block">/{pub.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-300 text-sm">
                      {pub.auteur?.prenom} {pub.auteur?.nom}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[pub.status]?.color}`}>
                      {pub.status === 'PUBLIE' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {STATUS_LABELS[pub.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-gray-400 text-sm">
                    {new Date(pub.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {pub.status === 'PUBLIE' && (
                        <a href={`/actualites/${pub.slug}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors text-gray-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => { setSelected(pub); setModal('edit') }}
                        className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors text-gray-400 hover:text-gold-400">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pub)}
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

      {/* Pagination */}
      {data?.pagination && (data.pagination.pages ?? data.pagination.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <span>{data.pagination.total} résultats</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 disabled:opacity-40 rounded-lg transition-colors">
              ← Précédent
            </button>
            <span className="px-3 py-1.5">{page} / {data.pagination.pages ?? data.pagination.totalPages}</span>
            <button disabled={page >= (data.pagination.pages ?? data.pagination.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 disabled:opacity-40 rounded-lg transition-colors">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'create' && (
        <Modal title="Nouvelle publication" onClose={() => setModal(null)}>
          <PublicationForm
            onSave={async (data) => { await createMutation.mutateAsync(data) }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title="Modifier la publication" onClose={() => setModal(null)}>
          <PublicationForm
            initial={selected}
            onSave={async (data) => { await updateMutation.mutateAsync({ id: selected.id, data }) }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
