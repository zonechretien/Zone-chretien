// src/app/not-found.tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page introuvable — GlorySound',
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #0d2b55 100%)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Décoration musicale */}
      <div className="mb-6 relative select-none" style={{ userSelect: 'none' }}>
        <div
          className="font-accent text-9xl leading-none"
          style={{ color: 'rgba(255,255,255,.06)', fontSize: '180px', lineHeight: 1 }}
        >
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-7xl"
            style={{ filter: 'drop-shadow(0 0 30px rgba(232,160,32,.5))' }}
          >
            🎵
          </div>
        </div>
      </div>

      {/* Badge */}
      <div
        className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg mb-4"
        style={{ background: 'rgba(232,160,32,.2)', color: 'var(--gold)' }}
      >
        Page introuvable
      </div>

      {/* Titre */}
      <h1
        className="font-display text-3xl md:text-4xl font-bold text-white mb-4"
        style={{ maxWidth: '480px' }}
      >
        Cette note n'est pas dans la{' '}
        <span style={{ color: 'var(--gold)' }}>partition</span>
      </h1>

      {/* Description */}
      <p
        className="text-base mb-8 max-w-sm"
        style={{ color: 'rgba(255,255,255,.6)', lineHeight: '1.6' }}
      >
        La page que vous recherchez a peut-être été déplacée, supprimée, ou n'existe
        pas encore. Retournez à l'accueil pour continuer votre voyage musical.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-bold text-sm no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
        >
          🏠 Retour à l'accueil
        </Link>
        <Link
          href="/musiques"
          className="px-6 py-3 rounded-xl font-bold text-sm no-underline transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'rgba(255,255,255,.08)',
            color: 'white',
            border: '1.5px solid rgba(255,255,255,.15)',
          }}
        >
          🎵 Écouter de la musique
        </Link>
        <Link
          href="/actualites"
          className="px-6 py-3 rounded-xl font-bold text-sm no-underline transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'rgba(255,255,255,.08)',
            color: 'white',
            border: '1.5px solid rgba(255,255,255,.15)',
          }}
        >
          📰 Actualités
        </Link>
      </div>

      {/* Notes décoratives flottantes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {['♩', '♪', '♫', '♬', '🎶'].map((note, i) => (
          <span
            key={i}
            className="absolute font-bold select-none"
            style={{
              fontSize: `${18 + i * 6}px`,
              opacity: 0.06 + i * 0.02,
              color: i % 2 === 0 ? 'var(--gold)' : 'white',
              top: `${10 + i * 18}%`,
              left: i % 2 === 0 ? `${5 + i * 8}%` : `${75 - i * 8}%`,
              transform: `rotate(${-20 + i * 12}deg)`,
            }}
          >
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}
