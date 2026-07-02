// Agent IA Zone-Chrétien — Service principal
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

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

// Compteurs basés sur la base de données (persistent au redémarrage,
// contrairement à agentLog qui est un ring buffer en mémoire).
export async function getAgentStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayPublications, todayEvenements, todayVideos, todayMusiques] = await Promise.all([
    prisma.publication.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.evenement.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.video.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.musique.count({ where: { createdAt: { gte: startOfDay } } }),
  ]);

  return {
    totalLogs: agentLog.length,
    todayPublications,
    todayEvenements,
    todayVideos,
    todayMusiques,
    recentLogs: agentLog.slice(0, 30),
    apiConfigured: !!process.env.ANTHROPIC_API_KEY,
  };
}
