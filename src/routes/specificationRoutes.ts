import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createSpecification,
  createSpecificationValue,
  deleteSpecification,
  deleteSpecificationValue,
  getSpecifications,
  updateSpecification,
  updateSpecificationValue
} from '../controllers/SpecificationController';

const router = Router();

// --- Specifications ---
router.get('/', getSpecifications);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createSpecification);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateSpecification);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteSpecification);

// --- Specification Values ---
router.post('/:specificationId/values', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createSpecificationValue);
router.put('/:specificationId/values/:valueId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateSpecificationValue);
router.delete('/:specificationId/values/:valueId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteSpecificationValue);

export default router;
