// src/routes/evenements.js
import { Router } from 'express';
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { authenticate, authorize, optionalAuth, ROLES } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();
const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

// GET — upcoming events by default (public); all statuses for authenticated admins
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, upcoming, past } = req.query;
    const isAdmin = !!req.user;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();
    const where = {
      ...(!isAdmin ? { status: 'PUBLIE' } : {}),
      ...(type ? { type } : {}),
      ...(upcoming === 'true' ? { dateDebut: { gte: now } } : {}),
      ...(past === 'true' ? { dateDebut: { lt: now } } : {}),
    };
    const [evenements, total] = await Promise.all([
      prisma.evenement.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { dateDebut: 'asc' },
      }),
      prisma.evenement.count({ where }),
    ]);
    res.json({ data: evenements, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const ev = await prisma.evenement.findUnique({ where: { slug: req.params.slug } });
    if (!ev) return res.status(404).json({ error: 'Événement introuvable.' });
    res.json(ev);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { titre, description, type, imageUrl, dateDebut, dateFin, heure, lieu, adresse, latitude, longitude, entree, capacite, status } = req.body;
    let slug = makeSlug(titre);
    const exists = await prisma.evenement.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now()}`;

    const ev = await prisma.evenement.create({
      data: {
        titre, slug, description, type, imageUrl,
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        heure, lieu, adresse,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        entree, capacite: capacite ? parseInt(capacite) : null,
        status: status || 'BROUILLON',
        publishedAt: status === 'PUBLIE' ? new Date() : null,
        creeParId: req.user.id,
      },
    });
    if (ev.status === 'PUBLIE') io.emit('content:update', { type: 'evenement', action: 'create', data: ev });
    res.status(201).json(ev);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { titre, description, type, imageUrl, dateDebut, dateFin, heure, lieu, adresse, latitude, longitude, entree, capacite, status } = req.body;
    const ev = await prisma.evenement.update({
      where: { id: req.params.id },
      data: {
        titre, description, type, imageUrl,
        dateDebut: dateDebut ? new Date(dateDebut) : undefined,
        dateFin: dateFin ? new Date(dateFin) : undefined,
        heure, lieu, adresse,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        entree, capacite: capacite ? parseInt(capacite) : undefined,
        status, updatedAt: new Date(),
      },
    });
    io.emit('content:update', { type: 'evenement', action: 'update', data: ev });
    res.json(ev);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    await prisma.evenement.delete({ where: { id: req.params.id } });
    io.emit('content:update', { type: 'evenement', action: 'delete', data: { id: req.params.id } });
    res.json({ message: 'Événement supprimé.' });
  } catch (err) { next(err); }
});

// POST /api/evenements/:id/inscription
router.post('/:id/inscription', async (req, res, next) => {
  try {
    const ev = await prisma.evenement.update({
      where: { id: req.params.id },
      data: { inscriptions: { increment: 1 } },
    });
    res.json({ message: 'Inscription enregistrée!', inscriptions: ev.inscriptions });
  } catch (err) { next(err); }
});

export default router;
