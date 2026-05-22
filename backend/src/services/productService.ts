import { PrismaClient } from '@prisma/client';
import { CreateProductInput, UpdateProductInput } from '../types';

const prisma = new PrismaClient();

export class ProductService {
  // ── List products with filters ────────────────────────────────────────
  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    featured?: boolean;
    isNew?: boolean;
  }) {
    const {
      page = 1, limit = 12, category, search,
      color, minPrice, maxPrice, sort = 'featured', featured, isNew,
    } = params;

    const where: any = { isActive: true };

    if (category) where.category = { slug: category };
    if (color) where.color = { contains: color, mode: 'insensitive' };
    if (featured !== undefined) where.isFeatured = featured;
    if (isNew !== undefined) where.isNew = isNew;
    if (minPrice || maxPrice) {
      where.OR = [
        { discountPrice: { gte: minPrice, lte: maxPrice } },
        { AND: [{ discountPrice: null }, { basePrice: { gte: minPrice, lte: maxPrice } }] },
      ];
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const orderBy: any =
      sort === 'newest'    ? { createdAt: 'desc' } :
      sort === 'price-asc' ? { basePrice: 'asc' }  :
      sort === 'price-desc'? { basePrice: 'desc' } :
      sort === 'rating'    ? { rating: 'desc' }    :
      sort === 'bestsellers' ? { totalSales: 'desc' } :
      { isFeatured: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy,
        skip: (page - 1) * limit, take: limit,
        include: {
          category: true,
          images: { orderBy: { order: 'asc' } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // ── Single product ────────────────────────────────────────────────────
  async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        reviews: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!product) throw new Error('Product not found');
    return product;
  }

  // ── Related products ──────────────────────────────────────────────────
  async getRelatedProducts(productId: string, categoryId: string) {
    return prisma.product.findMany({
      where: { categoryId, id: { not: productId }, isActive: true },
      include: { images: { orderBy: { order: 'asc' } }, category: true },
      take: 6,
      orderBy: { rating: 'desc' },
    });
  }

  // ── Create ────────────────────────────────────────────────────────────
  async createProduct(data: CreateProductInput) {
    const { images, colors, ...productData } = data;
    const createPayload: any = {
      ...productData,
      slug: productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      images: images ? { create: images } : undefined,
      colors: colors ? { create: colors.map((color) => ({
        name: color.name,
        hexCode: color.hexCode,
        folderUrl: color.folderUrl,
        productCode: color.productCode,
      })) } : undefined,
    };
    return prisma.product.create({
      data: createPayload,
      include: { category: true, images: true },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────
  async updateProduct(id: string, data: UpdateProductInput) {
    const { images, colors, ...productData } = data;
    const updatePayload: any = {
      // Parse numeric fields for Prisma Float
      ...productData,
      ...(productData.basePrice     != null && { basePrice:     Number(productData.basePrice) }),
      ...(productData.discountPrice != null && { discountPrice: Number(productData.discountPrice) }),
      ...(productData.discountPrice === null  && { discountPrice: null }),
      ...(productData.discountValue != null && { discountValue: Number(productData.discountValue) }),
      ...(productData.minOrderQty   != null && { minOrderQty:   Number(productData.minOrderQty) }),

      // Images handling (replace existing images)
      images: images ? {
        deleteMany: {},
        create: images,
      } : undefined,

      // Colors relation handling – create new colours while removing old ones
      colors: colors ? {
        deleteMany: {},
        create: colors.map((color) => ({
          name: color.name?.trim(),
          hexCode: color.hexCode ? (color.hexCode.startsWith('#') ? color.hexCode : `#${color.hexCode}`) : '#000000',
          folderUrl: color.folderUrl,
          productCode: color.productCode,
        })),
      } : undefined,
    };
    return prisma.product.update({
      where: { id },
      data: updatePayload,
      include: { category: true, images: true },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async deleteProduct(id: string) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: 'Product deactivated' };
  }

  // ── Update stock ──────────────────────────────────────────────────────
  async updateStock(id: string, quantity: number) {
    return prisma.product.update({
      where: { id },
      data: { totalStock: { decrement: quantity } },
    });
  }

  // ── Get featured ─────────────────────────────────────────────────────
  async getFeatured() {
    return prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { category: true, images: { orderBy: { order: 'asc' } } },
      orderBy: { rating: 'desc' },
      take: 8,
    });
  }

  // ── Get new arrivals ──────────────────────────────────────────────────
  async getNewArrivals() {
    return prisma.product.findMany({
      where: { isNew: true, isActive: true },
      include: { category: true, images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
  }

  // ── Search autocomplete ───────────────────────────────────────────────
  async searchProducts(query: string) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { color: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true, basePrice: true, discountPrice: true, images: { take: 1 } },
      take: 8,
    });
  }
}

export const productService = new ProductService();
