// Orchestrateur de découverte multi-sources — YouTube, Spotify, RSS (flux chrétiens réels)
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { logAction, findOrCreateArtiste } from './aiAgent.js';
import { io } from '../server.js';
import { searchYoutubeAllCategories } from './sources/youtube.js';
import { searchSpotifyAllCategories } from './sources/spotify.js';
import { fetchGospelNews } from './sources/rss.js';

const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

const CATEGORIE_GENRE_MAP = {
  'gospel-haitien': 'GOSPEL_HAITIEN',
  'gospel-americain': 'GOSPEL_CONTEMPORAIN',
  'gospel-latino': 'AUTRE',
  'gospel-africain': 'GOSPEL_CONTEMPORAIN',
  'worship-international': 'LOUANGE_ADORATION',
};

// ── Sauvegarde en base avec dédoublonnage par URL ──────────────

async function saveDiscovered(items) {
  let saved = 0;
  for (const item of items) {
    try {
      const exists = await prisma.sourceContent.findUnique({ where: { url: item.url } });
      if (exists) continue;
      await prisma.sourceContent.create({ data: item });
      saved++;
    } catch {
      // doublon concurrent ou URL invalide — on ignore et continue
    }
  }
  return saved;
}

export async function discoverMusicSpotify() {
  const items = await searchSpotifyAllCategories(3);
  const saved = await saveDiscovered(items);
  logAction('decouverte', `Spotify — ${items.length} résultats, ${saved} nouveaux`);
  return saved;
}

export async function discoverVideosYoutube() {
  const items = await searchYoutubeAllCategories(3);
  const saved = await saveDiscovered(items);
  logAction('decouverte', `YouTube — ${items.length} résultats, ${saved} nouveaux`);
  return saved;
}

export async function discoverActualitesRSS() {
  const items = await fetchGospelNews(5);
  const saved = await saveDiscovered(items);
  logAction('decouverte', `RSS — ${items.length} résultats, ${saved} nouveaux`);
  return saved;
}

export async function discoverAll() {
  const [spotify, youtube, rss] = await Promise.all([
    discoverMusicSpotify(),
    discoverVideosYoutube(),
    discoverActualitesRSS(),
  ]);
  return { spotify, youtube, rss };
}

// ── Approbation : convertit un SourceContent en contenu réel publié ──

export async function approveSourceContent(id, adminId) {
  const item = await prisma.sourceContent.findUnique({ where: { id } });
  if (!item) throw new Error('Contenu introuvable');
  if (item.statut !== 'NOUVEAU') throw new Error('Ce contenu a déjà été traité');

  const meta = item.metadata ? JSON.parse(item.metadata) : {};
  const genre = CATEGORIE_GENRE_MAP[item.categorie] || 'GOSPEL_CONTEMPORAIN';
  let publishedType;
  let publishedId;

  if (item.type === 'MUSIQUE') {
    const artiste = await findOrCreateArtiste(item.artiste || 'Artiste inconnu', genre);
    let slug = makeSlug(item.titre);
    if (await prisma.musique.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    const musique = await prisma.musique.create({
      data: {
        titre: item.titre,
        slug,
        fichierUrl: item.url,
        couvertureUrl: item.imageUrl,
        genre,
        duree: meta.duree || null,
        status: 'PUBLIE',
        publishedAt: new Date(),
        artisteId: artiste.id,
        ajouteParId: adminId,
      },
    });
    io.emit('content:update', { type: 'musique', action: 'create', data: musique });
    publishedType = 'musique';
    publishedId = musique.id;
  } else if (item.type === 'VIDEO') {
    const artiste = await findOrCreateArtiste(item.artiste || 'Artiste inconnu', genre);
    let slug = makeSlug(item.titre);
    if (await prisma.video.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    const video = await prisma.video.create({
      data: {
        titre: item.titre,
        slug,
        description: item.extrait || null,
        platform: 'YOUTUBE',
        url: item.url,
        embedId: meta.embedId || null,
        miniatureUrl: item.imageUrl,
        artisteId: artiste.id,
        categorie: item.categorie,
        status: 'PUBLIE',
        publishedAt: new Date(),
        ajouteParId: adminId,
      },
    });
    io.emit('content:update', { type: 'video', action: 'create', data: video });
    publishedType = 'video';
    publishedId = video.id;
  } else {
    // ACTUALITE
    let categorie = await prisma.categorie.findUnique({ where: { slug: 'actualite' } });
    if (!categorie) categorie = await prisma.categorie.create({ data: { nom: 'Actualité', slug: 'actualite' } });

    let slug = makeSlug(item.titre);
    if (await prisma.publication.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    const contenu = `<p>${item.extrait || item.titre}</p><p>Source : <a href="${item.url}" target="_blank" rel="noopener noreferrer">${meta.source || item.url}</a></p>`;
    const pub = await prisma.publication.create({
      data: {
        titre: item.titre,
        slug,
        contenu,
        extrait: item.extrait || null,
        imageUrl: item.imageUrl,
        status: 'PUBLIE',
        publishedAt: new Date(),
        auteurId: adminId,
        categorieId: categorie.id,
        motsCles: 'gospel,zone-chretien,decouverte',
      },
    });
    io.emit('content:update', { type: 'publication', action: 'create', data: pub });
    publishedType = 'publication';
    publishedId = pub.id;
  }

  await prisma.sourceContent.update({
    where: { id },
    data: { statut: 'PUBLIE', publishedType, publishedId, traiteAt: new Date() },
  });

  logAction('decouverte', `"${item.titre}" approuvé et publié (${publishedType})`);
  return { publishedType, publishedId };
}

export async function ignoreSourceContent(id) {
  await prisma.sourceContent.update({
    where: { id },
    data: { statut: 'IGNORE', traiteAt: new Date() },
  });
}

export async function approveAllSourceContent(adminId) {
  const items = await prisma.sourceContent.findMany({ where: { statut: 'NOUVEAU' } });
  const results = [];
  for (const item of items) {
    try {
      const r = await approveSourceContent(item.id, adminId);
      results.push({ id: item.id, ok: true, ...r });
    } catch (err) {
      results.push({ id: item.id, ok: false, error: err.message });
    }
  }
  return results;
}
