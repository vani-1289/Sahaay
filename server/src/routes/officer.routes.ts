import { Router } from 'express';
import {
  getOfficerDashboard,
  getOfficerCases,
  getOfficerGrievances,
  updateCaseStage,
  updateGrievanceStatus,
} from '../controllers/officer.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('OFFICER', 'ADMIN'));

router.get('/dashboard', getOfficerDashboard);
router.get('/cases', getOfficerCases);
router.get('/grievances', getOfficerGrievances);

// Support both path patterns for maximum client compatibility
router.patch('/cases/:id', updateCaseStage);
router.patch('/cases/:id/stage', updateCaseStage);

router.patch('/grievances/:id', updateGrievanceStatus);
router.patch('/grievances/:id/status', updateGrievanceStatus);

export default router;
