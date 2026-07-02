// Publications et événements automatiques — planifiés avec node-cron
import cron from 'node-cron';
import slugify from 'slugify';
import { generateText, isAgentEnabled, getAdminUser, logAction } from './aiAgent.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

// Extrait robustement un objet JSON depuis une réponse Claude (gère les blocs markdown)
function extractJSON(text) {
  const attempts = [
    // 1. Parse direct
    () => JSON.parse(text.trim()),
    // 2. Après suppression des blocs markdown ```json ... ```
    () => {
      const clean = text.replace(/^[\s\S]*?```(?:json)?\s*/i, '').replace(/\s*```[\s\S]*$/i, '').trim();
      return JSON.parse(clean);
    },
    // 3. Extraction par regex du premier objet JSON complet
    () => {
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('Aucun objet JSON trouvé');
      return JSON.parse(m[0]);
    },
  ];
  for (const attempt of attempts) {
    try { return attempt(); } catch { /* essai suivant */ }
  }
  throw new Error(`JSON introuvable dans la réponse Claude : ${text.slice(0, 120)}`);
}

// ── Prompts système ───────────────────────────────────────────

const SYS_PUBLICATION = `Tu es le rédacteur en chef de Zone-Chrétien, la plateforme de référence du gospel haïtien.
Tu rédiges des articles engageants, spirituellement riches, en français.
RÈGLE ABSOLUE : Ta réponse doit commencer DIRECTEMENT par { et se terminer par }. Zéro texte avant ou après. Zéro bloc markdown. Zéro commentaire.
Format JSON :
{"titre":"...","sousTitre":"...","extrait":"...","contenu":"<p>HTML 400+ mots</p>"}`;

const SYS_EVENEMENT = `Tu es responsable des événements de Zone-Chrétien.
Tu génères des événements chrétiens/gospel réalistes à venir en Haïti ou pour la diaspora.
RÈGLE ABSOLUE : Ta réponse doit commencer DIRECTEMENT par { et se terminer par }. Zéro texte avant ou après. Zéro bloc markdown.
Format JSON :
{"titre":"...","description":"<p>HTML</p>","type":"CONCERT","lieu":"...","adresse":"...","heure":"19:00","entree":"Gratuit","daysFromNow":21}
Types valides : CONCERT, CROISADE, CONFERENCE, EVANGELISATION`;

const SYS_SUGGESTIONS = `Tu es un expert passionné de musique chrétienne haïtienne et internationale.
Tu analyses les tendances et fournis des recommandations concrètes pour enrichir une plateforme gospel.
Réponds en français, de façon enthousiaste et pratique, en liste numérotée.`;

const SYS_MUSIQUE = `Tu es un dénicheur de talents (A&R) pour Zone-Chrétien, spécialisé en gospel haïtien et international.
Propose UNE chanson gospel plausible à suggérer à l'équipe éditoriale (titre + nom d'artiste réalistes).
RÈGLE ABSOLUE : Ta réponse doit commencer DIRECTEMENT par { et se terminer par }. Zéro texte avant ou après. Zéro bloc markdown.
Format JSON :
{"titre":"...","artiste":"...","genre":"GOSPEL_HAITIEN","dureeSecondes":230}
Genre valide : "GOSPEL_HAITIEN" pour un artiste haïtien, "GOSPEL_CONTEMPORAIN" pour un artiste international.`;

