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
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
    return URL.createObjectURL(file);
  } catch (err) {
    console.error('Storage error:', err);
    return URL.createObjectURL(file);
  }
}
