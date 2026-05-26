import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateSlug, buildStyleCode, buildProductCode, extractDesignName } from '../utils/string.util';
import { syncImagesForProduct } from '../services/driveService';

const prisma = new PrismaClient();

export const createProductGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, categoryId, basePrice, description, code, 
      minOrderQty = 0.5, variants 
    } = req.body;

    // Fetch the category to hardcode into the name as requested
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const categoryName = category.name;
    const cleanedName = extractDesignName(name, categoryName, code);
    const styleCode = code ? buildStyleCode(cleanedName, categoryName, code) : `P${Date.now()}`; // Or however styleCode is meant to be derived if code is absent

    // Create a product for each variant
    const createdProducts = [];
    
    for (const variant of variants) {
      // Name-Category-ProductCode-Color
      const productName = buildProductCode(cleanedName, categoryName, variant.color, code);
      const slug = generateSlug(productName);
      
      const newProduct = await prisma.product.create({
        data: {
          name: cleanedName,
          slug,
          description,
          categoryId,
          code: code ? parseInt(code, 10) : null,
          styleCode,
          productCode: productName,
          basePrice: parseFloat(basePrice),
          color: variant.color,
          totalStock: parseFloat(variant.inventory),
          minOrderQty: parseFloat(minOrderQty),
          stretchability: 'Medium', // default or required fields
          width: variant.width ? parseFloat(variant.width) : 0,
          pattern: variant.pattern || 'Standard',
        }
      });

      // Background Sync for Google Drive by product name
      syncImagesForProduct(newProduct.id, productName).catch(err => {
        console.error('Background sync failed:', err);
      });

      // Also create ProductColor record for consistency if needed
      await prisma.productColor.create({
        data: {
          productId: newProduct.id,
          name: variant.color,
          hexCode: '#000000', // Default, should be updated or provided
          productCode: productName,
          folderUrl: variant.folderUrl
        }
      });

      createdProducts.push(newProduct);
    }

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
      where: { styleCode },
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
