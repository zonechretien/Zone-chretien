// Découverte de titres gospel via Spotify Web API (client credentials — gratuit)
import { DISCOVERY_CATEGORIES } from './categories.js';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) return null;
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  try {
    const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch {
    return null;
  }
}

async function searchSpotifyCategory(category, maxResults, token) {
  try {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(category.querySpotify)}&type=track&limit=${maxResults}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.tracks?.items || []).map((track) => ({
      type: 'MUSIQUE',
      plateforme: 'SPOTIFY',
      categorie: category.slug,
      titre: track.name,
      artiste: (track.artists || []).map((a) => a.name).join(', ') || null,
      url: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
      imageUrl: track.album?.images?.[0]?.url || null,
      extrait: null,
      metadata: JSON.stringify({
        spotifyId: track.id,
        duree: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
      }),
    }));
  } catch {
    return [];
  }
}

export async function searchSpotifyAllCategories(maxResultsPerCategory = 3) {
  const token = await getSpotifyToken();
  if (!token) return [];
  const results = [];
  for (const category of DISCOVERY_CATEGORIES) {
    results.push(...(await searchSpotifyCategory(category, maxResultsPerCategory, token)));
  }
  return results;
}
