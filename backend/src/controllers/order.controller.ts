import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateOrderNumber, calculateOrderTotal } from '@/utils/order.util';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';
import { notifyOrder } from '@/services/orderNotifications';
import { saveAddressIfNew } from '@/services/addressService';

// Lazily create the Razorpay client. The Razorpay constructor throws if keys are missing,
// so constructing at module load time crashes the entire server when env vars aren't set.
// Initialize on first use instead, and surface a clean error rather than a boot crash.
let razorpayClient: InstanceType<typeof Razorpay> | null = null;
const getRazorpay = (): InstanceType<typeof Razorpay> => {
  if (!razorpayClient) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(503, 'Online payments are not configured. Please contact support or use another payment method.');
    }
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

import {
  MIN_QTY, MAX_QTY_PER_LINE, roundMoney, isHalfMetreStep, calculateShipping, couponDiscount,
} from '@/utils/pricing';
export { calculateShipping };

/** Load a coupon and check it is usable for this subtotal; returns the discount in ₹. */
const getValidCoupon = async (code: string, subtotal: number) => {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!coupon || !coupon.isActive || coupon.startsAt > now || coupon.expiresAt < now) {
    throw new ApiError(400, 'Invalid or expired coupon code');
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(400, 'This coupon has reached its usage limit');
  }
  const minOrder = coupon.minOrderAmount ?? 0;
  if (subtotal < minOrder) {
    throw new ApiError(400, `Minimum order of ₹${minOrder} required for this coupon`);
  }
  const discount = couponDiscount(subtotal, coupon);
  return { coupon, discount };
};

