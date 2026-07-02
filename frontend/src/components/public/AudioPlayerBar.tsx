'use client';
import { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/playerStore';
import { musiquesAPI } from '@/lib/api';

// ── URL type detection ────────────────────────────────────────

type AudioType = 'direct' | 'soundcloud' | 'youtube' | 'spotify';

function detectAudioType(url: string): AudioType {
  if (!url) return 'direct';
  const u = url.toLowerCase();
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('open.spotify.com')) return 'spotify';
  return 'direct';
}

function soundCloudEmbedUrl(url: string): string {
  return (
    'https://w.soundcloud.com/player/?url=' +
    encodeURIComponent(url) +
    '&color=%23E8A020&auto_play=true&hide_related=true' +
    '&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false'
  );
}

function youTubeEmbedUrl(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  const id = m?.[1];
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '';
}

function spotifyEmbedUrl(url: string): string {
  const m = url.match(/track\/([a-zA-Z0-9]+)/);
  const id = m?.[1];
  return id ? `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0` : '';
}

const PLATFORM_LABELS: Record<AudioType, string> = {
  direct: '',
  soundcloud: 'SoundCloud',
  youtube: 'YouTube',
  spotify: 'Spotify',
};

// ── Component ─────────────────────────────────────────────────

export function AudioPlayerBar() {
  const {
    currentTrack, isPlaying, volume, currentTime, duration,
    togglePlay, setVolume, setCurrentTime, setDuration, nextTrack, prevTrack,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioType: AudioType = currentTrack ? detectAudioType(currentTrack.audioUrl) : 'direct';
  const isDirect = audioType === 'direct';

  // Sync audio element only for direct tracks
  useEffect(() => {
    if (!audioRef.current || !currentTrack || !isDirect) return;
    audioRef.current.src = currentTrack.audioUrl;
    audioRef.current.play().catch(() => {});
  }, [currentTrack, isDirect]);

  useEffect(() => {
    if (!audioRef.current || !isDirect) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying, isDirect]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
  const handleEnded = () => {
    nextTrack();
    if (currentTrack) musiquesAPI.trackPlay(currentTrack.id).catch(() => {});
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (!currentTrack) return null;

  // ── Embedded player (SoundCloud, YouTube or Spotify) ───────────
  if (!isDirect) {
    const embedSrc = audioType === 'soundcloud'
      ? soundCloudEmbedUrl(currentTrack.audioUrl)
      : audioType === 'spotify'
      ? spotifyEmbedUrl(currentTrack.audioUrl)
      : youTubeEmbedUrl(currentTrack.audioUrl);

    // SoundCloud widget is 166px tall; Spotify compact embed is 152px; YouTube iframe we keep at 68px (audio feel)
    const iframeH = audioType === 'soundcloud' ? 166 : audioType === 'spotify' ? 152 : 68;
    const barH = iframeH + 20; // 10px padding top + bottom

    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ background: '#0A1628', borderTop: '1px solid rgba(255,255,255,.12)', padding: '10px 20px', height: `${barH}px` }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4 h-full">
          {/* Track info */}
          <div style={{ width: '168px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#1E5FA8,#E8A020)' }}>
              {currentTrack.coverUrl && (
                <img src={currentTrack.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTrack.titre}
              </p>
              <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px', margin: '2px 0 0' }}>
                {currentTrack.artiste}
              </p>
              <p style={{ color: '#E8A020', fontSize: '10px', fontWeight: 600, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {PLATFORM_LABELS[audioType]}
              </p>
            </div>
          </div>

          {/* Iframe */}
          <div style={{ flex: 1, overflow: 'hidden', borderRadius: '8px', height: `${iframeH}px` }}>
            {embedSrc && (
              <iframe
                key={currentTrack.id + audioType}
                src={embedSrc}
                width="100%"
                height={iframeH}
                scrolling="no"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                style={{ display: 'block', borderRadius: '8px' }}
              />
            )}
          </div>

          {/* Queue navigation + external link */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={prevTrack} title="Précédent"
                style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                <SkipBack size={18} />
              </button>
              <button onClick={nextTrack} title="Suivant"
                style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                <SkipForward size={18} />
              </button>
            </div>
            <a
              href={currentTrack.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Ouvrir sur ${PLATFORM_LABELS[audioType]}`}
              style={{ color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', textDecoration: 'none' }}
            >
              <ExternalLink size={13} />
              Ouvrir
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Direct audio player ───────────────────────────────────────
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: '#0A1628', borderTop: '1px solid rgba(255,255,255,.1)', padding: '10px 20px' }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 shrink-0" style={{ width: '224px' }}>
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg,#1E5FA8,#E8A020)' }}>
            {currentTrack.coverUrl && <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentTrack.titre}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,.5)' }}>{currentTrack.artiste}</p>
          </div>
        </div>

        {/* Controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button onClick={prevTrack} style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <SkipBack size={18} />
            </button>
            <button
              onClick={togglePlay}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E8A020', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A1628' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={nextTrack} style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <SkipForward size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '11px', width: '32px', textAlign: 'right' }}>{fmt(currentTime)}</span>
            <input
              type="range" min={0} max={duration || 1} value={currentTime} step={0.5}
              onChange={handleSeek}
              style={{ flex: 1, accentColor: '#E8A020', height: '3px' }}
            />
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '11px', width: '32px' }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 shrink-0" style={{ width: '128px' }}>
          <Volume2 size={16} style={{ color: 'rgba(255,255,255,.5)' }} />
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#E8A020', height: '3px' }}
          />
        </div>
      </div>
    </div>
  );
}
