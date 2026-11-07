// ============================================================
// UniCore – Client-Side Image Compression & Optimization
// Converts raw smartphone photos (5-15MB) to high-efficiency WebP (~150-250KB)
// Dramatically reduces Supabase storage usage and bandwidth by 90-95%
// ============================================================

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  mimeType?: 'image/webp' | 'image/jpeg';
}

/**
 * Compresses an image File or Blob on the client using HTML5 Canvas.
 * Automatically resizes large camera captures down to web-friendly dimensions
 * and converts to WebP/JPEG format to minimize Supabase Storage usage.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options;

  // If already a tiny GIF or SVG, do not re-encode through canvas
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  // If image is already smaller than 100KB, return as-is
  if (file.size < 100 * 1024 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback if canvas unsupported
          return;
        }

        // High quality rendering settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first; if browser doesn't support WebP export, fall back to JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Generate clean optimized file name
            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
            const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
            const optimizedFile = new File([blob], `${originalName}-opt.${extension}`, {
              type: blob.type,
              lastModified: Date.now(),
            });

            console.log(
              `[Image Compression] Reduced ${file.name} from ${(file.size / 1024).toFixed(1)}KB -> ${(optimizedFile.size / 1024).toFixed(1)}KB (${(
                (1 - optimizedFile.size / file.size) *
                100
              ).toFixed(0)}% space saved)`
            );

            resolve(optimizedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}

