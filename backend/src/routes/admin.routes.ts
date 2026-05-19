import { Router } from 'express';
import { authorizeRole } from '@/middleware/auth';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts as getProducts,
  getAdminOrders as getOrders,
  updateOrderStatus,
  getDashboardStats,
  getCustomers,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  syncProductImages,
  syncAllProductImages,
} from '@/controllers/admin.controller';

const router = Router();

// Admin middleware
router.use(authorizeRole(['ADMIN']));

// Product Management
router.post('/products', createProduct);
router.get('/products', getProducts);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/sync-all', syncAllProductImages);
router.post('/products/:id/sync', syncProductImages);

// Order Management
router.get('/orders', getOrders);
router.put('/orders/:id', updateOrderStatus);

// Customer Management
router.get('/customers', getCustomers);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Coupon Management
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Category Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Banner Management
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

export default router;
