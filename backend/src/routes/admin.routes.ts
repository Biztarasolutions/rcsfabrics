import { Router } from 'express';
import { authorizeRole } from '@/middleware/auth';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts as getProducts,
  getAdminOrders as getOrders,
  updateOrderStatus,
  getCancelledOrders,
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
  getInventory,
  adjustStock,
  getSettings,
  updateSetting,
  getAnalytics,
} from '@/controllers/admin.controller';
import bulkEnquiryRouter from '@/routes/bulkEnquiry.routes';
import { createProductGroup } from '@/controllers/productGroupController';

const router = Router();

// Admin middleware
router.use(authorizeRole(['ADMIN']));

// Product Management
router.post('/products/group', createProductGroup);
router.post('/products', createProduct);
router.get('/products', getProducts);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/sync-all', syncAllProductImages);
router.post('/products/:id/sync', syncProductImages);

// Inventory Management
router.get('/inventory', getInventory);
router.patch('/products/:id/stock', adjustStock);

// Order Management
router.get('/orders/cancelled', getCancelledOrders);
router.get('/orders', getOrders);
router.put('/orders/:id', updateOrderStatus);

// Customer Management
router.get('/customers', getCustomers);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

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

// Settings Management
router.get('/settings', getSettings);
router.put('/settings/:key', updateSetting);

router.use('/bulk-enquiries', bulkEnquiryRouter);
export default router;
