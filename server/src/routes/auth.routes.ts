import { Router } from 'express';
import { register, login, getMe, verifyPan, verifyFace } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { authLimiter, uploadLimiter } from '../middleware/rateLimiter';
import { autoSeedDatabase } from '../services/seedService';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.post('/verify-pan', authLimiter, verifyPan);
router.post(
  '/verify-face',
  uploadLimiter,
  uploadMiddleware.fields([
    { name: 'panDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  verifyFace
);

router.post('/seed-demo', async (req, res) => {
  const result = await autoSeedDatabase();
  res.json({ success: result.seeded, message: result.message });
});

router.get('/seed-demo', async (req, res) => {
  const result = await autoSeedDatabase();
  res.json({ success: result.seeded, message: result.message });
});

export default router;
