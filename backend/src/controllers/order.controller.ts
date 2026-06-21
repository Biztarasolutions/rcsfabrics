import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateOrderNumber, calculateOrderTotal } from '@/utils/order.util';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';

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

export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { items, shippingAddress, shippingCost, tax, couponCode, paymentMethod, utrReference } = req.body;

    if (!items || items.length === 0) {
      throw new ApiError(400, 'Order must contain at least one item');
    }

    // Build order items from the request body (frontend Zustand cart)
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, basePrice: true, discountPrice: true, totalStock: true },
      });
      if (!product) throw new ApiError(400, `Product ${item.productId} not found`);

      // Use price from DB (ignore client-sent price to prevent tampering)
      const price = product.discountPrice || product.basePrice;
      const qty = parseFloat(item.quantity);
      const itemTotal = price * qty;
      subtotal += itemTotal;

      // Fetch main product image
      const mainImg = await prisma.productImage.findFirst({
        where: { productId: product.id, isMain: true },
        select: { url: true },
      }) || await prisma.productImage.findFirst({
        where: { productId: product.id },
        select: { url: true },
      });

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: mainImg?.url || null,
        quantity: qty,
        pricePerMeter: price,
        total: itemTotal,
      });
    }

    // Apply coupon if provided
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.isActive) {
        const discount = coupon.discountType === 'PERCENTAGE'
          ? (subtotal * coupon.discountValue) / 100
          : coupon.discountValue;
        discountAmount = Math.min(discount, coupon.maxDiscount || discount);
      }
    }

    const total = calculateOrderTotal(
      subtotal,
      shippingCost || 0,
      tax || 0,
      discountAmount
    );

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: await generateOrderNumber(prisma),
        userId: req.userId,
        shippingAddress: JSON.stringify(shippingAddress),
        items: {
          createMany: {
            data: orderItems,
          },
        },
        subtotal,
        shippingCost: shippingCost || 0,
        tax: tax || 0,
        discountAmount,
        couponCode,
        total,
        paymentMethod: paymentMethod || undefined,
        utrReference: utrReference || undefined,
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Deduct inventory for each ordered item
    await Promise.all(
      orderItems.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { totalStock: { decrement: item.quantity } },
        })
      )
    );

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

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      throw new ApiError(400, 'Payment signature verification failed');
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.userId !== req.userId) throw new ApiError(403, 'Forbidden');

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        razorpayPaymentId,
        paidAt: new Date(),
      },
    });

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
    await Promise.all(
      order.items.map(item =>
        prisma.product.update({ where: { id: item.productId }, data: { totalStock: { increment: item.quantity } } })
      )
    );
    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledBy: 'CUSTOMER' },
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

    const coupon = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
    if (!coupon || !coupon.isActive) throw new ApiError(404, 'Invalid or expired coupon code');

    const minOrder = (coupon as any).minOrderAmount ?? 0;
    if (amount < minOrder) throw new ApiError(400, `Minimum order of ${minOrder} required for this coupon`);

    const discount = coupon.discountType === 'PERCENTAGE'
      ? Math.round((Number(amount) * coupon.discountValue) / 100)
      : coupon.discountValue;
    const finalDiscount = coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;

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
