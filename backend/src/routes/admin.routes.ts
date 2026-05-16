import { Router } from 'express';
import { authorizeRole } from '@/middleware/auth';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getAdminOrders,
  updateOrderStatus,
  getDashboardStats,
  getCoupons,
  createCoupon,
  deleteCoupon,
} from '@/controllers/admin.controller';

const router = Router();

// Admin middleware
router.use(authorizeRole(['ADMIN']));

// Product Management
router.post('/products', createProduct);
router.get('/products', getAdminProducts);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Order Management
router.get('/orders', getAdminOrders);
router.put('/orders/:id', updateOrderStatus);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Coupon Management
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

export default router;
