import { Router } from 'express';
import {
  directExtractDocument,
  explainDocumentText,
  explainDocumentStreamApi,
  detectDiscrepancyApi,
} from '../controllers/ai.controller';

const router = Router();

router.post('/extract-document', directExtractDocument);
router.post('/explain-document', explainDocumentText);
router.post('/explain-document/stream', explainDocumentStreamApi);
router.post('/detect-discrepancy', detectDiscrepancyApi);

export default router;
