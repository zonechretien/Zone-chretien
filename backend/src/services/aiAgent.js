// Agent IA Zone-Chrétien — Service principal
import Anthropic from '@anthropic-ai/sdk';
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

// Trouve ou crée l'artiste par son nom (utilisé par vidéos, suggestions musicales et découverte multi-sources)
export async function findOrCreateArtiste(nom, genre = 'GOSPEL_CONTEMPORAIN') {
  const slug = makeSlug(nom);
  let artiste = await prisma.artiste.findUnique({ where: { slug } });
  if (!artiste) {
    artiste = await prisma.artiste.create({ data: { nom, slug, genre, actif: true } });
  }
  return artiste;
}

// Ring buffer d'activité en mémoire (réinitialisé au redémarrage)
const MAX_LOG = 100;
export const agentLog = [];

export function logAction(type, detail, success = true) {
  agentLog.unshift({ type, detail, success, at: new Date().toISOString() });
  if (agentLog.length > MAX_LOG) agentLog.pop();
  if (success) {
    logger.info(`[Agent IA] ${type}: ${detail}`);
  } else {
    logger.warn(`[Agent IA] ERREUR ${type}: ${detail}`);
  }
}

export async function isAgentEnabled() {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { cle: 'agent_enabled' } });
    return s?.valeur === 'true';
  } catch {
    return false;
  }
}

export async function setAgentEnabled(enabled) {
  await prisma.siteSettings.upsert({
    where: { cle: 'agent_enabled' },
    update: { valeur: String(enabled) },
    create: {
      cle: 'agent_enabled',
      valeur: String(enabled),
      description: 'Agent IA Zone-Chrétien — actif/inactif',
    },
  });
}

export async function getAdminUser() {
  return prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN', actif: true },
    select: { id: true },
  });
}

// Génère du texte via Claude claude-sonnet-4-6
export async function generateText(systemPrompt, userPrompt, maxTokens = 1500) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY non configurée dans backend/.env');
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  return msg.content[0].text;
}

// Génère du texte via Claude avec recherche web activée (server tool Anthropic —
// exécutée côté Anthropic, aucune boucle d'appels côté serveur nécessaire).
export async function generateTextWithSearch(systemPrompt, userPrompt, maxTokens = 1500) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY non configurée dans backend/.env');
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
    messages: [{ role: 'user', content: userPrompt }],
  });
  // La recherche web ajoute des blocs server_tool_use / web_search_tool_result
  // avant le texte final — on récupère le dernier bloc de type "text".
  const textBlock = [...msg.content].reverse().find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Aucune réponse texte de Claude (recherche web)');
  return textBlock.text;
}

// Compteurs basés sur la base de données (persistent au redémarrage,
// contrairement à agentLog qui est un ring buffer en mémoire).
export async function getAgentStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayPublications, todayEvenements, todayVideos, todayMusiques, todaySources, pendingSources] = await Promise.all([
    prisma.publication.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.evenement.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.video.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.musique.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.sourceContent.count({ where: { decouvertAt: { gte: startOfDay } } }),
    prisma.sourceContent.count({ where: { statut: 'NOUVEAU' } }),
  ]);

  return {
    totalLogs: agentLog.length,
    todayPublications,
    todayEvenements,
    todayVideos,
    todayMusiques,
    todaySources,
    pendingSources,
    recentLogs: agentLog.slice(0, 30),
    apiConfigured: !!process.env.ANTHROPIC_API_KEY,
  };
}
