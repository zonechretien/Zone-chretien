'use client'

import Link from 'next/link'
import { Music, Youtube, Facebook, Instagram, Mail, Phone, MapPin, Heart } from 'lucide-react'
import { useState } from 'react'
import { newsletterAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export function PublicFooter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await newsletterAPI.subscribe({ email })
      toast.success('Merci ! Vérifiez votre boîte mail pour confirmer.')
      setEmail('')
    } catch {
      toast.error("Erreur lors de l'inscription. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-navy-950 text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bebas text-2xl text-white tracking-wider">ZONE-CHRÉTIEN</p>
                <p className="text-xs text-gold-400 -mt-1">Gospel & Louange</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              La plateforme de référence de la musique gospel et de louange chrétienne haïtienne. Adorons ensemble le Seigneur.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-navy-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-navy-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-navy-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-gold-400 font-semibold uppercase text-xs tracking-widest mb-5">Navigation</h3>
            <ul className="space-y-3">
              {[
                { href: '/actualites', label: 'Actualités' },
                { href: '/musiques', label: 'Musiques' },
                { href: '/videos', label: 'Vidéos' },
                { href: '/artistes', label: 'Artistes' },
                { href: '/evenements', label: 'Événements' },
                { href: '/galerie', label: 'Galerie' },
                { href: '/temoignages', label: 'Témoignages' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-gray-400 hover:text-gold-400 text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-gold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gold-400 font-semibold uppercase text-xs tracking-widest mb-5">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
                <span>Port-au-Prince, Haïti</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-gold-500 shrink-0" />
                <a href="tel:+50912345678" className="hover:text-white transition-colors">+509 12 34 56 78</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-gold-500 shrink-0" />
                <a href="mailto:contact@glorysound.ht" className="hover:text-white transition-colors">contact@glorysound.ht</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-gold-400 font-semibold uppercase text-xs tracking-widest mb-5">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">Recevez les dernières nouvelles et musiques directement dans votre boîte mail.</p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-2.5 bg-navy-800 border border-navy-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-900 font-semibold text-sm rounded-lg transition-colors"
              >
                {loading ? 'Inscription…' : "S'abonner"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Zone-Chrétien. Tous droits réservés.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Fait avec <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> pour la gloire de Dieu
          </p>
        </div>
      </div>
    </footer>
  )
}
