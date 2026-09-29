import { Router } from 'express';
import {
  searchParcels,
  getParcelById,
  getParcelCases,
  interactWithParcel,
} from '../controllers/parcel.controller';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/search', optionalAuthenticate, searchParcels);
router.get('/:id', optionalAuthenticate, getParcelById);
router.get('/:id/cases', optionalAuthenticate, getParcelCases);
router.post('/:id/interact', optionalAuthenticate, interactWithParcel);
router.patch('/:id', optionalAuthenticate, interactWithParcel);

export default router;
