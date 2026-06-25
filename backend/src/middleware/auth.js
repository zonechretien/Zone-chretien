// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
        avatar: true,
      },
    });

    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable.' });
    if (!user.actif) return res.status(403).json({ error: 'Compte désactivé.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invalide.' });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé. Permissions insuffisantes.',
        required: roles,
        current: req.user.role,
      });
    }
    next();
  };
};

// Optional auth (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, nom: true, role: true, actif: true },
    });
    if (user?.actif) req.user = user;
  } catch {
    // ignore
  }
  next();
};

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  EDITEUR: 'EDITEUR',
  CONTRIBUTEUR: 'CONTRIBUTEUR',
  MODERATEUR: 'MODERATEUR',
};
