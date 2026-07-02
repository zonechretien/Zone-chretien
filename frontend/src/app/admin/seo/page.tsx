'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Globe, Save, Loader2, RefreshCw, FileCode } from 'lucide-react'
import { seoAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function SeoPage() {
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['seo-settings'],
    queryFn: () => seoAPI.getSettings(),
    select: r => r.data,
  })

  useEffect(() => {
    if (data?.settings) setForm({ ...data.settings })
  }, [data])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await seoAPI.updateSettings(form)
      toast.success('Paramètres SEO sauvegardés !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  const handleGenerateSitemap = async () => {
    setGenerating(true)
    try {
      await seoAPI.generateSitemap()
      toast.success('Sitemap généré avec succès !')
    } catch {
      toast.error('Erreur lors de la génération du sitemap')
    } finally { setGenerating(false) }
  }

  if (isLoading || !form) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    )
  }

  const InputField = ({ label, field, type = 'text', placeholder = '' }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input type={type} value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
    </div>
  )

  const TextareaField = ({ label, field, rows = 3, placeholder = '' }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <textarea rows={rows} value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors resize-none" />
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Globe className="w-7 h-7 text-gold-400" />SEO & Paramètres</h1>
          <p className="text-gray-400 text-sm mt-1">Optimisation moteur de recherche</p>
        </div>
        <button onClick={handleGenerateSitemap} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-navy-700 hover:bg-navy-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Régénérer sitemap
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Identité */}
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-gold-400" />Informations du site
          </h2>
          <InputField label="Nom du site" field="nomSite" placeholder="Zone-Chrétien" />
          <TextareaField label="Description du site" field="descriptionSite" placeholder="La plateforme de référence..." />
          <InputField label="URL du site" field="urlSite" placeholder="https://glorysound.ht" />
          <InputField label="Email de contact" field="emailContact" type="email" />
          <InputField label="Téléphone" field="telephone" />
          <InputField label="Adresse" field="adresse" />
        </div>

        {/* Meta SEO */}
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FileCode className="w-4 h-4 text-gold-400" />Meta tags globaux
          </h2>
          <InputField label="Meta Title par défaut" field="metaTitleDefault" />
          <TextareaField label="Meta Description par défaut" field="metaDescriptionDefault" rows={2} />
          <InputField label="Meta Keywords" field="metaKeywords" placeholder="gospel, louange, haïti..." />
          <InputField label="Image OG par défaut (URL)" field="ogImageDefault" placeholder="https://..." />
        </div>

        {/* Analytics */}
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold">Analytics & Tracking</h2>
          <InputField label="Google Analytics ID" field="googleAnalyticsId" placeholder="G-XXXXXXXXXX" />
          <InputField label="Facebook Pixel ID" field="facebookPixelId" />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Google Search Console (code de vérification)</label>
            <input value={form.googleSearchConsole || ''} onChange={e => setForm({ ...form, googleSearchConsole: e.target.value })}
              placeholder="google-site-verification=..."
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" />
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold">Réseaux sociaux</h2>
          <InputField label="URL Facebook" field="facebook" placeholder="https://facebook.com/glorysound" />
          <InputField label="URL YouTube" field="youtube" placeholder="https://youtube.com/@glorysound" />
          <InputField label="URL Instagram" field="instagram" placeholder="https://instagram.com/glorysound" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Sauvegarde…' : 'Sauvegarder les paramètres'}
        </button>
      </form>
    </div>
  )
}
