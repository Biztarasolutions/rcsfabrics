import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateSlug, generateSKU } from '@/utils/string.util';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';
import { ApiError } from '@/middleware/errorHandler';
import { extractFolderId, getDriveImageStream, fetchFolderImageDetails, findFolderIdByName } from '@/utils/googleDrive.util';
import { uploadImageToSupabase } from '@/utils/supabase.util';
import { invalidateCache } from '@/middleware/cache';

// Reusable function to convert a stream to a buffer
const streamToBuffer = (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

/**
 * Downloads Google Drive images as streams, converts them to buffers, and uploads them to Supabase Storage
 */
const uploadDriveImagesToSupabase = async (folderId: string): Promise<string[]> => {
  try {
    const files = await fetchFolderImageDetails(folderId);
    const publicUrls: string[] = [];

    for (const file of files) {
      console.log(`[Supabase Upload] Downloading file: ${file.name} (${file.id})`);
      const streamRes = await getDriveImageStream(file.id);
      const buffer = await streamToBuffer(streamRes.data);
      
      const publicUrl = await uploadImageToSupabase(
        buffer,
        file.name,
        file.mimeType || 'image/jpeg'
      );
      
      publicUrls.push(publicUrl);
      console.log(`[Supabase Upload] Uploaded successfully: ${file.name} -> ${publicUrl}`);
    }

    return publicUrls;
  } catch (error) {
    console.error('[Supabase Upload] Error syncing images:', error);
    throw error;
  }
};

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
      categoryId,
      code,
      basePrice,
      discountPrice,
      discountType,
      discountValue,
      width,
      pattern,
      workType,
      stretchability,
      totalStock,
      minOrderQty,
      colors,
    } = req.body;

    if (!name || !categoryId || !basePrice || !code) {
      throw new ApiError(400, 'Name, category, code, and price are required');
    }

    // Get category to build styleCode
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Generate styleCode as Code-Category-Pattern
    const catStr = category.name ? category.name.substring(0, 3).toUpperCase() : 'UNK';
    const patStr = pattern ? pattern.substring(0, 3).toUpperCase() : name.substring(0, 3).toUpperCase();
    const styleCode = `${code}-${catStr}-${patStr}`;

    let processedColors: any[] = [];
    if (colors && Array.isArray(colors) && colors.length > 0) {
      processedColors = await Promise.all(colors.map(async (color: any) => {
        const pCode = `${styleCode}-${(color.name || 'UNK').substring(0, 3).toUpperCase()}`;
        let fUrl = color.folderUrl;
        if (!fUrl) {
          const fId = await findFolderIdByName(pCode);
          if (fId) fUrl = `https://drive.google.com/drive/folders/${fId}`;
        }
        return {
          name: color.name,
          hexCode: color.hexCode,
          productCode: pCode,
          folderUrl: fUrl,
        };
      }));
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: generateSlug(name),
        description: category.description,
        categoryId,
        code,
        styleCode,
        basePrice,
        discountPrice,
        discountType,
        discountValue,
        width,
        pattern,
        occasion: category.bestFor?.join(', ') || undefined,
        workType,
        color: colors && colors.length > 0 ? colors[0].name : 'Unknown',
        stretchability,
        totalStock: totalStock || 0,
        minOrderQty: minOrderQty || 0.5,
        sku: generateSKU('FAB'),
        bestFor: category.bestFor,
        properties: category.properties,
        ...(processedColors.length > 0 && {
          colors: {
            create: processedColors
          }
        })
      },
      include: { colors: true }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
      statusCode: 201,
    } as ApiResponse);
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
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
    const { 
      id: bodyId, 
      createdAt, 
      updatedAt, 
      images, 
      category, 
      reviews,
      imageUrls, 
      folderUrl,
      colors,      // extract colors so we can handle it as a relation
      ...updateData 
    } = req.body;

    // Build the update payload, ensuring numeric fields are properly parsed
    const existingProduct = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    
    let processedColors: any[] | undefined = undefined;
    if (colors !== undefined && Array.isArray(colors)) {
      processedColors = await Promise.all(colors.map(async (c: any) => {
        let pCode = c.productCode;
        if (!pCode && existingProduct) {
          const catStr = existingProduct.category?.name ? existingProduct.category.name.substring(0, 3).toUpperCase() : 'UNK';
          const patStr = updateData.pattern ? updateData.pattern.substring(0, 3).toUpperCase() : (existingProduct.pattern || existingProduct.name).substring(0, 3).toUpperCase();
          const sCode = `${updateData.code || existingProduct.code || '000'}-${catStr}-${patStr}`;
          pCode = `${sCode}-${(c.name || 'UNK').substring(0, 3).toUpperCase()}`;
        }
        
        let fUrl = c.folderUrl;
        if (!fUrl && pCode) {
          const fId = await findFolderIdByName(pCode);
          if (fId) fUrl = `https://drive.google.com/drive/folders/${fId}`;
        }
        
        return {
          name:        c.name?.trim(),
          hexCode:     c.hexCode ? (c.hexCode.startsWith('#') ? c.hexCode : `#${c.hexCode}`) : '#000000',
          folderUrl:   fUrl,
          productCode: pCode,
        };
      }));
    }

    const dataPayload: any = {
      ...updateData,
      folderUrl,
      // Convert to numbers so Prisma Float doesn't reject string inputs
      ...(updateData.basePrice     !== undefined && { basePrice:     Number(updateData.basePrice) }),
      ...(updateData.discountValue !== undefined && { discountValue: Number(updateData.discountValue) }),
      ...(updateData.minOrderQty   !== undefined && { minOrderQty:   Number(updateData.minOrderQty) }),
      ...(updateData.totalStock    !== undefined && { totalStock:    Number(updateData.totalStock) }),
      ...(updateData.discountPrice !== undefined && {
        discountPrice: updateData.discountPrice !== null && updateData.discountPrice !== ""
          ? Number(updateData.discountPrice)
          : null,
      }),
      // Handle colors as a nested Prisma relation write
      ...(processedColors !== undefined && {
        colors: {
          deleteMany: {},   // remove existing colours
          create: processedColors,
        },
      }),
    };

    const product = await prisma.product.update({
      where: { id },
      data: dataPayload,
      include: { colors: true },
    });

    let finalImageUrls: string[] | null = null;
    if (folderUrl) {
      const folderId = extractFolderId(folderUrl);
      if (folderId) {
        finalImageUrls = await uploadDriveImagesToSupabase(folderId);
      }
    } else if (imageUrls && Array.isArray(imageUrls)) {
      finalImageUrls = imageUrls.filter((url: string) => url);
    }

    if (finalImageUrls && finalImageUrls.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      
      await prisma.productImage.createMany({
        data: finalImageUrls.map((url: string, index: number) => ({
          productId: id,
          url,
          isMain: index === 0,
          order: index
        }))
      });
    } else if (imageUrls && Array.isArray(imageUrls) && imageUrls.length === 0) {
      // Allow clearing all images if empty array provided
      await prisma.productImage.deleteMany({ where: { productId: id } });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
      statusCode: 200,
    } as ApiResponse);
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
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
          colors: true,
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

