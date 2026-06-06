// src/services/bulkOrderService.ts
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/utils/email';

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
  // Send email notification to admin recipients
  try {
    await sendEmail({
      to: ['rish6.jain@gmail.com', 'mayankjain23102000@gmail.com'],
      subject: `New Bulk Enquiry from ${data.name}`,
      html: `<p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Company:</strong> ${data.company ?? ''}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Fabric:</strong> ${data.fabric}</p>
        <p><strong>Quantity (m):</strong> ${data.quantity}</p>
        <p><strong>Deadline:</strong> ${data.deadline ?? ''}</p>
        <p><strong>Notes:</strong> ${data.notes ?? ''}</p>`,
    });
  } catch (mailErr) {
    console.error('Failed to send bulk enquiry email:', mailErr);
    // Continue without throwing to avoid breaking the API response
  }
  return inserted;
};
