'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, ShieldCheck, X, Save, Loader2, UserCog } from 'lucide-react'
import { utilisateursAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

const ROLES: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-500/20 text-red-400' },
  ADMIN: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400' },
  EDITEUR: { label: 'Éditeur', color: 'bg-blue-500/20 text-blue-400' },
  AUTEUR: { label: 'Auteur', color: 'bg-green-500/20 text-green-400' },
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-navy-800 rounded-lg text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function UserForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    prenom: initial?.prenom || '',
    nom: initial?.nom || '',
    email: initial?.email || '',
    motDePasse: '',
    role: initial?.role || 'AUTEUR',
    actif: initial?.actif ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom *</label>
          <input required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom *</label>
          <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail *</label>
        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Mot de passe {initial ? '(laisser vide = inchangé)' : '*'}
        </label>
        <input type="password" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })}
          required={!initial}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Rôle</label>
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
          className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors">
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="user-actif" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} className="w-4 h-4 accent-gold-500" />
        <label htmlFor="user-actif" className="text-sm text-gray-300">Compte actif</label>
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

export default function UtilisateursPage() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-utilisateurs', search],
    // backend returns array directly
    queryFn: () => utilisateursAPI.getAll({ search }),
    select: r => Array.isArray(r.data) ? r.data : [],
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => utilisateursAPI.create({
      email: d.email,
      nom: d.nom,
      prenom: d.prenom,
      role: d.role,
      password: d.motDePasse,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-utilisateurs'] }); toast.success('Utilisateur créé !'); setModal(null) },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => utilisateursAPI.update(id, {
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      actif: data.actif,
      ...(data.motDePasse ? { password: data.motDePasse } : {}),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-utilisateurs'] }); toast.success('Utilisateur mis à jour !'); setModal(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => utilisateursAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-utilisateurs'] }); toast.success('Utilisateur supprimé') },
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><UserCog className="w-7 h-7 text-gold-400" />Utilisateurs</h1>
          <p className="text-gray-400 text-sm mt-1">Gérer les membres de l'équipe</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />Nouvel utilisateur
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors" />
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-navy-800 border-b border-navy-700">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Utilisateur</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Rôle</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Statut</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {(data as any[] || []).map((u: any) => {
                const roleInfo = ROLES[u.role]
                const isMe = u.id === currentUser?.id
                return (
                  <tr key={u.id} className="hover:bg-navy-800/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                          <span className="text-gold-400 font-bold">{u.prenom?.[0]}{u.nom?.[0]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium">{u.prenom} {u.nom}</p>
                            {isMe && <span className="text-xs bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded">Vous</span>}
                          </div>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${roleInfo?.color}`}>
                        <ShieldCheck className="w-3 h-3" />{roleInfo?.label || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.actif ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelected(u); setModal('edit') }}
                          className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-gold-400"><Edit2 className="w-4 h-4" /></button>
                        {!isMe && (
                          <button onClick={() => { if (confirm(`Supprimer ${u.prenom} ${u.nom} ?`)) deleteMutation.mutate(u.id) }}
                            className="p-1.5 hover:bg-navy-700 rounded-lg text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'create' && (
        <Modal title="Nouvel utilisateur" onClose={() => setModal(null)}>
          <UserForm onSave={async (d: any) => { await createMutation.mutateAsync(d) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title="Modifier l'utilisateur" onClose={() => setModal(null)}>
          <UserForm initial={selected} onSave={async (d: any) => { await updateMutation.mutateAsync({ id: selected.id, data: d }) }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
