import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import authRoutes from '@/routes/auth.routes';
import productRoutes from '@/routes/product.routes';
import orderRoutes from '@/routes/order.routes';
import userRoutes from '@/routes/user.routes';
import adminRoutes from '@/routes/admin.routes';
import cartRoutes from '@/routes/cart.routes';
import wishlistRoutes from '@/routes/wishlist.routes';

import { errorHandler, notFound } from '@/middleware/errorHandler';
import { authenticateToken } from '@/middleware/auth';
import { cacheMiddleware } from '@/middleware/cache';
import { driveProxyMiddleware } from '@/middleware/driveProxy';

const app: Express = express();
const port = process.env.PORT || 5000;

export const prisma = new PrismaClient();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);
app.use(driveProxyMiddleware);

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging
app.use(morgan('combined'));

// Cache Middleware - Cache all GET requests
app.use('/api/', cacheMiddleware);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public settings (no auth) — returns only payment config keys safe for frontend
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['payment_upi_enabled', 'payment_cod_enabled', 'payment_razorpay_enabled', 'upi_id', 'upi_name'] } },
    });
    const map: Record<string, string> = { payment_upi_enabled: 'true', payment_cod_enabled: 'true', payment_razorpay_enabled: 'true', upi_id: 'MAB0450543A0000066@Yesbank', upi_name: 'Rajasthan Cloth Store' };
    rows.forEach((r: any) => { map[r.key] = r.value; });
    res.json({ success: true, data: map });
  } catch { res.json({ success: true, data: { payment_upi_enabled: 'true', payment_cod_enabled: 'true', payment_razorpay_enabled: 'true', upi_id: 'MAB0450543A0000066@Yesbank', upi_name: 'Rajasthan Cloth Store' } }); }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/cart', authenticateToken, cartRoutes);
app.use('/api/wishlist', authenticateToken, wishlistRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`⚡ Server is running at http://localhost:${port}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
