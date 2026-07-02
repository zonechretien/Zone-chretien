// Routes de contrôle de l'Agent IA Zone-Chrétien
import { Router } from 'express';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { isAgentEnabled, setAgentEnabled, getAgentStats } from '../services/aiAgent.js';
import { generatePublication, generateEvenement, generateSuggestions, generateVideo, generateMusiqueSuggestion } from '../services/autoPublish.js';
import { discoverAll, discoverMusicSpotify, discoverVideosYoutube, discoverActualitesRSS, approveSourceContent, ignoreSourceContent, approveAllSourceContent } from '../services/discovery.js';
import { prisma } from '../config/database.js';

const router = Router();

// Toutes les routes agent requièrent SUPER_ADMIN
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

// GET /api/agent/status
router.get('/status', async (req, res, next) => {
  try {
    const [enabled, stats] = await Promise.all([
      isAgentEnabled(),
      getAgentStats(),
    ]);
    res.json({ enabled, ...stats });
  } catch (err) { next(err); }
});

// POST /api/agent/enable
router.post('/enable', async (req, res, next) => {
  try {
    await setAgentEnabled(true);
    res.json({ enabled: true, message: 'Agent IA activé.' });
  } catch (err) { next(err); }
});

// POST /api/agent/disable
router.post('/disable', async (req, res, next) => {
  try {
    await setAgentEnabled(false);
    res.json({ enabled: false, message: 'Agent IA désactivé.' });
  } catch (err) { next(err); }
});

// POST /api/agent/trigger/publication — Déclenche manuellement (ignore l'état activé/désactivé)
router.post('/trigger/publication', async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY non configurée dans backend/.env' });
    }
    const pub = await generatePublication({ force: true });
    res.json({ success: true, publication: pub });
  } catch (err) { next(err); }
});

// POST /api/agent/trigger/evenement
router.post('/trigger/evenement', async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY non configurée dans backend/.env' });
    }
    const ev = await generateEvenement({ force: true });
    res.json({ success: true, evenement: ev });
  } catch (err) { next(err); }
});

// POST /api/agent/trigger/suggestions
router.post('/trigger/suggestions', async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY non configurée dans backend/.env' });
    }
    const suggestions = await generateSuggestions({ force: true });
    res.json({ success: true, suggestions });
  } catch (err) { next(err); }
});

// POST /api/agent/trigger/video — Publie une vidéo (YouTube Data API ou bibliothèque, pas besoin de Claude)
router.post('/trigger/video', async (req, res, next) => {
  try {
    const video = await generateVideo({ force: true });
    res.json({ success: true, video });
  } catch (err) { next(err); }
});

// POST /api/agent/trigger/musique — Suggère une musique en BROUILLON pour validation admin
router.post('/trigger/musique', async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY non configurée dans backend/.env' });
    }
    const musique = await generateMusiqueSuggestion({ force: true });
    res.json({ success: true, musique });
  } catch (err) { next(err); }
});

// GET /api/agent/sources — liste du contenu découvert (file d'attente) + stats
router.get('/sources', async (req, res, next) => {
  try {
    const { statut, plateforme, page = 1, limit = 30 } = req.query;
    const where = { ...(statut ? { statut } : {}), ...(plateforme ? { plateforme } : {}) };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total, statYoutube, statSpotify, statRss] = await Promise.all([
      prisma.sourceContent.findMany({ where, orderBy: { decouvertAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.sourceContent.count({ where }),
      prisma.sourceContent.count({ where: { plateforme: 'YOUTUBE', statut: 'NOUVEAU' } }),
      prisma.sourceContent.count({ where: { plateforme: 'SPOTIFY', statut: 'NOUVEAU' } }),
      prisma.sourceContent.count({ where: { plateforme: 'RSS', statut: 'NOUVEAU' } }),
    ]);

    res.json({
      data: items,
      meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      stats: { youtube: statYoutube, spotify: statSpotify, rss: statRss, total: statYoutube + statSpotify + statRss },
    });
  } catch (err) { next(err); }
});

// POST /api/agent/sources/:id/approve — publie le contenu découvert
router.post('/sources/:id/approve', async (req, res, next) => {
  try {
    const result = await approveSourceContent(req.params.id, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// POST /api/agent/sources/:id/ignore
router.post('/sources/:id/ignore', async (req, res, next) => {
  try {
    await ignoreSourceContent(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/agent/sources/approve-all — publie tout le contenu "nouveau" en masse
router.post('/sources/approve-all', async (req, res, next) => {
  try {
    const results = await approveAllSourceContent(req.user.id);
    res.json({ success: true, results });
  } catch (err) { next(err); }
});

// POST /api/agent/trigger/discovery — lance immédiatement les 3 sources (YouTube, Spotify, RSS)
router.post('/trigger/discovery', async (req, res, next) => {
  try {
    const result = await discoverAll();
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.post('/trigger/discovery/youtube', async (req, res, next) => {
  try {
    const saved = await discoverVideosYoutube();
    res.json({ success: true, saved });
  } catch (err) { next(err); }
});

router.post('/trigger/discovery/spotify', async (req, res, next) => {
  try {
    const saved = await discoverMusicSpotify();
    res.json({ success: true, saved });
  } catch (err) { next(err); }
});

router.post('/trigger/discovery/rss', async (req, res, next) => {
  try {
    const saved = await discoverActualitesRSS();
    res.json({ success: true, saved });
  } catch (err) { next(err); }
});

export default router;
