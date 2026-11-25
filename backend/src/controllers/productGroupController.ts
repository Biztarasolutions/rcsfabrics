import { Request, Response } from 'express';
import { assignRcsCodes } from '@/services/rcsCode';
import { PrismaClient } from '@prisma/client';
import { generateSlug, buildStyleCode, buildProductCode, extractDesignName, cleanDesignName } from '../utils/string.util';
import { syncImagesForProduct } from '../services/driveService';

const prisma = new PrismaClient();

export const createProductGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, categoryId, basePrice, description, code, 
      minOrderQty = 0.5, variants, pattern, width, 
      stretchability, discountType, discountValue 
    } = req.body;

    // Fetch the category to hardcode into the name as requested
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const categoryName = category.name;
    const cleanedName = cleanDesignName(extractDesignName(name, categoryName, code), categoryName);
    const styleCode = buildStyleCode(cleanedName, categoryName, code); // the code is optional

    // Parse and validate base price
    const basePriceNum = parseFloat(basePrice);
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      res.status(400).json({ success: false, message: 'Invalid base price. Must be a positive number.' });
      return;
    }

    // Parse and validate min order quantity
    let minOrderQtyNum = parseFloat(minOrderQty || '0.5');
    if (isNaN(minOrderQtyNum) || minOrderQtyNum <= 0) {
      // Default to 0.5 if invalid
      minOrderQtyNum = 0.5;
    }

    // Calculate discount price if applicable
    let discountPrice = null;
    if (discountValue && parseFloat(discountValue) > 0) {
      const discountValueNum = parseFloat(discountValue);
      if (discountType === 'percentage') {
        discountPrice = basePriceNum - (basePriceNum * (discountValueNum / 100));
      } else {
        discountPrice = basePriceNum - discountValueNum;
      }
      // Ensure discount price is not negative; prices are whole rupees (₹1079, not ₹1079.10)
      discountPrice = Math.max(0, Math.round(discountPrice));
    }

    // Stop duplicates: if any colour of this design already exists (same product code), refuse.
    // This also makes a repeated "Save" (e.g. after a slow response) harmless.
    const plannedCodes = (variants || []).map((v: any) => buildProductCode(cleanedName, categoryName, v.color, code));
    const already = await prisma.product.findMany({
      where: { OR: plannedCodes.map((c: string) => ({ productCode: { equals: c, mode: 'insensitive' as const } })) },
      select: { productCode: true },
    });
    if (already.length) {
      const names = already.map((a) => a.productCode).join(', ');
      res.status(409).json({
        success: false,
        message: `Duplicate product — already exists: ${names}. Nothing was saved. Edit the existing fabric instead, or remove these colours from the form.`,
        data: { existing: already.map((a) => a.productCode) },
      });
      return;
    }

    // Create a product for each variant
    const createdProducts = [];

    for (const variant of variants) {
      // Validate variant inventory
      const inventoryNum = parseFloat(variant.inventory) || 0;
      if (inventoryNum < 0) {
        res.status(400).json({ success: false, message: `Invalid inventory for variant ${variant.color}. Must be a positive number.` });
        return;
      }

      // Name-Category-ProductCode-Color
      const productName = buildProductCode(cleanedName, categoryName, variant.color, code);
      let slug = generateSlug(productName);

      // Check if slug already exists
      const existingProduct = await prisma.product.findUnique({
        where: { slug }
      });

      if (existingProduct) {
        // Never make a copy with a timestamped address — report it as a duplicate instead
        res.status(409).json({ success: false, message: `Duplicate product — ${productName} already exists. Nothing more was saved.` });
        return;
      }

      
      try {
        const newProduct = await prisma.product.create({
          data: {
            name: cleanedName,
            slug,
            description,
            categoryId,
            code: code ? parseInt(code, 10) : null,
            styleCode,
            productCode: productName,
            basePrice: Math.round(basePriceNum),
            discountPrice,
            discountType,
            discountValue: discountValue ? parseFloat(discountValue) : null,
            color: variant.color,
            totalStock: inventoryNum,
            minOrderQty: minOrderQtyNum,
            stretchability: stretchability || 'Non-Stretch',
            width: Number(width ?? 0),
            pattern: pattern || 'Plain',
            bestFor: category.bestFor,
            properties: category.properties,
          }
        });

        // Background Sync for Google Drive by product name
        syncImagesForProduct(newProduct.id, productName).catch(err => {
          console.error('Background sync failed:', err);
        });

        // Also create ProductColor record for consistency if needed
        try {
          await prisma.productColor.create({
            data: {
              productId: newProduct.id,
              name: variant.color,
              hexCode: variant.hexCode || '#000000',
              productCode: productName,
              folderUrl: variant.folderUrl
            }
          });
        } catch (colorError: any) {
          // Log error but don't fail the entire product creation if color creation fails
          console.warn('Failed to create product color:', colorError.message);
        }

        createdProducts.push(newProduct);
      } catch (dbError: any) {
        // Handle specific database errors
        if (dbError.code === 'P2002') {
          // Unique constraint violation
          const field = dbError.meta?.target?.[0] || 'field';
          res.status(400).json({ 
            success: false, 
            message: `Duplicate product — a product with this ${field} already exists.` 
          });
          return;
        } else {
          // Re-throw other errors to be caught by the outer try-catch
          throw dbError;
        }
      }
    }

    await assignRcsCodes().catch((e) => console.error('[RCS codes] failed:', e));
    res.status(201).json({
      success: true,
      message: 'Product group created successfully',
      data: createdProducts
    });
  } catch (error: any) {
    console.error('Error creating product group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { styleCode } = req.params;
    const products = await prisma.product.findMany({
      // other colours of the design, as customers see them (active, with photos)
      where: { styleCode, isActive: true, images: { some: {} } },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        colors: true
      }
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error: any) {
    console.error('Error fetching product group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
