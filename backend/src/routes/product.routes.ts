import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getHomepageData,
  proxyProductImage,
  createReview,
} from '@/controllers/product.controller';
import { getProductGroup } from '@/controllers/productGroupController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Batch endpoint for homepage - should be called before individual endpoints
router.get('/batch/homepage', getHomepageData);

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/image/:fileId', proxyProductImage);
router.get('/group/:styleCode', getProductGroup);
router.get('/:id', getProductById);
router.get('/slug/:slug', getProductBySlug);
router.post('/:productId/reviews', authenticateToken, createReview);

export default router;
