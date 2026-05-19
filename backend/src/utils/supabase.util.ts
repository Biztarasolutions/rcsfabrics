import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://eufihjcpdolquyxucnpf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file buffer directly to Supabase Storage and returns its public CDN URL.
 */
export const uploadImageToSupabase = async (
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in backend .env');
  }

  // Clean filename to prevent path traversal or special character issues
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFilename = `${Date.now()}-${cleanFilename}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(uniqueFilename, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('[Supabase] Upload error details:', error);
    throw new Error(`Failed to upload image to Supabase: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};
