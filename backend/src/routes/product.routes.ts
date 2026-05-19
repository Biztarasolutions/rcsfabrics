import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getHomepageData,
} from '@/controllers/product.controller';

const router = Router();

// Batch endpoint for homepage - should be called before individual endpoints
router.get('/batch/homepage', getHomepageData);

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/:id', getProductById);
router.get('/slug/:slug', getProductBySlug);

export default router;
