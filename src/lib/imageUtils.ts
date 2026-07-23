/**
 * Normalizes image URLs, automatically converting share links (such as kommodo.ai/i/...)
 * into direct CDN image URLs.
 */
export function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const kommodoMatch = trimmed.match(/kommodo\.ai\/i\/([a-zA-Z0-9_-]+)/);
  if (kommodoMatch) {
    const id = kommodoMatch[1];
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `https://plain-apac-prod-public.komododecks.com/${yyyy}${mm}/${dd}/${id}/image.png`;
  }
  return trimmed;
}

/**
 * Image compression utility to convert raw camera/file uploads (which can be 5MB-15MB)
 * into lightweight, crystal-clear base64 images (~60KB - 120KB).
 */
export function compressImageFile(
  file: File, 
  maxWidth = 800, 
  maxHeight = 800, 
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // Try createImageBitmap first (modern fast path)
    if ('createImageBitmap' in window) {
      createImageBitmap(file)
        .then((bitmap) => {
          let width = bitmap.width;
          let height = bitmap.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            bitmap.close();
            resolve(compressedBase64);
            return;
          }
          bitmap.close();
          fallbackCompress(file, maxWidth, maxHeight, quality, resolve);
        })
        .catch(() => {
          fallbackCompress(file, maxWidth, maxHeight, quality, resolve);
        });
    } else {
      fallbackCompress(file, maxWidth, maxHeight, quality, resolve);
    }
  });
}

function fallbackCompress(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  resolve: (value: string) => void
) {
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    // Fallback reader
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  };
  img.onload = () => {
    URL.revokeObjectURL(objectUrl);
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      if (width > height) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(file);
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);
    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
    resolve(compressedBase64);
  };
  img.src = objectUrl;
}

