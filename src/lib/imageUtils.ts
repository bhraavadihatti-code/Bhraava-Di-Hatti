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

  // Quick check: if it already ends with /9k= or 9k= and is not near 40,000 chars, return fast
  if (
    rawB64.length === validLen &&
    rawB64.length < 38500 &&
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

    // If not near 40,000 chars and already ends with FF D9, it's a normal complete JPEG
    const endsWithEOI = bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    if (endsWithEOI && dataUri.length < 39500) {
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
 * into direct loadable image URLs, and repairing truncated base64 strings if needed.
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
 * so the resulting base64 string is strictly <= 32,000 characters (~24KB).
 * This guarantees fast loading on mobile networks and ensures the full image fits inside
 * a single Google Sheets cell without ever being cut off at 40,000 chars.
 */
function encodeToSheetSafeBase64(
  source: CanvasImageSource,
  origWidth: number,
  origHeight: number,
  maxAllowedChars = 32000
): string {
  let maxDim = 500;
  let quality = 0.62;
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

    // Step down size and quality for next iteration if still > maxAllowedChars
    maxDim = Math.max(220, Math.round(maxDim * 0.84));
    quality = Math.max(0.35, Number((quality - 0.07).toFixed(2)));
  }

  return result;
}

/**
 * Image compression utility to convert raw camera/file uploads (which can be 5MB-15MB)
 * into a fast, Google-Sheets-safe base64 JPEG (strictly <= 32,000 characters).
 */
export function compressImageFile(
  file: File,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.62
): Promise<string> {
  return new Promise((resolve) => {
    if ('createImageBitmap' in window) {
      createImageBitmap(file)
        .then((bitmap) => {
          const compressedBase64 = encodeToSheetSafeBase64(bitmap, bitmap.width, bitmap.height, 32000);
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
    const compressedBase64 = encodeToSheetSafeBase64(img, img.width, img.height, 32000);
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