export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    // shippingCost / tax from the client are deliberately ignored — the server prices the order.
    const { items, shippingAddress, couponCode, paymentMethod, utrReference } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'Order must contain at least one item');
    }
    if (items.length > 50) {
      throw new ApiError(400, 'Too many items in one order');
    }
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      throw new ApiError(400, 'Shipping address is required');
    }

    // Merge duplicate lines and validate quantities (metres, 0.5 m steps)
    const qtyByProduct = new Map<string, number>();
    for (const item of items) {
      const productId = String(item?.productId || '');
      const qty = Number(item?.quantity);
      if (!productId) throw new ApiError(400, 'Each item needs a productId');
      if (!Number.isFinite(qty) || qty <= 0 || qty > MAX_QTY_PER_LINE || !isHalfMetreStep(qty)) {
        throw new ApiError(400, 'Quantity must be in 0.5 m steps (e.g. 0.5, 1, 1.5)');
      }
      qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + qty);
    }

    // Build order items from DB prices (never trust client prices)
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const [productId, qty] of qtyByProduct) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true, name: true, color: true, basePrice: true, discountPrice: true,
          totalStock: true, minOrderQty: true, isActive: true,
        },
      });
      if (!product || !product.isActive) throw new ApiError(400, 'A product in your cart is no longer available');

      const minQty = product.minOrderQty || MIN_QTY;
      if (qty < minQty) {
        throw new ApiError(400, `Minimum order for ${product.name} is ${minQty} m`);
      }
      if (qty > product.totalStock) {
        throw new ApiError(409, `Only ${product.totalStock} m of ${product.name} left in stock`);
      }

      const price = product.discountPrice || product.basePrice;
      const itemTotal = roundMoney(price * qty);
      subtotal = roundMoney(subtotal + itemTotal);

      const mainImg = await prisma.productImage.findFirst({
        where: { productId: product.id, isMain: true },
        select: { url: true },
      }) || await prisma.productImage.findFirst({
        where: { productId: product.id },
        select: { url: true },
      });

      orderItems.push({
        productId: product.id,
        productName: product.color && !product.name.toLowerCase().includes(product.color.toLowerCase())
          ? `${product.name} — ${product.color}`
          : product.name,
        productImage: mainImg?.url || null,
        quantity: qty,
        pricePerMeter: price,
        total: itemTotal,
      });
    }

    // Coupon: re-validated here (active, dates, usage limit, minimum order)
    let discountAmount = 0;
    let appliedCoupon: { id: string; code: string } | null = null;
    if (couponCode) {
      const result = await getValidCoupon(String(couponCode), subtotal);
      discountAmount = result.discount;
      appliedCoupon = { id: result.coupon.id, code: result.coupon.code };
    }

    // Server-side shipping and tax
    const shippingCost = calculateShipping(subtotal);
    const tax = 0; // prices are GST-inclusive
    const total = roundMoney(calculateOrderTotal(subtotal, shippingCost, tax, discountAmount));

    const orderNumber = await generateOrderNumber(prisma);

    // Phone for this order: the delivery address phone, else the account's current phone
    const account = await prisma.user.findUnique({ where: { id: req.userId! }, select: { phone: true } });
    const orderPhone = String(shippingAddress?.phone || account?.phone || '').replace(/\s+/g, '').slice(0, 20);

    // Create the order, deduct stock and count the coupon atomically.
    // Stock is decremented only if enough is left, so concurrent orders can't oversell.
    const order = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, totalStock: { gte: item.quantity } },
          data: { totalStock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new ApiError(409, `${item.productName} just sold out — please update your cart`);
        }
      }

      if (appliedCoupon) {
        const c = await tx.coupon.findUnique({ where: { id: appliedCoupon.id } });
        if (c?.maxUses != null && c.usedCount >= c.maxUses) {
          throw new ApiError(400, 'This coupon has reached its usage limit');
        }
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId: req.userId!,
          shippingAddress: JSON.stringify(shippingAddress),
          customerPhone: orderPhone || undefined,
          items: { createMany: { data: orderItems } },
          subtotal,
          shippingCost,
          tax,
          discountAmount,
          couponCode: appliedCoupon?.code,
          total,
          paymentMethod: paymentMethod || undefined,
          utrReference: utrReference || undefined,
        },
        include: { items: { include: { product: true } } },
      });
    });

    // Create Razorpay order for online payments (RAZORPAY or UPI)
    let razorpayOrderId: string | undefined;
    if (paymentMethod === 'RAZORPAY' || paymentMethod === 'UPI') {
      try {
        const rzOrder = await getRazorpay().orders.create({
          amount: Math.round(total * 100),
          currency: 'INR',
          receipt: order.orderNumber,
          notes: { orderId: order.id },
        });
        razorpayOrderId = rzOrder.id as string;
        await prisma.order.update({
          where: { id: order.id },
          data: { razorpayOrderId },
        });
      } catch (rzErr) {
        console.error('[Razorpay] Failed to create order:', rzErr);
      }
    }

    // Email customer + team now for COD / manual UPI; online payments are announced once verified
    if (!razorpayOrderId || utrReference) {
      void notifyOrder(order.id, 'placed');
      // COD / manual UPI: the order is placed now, so remember a new address now
      await saveAddressIfNew(req.userId!, shippingAddress);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { ...order, razorpayOrderId },
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const getOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { page, limit } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      page as string,
      limit as string
    );

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.userId },
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parsedLimit,
      }),
      prisma.order.count({ where: { userId: req.userId } }),
    ]);

    const meta = createPaginationMeta(total, parsedPage, parsedLimit);

    res.json({
      success: true,
      message: 'Orders retrieved',
      data: {
        orders,
        ...meta,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const verifyPayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');

    const { id } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new ApiError(503, 'Online payments are not configured');
    }
    if (
      typeof razorpayOrderId !== 'string' || !razorpayOrderId ||
      typeof razorpayPaymentId !== 'string' || !razorpayPaymentId ||
      typeof razorpaySignature !== 'string' || !razorpaySignature
    ) {
      throw new ApiError(400, 'Missing payment details');
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.userId !== req.userId) throw new ApiError(403, 'Forbidden');
    if (order.paymentStatus === 'PAID') throw new ApiError(409, 'Order is already paid');
    if (order.status === 'CANCELLED') throw new ApiError(409, 'Order was cancelled');

    // The payment must belong to the Razorpay order we created for THIS order,
    // otherwise a valid signature from a cheaper order could be replayed here.
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      throw new ApiError(400, 'Payment does not match this order');
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const givenBuf = Buffer.from(razorpaySignature, 'utf8');
    if (expectedBuf.length !== givenBuf.length || !crypto.timingSafeEqual(expectedBuf, givenBuf)) {
      throw new ApiError(400, 'Payment signature verification failed');
    }

    // Conditional update so two concurrent verify calls can't both succeed
    const result = await prisma.order.updateMany({
      where: { id, paymentStatus: { not: 'PAID' } },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        razorpayPaymentId,
        paidAt: new Date(),
      },
    });
    if (result.count === 0) throw new ApiError(409, 'Order is already paid');
    const updated = await prisma.order.findUnique({ where: { id } });
    void notifyOrder(id, 'paid');
    // Online payment succeeded — remember a new delivery address for next time
    if (updated) await saveAddressIfNew(updated.userId, updated.shippingAddress);

    res.json({ success: true, message: 'Payment verified', data: updated, statusCode: 200 } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};

export const getOrderById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.userId !== req.userId) {
      throw new ApiError(403, 'Forbidden');
    }

    res.json({
      success: true,
      message: 'Order retrieved',
      data: order,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const cancelOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.userId !== req.userId) throw new ApiError(403, 'Forbidden');
    if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new ApiError(400, 'Order cannot be cancelled after it has been shipped');
    }
    // Cancel first (only if not already cancelled/shipped) so stock is restored exactly once
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id, status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] } },
        data: { status: 'CANCELLED', cancelledBy: 'CUSTOMER' },
      });
      if (res.count === 0) throw new ApiError(400, 'Order cannot be cancelled');
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { totalStock: { increment: item.quantity } } });
      }
      return tx.order.findUnique({ where: { id } });
    });
    res.json({ success: true, message: 'Order cancelled', data: updated, statusCode: 200 } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};

export const validateCoupon = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    const { code, amount } = req.body;
    if (!code) throw new ApiError(400, 'Coupon code is required');

    const subtotal = Number(amount);
    if (!Number.isFinite(subtotal) || subtotal < 0) throw new ApiError(400, 'Invalid order amount');
    const { coupon, discount: finalDiscount } = await getValidCoupon(String(code), subtotal);

    res.json({
      success: true,
      data: { code: coupon.code, type: coupon.discountType === 'PERCENTAGE' ? 'PERCENT' : 'FIXED', value: coupon.discountValue, discount: finalDiscount },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};
