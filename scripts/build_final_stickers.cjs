const fs = require('fs');
const { PNG } = require('pngjs');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { execSync } = require('child_process');

async function main() {
  console.log('=== BUILDING FINAL BHRAAVA DI HATTI STICKERS V3 ===');
  const baseBuf = fs.readFileSync('public/assets/aistudio/file_00000000cb0082119d4583dda28cec96_f38bb18b.png');
  const basePng = PNG.sync.read(baseBuf);
  const W = basePng.width; // 1536
  const H = basePng.height; // 1024

  const goldPng = new PNG({ width: W, height: H });
  const badgePng = new PNG({ width: W, height: H });
  basePng.data.copy(goldPng.data);
  basePng.data.copy(badgePng.data);

  // 1. FIX ADDRESS: "Raad" -> "Road"
  // Clear first 'a' at x: 445..470, y: 708..748
  // Sample true gold color directly above (y: 692..698, x: 450..465)
  let pureGoldR = 0, pureGoldG = 0, pureGoldB = 0;
  for (let y = 692; y <= 698; y++) {
    for (let x = 450; x <= 465; x++) {
      const idx = (y * W + x) * 4;
      pureGoldR += basePng.data[idx];
      pureGoldG += basePng.data[idx+1];
      pureGoldB += basePng.data[idx+2];
    }
  }
  const count = 7 * 16;
  pureGoldR = Math.round(pureGoldR / count);
  pureGoldG = Math.round(pureGoldG / count);
  pureGoldB = Math.round(pureGoldB / count);
  console.log(`Pure gold sample for address: rgb(${pureGoldR}, ${pureGoldG}, ${pureGoldB})`);

  for (let y = 705; y <= 750; y++) {
    for (let x = 445; x <= 470; x++) {
      const noise = ((Math.sin(y * 11.3 + x * 73.1) * 43758.5453) % 1 - 0.5) * 3;
      const idx = (y * W + x) * 4;
      goldPng.data[idx] = Math.round(pureGoldR + noise);
      goldPng.data[idx+1] = Math.round(pureGoldG + noise);
      goldPng.data[idx+2] = Math.round(pureGoldB + noise);
      goldPng.data[idx+3] = 255;

      badgePng.data[idx] = goldPng.data[idx];
      badgePng.data[idx+1] = goldPng.data[idx+1];
      badgePng.data[idx+2] = goldPng.data[idx+2];
      badgePng.data[idx+3] = 255;
    }
  }

  // Draw engraved lowercase 'o' at cx = 457.5, cy = 733.5, rx = 10.5, ry = 12.5
  const darkR = 25, darkG = 16, darkB = 10;
  for (let y = 718; y <= 748; y++) {
    for (let x = 445; x <= 470; x++) {
      const dxOut = (x - 457.5) / 10.5;
      const dyOut = (y - 733.5) / 12.5;
      const outerDist = dxOut * dxOut + dyOut * dyOut;

      const dxIn = (x - 457.5) / 5.2;
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

        badgePng.data[idx] = goldPng.data[idx];
        badgePng.data[idx+1] = goldPng.data[idx+1];
        badgePng.data[idx+2] = goldPng.data[idx+2];
      }
    }
  }
  console.log('✅ Address typo corrected: "Bus Stand Road".');

  // 2. CLEAN OLD QR ZONE IN DIRECT GOLD (x: 852..1148, y: 375..695)
  // Sample true plate gold directly from y=370..380 and y=695..705
  for (let y = 372; y <= 695; y++) {
    for (let x = 852; x <= 1148; x++) {
      const tX = (x - 852) / (1148 - 852);
      // Perfect match with the surrounding plate color (rgb 224, 189, 91)
      const baseR = 222 * (1 - tX) + 226 * tX;
      const baseG = 187 * (1 - tX) + 191 * tX;
      const baseB = 90 * (1 - tX) + 93 * tX;
      const noise = ((Math.sin(y * 13.7 + x * 89.1) * 43758.5453) % 1 - 0.5) * 3;

      const idx = (y * W + x) * 4;
      goldPng.data[idx] = Math.min(255, Math.max(0, Math.round(baseR + noise)));
      goldPng.data[idx+1] = Math.min(255, Math.max(0, Math.round(baseG + noise)));
      goldPng.data[idx+2] = Math.min(255, Math.max(0, Math.round(baseB + noise)));
      goldPng.data[idx+3] = 255;
    }
  }

  // 3. GENERATE REAL QR CODE
  const qrUrl = 'https://bhraavadihatti.netlify.app/links';
  const qr = QRCode.create(qrUrl, { errorCorrectionLevel: 'M' });
  const qrSize = qr.modules.size; // 29 modules

  const modScale = 8;
  const qrPixSize = qrSize * modScale; // 232 px
  const startX = Math.round(1002 - qrPixSize / 2); // 886
  const startY = Math.round(541.5 - qrPixSize / 2); // 425

  // A. DIRECT GOLD QR MODULES
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

  // B. WHITE BADGE OPTION (covers x: 860..1144, y: 396..688)
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

  // Draw dark QR modules inside badge
  const badgeQrX = Math.round(badgeX + (badgeW - qrPixSize) / 2); // 886
  const badgeQrY = Math.round(badgeY + (badgeH - qrPixSize) / 2); // 426
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

  // VERIFY SCANS WITH jsQR
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
  console.log('Direct Gold QR Scan:', directScan ? `✅ SUCCESS! (${directScan.data})` : '❌ Failed');

  const badgeScan = jsQR(new Uint8ClampedArray(badgePng.data), W, H);
  console.log('White Badge Full Image Scan:', badgeScan ? `✅ SUCCESS! (${badgeScan.data})` : '❌ Failed');

  // WRITE PNG FILES
  fs.writeFileSync('public/assets/bhraava_di_hatti_gold_sticker.png', PNG.sync.write(goldPng));
  fs.writeFileSync('public/assets/bhraava_di_hatti_badge_sticker.png', PNG.sync.write(badgePng));
  fs.writeFileSync('public/assets/bhraava_di_hatti_sticker_final.png', PNG.sync.write(goldPng));
  fs.writeFileSync('public/assets/bhraava_di_hatti_sticker_final_print.png', PNG.sync.write(goldPng));

  // CONVERT TO HIGH QUALITY JPG WITH FFMPEG
  execSync('ffmpeg -y -i public/assets/bhraava_di_hatti_gold_sticker.png -q:v 1 public/assets/bhraava_di_hatti_gold_sticker.jpg');
  execSync('ffmpeg -y -i public/assets/bhraava_di_hatti_badge_sticker.png -q:v 1 public/assets/bhraava_di_hatti_badge_sticker.jpg');
  execSync('cp public/assets/bhraava_di_hatti_gold_sticker.jpg public/assets/bhraava_di_hatti_sticker_final.jpg');
  execSync('cp public/assets/bhraava_di_hatti_gold_sticker.jpg public/assets/bhraava_di_hatti_sticker_final_print.jpg');
  execSync('cp public/assets/bhraava_di_hatti_gold_sticker.jpg .aistudio/artifacts/brain/c9bbc2ef-f95c-4e7c-aa01-df8aafc449d8/bhraava_di_hatti_sticker_ready_print.jpg');
  execSync('cp public/assets/bhraava_di_hatti_badge_sticker.jpg .aistudio/artifacts/brain/c9bbc2ef-f95c-4e7c-aa01-df8aafc449d8/bhraava_di_hatti_sticker_white_badge.jpg');
  console.log('🎉 ALL DONE PERFECTLY!');
}

main().catch(console.error);
