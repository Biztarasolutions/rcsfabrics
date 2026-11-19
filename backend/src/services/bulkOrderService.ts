// src/services/bulkOrderService.ts
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/utils/email';
import { brandEmail, detailsTable, esc } from '@/utils/emailLayout';

// Lazy Supabase client — constructing at module load with missing env crashes the server on boot.
let supabaseClient: any = null;
const getSupabase = (): any => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key not set in environment');
    }
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
};

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
  const { data: inserted, error } = await getSupabase().from('bulk_enquiries').insert([data]);
  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }
  // Send email notification to admin recipients
  try {
    await sendEmail({
      to: ['support@rcsfabrics.com'],
      subject: `New Bulk Enquiry from ${data.name}`,
      html: brandEmail({
        team: true,
        preheader: `${data.name} · ${data.quantity} m ${data.fabric}`,
        eyebrow: 'Bulk enquiry',
        title: `${data.quantity} m ${data.fabric}`,
        body: detailsTable([
          ['Name', esc(data.name)], ['Business', esc(data.company ?? '—')], ['Email', esc(data.email)], ['Phone', esc(data.phone)],
          ['Fabric', esc(data.fabric)], ['Quantity', `${esc(data.quantity)} m`], ['Needed by', esc(data.deadline ?? '—')], ['Notes', esc(data.notes ?? '—')],
        ]),
      }),
    });
  } catch (mailErr) {
    console.error('Failed to send bulk enquiry email:', mailErr);
    // Continue without throwing to avoid breaking the API response
  }
  return inserted;
};