// ── Bibliothèque de vidéos gospel (fallback si YOUTUBE_API_KEY absente) ─
// IDs vérifiés — vraies vidéos officielles/publiques YouTube d'artistes gospel
// haïtiens et internationaux, à rotater.
const VIDEO_LIBRARY = [
  { titre: "Stanley Georges — Glwa Ou (Clip officiel)", artiste: 'Stanley Georges', embedId: 'X0n2M-tkpg4', categorie: 'Gospel Haïtien' },
  { titre: "Stanley Georges — Sou Jenou'm (Clip officiel)", artiste: 'Stanley Georges', embedId: 'OSfeldU7nqc', categorie: 'Gospel Haïtien' },
  { titre: 'Delly Benson — Sentespri (Vidéo officielle)', artiste: 'Delly Benson', embedId: 'yPxk7RTG3Ic', categorie: 'Gospel Haïtien' },
  { titre: 'Delly Benson — Mwen Sou Kont Anwo (Official Video)', artiste: 'Delly Benson', embedId: 'GCRY-en2sz0', categorie: 'Gospel Haïtien' },
  { titre: 'Delly Benson feat. Cassandra Guillaume — BonDye Ou Fidèl', artiste: 'Delly Benson', embedId: 'aqVLLuxsWQw', categorie: 'Gospel Haïtien' },
  { titre: 'Joël Lorquet — Gras pou Timoun Yo', artiste: 'Joël Lorquet', embedId: 'FcruvrBTMYY', categorie: 'Gospel Haïtien' },
  { titre: 'Joël Lorquet — Pitye Pou Ayiti', artiste: 'Joël Lorquet', embedId: 'R_-qQ4M1kWM', categorie: 'Gospel Haïtien' },
  { titre: 'Michael W. Smith — Revelation Song (Official Lyric Video)', artiste: 'Michael W. Smith', embedId: 'i8xFgPJWDOo', categorie: 'Gospel International' },
  { titre: 'Hillsong Worship — What A Beautiful Name', artiste: 'Hillsong Worship', embedId: 'nQWFzMvCfLE', categorie: 'Gospel International' },
  { titre: 'Hillsong Worship — King of Kings (Live)', artiste: 'Hillsong Worship', embedId: 'dQl4izxPeNU', categorie: 'Gospel International' },
  { titre: 'Hillsong Worship — Who You Say I Am', artiste: 'Hillsong Worship', embedId: 'lKw6uqtGFfo', categorie: 'Gospel International' },
];

// Genre par défaut de l'artiste selon son origine (GOSPEL_INTERNATIONAL n'existe pas dans l'enum Prisma)
const ARTISTE_GENRE = {
  'Stanley Georges': 'GOSPEL_HAITIEN',
  'Delly Benson': 'GOSPEL_HAITIEN',
  'Joël Lorquet': 'GOSPEL_HAITIEN',
  'Michael W. Smith': 'GOSPEL_CONTEMPORAIN',
  'Hillsong Worship': 'GOSPEL_CONTEMPORAIN',
};