// Reusable helper to process category images from Google Drive links to Supabase
const processCategoryImage = async (imageUrl: string | null | undefined): Promise<string | null> => {
  if (!imageUrl) return null;

  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([^\/\?]+)/;
  const match = imageUrl.match(driveRegex);
  if (match && match[1]) {
    try {
      const fileId = match[1];
      console.log(`[Category Image Sync] Google Drive file detected. File ID: ${fileId}`);
      const streamRes = await getDriveImageStream(fileId);
      
      const mimeType = streamRes.headers['content-type'] || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const filename = `category_${fileId}.${ext}`;
      
      const buffer = await streamToBuffer(streamRes.data);
      const publicUrl = await uploadImageToSupabase(buffer, filename, mimeType);
      
      console.log(`[Category Image Sync] Successfully uploaded category image from Drive to Supabase: ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      console.error('[Category Image Sync] Failed to download/upload image from Google Drive:', err);
      return imageUrl;
    }
  }
  return imageUrl;
};

export const createCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      slug,
      description,
      isActive,
      gender,
      bestFor,
      properties,
      imageUrl,
    } = req.body;
    if (!name || !slug) throw new ApiError(400, 'Name and slug are required');

    let processedImageUrl = imageUrl || null;
    if (imageUrl) {
      processedImageUrl = await processCategoryImage(imageUrl);
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        isActive: isActive ?? true,
        gender: gender || 'women',
        bestFor: bestFor || [],
        properties: properties || [],
        imageUrl: processedImageUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created',
      data: category,
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create category', statusCode: 500 } as ApiResponse);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.imageUrl) {
      data.imageUrl = await processCategoryImage(data.imageUrl);
    }

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
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can delete categories');
    }

    const { id } = req.params;

    // Check if the category exists first
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found or has already been deleted');
    }

    // Check if any products are currently associated with this category
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete category: ${productCount} product(s) are currently associated with it. Please reassign or delete these products first.`
      );
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully', statusCode: 200 } as ApiResponse);
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete category',
        statusCode: 500,
      } as ApiResponse);
    }
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

