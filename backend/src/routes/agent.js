// Routes de contrôle de l'Agent IA Zone-Chrétien
import { Router } from 'express';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { isAgentEnabled, setAgentEnabled, getAgentStats } from '../services/aiAgent.js';
import { generatePublication, generateEvenement, generateSuggestions, generateVideo, generateMusiqueSuggestion } from '../services/autoPublish.js';

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

export default router;
