import { Router } from 'express';
import {
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getUserReviews,
  requestContactOTP,
  verifyContactOTP,
} from '@/controllers/user.controller';

const router = Router();

router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.get('/reviews', getUserReviews);
router.post('/request-contact-otp', requestContactOTP);
router.post('/verify-contact-otp', verifyContactOTP);

export default router;