/**
 * Syncs images of a single product from Google Drive to Supabase Storage
 */
export const syncProductImages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can sync product images');
    }

    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { colors: true },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const foldersToSync = new Set<string>();
    if (product.folderUrl) {
      const folderId = extractFolderId(product.folderUrl);
      if (folderId) foldersToSync.add(folderId);
    }
    for (const color of product.colors) {
      if (color.folderUrl) {
        const folderId = extractFolderId(color.folderUrl);
        if (folderId) foldersToSync.add(folderId);
      }
    }

    if (foldersToSync.size === 0) {
      throw new ApiError(400, 'This product does not have any Google Drive folder links saved (either on product level or color variant level).');
    }

    console.log(`[Sync] Starting image sync for product: ${product.name} (${product.id}) across ${foldersToSync.size} folders`);
    
    // Upload files to Supabase from all folders
    const supabaseUrls: string[] = [];
    for (const folderId of foldersToSync) {
      try {
        const urls = await uploadDriveImagesToSupabase(folderId);
        supabaseUrls.push(...urls);
      } catch (err: any) {
        console.error(`[Sync] Failed to sync folder ${folderId}:`, err);
      }
    }

    // Clear existing images and replace with the newly synced ones (even if 0 images remain)
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productImage.createMany({
        data: supabaseUrls.map((url, index) => ({
          productId: id,
          url,
          isMain: index === 0,
          order: index,
        })),
      }),
    ]);

    // Invalidate product cache to show updates instantly
    invalidateCache('/api/products');

    res.json({
      success: true,
      message: `Successfully synced ${supabaseUrls.length} images for product: ${product.name}`,
      statusCode: 200,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error syncing images:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to sync product images.',
      statusCode: error.statusCode || 500,
    } as ApiResponse);
  }
};

/**
 * Syncs images for all products that have folderUrls
 */
export const syncAllProductImages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can sync all product images');
    }

    // Find all products
    const products = await prisma.product.findMany({
      include: { colors: true },
    });

    console.log(`[Sync All] Found ${products.length} products to sync.`);
    let syncCount = 0;
    const errors: string[] = [];

    for (const product of products) {
      const foldersToSync = new Set<string>();
      if (product.folderUrl) {
        const folderId = extractFolderId(product.folderUrl);
        if (folderId) foldersToSync.add(folderId);
      }
      for (const color of product.colors) {
        if (color.folderUrl) {
          const folderId = extractFolderId(color.folderUrl);
          if (folderId) foldersToSync.add(folderId);
        }
      }

      if (foldersToSync.size === 0) continue;

      try {
        console.log(`[Sync All] Syncing product: ${product.name} across ${foldersToSync.size} folders`);
        const supabaseUrls: string[] = [];
        for (const folderId of foldersToSync) {
          try {
            const urls = await uploadDriveImagesToSupabase(folderId);
            supabaseUrls.push(...urls);
          } catch (err: any) {
            console.error(`[Sync All] Failed syncing folder ${folderId} for product "${product.name}":`, err.message);
          }
        }

        // Clear existing images and replace with the newly synced ones (even if 0 images remain)
        await prisma.$transaction([
          prisma.productImage.deleteMany({ where: { productId: product.id } }),
          prisma.productImage.createMany({
            data: supabaseUrls.map((url, index) => ({
              productId: product.id,
              url,
              isMain: index === 0,
              order: index,
            })),
          }),
        ]);
        syncCount++;
      } catch (err: any) {
        console.error(`[Sync All] Failed syncing product "${product.name}":`, err.message);
        errors.push(`Product "${product.name}": ${err.message}`);
      }
    }

    // Invalidate product cache to show updates instantly
    invalidateCache('/api/products');

    res.json({
      success: true,
      message: `Successfully synced ${syncCount} of ${products.length} products.`,
      data: {
        totalProducts: products.length,
        syncedCount: syncCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error syncing all images:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to sync all product images.',
      statusCode: error.statusCode || 500,
    } as ApiResponse);
  }
};



