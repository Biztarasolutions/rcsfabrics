import { Router } from 'express';
import { getBulkEnquiries } from '@/controllers/bulkEnquiry.controller';

const router = Router();

// Mounted under /admin/bulk-enquiries, which already allows admins and the super admin only
router.get('/', getBulkEnquiries);

export default router;
