// src/middleware/errorHandler.js
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Cette valeur existe déjà (contrainte unique).', field: err.meta?.target });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Enregistrement introuvable.' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux. Maximum 50MB.' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur.' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// src/middleware/notFound.js
export const notFound = (req, res) => {
  res.status(404).json({ error: `Route introuvable: ${req.method} ${req.path}` });
};
