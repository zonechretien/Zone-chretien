// src/routes/publications.js
import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import slugify from 'slugify';
import { prisma } from '../config/database.js';
import { authenticate, authorize, optionalAuth, ROLES } from '../middleware/auth.js';
import { io } from '../server.js';
import { logger } from '../utils/logger.js';

const router = Router();

const makeSlug = (titre) =>
  slugify(titre, { lower: true, strict: true, locale: 'fr' });

// ── GET /api/publications (public + admin) ────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      categorieId,
      tag,
      q,
      sort = 'publishedAt',
      order = 'desc',
    } = req.query;

    const isAdmin = req.user?.role && req.user.role !== 'PUBLIC';
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(isAdmin ? {} : { status: 'PUBLIE' }),
      ...(status && isAdmin ? { status } : {}),
      ...(categorieId ? { categorieId } : {}),
      ...(tag ? { tags: { some: { slug: tag } } } : {}),
      ...(q
        ? {
            OR: [
              { titre: { contains: q, mode: 'insensitive' } },
              { sousTitre: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [publications, total] = await Promise.all([
      prisma.publication.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: {
          auteur: { select: { id: true, nom: true, prenom: true, avatar: true } },
          categorie: { select: { id: true, nom: true, slug: true, couleur: true } },
          tags: { select: { id: true, nom: true, slug: true } },
          mediaGalerie: { orderBy: { ordre: 'asc' } },
          _count: { select: { commentaires: true } },
        },
      }),
      prisma.publication.count({ where }),
    ]);

    res.json({
      data: publications,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/publications/:slug ───────────────────────────────
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const pub = await prisma.publication.findUnique({
      where: { slug: req.params.slug },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true, avatar: true } },
        categorie: true,
        tags: true,
        mediaGalerie: { orderBy: { ordre: 'asc' } },
        commentaires: {
          where: { approuve: true, parentId: null },
          include: { enfants: { where: { approuve: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pub) return res.status(404).json({ error: 'Publication introuvable.' });
    if (pub.status !== 'PUBLIE' && !req.user) {
      return res.status(404).json({ error: 'Publication introuvable.' });
    }

    // Increment views (async, don't await)
    prisma.publication
      .update({ where: { id: pub.id }, data: { vues: { increment: 1 } } })
      .catch(() => {});

    res.json(pub);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/publications ────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.CONTRIBUTEUR),
  [
    body('titre').notEmpty().trim().withMessage('Titre requis.'),
    body('contenu').notEmpty().withMessage('Contenu requis.'),
    body('categorieId').optional(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const {
        titre,
        sousTitre,
        contenu,
        extrait,
        imageUrl,
        galerie,
        categorieId,
        tags,
        scheduledAt,
        status,
        metaTitre,
        metaDescription,
        motsCles,
        ogImage,
      } = req.body;

      const canPublish = [ROLES.SUPER_ADMIN, ROLES.EDITEUR].includes(req.user.role);
      const finalStatus = canPublish ? (status || 'BROUILLON') : 'BROUILLON';

      let slug = makeSlug(titre);
      const exists = await prisma.publication.findUnique({ where: { slug } });
      if (exists) slug = `${slug}-${Date.now()}`;

      const pub = await prisma.publication.create({
        data: {
          titre,
          sousTitre,
          slug,
          contenu,
          extrait,
          imageUrl,
          galerie: galerie || [],
          status: finalStatus,
          publishedAt: finalStatus === 'PUBLIE' ? new Date() : null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          auteurId: req.user.id,
          ...(categorieId ? { categorieId } : {}),
          metaTitre: metaTitre || titre,
          metaDescription,
          motsCles,
          ogImage,
          tags: tags?.length
            ? {
                connectOrCreate: tags.map((tag) => ({
                  where: { slug: makeSlug(tag) },
                  create: { nom: tag, slug: makeSlug(tag) },
                })),
              }
            : undefined,
        },
        include: {
          auteur: { select: { id: true, nom: true, prenom: true } },
          categorie: true,
          tags: true,
        },
      });

      // Real-time push to public site
      if (pub.status === 'PUBLIE') {
        io.emit('content:update', {
          type: 'publication',
          action: 'create',
          data: pub,
        });
      }

      logger.info(`Publication créée: "${pub.titre}" by ${req.user.email}`);
      res.status(201).json(pub);
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/publications/:id ─────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR),
  async (req, res, next) => {
    try {
      const { tags, status, scheduledAt, ...rest } = req.body;

      const existing = await prisma.publication.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) return res.status(404).json({ error: 'Publication introuvable.' });

      const wasPublished = existing.status === 'PUBLIE';
      const nowPublished = status === 'PUBLIE';

      const pub = await prisma.publication.update({
        where: { id: req.params.id },
        data: {
          ...rest,
          status: status || existing.status,
          publishedAt:
            !wasPublished && nowPublished ? new Date() : existing.publishedAt,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : existing.scheduledAt,
          tags: tags
            ? {
                set: [],
                connectOrCreate: tags.map((tag) => ({
                  where: { slug: makeSlug(tag) },
                  create: { nom: tag, slug: makeSlug(tag) },
                })),
              }
            : undefined,
          updatedAt: new Date(),
        },
        include: {
          auteur: { select: { id: true, nom: true, prenom: true } },
          categorie: true,
          tags: true,
        },
      });

      // Real-time update
      io.emit('content:update', { type: 'publication', action: 'update', data: pub });

      res.json(pub);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/publications/:id ──────────────────────────────
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR),
  async (req, res, next) => {
    try {
      await prisma.publication.delete({ where: { id: req.params.id } });
      io.emit('content:update', {
        type: 'publication',
        action: 'delete',
        data: { id: req.params.id },
      });
      res.json({ message: 'Publication supprimée.' });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/publications/:id/commentaires ───────────────────
router.post('/:id/commentaires', async (req, res, next) => {
  try {
    const { contenu, auteurNom, auteurEmail, parentId } = req.body;
    const comment = await prisma.commentaire.create({
      data: {
        contenu,
        auteurNom,
        auteurEmail,
        publicationId: req.params.id,
        parentId: parentId || null,
        approuve: false,
      },
    });
    res.status(201).json({ message: 'Commentaire soumis pour modération.', comment });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/publications/commentaires/:id/approuver ────────
router.patch(
  '/commentaires/:id/approuver',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.MODERATEUR),
  async (req, res, next) => {
    try {
      const c = await prisma.commentaire.update({
        where: { id: req.params.id },
        data: { approuve: req.body.approuve ?? true },
      });
      res.json(c);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
