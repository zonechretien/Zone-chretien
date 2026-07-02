// src/routes/videos.js
import { Router } from 'express';
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { authenticate, authorize, optionalAuth, ROLES } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();
const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

const extractEmbedId = (url, platform) => {
  if (platform === 'YOUTUBE') {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return match?.[1] || null;
  }
  if (platform === 'VIMEO') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match?.[1] || null;
  }
  return null;
};

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 12, platform, artisteId, langue, q } = req.query;
    const isAdmin = !!req.user;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      ...(!isAdmin ? { status: 'PUBLIE' } : {}),
      ...(platform ? { platform } : {}),
      ...(artisteId ? { artisteId } : {}),
      ...(langue ? { langue } : {}),
      ...(q ? { titre: { contains: q, mode: 'insensitive' } } : {}),
    };
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { vues: 'desc' },
        include: { artiste: { select: { id: true, nom: true, slug: true } } },
      }),
      prisma.video.count({ where }),
    ]);
    res.json({ data: videos, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const video = await prisma.video.findUnique({
      where: { slug: req.params.slug },
      include: { artiste: true },
    });
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable.' });
    prisma.video.update({ where: { id: video.id }, data: { vues: { increment: 1 } } }).catch(() => {});
    res.json(video);
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.CONTRIBUTEUR), async (req, res, next) => {
  try {
    const { titre, description, url, platform, miniatureUrl, artisteId, categorie, langue, status } = req.body;
    let slug = makeSlug(titre);
    const exists = await prisma.video.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now()}`;

    const video = await prisma.video.create({
      data: {
        titre, slug, description, url, platform,
        embedId: extractEmbedId(url, platform),
        miniatureUrl, artisteId, categorie, langue: langue || 'AUTRE',
        status: status || 'BROUILLON',
        publishedAt: status === 'PUBLIE' ? new Date() : null,
        ajouteParId: req.user.id,
      },
    });
    if (video.status === 'PUBLIE') io.emit('content:update', { type: 'video', action: 'create', data: video });
    res.status(201).json(video);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { titre, description, url, platform, miniatureUrl, artisteId, categorie, langue, status } = req.body;
    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: {
        titre, description, url, platform,
        ...(url ? { embedId: extractEmbedId(url, platform) } : {}),
        miniatureUrl, artisteId, categorie, langue, status, updatedAt: new Date(),
      },
    });
    io.emit('content:update', { type: 'video', action: 'update', data: video });
    res.json(video);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    await prisma.video.delete({ where: { id: req.params.id } });
    io.emit('content:update', { type: 'video', action: 'delete', data: { id: req.params.id } });
    res.json({ message: 'Vidéo supprimée.' });
  } catch (err) { next(err); }
});

export default router;
