// src/routes/musiques.js
import { Router } from 'express';
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { authenticate, authorize, optionalAuth, ROLES } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();
const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

// GET /api/musiques
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, artisteId, genre, albumId, q } = req.query;
    const isAdmin = !!req.user;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(!isAdmin ? { status: 'PUBLIE' } : {}),
      ...(artisteId ? { artisteId } : {}),
      ...(genre ? { genre } : {}),
      ...(albumId ? { albumId } : {}),
      ...(q ? { titre: { contains: q, mode: 'insensitive' } } : {}),
    };

    const [musiques, total] = await Promise.all([
      prisma.musique.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { ecoutes: 'desc' },
        include: {
          artiste: { select: { id: true, nom: true, slug: true, photoUrl: true } },
          album: { select: { id: true, titre: true, couverture: true } },
        },
      }),
      prisma.musique.count({ where }),
    ]);

    res.json({ data: musiques, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// GET /api/musiques/top50 — classement hebdomadaire par écoutes
router.get('/top50', async (req, res, next) => {
  try {
    const musiques = await prisma.musique.findMany({
      where: { status: 'PUBLIE' },
      orderBy: { ecoutes: 'desc' },
      take: 50,
      include: { artiste: { select: { id: true, nom: true, slug: true, photoUrl: true } } },
    });

    // Snapshot de la semaine précédente (stocké en SiteSettings)
    let prevMap = {};
    try {
      const snap = await prisma.siteSettings.findUnique({ where: { cle: 'top50_snapshot' } });
      if (snap) {
        const prev = JSON.parse(snap.valeur);
        prev.forEach(item => { prevMap[item.id] = item.position; });
      }
    } catch {}

    // Numéro de semaine ISO
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const weekNumber = Math.ceil((dayOfYear + new Date(now.getFullYear(), 0, 1).getDay()) / 7);

    const result = musiques.map((m, i) => {
      const position = i + 1;
      const prevPos = prevMap[m.id];
      const variation = prevPos != null ? prevPos - position : null; // >0 monte, <0 descend
      return { ...m, position, variation, isNew: prevPos == null };
    });

    res.json({ musiques: result, weekNumber, total: result.length, updatedAt: now });
  } catch (err) { next(err); }
});

// GET /api/musiques/:slug
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const musique = await prisma.musique.findUnique({
      where: { slug: req.params.slug },
      include: {
        artiste: true,
        album: { include: { musiques: { select: { id: true, titre: true, slug: true, duree: true } } } },
      },
    });
    if (!musique) return res.status(404).json({ error: 'Chanson introuvable.' });
    prisma.musique.update({ where: { id: musique.id }, data: { ecoutes: { increment: 1 } } }).catch(() => {});
    res.json(musique);
  } catch (err) { next(err); }
});

// POST /api/musiques
router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.CONTRIBUTEUR), async (req, res, next) => {
  try {
    const { titre, artisteId, albumId, genre, fichierUrl, couvertureUrl, paroles, dateSortie, telechargeablePublic, status } = req.body;
    let slug = makeSlug(titre);
    const exists = await prisma.musique.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now()}`;

    const musique = await prisma.musique.create({
      data: { titre, slug, artisteId, albumId, genre, fichierUrl, couvertureUrl, paroles, dateSortie: dateSortie ? new Date(dateSortie) : null, telechargeablePublic: telechargeablePublic ?? true, status: status || 'BROUILLON', publishedAt: status === 'PUBLIE' ? new Date() : null, ajouteParId: req.user.id },
      include: { artiste: { select: { id: true, nom: true } } },
    });

    if (musique.status === 'PUBLIE') {
      io.emit('content:update', { type: 'musique', action: 'create', data: musique });
    }
    res.status(201).json(musique);
  } catch (err) { next(err); }
});

// PUT /api/musiques/:id
router.put('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { titre, artisteId, albumId, genre, fichierUrl, couvertureUrl, paroles, dateSortie, telechargeablePublic, status } = req.body;
    const musique = await prisma.musique.update({
      where: { id: req.params.id },
      data: { titre, artisteId, albumId, genre, fichierUrl, couvertureUrl, paroles, dateSortie: dateSortie ? new Date(dateSortie) : undefined, telechargeablePublic, status, updatedAt: new Date() },
      include: { artiste: { select: { id: true, nom: true } } },
    });
    io.emit('content:update', { type: 'musique', action: 'update', data: musique });
    res.json(musique);
  } catch (err) { next(err); }
});

// DELETE /api/musiques/:id
router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    await prisma.musique.delete({ where: { id: req.params.id } });
    io.emit('content:update', { type: 'musique', action: 'delete', data: { id: req.params.id } });
    res.json({ message: 'Chanson supprimée.' });
  } catch (err) { next(err); }
});

// POST /api/musiques/:id/ecoute — increment play count
router.post('/:id/ecoute', async (req, res) => {
  await prisma.musique.update({ where: { id: req.params.id }, data: { ecoutes: { increment: 1 } } }).catch(() => {});
  res.json({ ok: true });
});

export default router;
