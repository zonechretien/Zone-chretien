// src/routes/media.js
import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for Cloudinary uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3', 'video/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  },
});

// Upload single file to Cloudinary
const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(buffer);
  });

// POST /api/media/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni.' });

    const { folder = 'glorysound', type = 'image' } = req.body;
    const isImage = req.file.mimetype.startsWith('image/');
    const isAudio = req.file.mimetype.startsWith('audio/');

    let result;
    if (isImage) {
      result = await uploadToCloudinary(req.file.buffer, {
        folder: `glorysound/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
    } else if (isAudio) {
      // For audio: upload to Cloudinary as raw
      result = await uploadToCloudinary(req.file.buffer, {
        folder: `glorysound/audio`,
        resource_type: 'raw',
      });
    } else {
      result = await uploadToCloudinary(req.file.buffer, {
        folder: `glorysound/videos`,
        resource_type: 'video',
      });
    }

    // Save to media library
    const media = await prisma.mediaFile.create({
      data: {
        nom: req.file.originalname,
        url: result.secure_url,
        urlThumb: isImage ? cloudinary.url(result.public_id, { width: 300, height: 300, crop: 'fill', quality: 'auto' }) : null,
        type: req.file.mimetype,
        taille: req.file.size,
        cloudinaryId: result.public_id,
        dossier: folder,
        uploadePar: req.user.id,
      },
    });

    logger.info(`Media uploaded: ${media.nom} by ${req.user.email}`);
    res.json({ url: result.secure_url, media });
  } catch (err) {
    logger.error('Upload error:', err);
    next(err);
  }
});

// POST /api/media/upload-multiple
router.post('/upload-multiple', authenticate, upload.array('files', 20), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'Aucun fichier fourni.' });
    const { folder = 'galerie' } = req.body;

    const results = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, {
          folder: `glorysound/${folder}`,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        return prisma.mediaFile.create({
          data: {
            nom: file.originalname,
            url: result.secure_url,
            urlThumb: cloudinary.url(result.public_id, { width: 300, height: 300, crop: 'fill', quality: 'auto' }),
            type: file.mimetype,
            taille: file.size,
            cloudinaryId: result.public_id,
            dossier: folder,
            uploadePar: req.user.id,
          },
        });
      })
    );

    res.json({ uploaded: results.length, files: results });
  } catch (err) { next(err); }
});

// GET /api/media
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 30, type, dossier } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      ...(type ? { type: { contains: type } } : {}),
      ...(dossier ? { dossier } : {}),
    };
    const [files, total] = await Promise.all([
      prisma.mediaFile.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.mediaFile.count({ where }),
    ]);
    res.json({ data: files, meta: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// DELETE /api/media/:id
router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.EDITEUR), async (req, res, next) => {
  try {
    const media = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
    if (!media) return res.status(404).json({ error: 'Fichier introuvable.' });

    if (media.cloudinaryId) {
      await cloudinary.uploader.destroy(media.cloudinaryId).catch(() => {});
    }
    await prisma.mediaFile.delete({ where: { id: req.params.id } });
    res.json({ message: 'Fichier supprimé.' });
  } catch (err) { next(err); }
});

export default router;
