// src/routes/artistes.js
import { Router } from 'express';
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();
const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

// GET /api/artistes
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, genre, featured, q } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      actif: true,
      ...(genre ? { genre } : {}),
      ...(featured === 'true' ? { featured: true } : {}),
      ...(q ? { nom: { contains: q, mode: 'insensitive' } } : {}),
    };

    const [artistes, total] = await Promise.all([
      prisma.artiste.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { nom: 'asc' },
        include: {
          _count: { select: { musiques: true, videos: true, albums: true } },
        },
      }),
      prisma.artiste.count({ where }),
    ]);

    res.json({ data: artistes, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// GET /api/artistes/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const artiste = await prisma.artiste.findUnique({
      where: { slug: req.params.slug },
      include: {
        musiques: {
          where: { status: 'PUBLIE' },
          orderBy: { ecoutes: 'desc' },
          select: { id: true, titre: true, slug: true, fichierUrl: true, couvertureUrl: true, duree: true, ecoutes: true, genre: true },
        },
        videos: {
          where: { status: 'PUBLIE' },
          orderBy: { vues: 'desc' },
          take: 6,
          select: { id: true, titre: true, slug: true, miniatureUrl: true, platform: true, vues: true },
        },
        albums: {
          include: {
            musiques: { select: { id: true, titre: true, slug: true, duree: true } },
          },
        },
        _count: { select: { musiques: true, videos: true } },
      },
    });
    if (!artiste) return res.status(404).json({ error: 'Artiste introuvable.' });
    res.json(artiste);
  } catch (err) { next(err); }
});

// POST /api/artistes
router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { nom, photoUrl, biographie, genre, facebook, instagram, youtube, tiktok, twitter, site, featured } = req.body;
    let slug = makeSlug(nom);
    const exists = await prisma.artiste.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now()}`;

    const artiste = await prisma.artiste.create({
      data: { nom, slug, photoUrl, biographie, genre, facebook, instagram, youtube, tiktok, twitter, site, featured: featured || false },
    });
    io.emit('content:update', { type: 'artiste', action: 'create', data: artiste });
    res.status(201).json(artiste);
  } catch (err) { next(err); }
});

// PUT /api/artistes/:id
router.put('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { nom, photoUrl, biographie, genre, facebook, instagram, youtube, tiktok, twitter, site, featured, actif } = req.body;
    const artiste = await prisma.artiste.update({
      where: { id: req.params.id },
      data: { nom, photoUrl, biographie, genre, facebook, instagram, youtube, tiktok, twitter, site, featured, actif, updatedAt: new Date() },
    });
    io.emit('content:update', { type: 'artiste', action: 'update', data: artiste });
    res.json(artiste);
  } catch (err) { next(err); }
});

// DELETE /api/artistes/:id
router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    await prisma.artiste.update({ where: { id: req.params.id }, data: { actif: false } });
    io.emit('content:update', { type: 'artiste', action: 'delete', data: { id: req.params.id } });
    res.json({ message: 'Artiste désactivé.' });
  } catch (err) { next(err); }
});

export default router;
