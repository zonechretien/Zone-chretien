// ============================================================
// GlorySound CMS — Express Server
// ============================================================

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

import { prisma } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Routes
import authRoutes from './routes/auth.js';
import publicationsRoutes from './routes/publications.js';
import videosRoutes from './routes/videos.js';
import musiquesRoutes from './routes/musiques.js';
import artistesRoutes from './routes/artistes.js';
import evenementsRoutes from './routes/evenements.js';
import galerieRoutes from './routes/galerie.js';
import temoignagesRoutes from './routes/temoignages.js';
import newsletterRoutes from './routes/newsletter.js';
import utilisateursRoutes from './routes/utilisateurs.js';
import seoRoutes from './routes/seo.js';
import mediaRoutes from './routes/media.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const httpServer = createServer(app);

// ── WebSocket (real-time CMS ↔ site sync) ────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ── Core Middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve locally uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion.' },
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
    });
  } catch {
    res.status(503).json({ status: 'ERROR', database: 'disconnected' });
  }
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/musiques', musiquesRoutes);
app.use('/api/artistes', artistesRoutes);
app.use('/api/evenements', evenementsRoutes);
app.use('/api/galerie', galerieRoutes);
app.use('/api/temoignages', temoignagesRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Search endpoint ───────────────────────────────────────────
app.get('/api/search', async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }
    const query = q.toLowerCase();

    const [publications, musiques, artistes, videos, evenements] = await Promise.all([
      (!type || type === 'publications')
        ? prisma.publication.findMany({
            where: {
              status: 'PUBLIE',
              OR: [
                { titre: { contains: query, mode: 'insensitive' } },
                { contenu: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: { id: true, titre: true, slug: true, imageUrl: true },
            take: 5,
          })
        : [],
      (!type || type === 'musiques')
        ? prisma.musique.findMany({
            where: {
              status: 'PUBLIE',
              OR: [{ titre: { contains: query, mode: 'insensitive' } }],
            },
            select: { id: true, titre: true, slug: true, couvertureUrl: true },
            include: { artiste: { select: { nom: true } } },
            take: 5,
          })
        : [],
      (!type || type === 'artistes')
        ? prisma.artiste.findMany({
            where: {
              actif: true,
              nom: { contains: query, mode: 'insensitive' },
            },
            select: { id: true, nom: true, slug: true, photoUrl: true },
            take: 5,
          })
        : [],
      (!type || type === 'videos')
        ? prisma.video.findMany({
            where: {
              status: 'PUBLIE',
              titre: { contains: query, mode: 'insensitive' },
            },
            select: { id: true, titre: true, slug: true, miniatureUrl: true },
            take: 5,
          })
        : [],
      (!type || type === 'evenements')
        ? prisma.evenement.findMany({
            where: {
              status: 'PUBLIE',
              titre: { contains: query, mode: 'insensitive' },
            },
            select: { id: true, titre: true, slug: true, dateDebut: true },
            take: 5,
          })
        : [],
    ]);

    res.json({
      results: {
        publications: publications.map((p) => ({ ...p, type: 'publication' })),
        musiques: musiques.map((m) => ({ ...m, type: 'musique' })),
        artistes: artistes.map((a) => ({ ...a, type: 'artiste' })),
        videos: videos.map((v) => ({ ...v, type: 'video' })),
        evenements: evenements.map((e) => ({ ...e, type: 'evenement' })),
      },
      total:
        publications.length +
        musiques.length +
        artistes.length +
        videos.length +
        evenements.length,
    });
  } catch (error) {
    next(error);
  }
});

// ── Error Handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, async () => {
  logger.info(`🎵 GlorySound API running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
