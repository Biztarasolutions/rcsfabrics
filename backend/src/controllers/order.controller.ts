import { Response } from 'express';
import { logOrderEvent } from '@/utils/activity';
import { cashfreeConfigured, createCashfreeOrder, getCashfreePaymentStatus, verifyCashfreeWebhook } from '@/utils/cashfree';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateOrderNumber, calculateOrderTotal } from '@/utils/order.util';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';
import { notifyOrder } from '@/services/orderNotifications';
import { saveAddressIfNew } from '@/services/addressService';

// Online payments go through Cashfree (see utils/cashfree.ts).

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
    const { items, shippingAddress, couponCode, utrReference } = req.body;
    // Online payments (card, UPI, net banking, wallets) all go through Cashfree.
    // "UPI" with a UTR reference is the manual bank-UPI transfer and stays as UPI.
    const requested = String(req.body.paymentMethod || '').toUpperCase();
    const paymentMethod =
      requested === 'COD' || requested === 'BANK_TRANSFER' ? requested
      : requested === 'UPI' && utrReference ? 'UPI'
      : requested ? 'CASHFREE' : undefined;
    if (paymentMethod === 'CASHFREE' && !cashfreeConfigured()) {
      throw new ApiError(503, 'Online payment is temporarily unavailable. Please choose Cash on Delivery or try again later.');
    }

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
          paymentMethod: (paymentMethod as any) || undefined,
          utrReference: utrReference || undefined,
        },
        include: { items: { include: { product: true } } },
      });
    });

    // Online payment: open a Cashfree payment session for this order
    let paymentSessionId: string | undefined;
    let cashfreeMode: string | undefined;
    if (paymentMethod === 'CASHFREE') {
      try {
        const session = await startCashfreeSession(order.id, req);
        paymentSessionId = session.paymentSessionId;
        cashfreeMode = session.mode;
      } catch (cfErr) {
        console.error('[Cashfree] Failed to create order:', cfErr);
      }
    }

    // Email customer + team now for COD / manual UPI; online payments are announced once paid
    if (paymentMethod !== 'CASHFREE') {
      void notifyOrder(order.id, 'placed');
      // COD / manual UPI: the order is placed now, so remember a new address now
      await saveAddressIfNew(req.userId!, shippingAddress);
    }

    void logOrderEvent(order.id, 'ORDER_PLACED', 'Order placed');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { ...order, paymentSessionId, cashfreeMode },
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

/**
 * Opens a fresh Cashfree payment session for an unpaid order (also used to retry
 * payment later from My Orders). Each attempt gets its own Cashfree order id.
 */
const startCashfreeSession = async (orderId: string, req: AuthRequest) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
  });
  if (!order) throw new ApiError(404, 'Order not found');
  const site = (process.env.FRONTEND_URL || 'https://rcsfabrics.com').split(',')[0].trim().replace(/\/$/, '');
  const api = `${req.protocol}://${req.get('host')}`;
  const cfOrderId = `${order.orderNumber}-${Date.now().toString(36)}`.slice(0, 45);
  const session = await createCashfreeOrder({
    cfOrderId,
    amount: order.total,
    customerId: order.userId,
    name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
    email: order.user?.email || undefined,
    phone: order.customerPhone || order.user?.phone,
    returnUrl: `${site}/account/orders/${order.id}?payment=return`,
    notifyUrl: `${api}/api/payments/cashfree/webhook`,
    note: `RCS Fabrics order ${order.orderNumber}`,
  });
  await prisma.order.update({ where: { id: order.id }, data: { cashfreeOrderId: session.cfOrderId, paymentMethod: 'CASHFREE' as any } });
  return { ...session, mode: (process.env.CASHFREE_ENV || 'production').toLowerCase() === 'sandbox' ? 'sandbox' : 'production' };
};

/** Marks an order paid exactly once (from the browser check or the Cashfree webhook) */
const markOrderPaid = async (orderId: string, paymentId?: string): Promise<boolean> => {
  const result = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: 'PAID' }, status: { not: 'CANCELLED' } },
    data: { paymentStatus: 'PAID', status: 'PROCESSING', cashfreePaymentId: paymentId || undefined, paidAt: new Date() },
  });
  if (result.count === 0) return false;
  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  void notifyOrder(orderId, 'paid');
  void logOrderEvent(orderId, 'PAYMENT_RECEIVED', 'Payment received for order');
  if (updated) await saveAddressIfNew(updated.userId, updated.shippingAddress);
  return true;
};

