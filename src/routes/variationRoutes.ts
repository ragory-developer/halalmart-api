import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createVariation,
  createVariationValue,
  deleteVariation,
  deleteVariationValue,
  getVariations,
  updateVariation,
  updateVariationValue
} from '../controllers/VariationController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Variations
 *   description: Product variations and attributes
 */

// --- Variations ---
/**
 * @swagger
 * /api/variations:
 *   get:
 *     summary: Get all variations
 *     tags: [Variations]
 *     responses:
 *       200:
 *         description: List of variations
 *   post:
 *     summary: Create variation
 *     tags: [Variations]
 *     responses:
 *       201:
 *         description: Variation created
 */
router.get('/', getVariations);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createVariation);

/**
 * @swagger
 * /api/variations/{id}:
 *   put:
 *     summary: Update variation
 *     tags: [Variations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variation updated
 *   delete:
 *     summary: Delete variation
 *     tags: [Variations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variation deleted
 */
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateVariation);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteVariation);

// --- Variation Values ---
/**
 * @swagger
 * /api/variations/{variationId}/values:
 *   post:
 *     summary: Create variation value
 *     tags: [Variations]
 *     parameters:
 *       - in: path
 *         name: variationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Variation value created
 */
router.post('/:variationId/values', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createVariationValue);

/**
 * @swagger
 * /api/variations/{variationId}/values/{valueId}:
 *   put:
 *     summary: Update variation value
 *     tags: [Variations]
 *     parameters:
 *       - in: path
 *         name: variationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: valueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variation value updated
 *   delete:
 *     summary: Delete variation value
 *     tags: [Variations]
 *     parameters:
 *       - in: path
 *         name: variationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: valueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variation value deleted
 */
router.put('/:variationId/values/:valueId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateVariationValue);
router.delete('/:variationId/values/:valueId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteVariationValue);

export default router;
