// src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

// ── POST /api/auth/login ──────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
    body('password').notEmpty().withMessage('Mot de passe requis.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }
      if (!user.actif) {
        return res.status(403).json({ error: 'Compte désactivé.' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken, lastLogin: new Date() },
      });

      logger.info(`Login: ${user.email} (${user.role})`);

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      logger.error('Login error:', err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

// ── POST /api/auth/register ───────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('8 caractères minimum.'),
    body('nom').notEmpty().trim(),
    body('prenom').notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, nom, prenom } = req.body;

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(409).json({ error: 'Email déjà utilisé.' });
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email, password: hashed, nom, prenom, role: 'CONTRIBUTEUR' },
        select: { id: true, email: true, nom: true, prenom: true, role: true },
      });

      const { accessToken, refreshToken } = generateTokens(user.id);
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

      res.status(201).json({ accessToken, refreshToken, user });
    } catch (err) {
      logger.error('Register error:', err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

// ── POST /api/auth/refresh ────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Token requis.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Token invalide.' });
    }

    const tokens = generateTokens(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });
  res.json({ message: 'Déconnexion réussie.' });
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
