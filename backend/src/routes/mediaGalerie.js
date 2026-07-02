// src/routes/mediaGalerie.js — galerie photos (carousel) des articles et événements
import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';

const router = Router();

// PUT /api/media-galerie/sync — remplace intégralement la galerie d'un article ou événement
// (crée/met à jour/supprime en une seule requête, ordre = position dans le tableau)
router.put('/sync', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR, ROLES.CONTRIBUTEUR), async (req, res, next) => {
  try {
    const { publicationId, evenementId, items } = req.body;
    if (!publicationId && !evenementId) {
      return res.status(400).json({ error: 'publicationId ou evenementId requis.' });
    }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items doit être un tableau.' });
    }

    const ownerWhere = publicationId ? { publicationId } : { evenementId };
    const existing = await prisma.mediaGalerie.findMany({ where: ownerWhere, select: { id: true } });
    const existingIds = new Set(existing.map((e) => e.id));
    const keepIds = new Set(items.filter((i) => i.id).map((i) => i.id));

    const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
    if (toDelete.length) {
      await prisma.mediaGalerie.deleteMany({ where: { id: { in: toDelete } } });
    }

    const results = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id && existingIds.has(item.id)) {
        results.push(await prisma.mediaGalerie.update({
          where: { id: item.id },
          data: { url: item.url, caption: item.caption || null, ordre: i },
        }));
      } else {
        results.push(await prisma.mediaGalerie.create({
          data: {
            url: item.url,
            caption: item.caption || null,
            ordre: i,
            ...(publicationId ? { publicationId } : { evenementId }),
          },
        }));
      }
    }

    res.json({ data: results });
  } catch (err) { next(err); }
});

export default router;
