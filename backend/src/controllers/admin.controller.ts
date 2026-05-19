import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateSlug, generateSKU } from '@/utils/string.util';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';

export const createProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can create products');
    }

    const {
      name,
      description,
      categoryId,
      basePrice,
      discountPrice,
      material,
      gsm,
      width,
      pattern,
      color,
      stretchability,
      usage,
      washCare,
      totalStock,
      minOrderQty,
    } = req.body;

    if (!name || !categoryId || !basePrice) {
      throw new ApiError(400, 'Name, category, and price are required');
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: generateSlug(name),
        description,
        categoryId,
        basePrice,
        discountPrice,
        material,
        gsm,
        width,
        pattern,
        color,
        stretchability,
        usage,
        washCare,
        totalStock: totalStock || 0,
        minOrderQty: minOrderQty || 0.5,
        sku: generateSKU('FAB'),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
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

export const updateProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can update products');
    }

    const { id } = req.params;
    const updateData = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
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

export const deleteProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can delete products');
    }

    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
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

export const getAdminProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can access this');
    }

    const { page, limit, search } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      page as string,
      limit as string
    );

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            where: { isMain: true },
            take: 1,
          },
          category: {
            select: { name: true, id: true },
          },
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const meta = createPaginationMeta(total, parsedPage, parsedLimit);

    res.json({
      success: true,
      message: 'Products retrieved',
      data: {
        products,
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

export const getAdminOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can access this');
    }

    const { page, limit, status } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      page as string,
      limit as string
    );

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              pricePerMeter: true,
              total: true,
              productName: true,
              productImage: true,
            },
          },
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
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

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can update orders');
    }

    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        paymentStatus,
      },
      include: {
        items: true,
      },
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
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

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can access this');
    }

    const [totalOrders, totalRevenue, totalCustomers, totalProducts] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
    ]);

    res.json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalCustomers,
        totalProducts,
      },
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

// ── Coupon Management ───────────────────────────────────────────────────

export const getCoupons = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      message: 'Coupons retrieved',
      data: coupons,
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

export const createCoupon = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      expiresAt,
    } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      throw new ApiError(400, 'Code, type, value, and expiry are required');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxUses,
        startsAt: new Date(),
        expiresAt: new Date(expiresAt),
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
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

export const deleteCoupon = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
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

// ── Category Management ──────────────────────────────────────────────────

export const getCategories = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      message: 'Categories retrieved',
      data: categories,
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

export const createCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, slug, description, isActive } = req.body;
    if (!name || !slug) throw new ApiError(400, 'Name and slug are required');

    const category = await prisma.category.create({
      data: { name, slug, description, isActive: isActive ?? true },
    });

    res.status(201).json({
      success: true,
      message: 'Category created',
      data: category,
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category', statusCode: 500 } as ApiResponse);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;
    const category = await prisma.category.update({ where: { id }, data });

    res.json({ success: true, message: 'Category updated', data: category, statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category', statusCode: 500 } as ApiResponse);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted', statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category', statusCode: 500 } as ApiResponse);
  }
};

// ── Customer Management ──────────────────────────────────────────────────

export const getCustomers = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          select: { total: true },
          take: 100, // Limit to prevent fetching too much data
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Guest User',
      email: c.email,
      phone: c.phone || 'N/A',
      orders: c._count.orders,
      spent: c.orders.reduce((s, o) => s + (o.total || 0), 0),
      joined: c.createdAt,
      status: c.isActive ? 'Active' : 'Inactive',
    }));

    res.json({
      success: true,
      message: 'Customers retrieved',
      data: formattedCustomers,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
  }
};

// ── Banner Management ────────────────────────────────────────────────────

export const getBanners = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: banners, statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
  }
};

export const createBanner = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const banner = await prisma.banner.create({ data });
    res.status(201).json({ success: true, data: banner, statusCode: 201 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner', statusCode: 500 } as ApiResponse);
  }
};

export const updateBanner = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.update({ where: { id }, data: req.body });
    res.json({ success: true, data: banner, statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner', statusCode: 500 } as ApiResponse);
  }
};

export const deleteBanner = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    res.json({ success: true, message: 'Banner deleted', statusCode: 200 } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner', statusCode: 500 } as ApiResponse);
  }
};



