import { Router } from 'express';
import { NavigationController } from '../controllers/NavigationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const controller = new NavigationController();

/**
 * @swagger
 * tags:
 *   name: Navigation
 *   description: Navbar and Footer management
 */

// --- Navbar APIs ---
/**
 * @swagger
 * /api/navigation/navbar:
 *   get:
 *     summary: Get navbar items
 *     tags: [Navigation]
 *     responses:
 *       200:
 *         description: Navbar items
 *   post:
 *     summary: Create navbar item
 *     tags: [Navigation]
 *     responses:
 *       201:
 *         description: Navbar item created
 */
router.get('/navbar', controller.getNavbar);
router.post('/navbar', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.createNavbarItem);

/**
 * @swagger
 * /api/navigation/navbar/{id}:
 *   put:
 *     summary: Update navbar item
 *     tags: [Navigation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item updated
 *   delete:
 *     summary: Delete navbar item
 *     tags: [Navigation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted
 */
router.put('/navbar/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.updateNavbarItem);
router.delete('/navbar/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deleteNavbarItem);

/**
 * @swagger
 * /api/navigation/navbar/reorder:
 *   patch:
 *     summary: Reorder navbar items
 *     tags: [Navigation]
 *     responses:
 *       200:
 *         description: Items reordered
 */
router.patch('/navbar/reorder', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.reorderNavbar);

/**
 * @swagger
 * /api/navigation/navbar/{id}/status:
 *   patch:
 *     summary: Toggle navbar item status
 *     tags: [Navigation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/navbar/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.toggleNavbarStatus);

// --- Footer Section APIs ---
/**
 * @swagger
 * /api/navigation/footer/sections:
 *   get:
 *     summary: Get footer sections
 *     tags: [Navigation]
 *     responses:
 *       200:
 *         description: Footer sections
 *   post:
 *     summary: Create footer section
 *     tags: [Navigation]
 *     responses:
 *       201:
 *         description: Section created
 */
router.get('/footer/sections', controller.getFooterSections);
router.post('/footer/sections', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.createFooterSection);

/**
 * @swagger
 * /api/navigation/footer/sections/{id}:
 *   put:
 *     summary: Update footer section
 *     tags: [Navigation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section updated
 *   delete:
 *     summary: Delete footer section
 *     tags: [Navigation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section deleted
 */
router.put('/footer/sections/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.updateFooterSection);
router.delete('/footer/sections/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deleteFooterSection);

/**
 * @swagger
 * /api/navigation/footer/sections/reorder:
 *   patch:
 *     summary: Reorder footer sections
 *     tags: [Navigation]
 *     responses:
 *       200:
 *         description: Sections reordered
 */
router.patch('/footer/sections/reorder', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.reorderFooterSections);

// --- Footer Link APIs ---
/**
 * @swagger
 * /api/navigation/footer/links:
 *   get:
 *     summary: Get footer links
 *     tags: [Navigation]
 *     responses:
 *       200:
 *         description: Footer links
 *   post:
 *     summary: Create footer link
 *     tags: [Navigation]
 *     responses:
 *       201:
 *         description: Link created
 */
router.get('/footer/links', controller.getFooterLinks);
router.post('/footer/links', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.createFooterLink);

/**
 * @swagger
 * /api/navigation/footer/links/{id}:
 *   put:
 *     summary: Update footer link
 *     tags: [Navigation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Link updated
 *   delete:
 *     summary: Delete footer link
 *     tags: [Navigation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Link deleted
 */
router.put('/footer/links/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.updateFooterLink);
router.delete('/footer/links/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deleteFooterLink);

/**
 * @swagger
 * /api/navigation/footer/links/reorder:
 *   patch:
 *     summary: Reorder footer links
 *     tags: [Navigation]
 *     responses:
 *       200:
 *         description: Links reordered
 */
router.patch('/footer/links/reorder', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.reorderFooterLinks);

export default router;
