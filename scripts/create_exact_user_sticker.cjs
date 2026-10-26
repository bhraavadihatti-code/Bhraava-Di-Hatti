const fs = require('fs');
const { PNG } = require('pngjs');
const QRCode = require('qrcode');
const jsQR = require('jsqr');

async function main() {
  console.log('--- GENERATING PIXEL-PERFECT EXACT USER STICKER ---');
  // Always load from the pristine master PNG
  const baseBuf = fs.readFileSync('public/assets/aistudio/file_00000000cb0082119d4583dda28cec96_f38bb18b.png');
  const basePng = PNG.sync.read(baseBuf);
  const W = basePng.width; // 1536
  const H = basePng.height; // 1024

  // Work copies
  const goldPng = new PNG({ width: W, height: H });
  basePng.data.copy(goldPng.data);

  // 1. FIX ADDRESS: "Raad" -> "Road"
  // "Bus Stand" is at x: 190..385 (DO NOT TOUCH!)
  // "Raad" is at x: 395..500
  // R is at x: 395..417
  // First 'a' is at x: 422..447
  // Second 'a' is at x: 450..473
  // 'd' is at x: 477..500
  // We replace the first 'a' (x: 422..447) with an 'o' (ellipse)
  // First clear the first 'a' with local background
  for (let y = 705; y <= 750; y++) {
    // sample local gold at x=419
    const idxSample = (y * W + 419) * 4;
    const bgR = basePng.data[idxSample];
    const bgG = basePng.data[idxSample+1];
    const bgB = basePng.data[idxSample+2];
    for (let x = 421; x <= 448; x++) {
      const idx = (y * W + x) * 4;
      goldPng.data[idx] = bgR;
      goldPng.data[idx+1] = bgG;
      goldPng.data[idx+2] = bgB;
      goldPng.data[idx+3] = 255;
    }
  }

  // Draw engraved lowercase 'o' at x: 422..447, y: 720..746
  // Outer ellipse: center = (434.5, 733.5), rx = 10.0, ry = 12.5
  // Inner ellipse: center = (434.5, 733.5), rx = 5.0, ry = 7.5
  const darkR = 25, darkG = 16, darkB = 10;
  for (let y = 718; y <= 748; y++) {
    for (let x = 422; x <= 448; x++) {
      const dxOut = (x - 434.5) / 10.2;
      const dyOut = (y - 733.5) / 12.6;
      const outerDist = dxOut * dxOut + dyOut * dyOut;

      const dxIn = (x - 434.5) / 5.0;
      const dyIn = (y - 733.5) / 7.6;
      const innerDist = dxIn * dxIn + dyIn * dyIn;

      if (outerDist <= 1.05 && innerDist >= 0.85) {
        let alpha = 1.0;
        if (outerDist > 0.85) alpha = (1.05 - outerDist) / 0.2;
        if (innerDist < 1.05) alpha = Math.min(alpha, (innerDist - 0.85) / 0.2);
        alpha = Math.max(0, Math.min(1, alpha));

        const idx = (y * W + x) * 4;
        goldPng.data[idx] = Math.round(darkR * alpha + goldPng.data[idx] * (1 - alpha));
        goldPng.data[idx+1] = Math.round(darkG * alpha + goldPng.data[idx+1] * (1 - alpha));
        goldPng.data[idx+2] = Math.round(darkB * alpha + goldPng.data[idx+2] * (1 - alpha));
      }
    }
  }
  console.log('Fixed address typo: "Raad" -> "Road" (Stand left intact).');

  // 2. CLEAN OLD QR ZONE (x: 855..1148, y: 360..695)
  for (let y = 358; y <= 698; y++) {
    // Sample 5 pixels on left: x=845..849
    let leftR = 0, leftG = 0, leftB = 0;
    for (let x = 845; x <= 849; x++) {
      const idx = (y * W + x) * 4;
      leftR += basePng.data[idx];
      leftG += basePng.data[idx+1];
      leftB += basePng.data[idx+2];
    }
    leftR /= 5; leftG /= 5; leftB /= 5;

    // Sample 5 pixels on right: x=1152..1156
    let rightR = 0, rightG = 0, rightB = 0;
    for (let x = 1152; x <= 1156; x++) {
      const idx = (y * W + x) * 4;
      rightR += basePng.data[idx];
      rightG += basePng.data[idx+1];
      rightB += basePng.data[idx+2];
    }
    rightR /= 5; rightG /= 5; rightB /= 5;

    const xStart = 852;
    const xEnd = 1150;
    for (let x = xStart; x <= xEnd; x++) {
      const t = (x - xStart) / (xEnd - xStart);
      const bgR = leftR * (1 - t) + rightR * t;
      const bgG = leftG * (1 - t) + rightG * t;
      const bgB = leftB * (1 - t) + rightB * t;
      const noise = ((Math.sin(y * 13.7 + x * 89.1) * 43758.5453) % 1 - 0.5) * 3;

      const idx = (y * W + x) * 4;
      goldPng.data[idx] = Math.min(255, Math.max(0, Math.round(bgR + noise)));
      goldPng.data[idx+1] = Math.min(255, Math.max(0, Math.round(bgG + noise)));
      goldPng.data[idx+2] = Math.min(255, Math.max(0, Math.round(bgB + noise)));
      goldPng.data[idx+3] = 255;
    }
  }

  // 3. GENERATE QR CODE
  const qrUrl = 'https://bhraavadihatti.netlify.app/links';
  const qr = QRCode.create(qrUrl, { errorCorrectionLevel: 'M' });
  const qrSize = qr.modules.size; // 29 modules

  // Center in the exact old QR bounding box:
  // Old QR was x: 866..1138 (center = 1002), y: 402..681 (center = 541.5)
  const modScale = 8;
  const qrPixSize = qrSize * modScale; // 232 px
  const startX = Math.round(1002 - qrPixSize / 2); // 886
  const startY = Math.round(541.5 - qrPixSize / 2); // 425

  // Draw dark modules onto gold surface
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (qr.modules.get(c, r)) {
        const px = startX + c * modScale;
        const py = startY + r * modScale;
        for (let dy = 0; dy < modScale; dy++) {
          for (let dx = 0; dx < modScale; dx++) {
            const idx = ((py + dy) * W + (px + dx)) * 4;
            goldPng.data[idx] = 16;
            goldPng.data[idx+1] = 10;
            goldPng.data[idx+2] = 6;
            goldPng.data[idx+3] = 255;
          }
        }
      }
    }
  }

  // Test scan on crop
  const cropX = startX - 25;
  const cropY = startY - 25;
  const cropW = qrPixSize + 50;
  const cropH = qrPixSize + 50;
  const crop = new Uint8ClampedArray(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const src = ((cropY + y) * W + (cropX + x)) * 4;
      const dst = (y * cropW + x) * 4;
      crop[dst] = goldPng.data[src];
      crop[dst+1] = goldPng.data[src+1];
      crop[dst+2] = goldPng.data[src+2];
      crop[dst+3] = 255;
    }
  }
  const directScan = jsQR(crop, cropW, cropH);
  console.log('Direct Gold QR Scan (with margin):', directScan ? `✅ SUCCESS! (${directScan.data})` : '❌ Failed');

  fs.writeFileSync('public/assets/bhraava_di_hatti_gold_sticker.png', PNG.sync.write(goldPng));
  fs.writeFileSync('public/assets/bhraava_di_hatti_sticker_final.png', PNG.sync.write(goldPng));
  fs.writeFileSync('public/assets/bhraava_di_hatti_sticker_final_print.png', PNG.sync.write(goldPng));

  // 4. CREATE WHITE BADGE VERSION (covers entire old QR box completely)
  const badgePng = new PNG({ width: W, height: H });
  basePng.data.copy(badgePng.data);

  // Copy corrected "Road"
  for (let y = 705; y <= 750; y++) {
    for (let x = 390; x <= 505; x++) {
      const idx = (y * W + x) * 4;
      badgePng.data[idx] = goldPng.data[idx];
      badgePng.data[idx+1] = goldPng.data[idx+1];
      badgePng.data[idx+2] = goldPng.data[idx+2];
    }
  }

  // White badge covering x: 860..1144, y: 396..688 (covers entire old AI QR box)
  const badgeX = 860;
  const badgeY = 396;
  const badgeW = 284;
  const badgeH = 292;
  const badgeRadius = 14;

  for (let y = badgeY; y <= badgeY + badgeH; y++) {
    for (let x = badgeX; x <= badgeX + badgeW; x++) {
      let inside = true;
      const cornerDX = Math.max(0, Math.max(badgeX + badgeRadius - x, x - (badgeX + badgeW - badgeRadius)));
      const cornerDY = Math.max(0, Math.max(badgeY + badgeRadius - y, y - (badgeY + badgeH - badgeRadius)));
      if (cornerDX > 0 && cornerDY > 0) {
        if (cornerDX * cornerDX + cornerDY * cornerDY > badgeRadius * badgeRadius) {
          inside = false;
        }
      }

      if (inside) {
        const isBorder = (x <= badgeX + 2 || x >= badgeX + badgeW - 2 || y <= badgeY + 2 || y >= badgeY + badgeH - 2);
        const idx = (y * W + x) * 4;
        if (isBorder) {
          badgePng.data[idx] = 180;
          badgePng.data[idx+1] = 140;
          badgePng.data[idx+2] = 60;
        } else {
          badgePng.data[idx] = 255;
          badgePng.data[idx+1] = 255;
          badgePng.data[idx+2] = 255;
        }
      }
    }
  }

  // Draw dark QR modules inside badge (centered in badge)
  const badgeQrX = Math.round(badgeX + (badgeW - qrPixSize) / 2); // 860 + 26 = 886
  const badgeQrY = Math.round(badgeY + (badgeH - qrPixSize) / 2); // 396 + 30 = 426

  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (qr.modules.get(c, r)) {
        const px = badgeQrX + c * modScale;
        const py = badgeQrY + r * modScale;
        for (let dy = 0; dy < modScale; dy++) {
          for (let dx = 0; dx < modScale; dx++) {
            const idx = ((py + dy) * W + (px + dx)) * 4;
            badgePng.data[idx] = 16;
            badgePng.data[idx+1] = 10;
            badgePng.data[idx+2] = 6;
          }
        }
      }
    }
  }

  const badgeScan = jsQR(new Uint8ClampedArray(badgePng.data), W, H);
  console.log('Full image White Badge Scan verification:', badgeScan ? `✅ SUCCESS! (${badgeScan.data})` : '❌ Failed');

  fs.writeFileSync('public/assets/bhraava_di_hatti_badge_sticker.png', PNG.sync.write(badgePng));
  console.log('--- ALL FILES WRITTEN SUCCESSFULLY ---');
}

main().catch(console.error);
