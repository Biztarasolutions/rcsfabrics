import { Router } from 'express';
import { loadCurrentRole, allowRoles, STAFF, MANAGERS } from '@/utils/roles';
import { trackAdminActivity } from '@/utils/activity';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts as getProducts,
  getAdminOrders as getOrders,
  updateOrderStatus,
  emailOrderToTeam,
  importFromDrive,
  setProductLive,
  getCancelledOrders,
  getDashboardStats,
  getCustomers,
  getCustomerDetail,
  getCoupons,
  createCoupon,
  updateCoupon,
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
  migrateProductCodes,
  getMyRole,
  setUserRole,
  getHistory,
  getProductPhotos,
  previewProduct,
} from '@/controllers/admin.controller';
import bulkEnquiryRouter from '@/routes/bulkEnquiry.routes';
import { createProductGroup } from '@/controllers/productGroupController';

const router = Router();

// Staff only (super admin, admin, employee). Role is re-read from the database each request.
router.use(loadCurrentRole, allowRoles(STAFF));
const managers = allowRoles(MANAGERS); // not for employees: orders, customers, dashboard, analytics, enquiries, coupons
const superAdmin = allowRoles(['SUPER_ADMIN']);

// Record every successful change made in the admin panel (History page)
router.use(trackAdminActivity);

router.get('/me', getMyRole);
router.get('/history', managers, getHistory);

// Product photos (Raw + customer photos) and customer-view preview — any staff
router.get('/products/preview/:slug', previewProduct);
router.get('/products/:id/photos', getProductPhotos);

// User roles — super admin only
router.patch('/users/:id/role', superAdmin, setUserRole);

// Product Management
router.post('/products/group', createProductGroup);
router.post('/products', createProduct);
router.get('/products', getProducts);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/import-drive', importFromDrive);
router.put('/products/:id/live', setProductLive);
router.post('/products/sync-all', syncAllProductImages);
router.post('/products/:id/sync', syncProductImages);
router.post('/products/migrate-codes', migrateProductCodes);

// Inventory Management
router.get('/inventory', getInventory);
router.patch('/products/:id/stock', adjustStock);

// Order Management
router.get('/orders/cancelled', managers, getCancelledOrders);
router.get('/orders', managers, getOrders);
router.put('/orders/:id', managers, updateOrderStatus);
router.post('/orders/:id/email-team', managers, emailOrderToTeam);

// Customer Management
router.get('/customers', managers, getCustomers);
router.get('/customers/:id', managers, getCustomerDetail);

// Dashboard
router.get('/dashboard/stats', managers, getDashboardStats);
router.get('/analytics', managers, getAnalytics);

// Coupon Management
router.get('/coupons', managers, getCoupons);
router.post('/coupons', managers, createCoupon);
router.patch('/coupons/:id', managers, updateCoupon);
router.delete('/coupons/:id', managers, deleteCoupon);

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
router.get('/settings', superAdmin, getSettings);
router.put('/settings/:key', superAdmin, updateSetting);

router.use('/bulk-enquiries', managers, bulkEnquiryRouter);
export default router;
