import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';

export const getProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { category, search, page, limit, sort } = req.query;

    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      page as string,
      limit as string
    );

    // Build filter
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build sort
    const orderBy: any = {};
    if (sort === 'price_asc') {
      orderBy.basePrice = 'asc';
    } else if (sort === 'price_desc') {
      orderBy.basePrice = 'desc';
    } else if (sort === 'newest') {
      orderBy.createdAt = 'desc';
    } else if (sort === 'rating') {
      orderBy.rating = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parsedLimit,
        include: {
          images: {
            where: { isMain: true },
            take: 1,
          },
          category: {
            select: { name: true, slug: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const meta = createPaginationMeta(total, parsedPage, parsedLimit);

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        ...meta,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      statusCode: 500,
    } as ApiResponse);
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: {
          select: { name: true, slug: true },
        },
        reviews: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
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

export const getProductBySlug = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        category: {
          select: { name: true, slug: true },
        },
        reviews: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
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

export const getFeaturedProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = '8' } = req.query;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: parseInt(limit as string),
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      message: 'Featured products retrieved',
      data: products,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured products',
      statusCode: 500,
    } as ApiResponse);
  }
};

export const getNewArrivals = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = '8' } = req.query;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      take: parseInt(limit as string),
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      message: 'New arrivals retrieved',
      data: products,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve new arrivals',
      statusCode: 500,
    } as ApiResponse);
  }
};

