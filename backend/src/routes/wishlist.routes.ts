import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  removeProductFromWishlist,
} from '@/controllers/wishlist.controller';

const router = Router();

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/product/:productId', removeProductFromWishlist);
router.delete('/:id', removeFromWishlist);

export default router;
