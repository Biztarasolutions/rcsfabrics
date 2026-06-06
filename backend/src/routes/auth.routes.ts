import { Router } from 'express';
import { login, register, me, sendPhoneOTP, verifyPhoneOTP } from '@/controllers/auth.controller';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// OTP flow routes
router.post('/send-otp', sendPhoneOTP);
router.post('/verify-otp', verifyPhoneOTP);

// Registration and authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);

export default router;
