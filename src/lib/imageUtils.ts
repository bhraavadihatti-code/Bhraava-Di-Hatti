/**
 * Repairs a JPEG base64 data URI that was truncated (e.g., at 40,000 chars by Google Sheets).
 * It parses the JPEG SOF0 header, DHT Huffman tables, and SOS scan bitstream, counts the exact
 * number of complete MCU rows present, updates the SOF0 image height to match those complete rows,
 * and appends a clean EOI marker (0xFF, 0xD9).
 * Works in both Browser and Node.js using standard Uint8Array.
 */
export function repairTruncatedJpeg(dataUri: string): string {
  if (!dataUri || !dataUri.startsWith('data:image/jpeg;base64,')) {
    return dataUri;
  }

  const prefix = 'data:image/jpeg;base64,';
  const rawB64 = dataUri.slice(prefix.length).trim();

  // Only run deep bitstream inspection if the base64 looks truncated or near the 40k sheet limit
  const validLen = rawB64.length - (rawB64.length % 4);
  const alignedB64 = rawB64.slice(0, validLen);

  // Quick check: if it already ends with /9k= (standard base64 for FF D9), it is a complete JPEG
  if (
    rawB64.length === validLen &&
    (alignedB64.endsWith('/9k=') || alignedB64.endsWith('ffd9'))
  ) {
    return dataUri;
  }

  try {
    let bytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      bytes = new Uint8Array(Buffer.from(alignedB64, 'base64'));
    } else if (typeof atob === 'function') {
      const binStr = atob(alignedB64);
      bytes = new Uint8Array(binStr.length);
      for (let idx = 0; idx < binStr.length; idx++) {
        bytes[idx] = binStr.charCodeAt(idx);
      }
    } else {
      return `${prefix}${alignedB64}`;
    }

    if (bytes.length < 20 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      return dataUri;
    }

    // If it already ends with FF D9 (JPEG End-Of-Image marker), it is a 100% complete JPEG (including Full HD JPEGs!)
    const endsWithEOI = bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    if (endsWithEOI) {
      return dataUri;
    }

    const dht: Record<number, Record<string, number>> = {};
    let width = 0;
    let height = 0;
    let sofHeightOffset = 0;
    let sosOffset = 0;
    let maxH = 1;
    let maxV = 1;
    const comps: Array<{ id: number; h: number; v: number }> = [];

    let i = 2;
    while (i < bytes.length - 4) {
      if (bytes[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = bytes[i + 1];
      if (marker === 0xd9) break;
      if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0xff) {
        i += 2;
        continue;
      }
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      if (i + 2 + len > bytes.length) break;

      if (marker === 0xc0) {
        sofHeightOffset = i + 5;
        height = (bytes[i + 5] << 8) | bytes[i + 6];
        width = (bytes[i + 7] << 8) | bytes[i + 8];
        const ncomp = bytes[i + 9];
        for (let c = 0; c < ncomp; c++) {
          const samp = bytes[i + 11 + c * 3];
          const h = samp >> 4;
          const v = samp & 0x0f;
          if (h > maxH) maxH = h;
          if (v > maxV) maxV = v;
          comps.push({ id: bytes[i + 10 + c * 3], h, v });
        }
      } else if (marker === 0xc4) {
        let pos = i + 4;
        const end = i + 2 + len;
        while (pos < end) {
          const tcTh = bytes[pos++];
          const counts: number[] = [];
          for (let k = 0; k < 16; k++) counts.push(bytes[pos++]);
          const table: Record<string, number> = {};
          let code = 0;
          for (let k = 0; k < 16; k++) {
            for (let j = 0; j < counts[k]; j++) {
              const sym = bytes[pos++];
              table[`${k + 1}:${code}`] = sym;
              code++;
            }
            code <<= 1;
          }
          dht[tcTh] = table;
        }
      } else if (marker === 0xda) {
        sosOffset = i + 2 + len;
        break;
      }
      i += 2 + len;
    }

    if (sofHeightOffset > 0 && sosOffset > 0 && Object.keys(dht).length > 0 && comps.length > 0) {
      const scanBytes: number[] = [];
      const scanBufOffsets: number[] = [];

      for (let p = sosOffset; p < bytes.length; p++) {
        if (bytes[p] === 0xff) {
          if (p + 1 >= bytes.length) break;
          const next = bytes[p + 1];
          if (next === 0x00) {
            scanBytes.push(0xff);
            scanBufOffsets.push(p + 2);
            p++;
          } else if (next === 0xd9) {
            break;
          } else {
            scanBytes.push(0xff);
            scanBufOffsets.push(p + 1);
          }
        } else {
          scanBytes.push(bytes[p]);
          scanBufOffsets.push(p + 1);
        }
      }

      let bitPos = 0;
      const totalBits = scanBytes.length * 8;

      const readBit = (): number => {
        if (bitPos >= totalBits) return -1;
        const b = (scanBytes[bitPos >> 3] >> (7 - (bitPos & 7))) & 1;
        bitPos++;
        return b;
      };

      const decodeSym = (table: Record<string, number> | undefined): number => {
        if (!table) return -2;
        let code = 0;
        for (let len = 1; len <= 16; len++) {
          const bit = readBit();
          if (bit === -1) return -1;
          code = (code << 1) | bit;
          const val = table[`${len}:${code}`];
          if (val !== undefined) return val;
        }
        return -2;
      };

      const decodeBlock = (
        dcTab: Record<string, number> | undefined,
        acTab: Record<string, number> | undefined
      ): boolean => {
        const dcSym = decodeSym(dcTab);
        if (dcSym < 0) return false;
        bitPos += dcSym & 0x0f;
        if (bitPos > totalBits) return false;
        let k = 1;
        while (k < 64) {
          const acSym = decodeSym(acTab);
          if (acSym < 0) return false;
          if (acSym === 0x00) break;
          const r = acSym >> 4;
          const s = acSym & 0x0f;
          k += r + 1;
          bitPos += s;
          if (bitPos > totalBits) return false;
        }
        return true;
      };

      const mcuWidth = maxH * 8;
      const mcuHeight = maxV * 8;
      const mcuCols = Math.ceil(width / mcuWidth);
      const mcuRows = Math.ceil(height / mcuHeight);

      let completedRows = 0;
      let lastValidBitPos = 0;

      for (let r = 0; r < mcuRows; r++) {
        let rowOk = true;
        for (let c = 0; c < mcuCols; c++) {
          for (let compIdx = 0; compIdx < comps.length; compIdx++) {
            const comp = comps[compIdx];
            const dcTab = dht[compIdx === 0 ? 0x00 : 0x01];
            const acTab = dht[compIdx === 0 ? 0x10 : 0x11];
            const blocks = comp.h * comp.v;
            for (let b = 0; b < blocks; b++) {
              if (!decodeBlock(dcTab, acTab)) {
                rowOk = false;
                break;
              }
            }
            if (!rowOk) break;
          }
          if (!rowOk) break;
        }
        if (!rowOk) break;
        completedRows = r + 1;
        lastValidBitPos = bitPos;
      }

      if (completedRows < mcuRows && completedRows > 0) {
        const newHeight = Math.min(height, completedRows * mcuHeight);
        bytes[sofHeightOffset] = (newHeight >> 8) & 0xff;
        bytes[sofHeightOffset + 1] = newHeight & 0xff;

        const lastScanByteIdx = Math.min(scanBytes.length - 1, Math.ceil(lastValidBitPos / 8));
        const cutBufOffset = scanBufOffsets[lastScanByteIdx] || bytes.length;
        const cleanBytes = new Uint8Array(cutBufOffset + 3);
        cleanBytes.set(bytes.subarray(0, cutBufOffset), 0);
        cleanBytes[cutBufOffset] = 0x7f;
        cleanBytes[cutBufOffset + 1] = 0xff;
        cleanBytes[cutBufOffset + 2] = 0xd9;

        if (typeof Buffer !== 'undefined') {
          return `${prefix}${Buffer.from(cleanBytes).toString('base64')}`;
        }
        let binary = '';
        for (let idx = 0; idx < cleanBytes.length; idx++) {
          binary += String.fromCharCode(cleanBytes[idx]);
        }
        return `${prefix}${btoa(binary)}`;
      }
    }

    if (!endsWithEOI) {
      const padded = new Uint8Array(bytes.length + 2);
      padded.set(bytes, 0);
      padded[bytes.length] = 0xff;
      padded[bytes.length + 1] = 0xd9;
      if (typeof Buffer !== 'undefined') {
        return `${prefix}${Buffer.from(padded).toString('base64')}`;
      }
      let binary = '';
      for (let idx = 0; idx < padded.length; idx++) {
        binary += String.fromCharCode(padded[idx]);
      }
      return `${prefix}${btoa(binary)}`;
    }
  } catch {
    // Fallback if anything fails during binary inspection
  }

  return `${prefix}${alignedB64}`;
}

