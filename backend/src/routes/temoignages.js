// src/routes/temoignages.js
import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { io } from '../server.js';
import { sendAutoReply } from '../services/autoReply.js';

const router = Router();

// GET public approved
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      status: 'APPROUVE',
      ...(type ? { type } : {}),
      ...(featured === 'true' ? { featured: true } : {}),
    };
    const [temoignages, total] = await Promise.all([
      prisma.temoignage.findMany({ where, skip, take: parseInt(limit), orderBy: { approuveAt: 'desc' } }),
      prisma.temoignage.count({ where }),
    ]);
    res.json({ data: temoignages, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// GET admin — all with status filter
router.get('/admin/tous', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.MODERATEUR), async (req, res, next) => {
  try {
    const { status = 'EN_ATTENTE' } = req.query;
    const temoignages = await prisma.temoignage.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    res.json(temoignages);
  } catch (err) { next(err); }
});

// POST — public submission
router.post('/', async (req, res, next) => {
  try {
    const { type, contenu, mediaUrl, auteurNom, auteurEmail, titre } = req.body;
    const t = await prisma.temoignage.create({
      data: { type, contenu, mediaUrl, auteurNom, auteurEmail, titre, status: 'EN_ATTENTE' },
    });
    // Réponse auto IA (async — n'attend pas l'email pour répondre au client)
    sendAutoReply({ auteurNom, auteurEmail, contenu, titre }).catch(() => {});
    res.status(201).json({ message: 'Témoignage soumis. En attente de validation.', id: t.id });
  } catch (err) { next(err); }
});

// PATCH — approve/refuse
router.patch('/:id/statut', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.MODERATEUR), async (req, res, next) => {
  try {
    const { status, featured } = req.body;
    const t = await prisma.temoignage.update({
      where: { id: req.params.id },
      data: {
        status,
        featured: featured ?? false,
        approuvePar: req.user.id,
        approuveAt: status === 'APPROUVE' ? new Date() : null,
      },
    });
    if (status === 'APPROUVE') {
      io.emit('content:update', { type: 'temoignage', action: 'approve', data: t });
    }
    res.json(t);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.MODERATEUR), async (req, res, next) => {
  try {
    await prisma.temoignage.delete({ where: { id: req.params.id } });
    res.json({ message: 'Témoignage supprimé.' });
  } catch (err) { next(err); }
});

export default router;
