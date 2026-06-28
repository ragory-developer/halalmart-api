import { Router } from 'express';
import { BuilderController } from '../controllers/BuilderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const controller = new BuilderController();

/**
 * @swagger
 * tags:
 *   name: Builder
 *   description: Dynamic page builder and components
 */

/**
 * @swagger
 * /api/builder/public/{key}:
 *   get:
 *     summary: Get public page by key
 *     tags: [Builder]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page details
 */
router.get('/public/:key', controller.getPublicPage);

/**
 * @swagger
 * /api/builder/components:
 *   get:
 *     summary: Get all builder components
 *     tags: [Builder]
 *     responses:
 *       200:
 *         description: List of components
 *   post:
 *     summary: Register a new dynamic component (Admin only)
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Component registered
 */
router.get('/components', controller.getComponents);
router.post('/components', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.registerComponent);

/**
 * @swagger
 * /api/builder/packs:
 *   get:
 *     summary: Get all template packs
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of template packs
 */
router.get('/packs', authenticate, controller.getPacks);

/**
 * @swagger
 * /api/builder/templates:
 *   get:
 *     summary: Get all templates
 *     tags: [Builder]
 *     responses:
 *       200:
 *         description: List of templates
 *   post:
 *     summary: Create template (Admin only)
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Template created
 */
router.get('/templates', controller.getTemplates);
router.post('/templates', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.createTemplate);

/**
 * @swagger
 * /api/builder/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 *   delete:
 *     summary: Delete template (Admin only)
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted
 */
router.get('/templates/:id', controller.getTemplateById);
router.delete('/templates/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deleteTemplate);

/**
 * @swagger
 * /api/builder/pages/{key}/apply-template:
 *   post:
 *     summary: Apply template to page (Admin only)
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template applied
 */
router.post('/pages/:key/apply-template', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.applyTemplate);

/**
 * @swagger
 * /api/builder/pages:
 *   get:
 *     summary: Get all pages
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pages
 *   post:
 *     summary: Create new page
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Page created
 */
router.get('/pages', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.getPages);
router.post('/pages', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.createPage);

/**
 * @swagger
 * /api/builder/pages/{key}:
 *   delete:
 *     summary: Delete a page
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page deleted
 */
router.delete('/pages/:key', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deletePage);

/**
 * @swagger
 * /api/builder/pages/{key}:
 *   get:
 *     summary: Get admin page by key
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin page details
 */
router.get('/pages/:key', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.getAdminPage);

/**
 * @swagger
 * /api/builder/pages/{key}/draft:
 *   put:
 *     summary: Save page draft
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Draft saved
 */
router.put('/pages/:key/draft', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.saveDraft);

/**
 * @swagger
 * /api/builder/pages/{key}/publish:
 *   post:
 *     summary: Publish page
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page published
 */
router.post('/pages/:key/publish', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.publish);

/**
 * @swagger
 * /api/builder/pages/{key}/versions:
 *   get:
 *     summary: Get page versions
 *     tags: [Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of versions
 */
router.get('/pages/:key/versions', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.getVersions);

export default router;
