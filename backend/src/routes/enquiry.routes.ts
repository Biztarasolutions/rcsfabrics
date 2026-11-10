import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createEnquiry } from '@/controllers/enquiry.controller';

const router = Router();

// 5 messages per visitor per hour is plenty for real people, stops spam floods
const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.ENQUIRY_RATE_LIMIT_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again later or WhatsApp us.', statusCode: 429 },
});

router.post('/', enquiryLimiter, createEnquiry);

export default router;