// Pistes audio placeholder (même service déjà utilisé par prisma/seed_musiques.js)
// — à remplacer par l'admin par le vrai fichier/embed SoundCloud lors de la validation.
const SOUNDHELIX_TRACKS = Array.from({ length: 9 }, (_, i) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`);

let videoIndex = 0;
let audioIndex = 0;

// Trouve ou crée l'artiste par son nom (utilisé par vidéos et suggestions musicales)
async function findOrCreateArtiste(nom, genre = 'GOSPEL_CONTEMPORAIN') {
  const slug = makeSlug(nom);
  let artiste = await prisma.artiste.findUnique({ where: { slug } });
  if (!artiste) {
    artiste = await prisma.artiste.create({ data: { nom, slug, genre, actif: true } });
  }
  return artiste;
}

// Recherche une vidéo gospel via YouTube Data API v3 (si YOUTUBE_API_KEY configurée)
async function searchYouTubeGospelVideo() {
  if (!process.env.YOUTUBE_API_KEY) return null;
  try {
    const queries = [
      'gospel haïtien clip officiel',
      'musique évangélique haïtienne',
      'gospel worship official video',
      'louange adoration official music video',
    ];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=${encodeURIComponent(q)}&key=${process.env.YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const items = (data.items || []).filter((it) => it.id?.videoId);
    if (!items.length) return null;
    const pick = items[Math.floor(Math.random() * items.length)];
    return {
      titre: pick.snippet.title,
      artiste: pick.snippet.channelTitle,
      embedId: pick.id.videoId,
      categorie: 'Gospel',
    };
  } catch {
    return null;
  }
}

// Seeds Picsum stables (toujours la même image pour le même seed)
const TOPICS = [
  { sujet: 'Un artiste gospel haïtien influent : son parcours, son impact spirituel et ses chansons phares', seed: 'gospel-artist' },
  { sujet: 'Le verset biblique de la semaine : méditation profonde sur la louange et l\'adoration', seed: 'bible-verse' },
  { sujet: 'Actualité internationale : les tendances du gospel contemporain et leur influence en Haïti', seed: 'gospel-concert' },
  { sujet: 'Un message d\'encouragement spirituel pour les chrétiens haïtiens face aux défis quotidiens', seed: 'faith-hope' },
  { sujet: 'Histoire et héritage : les origines du gospel haïtien et son rayonnement mondial', seed: 'gospel-heritage' },
  { sujet: 'Jeunesse et foi : comment le gospel contemporain touche la nouvelle génération chrétienne', seed: 'worship-youth' },
  { sujet: 'Focus sur un groupe de louange haïtien : ministère, albums et vision spirituelle', seed: 'praise-worship' },
  { sujet: 'La puissance de l\'adoration collective : témoignages et bienfaits du chant en communauté', seed: 'church-community' },
  { sujet: 'Portrait d\'un artiste évangélique haïtien de la diaspora et son influence internationale', seed: 'gospel-singer' },
  { sujet: 'Analyse spirituelle d\'un hymne traditionnel haïtien chanté dans les églises du monde entier', seed: 'church-hymn' },
];

let topicIndex = 0;

// ── Génération d'une publication ──────────────────────────────

export async function generatePublication({ force = false } = {}) {
  if (!force) {
    const enabled = await isAgentEnabled();
    if (!enabled) return null;
  }

  const admin = await getAdminUser();
  if (!admin) throw new Error('Aucun administrateur actif trouvé dans la base de données');

  const topic = TOPICS[topicIndex % TOPICS.length];
  topicIndex++;

  // Picsum : seed unique par publication (topic + timestamp) → image différente à chaque fois
  const seed = `${topic.seed}-${Date.now()}`;
  const imageUrl = `https://picsum.photos/seed/${seed}/800/400`;
  const raw = await generateText(SYS_PUBLICATION, `Rédige un article complet sur : ${topic.sujet}`, 4000);

  const data = extractJSON(raw);

  if (!data.titre || !data.contenu) {
    throw new Error('Réponse Claude incomplète — champs titre ou contenu manquants');
  }

  let slug = makeSlug(data.titre);
  const exists = await prisma.publication.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;

  const pub = await prisma.publication.create({
    data: {
      titre: data.titre,
      sousTitre: data.sousTitre || null,
      slug,
      contenu: data.contenu,
      extrait: data.extrait || null,
      imageUrl,
      status: 'PUBLIE',
      publishedAt: new Date(),
      auteurId: admin.id,
      metaTitre: data.titre,
      metaDescription: data.extrait || null,
      motsCles: 'gospel,zone-chretien,agent-ia',
    },
  });

  logAction('publication', `"${pub.titre}" publié (${pub.slug})`);
  return pub;
}

// ── Génération d'un événement ─────────────────────────────────

export async function generateEvenement({ force = false } = {}) {
  if (!force) {
    const enabled = await isAgentEnabled();
    if (!enabled) return null;
  }

  const admin = await getAdminUser();
  if (!admin) throw new Error('Aucun administrateur actif trouvé');

  const raw = await generateText(
    SYS_EVENEMENT,
    'Génère un événement chrétien/gospel à venir en Haïti ou pour la diaspora haïtienne'
  );

  const data = extractJSON(raw);

  const validTypes = ['CONCERT', 'CROISADE', 'CONFERENCE', 'EVANGELISATION'];
  const type = validTypes.includes(data.type) ? data.type : 'CONCERT';
  const days = Math.max(7, parseInt(data.daysFromNow) || 14);

  const dateDebut = new Date();
  dateDebut.setDate(dateDebut.getDate() + days);

  let slug = makeSlug(data.titre || `evenement-${Date.now()}`);
  const exists = await prisma.evenement.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;

  const ev = await prisma.evenement.create({
    data: {
      titre: data.titre,
      slug,
      description: data.description || null,
      type,
      dateDebut,
      heure: data.heure || null,
      lieu: data.lieu || 'Haïti',
      adresse: data.adresse || null,
      entree: data.entree || 'Gratuit',
      status: 'PUBLIE',
      publishedAt: new Date(),
      creeParId: admin.id,
      metaTitre: data.titre,
    },
  });

  logAction('evenement', `"${ev.titre}" créé (${ev.lieu})`);
  return ev;
}

