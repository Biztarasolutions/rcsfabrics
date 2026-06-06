// src/services/bulkOrderService.ts
import { createClient } from '@supabase/supabase-js';

// Supabase client for backend (service role key recommended for inserts)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key not set in environment');
}
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface BulkEnquiry {
  name: string;
  company?: string;
  email: string;
  phone: string;
  fabric: string;
  quantity: string;
  deadline?: string;
  notes?: string;
}

export const insertBulkEnquiry = async (data: BulkEnquiry) => {
  const { data: inserted, error } = await supabase.from('bulk_enquiries').insert([data]);
  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }
  return inserted;
};
