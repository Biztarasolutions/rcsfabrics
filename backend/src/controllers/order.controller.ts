import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateOrderNumber, calculateOrderTotal } from '@/utils/order.util';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';

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
        orderNumber: generateOrderNumber(),
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

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
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