// ── Suggestions musicales ─────────────────────────────────────

export async function generateSuggestions({ force = false } = {}) {
  if (!force) {
    const enabled = await isAgentEnabled();
    if (!enabled) return null;
  }

  const recentMusiques = await prisma.musique.findMany({
    take: 5,
    orderBy: { ecoutes: 'desc' },
    include: { artiste: { select: { nom: true } } },
  });

  const ctx = recentMusiques.length > 0
    ? `Top musiques : ${recentMusiques.map((m) => `"${m.titre}" par ${m.artiste.nom} (${m.ecoutes} écoutes)`).join(' | ')}`
    : 'Aucune musique encore très écoutée sur la plateforme.';

  const suggestions = await generateText(
    SYS_SUGGESTIONS,
    `${ctx}\n\nSuggère 5 artistes ou chansons gospel haïtiens/internationaux à ajouter sur Zone-Chrétien. Pour chacun, explique pourquoi c'est pertinent.`,
    900
  );

  logAction('suggestions', 'Analyse des tendances musicales terminée');
  return suggestions;
}

// ── Génération d'une vidéo (YouTube Data API v3, sinon bibliothèque) ──

export async function generateVideo({ force = false } = {}) {
  if (!force) {
    const enabled = await isAgentEnabled();
    if (!enabled) return null;
  }

  const admin = await getAdminUser();
  if (!admin) throw new Error('Aucun administrateur actif trouvé');

  let candidate = await searchYouTubeGospelVideo();
  if (!candidate) {
    candidate = VIDEO_LIBRARY[videoIndex % VIDEO_LIBRARY.length];
    videoIndex++;
  }

  // Évite de republier une vidéo déjà présente
  const already = await prisma.video.findFirst({ where: { embedId: candidate.embedId } });
  if (already) {
    logAction('video', `Vidéo déjà publiée, ignorée ("${candidate.titre}")`);
    return already;
  }

  const genre = ARTISTE_GENRE[candidate.artiste] || 'GOSPEL_CONTEMPORAIN';
  const artiste = await findOrCreateArtiste(candidate.artiste, genre);

  let slug = makeSlug(candidate.titre);
  const exists = await prisma.video.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;

  const video = await prisma.video.create({
    data: {
      titre: candidate.titre,
      slug,
      description: candidate.categorie ? `${candidate.categorie} — sélection Zone-Chrétien` : null,
      platform: 'YOUTUBE',
      url: `https://www.youtube.com/watch?v=${candidate.embedId}`,
      embedId: candidate.embedId,
      miniatureUrl: `https://img.youtube.com/vi/${candidate.embedId}/hqdefault.jpg`,
      artisteId: artiste.id,
      categorie: candidate.categorie || null,
      status: 'PUBLIE',
      publishedAt: new Date(),
      ajouteParId: admin.id,
    },
  });

  logAction('video', `"${video.titre}" publiée (YouTube)`);
  return video;
}

// ── Suggestion d'une nouvelle musique (créée en BROUILLON) ────