/**
 * Normalizes image URLs, automatically converting share links (such as Google Drive or kommodo.ai)
 * into direct Full HD (=s1600) loadable image URLs, and repairing truncated base64 strings if needed.
 */
export function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('data:image/jpeg;base64,')) {
    return repairTruncatedJpeg(trimmed);
  }

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Upgrade existing Google Drive lh3 CDN links to Full HD (=s1600) if no size parameter is present
  const lh3Match = trimmed.match(/^https:\/\/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)(?:=(.*))?$/);
  if (lh3Match && lh3Match[1]) {
    return `https://lh3.googleusercontent.com/d/${lh3Match[1]}=s1600`;
  }

  // Convert Google Drive share links (e.g. drive.google.com/file/d/ID/view or ?id=ID) into direct Full HD CDN image links
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}=s1600`;
  }
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?.*id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}=s1600`;
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

// In-memory cache mapping a Full HD data URI to its compact Google-Sheets-safe data URI (<= 46,500 chars)
const hdToSheetImageCache = new Map<string, string>();

export function getSheetSafeImage(imageUrl: string): string | undefined {
  if (!imageUrl) return undefined;
  return hdToSheetImageCache.get(imageUrl);
}

/**
 * Multi-step high-quality bicubic canvas downscaler.
 * Stepping down in halves when shrinking high-megapixel phone camera photos (e.g. 4000x3000 -> 1400px)
 * prevents browser single-pass aliasing and keeps fine zari/embroidery threads crystal-clear in HD.
 */
