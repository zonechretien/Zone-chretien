// Découverte de vidéos gospel via YouTube Data API v3 (clé gratuite, 10000 req/jour)
import { DISCOVERY_CATEGORIES } from './categories.js';

async function searchYoutubeCategory(category, maxResults) {
  if (!process.env.YOUTUBE_API_KEY) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(category.queryYoutube)}&key=${process.env.YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || [])
      .filter((it) => it.id?.videoId)
      .map((it) => ({
        type: 'VIDEO',
        plateforme: 'YOUTUBE',
        categorie: category.slug,
        titre: it.snippet.title,
        artiste: it.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
        imageUrl: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url || null,
        extrait: it.snippet.description ? it.snippet.description.slice(0, 200) : null,
        metadata: JSON.stringify({ embedId: it.id.videoId, publishedAt: it.snippet.publishedAt }),
      }));
  } catch {
    return [];
  }
}

export async function searchYoutubeAllCategories(maxResultsPerCategory = 3) {
  const results = [];
  for (const category of DISCOVERY_CATEGORIES) {
    results.push(...(await searchYoutubeCategory(category, maxResultsPerCategory)));
  }
  return results;
}
