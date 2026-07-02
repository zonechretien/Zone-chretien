// Publications et événements automatiques — planifiés avec node-cron
import cron from 'node-cron';
import slugify from 'slugify';
import { generateText, isAgentEnabled, getAdminUser, logAction } from './aiAgent.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

// ── Prompts système ───────────────────────────────────────────

const SYS_PUBLICATION = `Tu es le rédacteur en chef de Zone-Chrétien, la plateforme de référence du gospel haïtien.
Tu rédiges des articles engageants, spirituellement riches, en français.
IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans bloc markdown.
Format exact :
{
  "titre": "Titre accrocheur",
  "sousTitre": "Sous-titre complémentaire",
  "extrait": "Résumé en 2-3 phrases percutantes.",
  "contenu": "<p>Contenu HTML avec h2, h3, blockquote, strong. Minimum 400 mots.</p>"
}`;

const SYS_EVENEMENT = `Tu es responsable des événements de Zone-Chrétien.
Tu génères des événements chrétiens/gospel réalistes à venir en Haïti ou pour la diaspora.
IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après.
Format exact :
{
  "titre": "Titre de l'événement",
  "description": "<p>Description HTML en 2-3 paragraphes.</p>",
  "type": "CONCERT",
  "lieu": "Nom du lieu",
  "adresse": "Adresse, ville",
  "heure": "19:00",
  "entree": "Gratuit",
  "daysFromNow": 21
}
Types valides uniquement : CONCERT, CROISADE, CONFERENCE, EVANGELISATION`;

const SYS_SUGGESTIONS = `Tu es un expert passionné de musique chrétienne haïtienne et internationale.
Tu analyses les tendances et fournis des recommandations concrètes pour enrichir une plateforme gospel.
Réponds en français, de façon enthousiaste et pratique, en liste numérotée.`;

const TOPICS = [
  'Un artiste gospel haïtien influent : son parcours, son impact spirituel et ses chansons phares',
  'Le verset biblique de la semaine : méditation profonde sur la louange et l\'adoration',
  'Actualité internationale : les tendances du gospel contemporain et leur influence en Haïti',
  'Un message d\'encouragement spirituel pour les chrétiens haïtiens face aux défis quotidiens',
  'Histoire et héritage : les origines du gospel haïtien et son rayonnement mondial',
  'Jeunesse et foi : comment le gospel contemporain touche la nouvelle génération chrétienne',
  'Focus sur un groupe de louange haïtien : ministère, albums et vision spirituelle',
  'La puissance de l\'adoration collective : témoignages et bienfaits du chant en communauté',
  'Portrait d\'un artiste évangélique haïtien de la diaspora et son influence internationale',
  'Analyse spirituelle d\'un hymne traditionnel haïtien chanté dans les églises du monde entier',
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

  const raw = await generateText(SYS_PUBLICATION, `Rédige un article complet sur : ${topic}`);

  let data;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    data = JSON.parse(match ? match[0] : raw);
  } catch {
    throw new Error(`Réponse JSON invalide de Claude : ${raw.slice(0, 150)}`);
  }

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

  let data;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    data = JSON.parse(match ? match[0] : raw);
  } catch {
    throw new Error(`JSON invalide : ${raw.slice(0, 150)}`);
  }

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

// ── Planificateur cron ────────────────────────────────────────

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

  logger.info('🤖 Agent IA Zone-Chrétien — Planificateur démarré (3 pub/j · 1 event/sem · 1 sugg/sem)');
}
