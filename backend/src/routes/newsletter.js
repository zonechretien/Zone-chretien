// src/routes/newsletter.js
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

const router = Router();

// POST /api/newsletter/subscribe
router.post(
  '/subscribe',
  [body('email').isEmail().normalizeEmail(), body('nom').optional().trim()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, nom, segment } = req.body;
      const token = crypto.randomBytes(32).toString('hex');

      const abonne = await prisma.abonne.upsert({
        where: { email },
        update: { actif: true, nom, token },
        create: { email, nom, segment, token, confirme: false },
      });

      // Send confirmation email
      await sendEmail({
        to: email,
        subject: '✦ Confirmez votre inscription — Zone-Chrétien',
        html: `
          <h2>Bienvenue sur Zone-Chrétien!</h2>
          <p>Bonjour ${nom || 'ami(e)'},</p>
          <p>Cliquez sur le lien pour confirmer votre inscription à notre newsletter gospel:</p>
          <a href="${process.env.FRONTEND_URL}/newsletter/confirmer?token=${token}"
             style="background:#E8A020;color:#0A1628;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:16px 0">
            Confirmer mon inscription ✦
          </a>
          <p>À la grâce de Dieu,<br><strong>L'équipe Zone-Chrétien</strong></p>
        `,
      }).catch(() => {}); // Don't fail if email fails

      res.status(201).json({ message: 'Vérifiez votre email pour confirmer votre inscription.' });
    } catch (err) { next(err); }
  }
);

// GET /api/newsletter/confirmer?token=...
router.get('/confirmer', async (req, res, next) => {
  try {
    const { token } = req.query;
    const abonne = await prisma.abonne.findUnique({ where: { token } });
    if (!abonne) return res.status(400).json({ error: 'Token invalide.' });

    await prisma.abonne.update({
      where: { token },
      data: { confirme: true, token: null },
    });

    res.json({ message: 'Inscription confirmée! Bienvenue dans la famille Zone-Chrétien.' });
  } catch (err) { next(err); }
});

// POST /api/newsletter/unsubscribe
router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    await prisma.abonne.update({ where: { email }, data: { actif: false } });
    res.json({ message: 'Désinscription effectuée.' });
  } catch (err) { next(err); }
});

// GET /api/newsletter/abonnes (admin)
router.get('/abonnes', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, segment, actif } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      ...(segment ? { segment } : {}),
      ...(actif !== undefined ? { actif: actif === 'true' } : {}),
    };
    const [abonnes, total] = await Promise.all([
      prisma.abonne.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.abonne.count({ where }),
    ]);
    res.json({ data: abonnes, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// POST /api/newsletter/campagnes — send campaign
router.post('/campagnes', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { objet, contenu, segment, planifieAt } = req.body;

    const campagne = await prisma.campagne.create({
      data: {
        objet, contenu, segment,
        status: planifieAt ? 'planifie' : 'brouillon',
        planifieAt: planifieAt ? new Date(planifieAt) : null,
      },
    });

    // If no planification, send now
    if (!planifieAt) {
      const where = { actif: true, confirme: true, ...(segment ? { segment } : {}) };
      const abonnes = await prisma.abonne.findMany({ where, select: { email: true, nom: true } });

      // In production: use a queue (Bull/BullMQ) for bulk sending
      // Here we batch-send with a simple loop
      let sent = 0;
      for (const abonne of abonnes) {
        try {
          await sendEmail({
            to: abonne.email,
            subject: objet,
            html: contenu.replace('{{nom}}', abonne.nom || 'ami(e)'),
          });
          sent++;
        } catch { /* continue */ }
      }

      await prisma.campagne.update({
        where: { id: campagne.id },
        data: { status: 'envoye', envoyes: sent, envoyeAt: new Date() },
      });

      res.json({ message: `Campagne envoyée à ${sent} abonnés.`, campagne });
    } else {
      res.status(201).json({ message: 'Campagne planifiée.', campagne });
    }
  } catch (err) { next(err); }
});

// GET /api/newsletter/campagnes
router.get('/campagnes', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const campagnes = await prisma.campagne.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(campagnes);
  } catch (err) { next(err); }
});

export default router;
