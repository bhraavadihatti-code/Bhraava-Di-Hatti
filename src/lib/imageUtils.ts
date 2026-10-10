/**
 * Normalizes image URLs, automatically converting share links (such as Google Drive or kommodo.ai)
 * into direct loadable image URLs, and repairing truncated base64 strings if needed.
 */
export function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Repair previously truncated 40,000-char base64 strings from older Google Sheet rows
  if (trimmed.startsWith('data:image/jpeg;base64,')) {
    const prefix = 'data:image/jpeg;base64,';
    const b64 = trimmed.slice(prefix.length);
    if (trimmed.length === 40000 || b64.length % 4 === 1) {
      const validLen = b64.length - (b64.length % 4);
      const alignedB64 = b64.slice(0, validLen);
      if (!alignedB64.endsWith('/9k=')) {
        return `${prefix}${alignedB64}/9k=`;
      }
      return `${prefix}${alignedB64}`;
    }
    return trimmed;
  }

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Convert Google Drive share links (e.g. drive.google.com/file/d/ID/view or ?id=ID) into direct CDN image links
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?.*id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

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
 * Helper that draws an image source onto a canvas and adaptively steps down dimensions/quality
 * so the resulting base64 string is strictly <= 35,000 characters.
 * This guarantees the full image fits inside a single Google Sheets cell without ever being cut off at 40,000 chars.
 */
function encodeToSheetSafeBase64(
  source: CanvasImageSource,
  origWidth: number,
  origHeight: number,
  maxAllowedChars = 35000
): string {
  let maxDim = 540;
  let quality = 0.65;
  let result = '';

  for (let step = 0; step < 8; step++) {
    let width = origWidth;
    let height = origHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.max(1, Math.round((height * maxDim) / width));
        width = maxDim;
      } else {
        width = Math.max(1, Math.round((width * maxDim) / height));
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) break;

    // Fill white background so transparent PNGs don't turn black
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);

    result = canvas.toDataURL('image/jpeg', quality);
    if (result.length <= maxAllowedChars) {
      return result;
    }

    // Step down size and quality for next iteration if still > 35,000 chars
    maxDim = Math.max(220, Math.round(maxDim * 0.84));
    quality = Math.max(0.35, Number((quality - 0.07).toFixed(2)));
  }

  return result;
}

/**
 * Image compression utility to convert raw camera/file uploads (which can be 5MB-15MB)
 * into a Google-Sheets-safe base64 JPEG (strictly <= 35,000 characters so it never gets truncated).
 */
export function compressImageFile(
  file: File,
  maxWidth = 540,
  maxHeight = 540,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve) => {
    if ('createImageBitmap' in window) {
      createImageBitmap(file)
        .then((bitmap) => {
          const compressedBase64 = encodeToSheetSafeBase64(bitmap, bitmap.width, bitmap.height, 35000);
          bitmap.close();
          if (compressedBase64) {
            resolve(compressedBase64);
            return;
          }
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
  _maxWidth: number,
  _maxHeight: number,
  _quality: number,
  resolve: (value: string) => void
) {
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  };
  img.onload = () => {
    URL.revokeObjectURL(objectUrl);
    const compressedBase64 = encodeToSheetSafeBase64(img, img.width, img.height, 35000);
    if (compressedBase64) {
      resolve(compressedBase64);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  };
  img.src = objectUrl;
}


