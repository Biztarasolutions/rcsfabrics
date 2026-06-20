import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  verifyPayment,
} from '@/controllers/order.controller';

const router = Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.post('/:id/verify', verifyPayment);
router.get('/:id', getOrderById);

export default router;
