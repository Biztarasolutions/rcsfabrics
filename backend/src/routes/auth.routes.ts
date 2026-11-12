import { Router } from 'express';
import { login, register, me, sendPhoneOTP, verifyPhoneOTP, sendLoginOTP, sendSignupOTP, verifySignupOTP } from '@/controllers/auth.controller';
import { authenticateToken } from '@/middleware/auth';
import { forgotPassword, resetPassword } from '@/controllers/password.controller';

const router = Router();

// OTP flow routes
router.post('/send-otp', sendSignupOTP);      // sign-up: code by email
router.post('/verify-otp', verifySignupOTP);
router.post('/send-phone-otp', sendPhoneOTP); // kept for when SMS is set up
router.post('/verify-phone-otp', verifyPhoneOTP);
router.post('/login-otp/send', sendLoginOTP);

// Registration and authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, me);

export default router;
