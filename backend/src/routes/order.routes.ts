import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  verifyPayment,
  payOrder,
  cancelOrder,
  validateCoupon,
} from '@/controllers/order.controller';

const router = Router();

router.post('/validate-coupon', validateCoupon);
router.post('/', createOrder);
router.get('/', getOrders);
router.post('/:id/verify', verifyPayment);
router.post('/:id/pay', payOrder);
router.post('/:id/cancel', cancelOrder);
router.get('/:id', getOrderById);

export default router;
