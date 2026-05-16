import { PrismaClient, OrderStatus } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { productService } from './productService';

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

function generateOrderNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 90000) + 10000;
  return `RCS-${y}-${r}`;
}

export class OrderService {
  // ── Create order ──────────────────────────────────────────────────────
  async createOrder(userId: string, data: {
    items: { productId: string; quantity: number; pricePerMeter: number }[];
    shippingAddressId: string;
    couponCode?: string;
    paymentMethod: 'RAZORPAY' | 'COD';
    notes?: string;
  }) {
    // 1. Validate products & check stock
    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      if (!product.isActive) throw new Error(`Product not available: ${product.name}`);
      if (product.totalStock < item.quantity) throw new Error(`Insufficient stock for: ${product.name}`);
    }

    // 2. Calculate totals
    let subtotal = data.items.reduce((s, i) => s + i.quantity * i.pricePerMeter, 0);
    let discount = 0;
    let couponId: string | undefined;

    // 3. Apply coupon
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode } });
      if (coupon && coupon.isActive && new Date(coupon.expiresAt) > new Date()) {
        if (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount)) {
          if (!coupon.maxUses || coupon.usedCount < coupon.maxUses) {
            if (coupon.discountType === 'PERCENTAGE') discount = (subtotal * coupon.discountValue) / 100;
            else if (coupon.discountType === 'FIXED') discount = Math.min(coupon.discountValue, subtotal);
            couponId = coupon.id;
          }
        }
      }
    }

    const shipping = (subtotal - discount) >= 2000 ? 0 : 150;
    const total = subtotal - discount + shipping;

    // 4. Create order in DB
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: data.paymentMethod,
        subtotal,
        discountAmount: discount,
        shippingCost: shipping,
        total,
        shippingAddressId: data.shippingAddressId,
        couponCode: data.couponCode,
        notes: data.notes,
        items: {
          create: await Promise.all(data.items.map(async (i) => {
            const product = await prisma.product.findUnique({
              where: { id: i.productId },
              include: { images: true },
            });
            return {
              productId: i.productId,
              productName: product?.name || 'Unknown Product',
              productImage: product?.images?.[0]?.url || null,
              quantity: i.quantity,
              pricePerMeter: i.pricePerMeter,
              total: i.quantity * i.pricePerMeter,
            };
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // 5. Create Razorpay order (if not COD)
    if (data.paymentMethod === 'RAZORPAY') {
      const rzOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderId: order.id },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: rzOrder.id as string },
      });

      return { order, razorpayOrder: rzOrder };
    }

    // 6. COD: mark as CONFIRMED directly
    const confirmed = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PROCESSING' },
      include: { items: { include: { product: true } } },
    });

    // 7. Deduct stock
    for (const item of data.items) {
      await productService.updateStock(item.productId, item.quantity);
    }

    // 8. Increment coupon usage
    if (couponId) {
      await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    return { order: confirmed };
  }

  // ── Verify Razorpay payment ───────────────────────────────────────────
  async verifyPayment(orderId: string, data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== data.razorpaySignature) {
      throw new Error('Payment signature verification failed');
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error('Order not found');

    // Update order to paid
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        razorpayPaymentId: data.razorpayPaymentId,
        paidAt: new Date(),
      },
    });

    // Deduct stock
    for (const item of order.items) {
      await productService.updateStock(item.productId, item.quantity);
    }

    return updated;
  }

  // ── Get user orders ───────────────────────────────────────────────────
  async getUserOrders(userId: string, page = 1, limit = 10) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: { product: { include: { images: { take: 1 } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { orders, total, pages: Math.ceil(total / limit) };
  }

  // ── Get single order ──────────────────────────────────────────────────
  async getOrderById(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!order) throw new Error('Order not found');
    if (userId && order.userId !== userId) throw new Error('Unauthorized');
    return order;
  }

  // ── Admin: get all orders ─────────────────────────────────────────────
  async getAllOrders(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const where: any = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, pages: Math.ceil(total / limit) };
  }

  // ── Admin: update order status ────────────────────────────────────────
  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(trackingNumber && { trackingNumber }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
    });
  }

  // ── Validate coupon ───────────────────────────────────────────────────
  async validateCoupon(code: string, orderTotal: number) {
    const coupon = await prisma.coupon.findUnique({ where: { code, isActive: true } });
    if (!coupon) throw new Error('Invalid coupon code');
    if (new Date(coupon.expiresAt) < new Date()) throw new Error('Coupon has expired');
    if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
      throw new Error(`Minimum order of ₹${coupon.minOrderAmount} required`);
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new Error('Coupon usage limit reached');
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') discount = (orderTotal * coupon.discountValue) / 100;
    else if (coupon.discountType === 'FIXED') discount = Math.min(coupon.discountValue, orderTotal);

    return { coupon, discount };
  }
}

export const orderService = new OrderService();
