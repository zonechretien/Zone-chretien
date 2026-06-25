// src/routes/seo.js
import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';

const router = Router();

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.siteSettings.findMany();
    const obj = Object.fromEntries(settings.map((s) => [s.cle, s.valeur]));
    res.json(obj);
  } catch (err) { next(err); }
});

router.put('/settings', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const updates = Object.entries(req.body);
    await prisma.$transaction(
      updates.map(([cle, valeur]) =>
        prisma.siteSettings.upsert({
          where: { cle },
          update: { valeur: String(valeur) },
          create: { cle, valeur: String(valeur) },
        })
      )
    );
    res.json({ message: 'Paramètres SEO sauvegardés.' });
  } catch (err) { next(err); }
});

// GET /api/seo/sitemap — generate XML sitemap data
router.get('/sitemap', async (req, res, next) => {
  try {
    const [publications, musiques, artistes, evenements] = await Promise.all([
      prisma.publication.findMany({ where: { status: 'PUBLIE' }, select: { slug: true, updatedAt: true } }),
      prisma.musique.findMany({ where: { status: 'PUBLIE' }, select: { slug: true, updatedAt: true } }),
      prisma.artiste.findMany({ where: { actif: true }, select: { slug: true, updatedAt: true } }),
      prisma.evenement.findMany({ where: { status: 'PUBLIE' }, select: { slug: true, updatedAt: true } }),
    ]);

    const base = process.env.FRONTEND_URL || 'https://glorysound.ht';
    const urls = [
      { loc: base, lastmod: new Date().toISOString(), priority: '1.0' },
      ...publications.map((p) => ({ loc: `${base}/actualites/${p.slug}`, lastmod: p.updatedAt.toISOString(), priority: '0.8' })),
      ...musiques.map((m) => ({ loc: `${base}/musiques/${m.slug}`, lastmod: m.updatedAt.toISOString(), priority: '0.7' })),
      ...artistes.map((a) => ({ loc: `${base}/artistes/${a.slug}`, lastmod: a.updatedAt.toISOString(), priority: '0.7' })),
      ...evenements.map((e) => ({ loc: `${base}/evenements/${e.slug}`, lastmod: e.updatedAt.toISOString(), priority: '0.9' })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) { next(err); }
});

export default router;
