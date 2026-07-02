// Découverte d'actualités évangéliques via de vrais flux RSS chrétiens (best-effort —
// radio4veh.com et radiovision2000.ht n'exposent pas de flux RSS public vérifiable ;
// ces sources fiables et vérifiées les remplacent).
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  { url: 'https://www.newreleasetoday.com/news_rss.xml', label: 'NewReleaseToday — Actualités musique chrétienne' },
  { url: 'https://www.newreleasetoday.com/new_release_rss.xml', label: 'NewReleaseToday — Nouvelles sorties' },
  { url: 'https://www.christiantoday.com/culture?format=xml', label: 'Christian Today — Culture' },
];

const GOSPEL_KEYWORDS = ['gospel', 'worship', 'christian music', 'praise', 'hillsong', 'kirk franklin', 'haiti', 'haïti', 'evangel', 'louange', 'adoration'];

export async function fetchGospelNews(maxPerFeed = 5) {
  const results = [];
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || [])
        .filter((item) => {
          const text = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
          return GOSPEL_KEYWORDS.some((k) => text.includes(k));
        })
        .slice(0, maxPerFeed);

      for (const item of items) {
        if (!item.link || !item.title) continue;
        results.push({
          type: 'ACTUALITE',
          plateforme: 'RSS',
          categorie: 'actualite-evangelique',
          titre: item.title,
          artiste: null,
          url: item.link,
          imageUrl: item.enclosure?.url || null,
          extrait: item.contentSnippet ? item.contentSnippet.slice(0, 250) : null,
          metadata: JSON.stringify({ source: feed.label, pubDate: item.pubDate || null }),
        });
      }
    } catch {
      // Flux temporairement indisponible — on continue avec les autres (best-effort)
    }
  }
  return results;
}
