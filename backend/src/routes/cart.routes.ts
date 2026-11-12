import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  setCartQuantity,
} from '@/controllers/cart.controller';

const router = Router();

router.get('/', getCart);
router.post('/', addToCart);
router.put('/product/:productId', setCartQuantity);
router.put('/:id', updateCartItem);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

export default router;