function renderHighQualityCanvas(
  source: CanvasImageSource,
  origWidth: number,
  origHeight: number,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement | null {
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return null;

  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';

  // If the original camera photo is > 2x larger than target, step down progressively for maximum sharpness
  let curWidth = origWidth;
  let curHeight = origHeight;
  let currentSource: CanvasImageSource = source;

  while (curWidth * 0.5 > targetWidth * 1.15 && curHeight * 0.5 > targetHeight * 1.15) {
    const nextW = Math.max(targetWidth, Math.round(curWidth * 0.5));
    const nextH = Math.max(targetHeight, Math.round(curHeight * 0.5));
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext('2d');
    if (!stepCtx) break;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.fillStyle = '#FFFFFF';
    stepCtx.fillRect(0, 0, nextW, nextH);
    stepCtx.drawImage(currentSource, 0, 0, nextW, nextH);
    currentSource = stepCanvas;
    curWidth = nextW;
    curHeight = nextH;
  }

  finalCtx.fillStyle = '#FFFFFF';
  finalCtx.fillRect(0, 0, targetWidth, targetHeight);
  finalCtx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);
  return finalCanvas;
}

/**
 * Encodes an image source into a crystal-clear Full HD JPEG data URI (up to 1400px @ 0.90 quality)
 * for the Home Page and Suit Detail Zoom view.
 */
function encodeToHighDefinitionBase64(
  source: CanvasImageSource,
  origWidth: number,
  origHeight: number,
  initialMaxDim = 1400,
  initialQuality = 0.90,
  maxAllowedChars = 480000
): string {
  let maxDim = initialMaxDim;
  let quality = initialQuality;
  let result = '';

  for (let step = 0; step < 6; step++) {
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

    const canvas = renderHighQualityCanvas(source, origWidth, origHeight, width, height);
    if (!canvas) break;

    result = canvas.toDataURL('image/jpeg', quality);
    if (result.length <= maxAllowedChars) {
      return result;
    }

    maxDim = Math.max(900, Math.round(maxDim * 0.88));
    quality = Math.max(0.78, Number((quality - 0.04).toFixed(2)));
  }

  return result;
}

/**
 * Encodes an image source into a Google-Sheets-safe JPEG (strictly <= 46,500 chars)
 * with high-quality bicubic smoothing so the single-cell Sheet copy also stays sharp and never truncates.
 */
function encodeToSheetSafeBase64(
  source: CanvasImageSource,
  origWidth: number,
  origHeight: number,
  maxAllowedChars = 46500
): string {
  let maxDim = 820;
  let quality = 0.80;
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

    const canvas = renderHighQualityCanvas(source, origWidth, origHeight, width, height);
    if (!canvas) break;

    result = canvas.toDataURL('image/jpeg', quality);
    if (result.length <= maxAllowedChars) {
      return result;
    }

    maxDim = Math.max(420, Math.round(maxDim * 0.86));
    quality = Math.max(0.55, Number((quality - 0.05).toFixed(2)));
  }

  return result;
}

/**
 * Image compression utility to convert raw camera/file uploads into a
 * Crystal-Clear Full HD JPEG (1400px @ 90% quality) for the Home Page & Product Modal,
 * while also caching a Google-Sheets-safe companion copy in memory.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.90
): Promise<string> {
  const targetMaxDim = Math.max(maxWidth, maxHeight, 1280);
  const targetQuality = Math.max(quality, 0.88);

  return new Promise((resolve) => {
    if ('createImageBitmap' in window) {
      createImageBitmap(file)
        .then((bitmap) => {
          const hdBase64 = encodeToHighDefinitionBase64(
            bitmap,
            bitmap.width,
            bitmap.height,
            targetMaxDim,
            targetQuality,
            480000
          );
          const sheetBase64 = encodeToSheetSafeBase64(bitmap, bitmap.width, bitmap.height, 46500);
          bitmap.close();
          if (hdBase64) {
            if (sheetBase64) {
              hdToSheetImageCache.set(hdBase64, sheetBase64);
            }
            resolve(hdBase64);
            return;
          }
          fallbackCompress(file, targetMaxDim, targetQuality, resolve);
        })
        .catch(() => {
          fallbackCompress(file, targetMaxDim, targetQuality, resolve);
        });
    } else {
      fallbackCompress(file, targetMaxDim, targetQuality, resolve);
    }
  });
}

function fallbackCompress(
  file: File,
  maxDim: number,
  quality: number,
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
    const hdBase64 = encodeToHighDefinitionBase64(img, img.width, img.height, maxDim, quality, 480000);
    const sheetBase64 = encodeToSheetSafeBase64(img, img.width, img.height, 46500);
    if (hdBase64) {
      if (sheetBase64) {
        hdToSheetImageCache.set(hdBase64, sheetBase64);
      }
      resolve(hdBase64);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  };
  img.src = objectUrl;
}

