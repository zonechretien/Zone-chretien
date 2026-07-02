'use client';
// src/app/(admin)/layout.tsx
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';

const NAV = [
  { label: 'Principal', items: [
    { href: '/admin/dashboard', icon: '📊', label: 'Tableau de bord' },
    { href: '/admin/publications', icon: '📰', label: 'Publications', badge: 12, badgeColor: 'gold' },
    { href: '/admin/videos', icon: '🎬', label: 'Vidéos' },
    { href: '/admin/musiques', icon: '🎵', label: 'Musiques' },
    { href: '/admin/artistes', icon: '🎤', label: 'Artistes' },
  ]},
  { label: 'Contenu', items: [
    { href: '/admin/actualites', icon: '📡', label: 'Actualités', badge: 3, badgeColor: 'red' },
    { href: '/admin/evenements', icon: '🎉', label: 'Événements' },
    { href: '/admin/galerie', icon: '🖼', label: 'Galerie' },
    { href: '/admin/temoignages', icon: '🙏', label: 'Témoignages', badge: 7, badgeColor: 'red' },
    { href: '/admin/newsletter', icon: '✉️', label: 'Newsletter' },
  ]},
  { label: 'Système', items: [
    { href: '/admin/utilisateurs', icon: '👥', label: 'Utilisateurs' },
    { href: '/admin/seo', icon: '🔍', label: 'SEO Global' },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, fetchMe } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('glorysound_token');
    if (!token && !pathname.includes('/connexion')) {
      router.push('/admin/connexion');
      return;
    }
    if (token && !user) fetchMe();
  }, []);

  if (pathname.includes('/connexion')) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col flex-shrink-0 overflow-y-auto" style={{ background: 'var(--navy)' }}>
        {/* Logo */}
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--blue), var(--gold))', color: 'var(--navy)' }}>♪</div>
          <div>
            <div className="font-accent text-lg tracking-widest text-white">ZONE-CHRÉTIEN</div>
            <div className="text-xs tracking-widest" style={{ color: 'var(--gray)', fontSize: '9px', textTransform: 'uppercase' }}>CMS Admin</div>
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--blue-bright), var(--gold))', color: 'white' }}>
            {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.prenom} {user?.nom}</div>
            <div className="text-xs" style={{ color: 'var(--gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.5px' }}>{user?.role}</div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-2">
          {NAV.map((section) => (
            <div key={section.label} className="px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,.28)', letterSpacing: '1.5px' }}>
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = pathname.endsWith(item.href) || pathname.includes(item.href + '/');
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-2.5 py-2 rounded-lg mb-0.5 no-underline transition-all duration-200 relative"
                    style={{
                      color: isActive ? 'var(--gold)' : 'rgba(255,255,255,.55)',
                      background: isActive ? 'linear-gradient(90deg, rgba(232,160,32,.18), rgba(232,160,32,.06))' : 'transparent',
                      fontSize: '13px', fontWeight: 500,
                    }}>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3/5 rounded-r" style={{ background: 'var(--gold)' }}></span>}
                    <span className="text-sm">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                        style={{ background: item.badgeColor === 'gold' ? 'var(--gold)' : 'var(--red)', color: item.badgeColor === 'gold' ? 'var(--navy)' : 'white', fontSize: '9px' }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
          <Link href="/" target="_blank" className="text-xs no-underline transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.35)' }}>
            ↗ Site public
          </Link>
          <button onClick={() => { logout(); router.push('/admin/connexion'); }}
            className="ml-auto text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.35)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center px-6 h-14 flex-shrink-0"
          style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div className="font-display text-base font-bold text-white">
            Zone-<span style={{ color: 'var(--gold)' }}>Chrétien</span>
            <span className="text-xs font-normal ml-2" style={{ color: 'rgba(255,255,255,.35)', fontFamily: 'var(--font-dm-sans)' }}>— Panneau Admin</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/" target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg no-underline text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.1)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}>
              👁 Voir le site
            </Link>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer relative transition-all"
              style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)' }}>
              🔔
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }}></span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--off-white)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
