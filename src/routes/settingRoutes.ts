import { Router } from 'express';
import { SettingController } from '../controllers/SettingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const controller = new SettingController();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Global app settings
 */

/**
 * @swagger
 * /api/global-settings/home-page:
 *   get:
 *     summary: Get home page settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Home page settings
 *   put:
 *     summary: Update home page settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Home page settings updated
 */
router.get('/home-page', controller.getHomePage);
router.put('/home-page', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.updateHomePage);

/**
 * @swagger
 * /api/global-settings:
 *   get:
 *     summary: Get all global settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: All settings
 *   post:
 *     summary: Update global settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.get('/', controller.getAll);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.update);

export default router;
