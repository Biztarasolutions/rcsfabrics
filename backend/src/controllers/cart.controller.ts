import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { ApiError } from '@/middleware/errorHandler';

export const getCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: {
        product: {
          include: {
            images: {
              orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
              take: 1,
            },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    const total = cartItems.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.basePrice;
      return sum + price * item.quantity;
    }, 0);

    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        items: cartItems,
        total,
        itemCount: cartItems.length,
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

export const addToCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      throw new ApiError(400, 'Product ID and quantity are required');
    }

    if (quantity <= 0) {
      throw new ApiError(400, 'Quantity must be greater than 0');
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.userId,
          productId,
        },
      },
    });

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.userId,
          productId,
          quantity,
        },
        include: { product: true },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: cartItem,
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

export const updateCartItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new ApiError(400, 'Quantity must be greater than 0');
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem || cartItem.userId !== req.userId) {
      throw new ApiError(404, 'Cart item not found');
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    });

    res.json({
      success: true,
      message: 'Cart item updated',
      data: updated,
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

export const removeFromCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { id } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem || cartItem.userId !== req.userId) {
      throw new ApiError(404, 'Cart item not found');
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Item removed from cart',
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

export const clearCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    await prisma.cartItem.deleteMany({
      where: { userId: req.userId },
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

/**
 * PUT /api/cart/product/:productId { quantity }
 * Set the absolute quantity (metres) of one product in the user's cart.
 * quantity 0 removes it. Used by the storefront to keep the server cart in sync.
 */
export const setCartQuantity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    const { productId } = req.params;
    const quantity = Number(req.body?.quantity);
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 1000) {
      throw new ApiError(400, 'Invalid quantity');
    }
    if (Math.abs(quantity * 2 - Math.round(quantity * 2)) > 1e-9) {
      throw new ApiError(400, 'Quantity must be in 0.5 m steps');
    }

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({ where: { userId: req.userId, productId } });
      res.json({ success: true, message: 'Removed from cart', statusCode: 200 } as ApiResponse);
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, isActive: true } });
    if (!product || !product.isActive) throw new ApiError(404, 'Product not available');

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.userId, productId } },
      update: { quantity },
      create: { userId: req.userId, productId, quantity },
    });
    res.json({ success: true, message: 'Cart updated', data: item, statusCode: 200 } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      console.error('Set cart quantity error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};
