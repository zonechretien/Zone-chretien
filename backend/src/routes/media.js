// src/routes/media.js
import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../config/database.js';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const isCloudinaryOk = () => !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3', 'video/mp4'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
  },
});

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(buffer);
  });

const saveLocally = (buffer, originalname) => {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const ext = path.extname(originalname);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return filename;
};

// POST /api/media/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni.' });

    const { folder = 'glorysound' } = req.body;
    const isImage = req.file.mimetype.startsWith('image/');
    const isAudio = req.file.mimetype.startsWith('audio/');

    let url, thumbUrl = null, cloudinaryId = null;

    if (isCloudinaryOk()) {
      let result;
      if (isImage) {
        result = await uploadToCloudinary(req.file.buffer, {
          folder: `glorysound/${folder}`,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        thumbUrl = cloudinary.url(result.public_id, { width: 300, height: 300, crop: 'fill', quality: 'auto' });
      } else if (isAudio) {
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
      url = result.secure_url;
      cloudinaryId = result.public_id;
      logger.info(`Cloudinary upload: ${url}`);
    } else {
      const filename = saveLocally(req.file.buffer, req.file.originalname);
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
      url = `${baseUrl}/uploads/${filename}`;
      logger.info(`Local upload (Cloudinary not configured): ${filename}`);
    }

    const media = await prisma.mediaFile.create({
      data: {
        nom: req.file.originalname,
        url,
        urlThumb: thumbUrl,
        type: req.file.mimetype,
        taille: req.file.size,
        cloudinaryId,
        dossier: folder,
        uploadePar: req.user.id,
      },
    });

    res.json({ url, media });
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
        let url, thumbUrl = null, cloudinaryId = null;

        if (isCloudinaryOk()) {
          const result = await uploadToCloudinary(file.buffer, {
            folder: `glorysound/${folder}`,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          });
          url = result.secure_url;
          cloudinaryId = result.public_id;
          thumbUrl = cloudinary.url(result.public_id, { width: 300, height: 300, crop: 'fill', quality: 'auto' });
        } else {
          const filename = saveLocally(file.buffer, file.originalname);
          const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
          url = `${baseUrl}/uploads/${filename}`;
        }

        return prisma.mediaFile.create({
          data: {
            nom: file.originalname,
            url,
            urlThumb: thumbUrl,
            type: file.mimetype,
            taille: file.size,
            cloudinaryId,
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
    } else {
      // Local file cleanup
      const localPath = path.join(UPLOADS_DIR, path.basename(media.url));
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }
    await prisma.mediaFile.delete({ where: { id: req.params.id } });
    res.json({ message: 'Fichier supprimé.' });
  } catch (err) { next(err); }
});

export default router;
