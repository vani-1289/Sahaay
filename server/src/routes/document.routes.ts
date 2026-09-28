import { Router } from 'express';
import { uploadAndAnalyzeDocument, getDocumentById, getUserDocuments } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadLimiter, uploadMiddleware.single('file'), uploadAndAnalyzeDocument);
router.get('/my', getUserDocuments);
router.get('/:id', getDocumentById);

export default router;
