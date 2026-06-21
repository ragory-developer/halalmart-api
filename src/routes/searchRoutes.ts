import { Router } from 'express';
import { searchController } from '../controllers/SearchController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get dynamic trending search terms
router.get('/trending', searchController.getTrending);

// Public search endpoint
router.get('/', searchController.search);

// Admin endpoint to reindex all products
router.post('/reindex', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), searchController.reindexAll);

export default router;
