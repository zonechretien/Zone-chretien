// src/routes/utilisateurs.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';

const router = Router();

// GET /api/utilisateurs
router.get('/', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nom: true, prenom: true, role: true, actif: true, avatar: true, lastLogin: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

// POST /api/utilisateurs — invite user
router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { email, nom, prenom, role, password } = req.body;
    const hashed = await bcrypt.hash(password || 'TempPassword2026!', 12);
    const user = await prisma.user.create({
      data: { email, nom, prenom, role, password: hashed },
      select: { id: true, email: true, nom: true, prenom: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// PUT /api/utilisateurs/:id
router.put('/:id', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { role, actif, nom, prenom, password } = req.body;
    const updateData = { role, actif, nom, prenom };
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, nom: true, prenom: true, role: true, actif: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

// DELETE /api/utilisateurs/:id
router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { actif: false } });
    res.json({ message: 'Utilisateur désactivé.' });
  } catch (err) { next(err); }
});

// PATCH /api/utilisateurs/me/password
router.patch('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Mot de passe mis à jour.' });
  } catch (err) { next(err); }
});

export default router;
