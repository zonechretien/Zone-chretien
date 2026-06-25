// src/routes/analytics.js
import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';

const router = Router();

// POST /api/analytics/pageview — track page view from frontend
router.post('/pageview', async (req, res) => {
  const { path, referer } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  prisma.pageView.create({
    data: { path, referer, userAgent: req.headers['user-agent'], ip },
  }).catch(() => {});
  res.json({ ok: true });
});

// GET /api/analytics/dashboard — admin stats
router.get('/dashboard', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPublications, totalVideos, totalMusiques, totalArtistes,
      totalEvenements, totalUsers, totalAbonnes,
      recentViews, topPublications,
      pubsParStatut, derniersTemoignages,
    ] = await Promise.all([
      prisma.publication.count(),
      prisma.video.count(),
      prisma.musique.count(),
      prisma.artiste.count({ where: { actif: true } }),
      prisma.evenement.count(),
      prisma.user.count({ where: { actif: true } }),
      prisma.abonne.count({ where: { actif: true } }),
      prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.publication.findMany({
        where: { status: 'PUBLIE' },
        orderBy: { vues: 'desc' },
        take: 5,
        select: { id: true, titre: true, slug: true, vues: true, publishedAt: true },
      }),
      prisma.publication.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.temoignage.findMany({
        where: { status: 'EN_ATTENTE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Views per day last 30 days — column is "createdAt" (camelCase, no @map on the field)
    const vuesParJour = await prisma.$queryRaw`
      SELECT DATE("createdAt") AS jour, COUNT(*)::int AS vues
      FROM page_views
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY jour ASC
    `;

    res.json({
      stats: {
        totalPublications, totalVideos, totalMusiques, totalArtistes,
        totalEvenements, totalUsers, totalAbonnes,
        visiteursMois: Number(recentViews),
      },
      topPublications,
      pubsParStatut: Object.fromEntries(pubsParStatut.map((p) => [p.status, p._count.id])),
      vuesParJour,
      derniersTemoignages,
    });
  } catch (err) { next(err); }
});

export default router;
