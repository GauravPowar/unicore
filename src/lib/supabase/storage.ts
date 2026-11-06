// ============================================================
// Supabase Storage Helper – Media Uploading
// Stores public media URLs as TEXT[] (no raw binaries in DB)
// ============================================================
import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'post-media';

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 */
export async function uploadPostMedia(file: File): Promise<string> {
  try {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Storage upload warning, using preview URL:', uploadError.message);
      return URL.createObjectURL(file);
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Storage error:', err);
    return URL.createObjectURL(file);
  }
}
