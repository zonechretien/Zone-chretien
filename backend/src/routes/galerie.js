// src/routes/galerie.js
import { Router } from 'express';
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';

const router = Router();
const makeSlug = (s) => slugify(s, { lower: true, strict: true, locale: 'fr' });

router.get('/albums', async (req, res, next) => {
  try {
    const albums = await prisma.album_Photo.findMany({
      include: { _count: { select: { photos: true } }, photos: { take: 1, orderBy: { ordre: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(albums);
  } catch (err) { next(err); }
});

router.get('/albums/:slug', async (req, res, next) => {
  try {
    const album = await prisma.album_Photo.findUnique({
      where: { slug: req.params.slug },
      include: { photos: { orderBy: { ordre: 'asc' } } },
    });
    if (!album) return res.status(404).json({ error: 'Album introuvable.' });
    res.json(album);
  } catch (err) { next(err); }
});

router.post('/albums', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { titre, description, categorie } = req.body;
    let slug = makeSlug(titre);
    const exists = await prisma.album_Photo.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now()}`;
    const album = await prisma.album_Photo.create({ data: { titre, slug, description, categorie } });
    res.status(201).json(album);
  } catch (err) { next(err); }
});

router.put('/albums/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const { titre, description, categorie } = req.body;
    const album = await prisma.album_Photo.update({
      where: { id: req.params.id },
      data: { titre, description, categorie },
    });
    res.json(album);
  } catch (err) { next(err); }
});

router.delete('/albums/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    await prisma.album_Photo.delete({ where: { id: req.params.id } });
    res.json({ message: 'Album supprimé.' });
  } catch (err) { next(err); }
});

router.post('/photos', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.CONTRIBUTEUR), async (req, res, next) => {
  try {
    const { photos, albumId } = req.body; // photos: [{url, alt, legende, ordre}]
    const created = await prisma.$transaction(
      photos.map((p, i) => prisma.photo.create({ data: { ...p, albumId, ordre: p.ordre ?? i } }))
    );
    res.status(201).json(created);
  } catch (err) { next(err); }
});

router.delete('/photos/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    await prisma.photo.delete({ where: { id: req.params.id } });
    res.json({ message: 'Photo supprimée.' });
  } catch (err) { next(err); }
});

export default router;
