import { Router } from 'express';
import { authorizeRole } from '@/middleware/auth.middleware';
import { getBulkEnquiries } from '@/controllers/bulkEnquiry.controller';

const router = Router();

// All routes under /admin/bulk-enquiries are admin only
router.get('/', authorizeRole(['ADMIN']), getBulkEnquiries);

export default router;
