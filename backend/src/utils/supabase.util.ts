import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL || 'https://eufihjcpdolquyxucnpf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in backend environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
};

/**
 * Uploads a file buffer directly to Supabase Storage and returns its public CDN URL.
 */
export const uploadImageToSupabase = async (
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> => {
  // Lazily get the initialized supabase client
  const supabaseClient = getSupabaseClient();

  // Clean filename to prevent path traversal or special character issues
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFilename = `${Date.now()}-${cleanFilename}`;

  const { data, error } = await supabaseClient.storage
    .from('product-images')
    .upload(uniqueFilename, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('[Supabase] Upload error details:', error);
    throw new Error(`Failed to upload image to Supabase: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};
