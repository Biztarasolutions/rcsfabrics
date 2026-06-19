import { Request, Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';
import { getDriveImageStream } from '@/utils/googleDrive.util';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.userId!;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }

    const review = await prisma.review.upsert({
      where: { productId_userId: { productId, userId } },
      create: { productId, userId, rating: Number(rating), title, comment },
      update: { rating: Number(rating), title, comment },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    // Recalculate product rating
    const agg = await prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
    await prisma.product.update({
      where: { id: productId },
      data: { rating: agg._avg.rating || 0, ratingCount: agg._count },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Simple LRU cache for image buffers
const imageCache = new Map<string, { buffer: Buffer, contentType: string }>();
const CACHE_LIMIT = 200;

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
    console.error('Error in getProducts:', error);
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

/**
 * Batch endpoint to fetch multiple data points for homepage
 * Reduces number of API calls from 5+ to 1
 */
export const getHomepageData = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = 8;

    // Fetch all data in parallel
    const [featured, newArrivals, bestSellers, categories] = await Promise.all([
      // Featured products
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        take: limit,
        include: {
          images: { where: { isMain: true }, take: 1 },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // New arrivals
      prisma.product.findMany({
        where: { isActive: true },
        take: limit,
        include: {
          images: { where: { isMain: true }, take: 1 },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Best sellers (products with most sales)
      prisma.product.findMany({
        where: { isActive: true },
        take: limit,
        include: {
          images: { where: { isMain: true }, take: 1 },
          category: { select: { name: true } },
        },
        orderBy: { orderItems: { _count: 'desc' } },
      }),
      // Active categories
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          imageUrl: true,
        },
        orderBy: { order: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      message: 'Homepage data retrieved',
      data: {
        featured,
        newArrivals,
        bestSellers,
        categories,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve homepage data',
      statusCode: 500,
    } as ApiResponse);
  }
};

/**
 * Public proxy endpoint to stream images from Google Drive securely
 */
export const proxyProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      throw new ApiError(400, 'File ID is required');
    }

    // Crucial for cross-origin image rendering in browsers when Helmet is enabled
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Set cache headers to avoid hitting Google Drive API repeatedly
    res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400'); // 30 days

    if (imageCache.has(fileId)) {
      const cached = imageCache.get(fileId)!;
      // move to end to simulate LRU
      imageCache.delete(fileId);
      imageCache.set(fileId, cached);
      
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Content-Length', cached.buffer.length);
      res.send(cached.buffer);
      return;
    }

    // Call the drive utility to get the stream
    const driveRes = await getDriveImageStream(fileId);
    
    // Set headers from the Google Drive response
    const contentType = driveRes.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    
    const contentLength = driveRes.headers['content-length'];
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Cache the stream data
    const chunks: Buffer[] = [];
    driveRes.data.on('data', (chunk: Buffer) => chunks.push(chunk));
    driveRes.data.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (imageCache.size >= CACHE_LIMIT) {
         const firstKey = imageCache.keys().next().value;
         if (firstKey) imageCache.delete(firstKey);
      }
      imageCache.set(fileId, { buffer, contentType });
    });

    // Pipe the stream to res
    (driveRes.data as any).pipe(res);
  } catch (error: any) {
    console.error('Error proxying Google Drive image:', error);
    res.status(404).send(`Image not found or access denied: ${error.message}`);
  }
};
