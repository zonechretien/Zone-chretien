'use client';
// src/components/public/PublicHeader.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu, X, Music } from 'lucide-react';
import { searchAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/musiques', label: 'Musiques' },
  { href: '/artistes', label: 'Artistes' },
  { href: '/actualites', label: 'Actualités' },
  { href: '/videos', label: 'Vidéos' },
  { href: '/evenements', label: 'Événements' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/temoignages', label: 'Témoignages' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { data: searchResults } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => searchAPI.search(debouncedSearch).then((r) => r.data),
    enabled: debouncedSearch.length >= 2,
  });

  return (
    <>
      {/* Top bar */}
      <div style={{ background: 'var(--navy)', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color: 'var(--gray)' }}>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1">
              <i className="fas fa-map-marker-alt" style={{ color: 'var(--gold)', fontSize: '10px' }}></i>
              Port-au-Prince, Haïti
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <i className="fas fa-envelope" style={{ color: 'var(--gold)', fontSize: '10px' }}></i>
              contact@glorysound.ht
            </span>
          </div>
          <div className="flex items-center gap-3">
            {['fa-facebook', 'fa-instagram', 'fa-youtube', 'fa-tiktok'].map((icon) => (
              <a key={icon} href="#" className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ background: 'rgba(255,255,255,.08)', color: 'var(--gray)', fontSize: '11px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--navy)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.08)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--gray)'; }}>
                <i className={`fab ${icon}`}></i>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: 'linear-gradient(135deg, var(--navy), var(--blue))', color: 'var(--gold)' }}>♪</div>
            <div>
              <div className="font-accent text-xl tracking-widest" style={{ color: 'var(--navy)', letterSpacing: '2px' }}>ZONE-CHRÉTIEN</div>
              <div className="text-xs tracking-widest uppercase" style={{ color: 'var(--gray)', fontSize: '9px' }}>Gospel & Musique Chrétienne</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 no-underline whitespace-nowrap
                  ${pathname === link.href ? 'nav-active' : ''}`}
                style={{ color: pathname === link.href ? 'var(--navy)' : 'var(--gray-dark)' }}
                onMouseEnter={(e) => { if (pathname !== link.href) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--off-white)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ''; }}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search + Admin */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <div className="flex items-center gap-2 px-4 h-9 rounded-full border transition-all duration-200"
                style={{ background: 'var(--off-white)', border: '1.5px solid var(--gray-light)' }}
                onClick={() => setSearchOpen(true)}>
                <Search size={13} style={{ color: 'var(--gray)' }} />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  className="bg-transparent border-none outline-none text-sm w-40"
                  style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}
                />
              </div>

              {/* Search dropdown */}
              {searchOpen && searchResults && searchResults.total > 0 && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-xl border z-50"
                  style={{ border: '1.5px solid var(--gray-light)', boxShadow: 'var(--shadow-lg)' }}>
                  {Object.entries(searchResults.results).map(([type, items]) => {
                    const arr = items as Array<{ id: string; titre?: string; nom?: string; slug: string; type: string }>;
                    if (!arr.length) return null;
                    return (
                      <div key={type} className="p-3">
                        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gray)' }}>{type}</div>
                        {arr.map((item) => (
                          <Link key={item.id} href={`/${type}/${item.slug}`}
                            className="flex items-center gap-2 p-2 rounded-lg text-sm no-underline transition-all duration-200 hover:bg-gray-50"
                            style={{ color: 'var(--text)' }}>
                            <Music size={12} style={{ color: 'var(--gold)' }} />
                            {item.titre || item.nom}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Link href="/admin/connexion" className="hidden sm:flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold no-underline transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, var(--navy), var(--blue))', color: 'white' }}>
              <i className="fas fa-lock text-xs"></i> Admin
            </Link>

            <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: 'var(--gray-light)', background: 'white' }}>
            <div className="p-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}
                  className="px-4 py-3 rounded-lg text-sm font-medium no-underline"
                  style={{ color: pathname === link.href ? 'var(--gold)' : 'var(--gray-dark)', background: pathname === link.href ? 'rgba(232,160,32,.08)' : 'transparent' }}
                  onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