export async function generateMusiqueSuggestion({ force = false } = {}) {
  if (!force) {
    const enabled = await isAgentEnabled();
    if (!enabled) return null;
  }

  const admin = await getAdminUser();
  if (!admin) throw new Error('Aucun administrateur actif trouvé');

  const raw = await generateText(SYS_MUSIQUE, 'Suggère une nouvelle chanson gospel à ajouter sur Zone-Chrétien.', 400);
  const data = extractJSON(raw);

  if (!data.titre || !data.artiste) {
    throw new Error('Réponse Claude incomplète — champs titre ou artiste manquants');
  }

  const genre = data.genre === 'GOSPEL_HAITIEN' ? 'GOSPEL_HAITIEN' : 'GOSPEL_CONTEMPORAIN';
  const artiste = await findOrCreateArtiste(data.artiste, genre);

  let slug = makeSlug(data.titre);
  const exists = await prisma.musique.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;

  const fichierUrl = SOUNDHELIX_TRACKS[audioIndex % SOUNDHELIX_TRACKS.length];
  audioIndex++;
  const couvertureUrl = `https://picsum.photos/seed/musique-${Date.now()}/400/400`;

  const musique = await prisma.musique.create({
    data: {
      titre: data.titre,
      slug,
      fichierUrl,
      couvertureUrl,
      duree: parseInt(data.dureeSecondes) || 210,
      genre,
      status: 'BROUILLON',
      telechargeablePublic: true,
      artisteId: artiste.id,
      ajouteParId: admin.id,
    },
  });

  logAction('musique', `"${musique.titre}" suggérée par ${artiste.nom} (brouillon à valider)`);
  return musique;
}

// ── Planificateur cron ────────────────────────────────────────

// Sauvegarde le classement Top50 actuel comme référence de la semaine précédente
async function saveTop50Snapshot() {
  const musiques = await prisma.musique.findMany({
    where: { status: 'PUBLIE' },
    orderBy: { ecoutes: 'desc' },
    take: 50,
    select: { id: true, ecoutes: true },
  });
  const snapshot = musiques.map((m, i) => ({ id: m.id, position: i + 1, ecoutes: m.ecoutes }));
  await prisma.siteSettings.upsert({
    where: { cle: 'top50_snapshot' },
    update: { valeur: JSON.stringify(snapshot) },
    create: { cle: 'top50_snapshot', valeur: JSON.stringify(snapshot), description: 'Snapshot classement Top50 semaine précédente' },
  });
  logAction('suggestions', `Top50 snapshot sauvegardé (${snapshot.length} chansons)`);
}

export function startScheduler() {
  // 3 publications/jour : 7h, 12h30, 19h
  cron.schedule('0 7 * * *', async () => {
    try { await generatePublication(); }
    catch (err) { logAction('publication', `Cron 7h — ${err.message}`, false); }
  });

  cron.schedule('30 12 * * *', async () => {
    try { await generatePublication(); }
    catch (err) { logAction('publication', `Cron 12h30 — ${err.message}`, false); }
  });

  cron.schedule('0 19 * * *', async () => {
    try { await generatePublication(); }
    catch (err) { logAction('publication', `Cron 19h — ${err.message}`, false); }
  });

  // Événement : chaque lundi à 8h
  cron.schedule('0 8 * * 1', async () => {
    try { await generateEvenement(); }
    catch (err) { logAction('evenement', `Cron lundi — ${err.message}`, false); }
  });

  // Suggestions : chaque jeudi à 10h
  cron.schedule('0 10 * * 4', async () => {
    try { await generateSuggestions(); }
    catch (err) { logAction('suggestions', `Cron jeudi — ${err.message}`, false); }
  });

  // Vidéos : 2 par jour — 10h et 16h
  cron.schedule('0 10 * * *', async () => {
    try { await generateVideo(); }
    catch (err) { logAction('video', `Cron 10h — ${err.message}`, false); }
  });

  cron.schedule('0 16 * * *', async () => {
    try { await generateVideo(); }
    catch (err) { logAction('video', `Cron 16h — ${err.message}`, false); }
  });

  // Suggestion musicale (brouillon à valider) : chaque jour à 9h
  cron.schedule('0 9 * * *', async () => {
    try { await generateMusiqueSuggestion(); }
    catch (err) { logAction('musique', `Cron 9h — ${err.message}`, false); }
  });

  // Snapshot Top50 : chaque lundi à 6h (avant les publications de 7h)
  cron.schedule('0 6 * * 1', async () => {
    try { await saveTop50Snapshot(); }
    catch (err) { logAction('suggestions', `Top50 snapshot — ${err.message}`, false); }
  });

  logger.info('🤖 Agent IA Zone-Chrétien — Planificateur démarré (3 pub/j · 2 vidéos/j · 1 sugg. musique/j · 1 event/sem · 1 sugg. tendances/sem · snapshot Top50/lun)');
}
