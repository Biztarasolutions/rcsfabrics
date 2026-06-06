import { Request, Response } from 'express';
import { prisma } from '@/index';
import { ApiError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import { parsePagination, createPaginationMeta } from '@/utils/pagination.util';

/**
 * Get bulk enquiries with pagination and optional search.
 * Admin only.
 */
export const getBulkEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - assume user added by auth middleware
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only admins can access bulk enquiries');
    }
    const { page = '1', limit = '20', search = '' } = req.query as any;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(page as string, limit as string);

    // Build where clause for optional search on name or email fields
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const data = await prisma.bulkOrderInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    });

    const count = await prisma.bulkOrderInquiry.count({ where });

    const meta = createPaginationMeta(count || 0, parsedPage, parsedLimit);
    res.json({ success: true, data, meta, statusCode: 200, message: 'Bulk enquiries retrieved successfully' } as ApiResponse);
  } catch (err: any) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ success: false, message: err.message, statusCode: err.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: err.message || 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};