/** Asks Cashfree (server-side) whether the order's current payment session is paid */
const checkCashfreeOrder = async (order: { id: string; total: number; cashfreeOrderId: string | null }) => {
  if (!order.cashfreeOrderId) return { paid: false, status: 'NO_PAYMENT' };
  const st = await getCashfreePaymentStatus(order.cashfreeOrderId);
  if (st.paid && Math.abs(st.amount - order.total) > 0.5) {
    console.error(`[Cashfree] Amount mismatch for ${order.id}: paid ${st.amount}, order ${order.total}`);
    return { paid: false, status: 'AMOUNT_MISMATCH' };
  }
  if (st.paid) await markOrderPaid(order.id, st.paymentId);
  return { paid: st.paid, status: st.status };
};

/** POST /orders/:id/pay — new Cashfree session to (re)try paying an unpaid order */
export const payOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    if (!cashfreeConfigured()) throw new ApiError(503, 'Online payment is temporarily unavailable');
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.userId !== req.userId) throw new ApiError(403, 'Forbidden');
    if (order.paymentStatus === 'PAID') throw new ApiError(409, 'Order is already paid');
    if (order.status === 'CANCELLED') throw new ApiError(409, 'Order was cancelled');
    // If the previous attempt actually went through, don't charge again
    if (order.cashfreeOrderId) {
      const st = await checkCashfreeOrder(order);
      if (st.paid) throw new ApiError(409, 'Order is already paid');
    }
    const session = await startCashfreeSession(order.id, req);
    res.json({ success: true, data: { paymentSessionId: session.paymentSessionId, cashfreeMode: session.mode }, statusCode: 200 } as ApiResponse);
  } catch (error) {
    const code = error instanceof ApiError ? error.statusCode : 500;
    if (!(error instanceof ApiError)) console.error('[Cashfree] payOrder failed:', error);
    res.status(code).json({ success: false, message: error instanceof ApiError ? error.message : 'Could not start payment. Please try again.', statusCode: code } as ApiResponse);
  }
};

/** POST /orders/:id/verify — checks the payment with Cashfree (never trusts the browser) */
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.userId !== req.userId) throw new ApiError(403, 'Forbidden');
    if (order.paymentStatus !== 'PAID') await checkCashfreeOrder(order);
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    const paid = updated?.paymentStatus === 'PAID';
    res.json({ success: true, message: paid ? 'Payment verified' : 'Payment not completed', data: { ...updated, paid }, statusCode: 200 } as ApiResponse);
  } catch (error) {
    const code = error instanceof ApiError ? error.statusCode : 500;
    if (!(error instanceof ApiError)) console.error('[Cashfree] verify failed:', error);
    res.status(code).json({ success: false, message: error instanceof ApiError ? error.message : 'Could not check payment. Please refresh in a moment.', statusCode: code } as ApiResponse);
  }
};

/** POST /api/payments/cashfree/webhook — Cashfree tells us about payments (signed) */
export const cashfreeWebhook = async (req: any, res: Response): Promise<void> => {
  try {
    const raw: string = req.rawBody || '';
    if (!verifyCashfreeWebhook(raw, req.get('x-webhook-timestamp'), req.get('x-webhook-signature'))) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }
    const cfOrderId = req.body?.data?.order?.order_id;
    if (cfOrderId) {
      const order = await prisma.order.findUnique({ where: { cashfreeOrderId: String(cfOrderId) } });
      // Re-check with Cashfree rather than trusting the payload's status
      if (order && order.paymentStatus !== 'PAID') await checkCashfreeOrder(order);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Cashfree] webhook failed:', error);
    res.status(500).json({ success: false });
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
    if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
      throw new ApiError(400, 'Order cannot be cancelled after it has been shipped');
    }
    // Cancel first (only if not already cancelled/shipped) so stock is restored exactly once
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id, status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] } },
        data: { status: 'CANCELLED', cancelledBy: 'CUSTOMER' },
      });
      if (res.count === 0) throw new ApiError(400, 'Order cannot be cancelled');
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { totalStock: { increment: item.quantity } } });
      }
      return tx.order.findUnique({ where: { id } });
    });
    void logOrderEvent(id, 'ORDER_CANCELLED', 'Order cancelled by customer');
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
