import { Router } from 'express';
import { login, register, me } from '@/controllers/auth.controller';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);

export default router;
