'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, FileText, X, Save, Loader2, CheckCircle, Clock, Eye } from 'lucide-react'
import { publicationsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-yellow-500/20 text-yellow-400' },
  PUBLIE:    { label: 'Publié',    color: 'bg-green-500/20 text-green-400'  },
  ARCHIVE:   { label: 'Archivé',  color: 'bg-gray-500/20 text-gray-400'    },
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-3xl mt-8 mb-8"
        style={{ background: '#0F2040', border: '1px solid #152D4D' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #152D4D' }}>
          <h2 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function ArticleForm({ initial, onSave, onClose }: { initial?: any; onSave: (d: any) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({
    titre:           initial?.titre           || '',
    contenu:         initial?.contenu         || '',
    extrait:         initial?.extrait         || '',
    status:          initial?.status          || 'BROUILLON',
    imageUrl:        initial?.imageUrl        || '',
    metaTitre:       initial?.metaTitre       || '',
    metaDescription: initial?.metaDescription || '',
  })
  const [saving, setSaving] = useState(false)

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>
        {label} {required && <span style={{ color: '#E8A020' }}>*</span>}
      </label>
      <input type={type} required={required} value={form[key] as string}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  )

  return (
    <form onSubmit={async e => { e.preventDefault(); setSaving(true); try { await onSave(form) } finally { setSaving(false) } }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {field('Titre', 'titre', 'text', true)}

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Extrait</label>
        <textarea value={form.extrait} onChange={e => setForm({ ...form, extrait: e.target.value })} rows={2}
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>
          Contenu <span style={{ color: '#E8A020' }}>*</span>
        </label>
        <textarea required value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} rows={10}
          placeholder="Rédigez votre article ici... Supporte le HTML"
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Statut</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
            style={{ width: '100%', padding: '10px 14px', background: '#0F2040', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
            <option value="BROUILLON">🟡 Brouillon</option>
            <option value="PUBLIE">🟢 Publier maintenant</option>
            <option value="ARCHIVE">🔵 Archiver</option>
          </select>
        </div>
        {field('Image à la une (URL)', 'imageUrl')}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>SEO — Optionnel</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {field('Meta Title', 'metaTitre')}
          {field('Meta Description', 'metaDescription')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onClose}
          style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px' }}>
          Annuler
        </button>
        <button type="submit" disabled={saving}
          style={{ flex: 1, padding: '11px', background: '#E8A020', border: 'none', borderRadius: '8px', color: '#0A1628', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : <><Save size={16} /> Enregistrer</>}
        </button>
      </div>
    </form>
  )
}

export default function ActualitesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['actualites', page, search, statusFilter],
    queryFn: () => publicationsAPI.list({ page, limit: 15, q: search, status: statusFilter || undefined }),
    select: r => ({ articles: r.data?.data || [], pagination: r.data?.meta }),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => publicationsAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actualites'] }); toast.success('Article publié !'); setModal(null) },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => publicationsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actualites'] }); toast.success('Article mis à jour !'); setModal(null) },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => publicationsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actualites'] }); toast.success('Article supprimé') },
  })

  const articles = data?.articles || []
  const pagination = data?.pagination

  return (
    <div style={{ padding: '1.5rem 2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FileText size={28} color="#E8A020" /> Actualités
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''} · Gérez vos articles et actualités gospel
          </p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#E8A020', border: 'none', borderRadius: '10px', color: '#0A1628', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
          <Plus size={16} /> Nouvel article
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un article..."
            style={{ width: '100%', padding: '10px 12px 10px 38px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}>
          <option value="">Tous les statuts</option>
          <option value="PUBLIE">Publié</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="ARCHIVE">Archivé</option>
        </select>
      </div>

      {/* Tableau */}
      <div style={{ background: '#0F2040', border: '1px solid #152D4D', borderRadius: '16px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem', color: '#E8A020' }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.3)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Aucun article trouvé</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Créez votre premier article en cliquant sur « Nouvel article »</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['Article', 'Auteur', 'Statut', 'Date', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i < 4 ? 'left' : 'right', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid #152D4D' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map((art: any) => {
                const sl = STATUS_LABELS[art.status] || STATUS_LABELS.BROUILLON
                return (
                  <tr key={art.id} style={{ borderBottom: '1px solid rgba(21,45,77,0.5)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {art.imageUrl
                          ? <img src={art.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={16} color="rgba(255,255,255,0.3)" /></div>
                        }
                        <div>
                          <p style={{ color: 'white', fontSize: '14px', fontWeight: 500, margin: 0, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.titre}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '2px 0 0', fontFamily: 'monospace' }}>/{art.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                      {art.auteur ? `${art.auteur.prenom} ${art.auteur.nom}` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500, background: sl.color.includes('green') ? 'rgba(74,222,128,0.15)' : sl.color.includes('yellow') ? 'rgba(251,191,36,0.15)' : 'rgba(107,114,128,0.15)', color: sl.color.includes('green') ? '#4ADE80' : sl.color.includes('yellow') ? '#FBBF24' : '#9CA3AF' }}>
                        {art.status === 'PUBLIE' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {sl.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                      {new Date(art.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {art.status === 'PUBLIE' && (
                          <a href={`/actualites/${art.slug}`} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                            <Eye size={15} />
                          </a>
                        )}
                        <button onClick={() => { setSelected(art); setModal('edit') }}
                          style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => { if (confirm(`Supprimer "${art.titre}" ?`)) deleteMutation.mutate(art.id) }}
                          style={{ padding: '6px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          <span>{pagination.total} article{pagination.total !== 1 ? 's' : ''} au total</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              ← Précédent
            </button>
            <span style={{ padding: '6px 14px', color: 'rgba(255,255,255,0.5)' }}>{page} / {pagination.pages}</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'white', cursor: page >= pagination.pages ? 'not-allowed' : 'pointer', opacity: page >= pagination.pages ? 0.4 : 1 }}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      {modal === 'create' && (
        <Modal title="✍️ Nouvel article" onClose={() => setModal(null)}>
          <ArticleForm onSave={async d => { await createMutation.mutateAsync(d) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title={`✏️ Modifier — ${selected.titre}`} onClose={() => setModal(null)}>
          <ArticleForm initial={selected} onSave={async d => { await updateMutation.mutateAsync({ id: selected.id, data: d }) }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
