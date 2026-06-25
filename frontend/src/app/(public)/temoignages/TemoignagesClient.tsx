'use client';
// src/app/(public)/temoignages/TemoignagesClient.tsx
import { useState } from 'react';
import { temoignagesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: 'GUERISON', label: '🙏 Guérison', desc: 'Témoignage de guérison physique ou spirituelle' },
  { value: 'DELIVRANCE', label: '✨ Délivrance', desc: 'Libération d\'une dépendance ou oppression' },
  { value: 'SALUT', label: '❤️ Salut', desc: 'Acceptation de Jésus comme Sauveur' },
  { value: 'BENEDICTION', label: '🌟 Bénédiction', desc: 'Bénédiction financière, familiale ou autre' },
  { value: 'MIRACLE', label: '⚡ Miracle', desc: 'Événement miraculeux dans votre vie' },
  { value: 'AUTRE', label: '💬 Autre', desc: 'Autre type de témoignage' },
];

interface Temoignage {
  id: string;
  auteurNom: string;
  type: string;
  titre?: string;
  contenu: string;
  createdAt: string;
  isAnonyme: boolean;
}

interface InitialData {
  temoignages: Temoignage[];
  total: number;
}

export default function TemoignagesClient({ initialData }: { initialData: InitialData }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    auteurNom: '',
    email: '',
    type: '',
    titre: '',
    contenu: '',
    isAnonyme: false,
  });

  const temoignages = initialData.temoignages || [];

  const getTypeLabel = (type: string) => TYPE_OPTIONS.find(t => t.value === type)?.label || type;
  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      GUERISON: { bg: 'rgba(34,197,94,.12)', text: '#16a34a' },
      DELIVRANCE: { bg: 'rgba(168,85,247,.12)', text: '#7c3aed' },
      SALUT: { bg: 'rgba(239,68,68,.12)', text: '#dc2626' },
      BENEDICTION: { bg: 'rgba(234,179,8,.12)', text: '#ca8a04' },
      MIRACLE: { bg: 'rgba(59,130,246,.12)', text: '#2563eb' },
      AUTRE: { bg: 'rgba(107,114,128,.12)', text: '#4b5563' },
    };
    return colors[type] || colors.AUTRE;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) { toast.error('Choisissez un type de témoignage'); return; }
    if (!form.contenu.trim() || form.contenu.length < 50) { toast.error('Votre témoignage doit faire au moins 50 caractères'); return; }
    if (!form.isAnonyme && !form.auteurNom.trim()) { toast.error('Entrez votre nom ou cochez anonyme'); return; }

    setSubmitting(true);
    try {
      await temoignagesAPI.submit(form);
      setSubmitted(true);
      setShowForm(false);
      toast.success('Merci ! Votre témoignage sera publié après validation.');
    } catch {
      toast.error('Une erreur est survenue. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* Hero */}
      <section className="py-20 text-center" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>Communauté</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Témoignages de <span style={{ color: 'var(--gold)' }}>la grâce</span>
          </h1>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,.7)' }}>
            Comment Dieu a transformé des vies à travers la musique gospel et la foi.
          </p>
          {!submitted ? (
            <button onClick={() => setShowForm(true)}
              className="px-8 py-3.5 rounded-xl text-base font-bold transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
              ✍️ Partager mon témoignage
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(34,197,94,.2)', color: '#4ade80' }}>
              ✓ Témoignage soumis — en attente de validation
            </div>
          )}
        </div>
      </section>

      {/* Formulaire de soumission */}
      {showForm && (
        <section className="py-12" style={{ background: 'var(--off-white)' }}>
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid var(--gray-light)', boxShadow: 'var(--shadow-md)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>Partager votre témoignage</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: 'var(--navy)' }}>Type de témoignage *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TYPE_OPTIONS.map((t) => (
                      <button key={t.value} type="button"
                        onClick={() => setForm({ ...form, type: t.value })}
                        className="p-2 rounded-xl text-xs font-medium text-left transition-all"
                        style={{
                          border: form.type === t.value ? '2px solid var(--gold)' : '1.5px solid var(--gray-light)',
                          background: form.type === t.value ? 'rgba(232,160,32,.08)' : 'white',
                          color: form.type === t.value ? 'var(--navy)' : 'var(--gray-dark)',
                        }}>
                        <div className="text-sm mb-0.5">{t.label}</div>
                        <div style={{ color: 'var(--gray)', fontSize: '10px' }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Anonymat */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="anonyme" checked={form.isAnonyme}
                    onChange={(e) => setForm({ ...form, isAnonyme: e.target.checked, auteurNom: e.target.checked ? 'Anonyme' : '' })}
                    className="w-4 h-4" />
                  <label htmlFor="anonyme" className="text-sm" style={{ color: 'var(--navy)' }}>
                    Rester anonyme
                  </label>
                </div>

                {/* Nom */}
                {!form.isAnonyme && (
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Votre nom *</label>
                    <input value={form.auteurNom} onChange={(e) => setForm({ ...form, auteurNom: e.target.value })}
                      placeholder="Prénom Nom"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Email (optionnel)</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
                  <p className="text-xs mt-1" style={{ color: 'var(--gray)' }}>Non publié. Utilisé pour vous notifier si votre témoignage est publié.</p>
                </div>

                {/* Titre */}
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Titre de votre témoignage</label>
                  <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    placeholder="Un titre résumant votre expérience"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
                </div>

                {/* Contenu */}
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Votre témoignage * (minimum 50 caractères)</label>
                  <textarea value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                    rows={5} placeholder="Racontez comment Dieu a agi dans votre vie..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
                  <p className="text-xs mt-1 text-right" style={{ color: form.contenu.length < 50 ? 'var(--red)' : 'var(--gray)' }}>
                    {form.contenu.length} / 50 minimum
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)' }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                    style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                    {submitting ? 'Envoi...' : 'Soumettre ✉️'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="py-8 bg-white border-b" style={{ borderColor: 'var(--gray-light)' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 gap-4 text-center">
          {[
            { value: initialData.total, label: 'Témoignages publiés', icon: '🙌' },
            { value: TYPE_OPTIONS.length, label: 'Types de grâces', icon: '✨' },
            { value: '100%', label: 'Vérifiés & validés', icon: '✓' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="font-display text-2xl font-bold" style={{ color: 'var(--navy)' }}>{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--gray)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages grid */}
      <section className="py-16" style={{ background: 'var(--off-white)' }}>
        <div className="max-w-7xl mx-auto px-6">
          {temoignages.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--gray)' }}>
              <div className="text-5xl mb-4">🙏</div>
              <p className="text-lg font-semibold" style={{ color: 'var(--navy)' }}>Soyez le premier à témoigner</p>
              <p className="text-sm mt-2">Partagez comment Dieu a agi dans votre vie.</p>
              <button onClick={() => setShowForm(true)}
                className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                Partager mon témoignage
              </button>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
              {temoignages.map((t) => {
                const typeColor = getTypeColor(t.type);
                return (
                  <div key={t.id} className="break-inside-avoid bg-white rounded-2xl p-5 mb-5 transition-all duration-200 hover:-translate-y-1"
                    style={{ border: '1.5px solid var(--gray-light)', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--navy), var(--blue))', color: 'var(--gold)' }}>
                          {t.isAnonyme ? '?' : t.auteurNom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
                            {t.isAnonyme ? 'Anonyme' : t.auteurNom}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--gray)' }}>
                            {new Date(t.createdAt).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: typeColor.bg, color: typeColor.text }}>
                        {getTypeLabel(t.type)}
                      </span>
                    </div>

                    {/* Grand guillemet décoratif */}
                    <div className="text-5xl leading-none mb-1" style={{ color: 'var(--gray-light)', fontFamily: 'Georgia, serif' }}>&ldquo;</div>

                    {/* Titre */}
                    {t.titre && (
                      <h3 className="text-base font-bold mb-2" style={{ color: 'var(--navy)' }}>{t.titre}</h3>
                    )}

                    {/* Contenu */}
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-dark)' }}>
                      {t.contenu.length > 300 ? t.contenu.slice(0, 300) + '...' : t.contenu}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA bas de page */}
      {!submitted && (
        <section className="py-16 text-center" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))' }}>
          <div className="max-w-xl mx-auto px-6">
            <div className="text-4xl mb-4">🙌</div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">
              Votre histoire <span style={{ color: 'var(--gold)' }}>peut inspirer</span>
            </h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,.7)' }}>
              Chaque témoignage est une preuve vivante de la puissance de Dieu. Partagez le vôtre avec notre communauté.
            </p>
            <button onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-8 py-3.5 rounded-xl text-base font-bold transition-all duration-200 hover:-translate-y-1"
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
              ✍️ Partager mon témoignage
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
