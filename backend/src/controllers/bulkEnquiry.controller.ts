import { Request, Response } from 'express';
import { supabase } from '@/services/bulkOrderService';
import { ApiError, ApiResponse } from '@/utils/apiResponse.util';
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
      where.or = [
        { name: { ilike: `%${search}%` } },
        { email: { ilike: `%${search}%` } },
      ];
    }

    const { data, error, count } = await supabase
      .from('bulk_enquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + parsedLimit - 1)
      .match(where);

    if (error) {
      console.error('Supabase fetch error:', error);
      throw new ApiError(500, 'Failed to fetch bulk enquiries');
    }

    const meta = createPaginationMeta({ page: parsedPage, limit: parsedLimit, total: count || 0 });
    res.json({ success: true, data, meta } as ApiResponse);
  } catch (err: any) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ success: false, message: err.message, statusCode: err.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: err.message || 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};
