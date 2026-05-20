import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export type AuthRequest = Request;

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductImageInput {
  url: string;
  alt?: string;
  order?: number;
  isMain?: boolean;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId: string;
  code?: number;
  basePrice: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
  discountType?: string;
  discountValue?: number | null;
  material: string;
  gsm?: number | null;
  width?: number | null;
  pattern?: string | null;
  occasion?: string | null;
  workType?: string | null;
  color: string;
  stretchability: string;
  usage?: string | null;
  washCare?: string | null;
  totalStock: number;
  minOrderQty?: number;
  sku?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  colors?: Array<{
    name: string;
    hexCode: string;
    folderUrl?: string;
    productCode?: string;
  }>;
  images?: ProductImageInput[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  categoryId?: string;
  code?: number;
  basePrice?: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
  discountType?: string;
  discountValue?: number | null;
  material?: string;
  gsm?: number | null;
  width?: number | null;
  pattern?: string | null;
  occasion?: string | null;
  workType?: string | null;
  color?: string;
  stretchability?: string;
  usage?: string | null;
  washCare?: string | null;
  totalStock?: number;
  minOrderQty?: number;
  sku?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  colors?: Array<{
    name: string;
    hexCode: string;
    folderUrl?: string;
    productCode?: string;
  }>;
  images?: ProductImageInput[];
}
