const fs = require('fs');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');
const { execSync } = require('child_process');

function makeCornersRounded(pngPath, outPngPath, outJpgPath) {
  console.log(`Processing rounded corners for: ${pngPath}`);
  const data = fs.readFileSync(pngPath);
  const png = PNG.sync.read(data);
  const W = png.width;
  const H = png.height;

  // Exact plate bounds
  const left = 75;
  const right = 1196;
  const top = 74;
  const bottom = 799;
  const R = 52; // Circular corner radius

  // Sample background color outside plate (from x=40, y=40)
  const bgIdx = (40 * W + 40) * 4;
  const bgR = png.data[bgIdx];     // ~242
  const bgG = png.data[bgIdx+1];   // ~244
  const bgB = png.data[bgIdx+2];   // ~241

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let isCorner = false;
      let dist = 0;

      // Top-Left Corner
      if (x < left + R && y < top + R) {
        isCorner = true;
        const dx = (left + R) - x;
        const dy = (top + R) - y;
        dist = Math.sqrt(dx * dx + dy * dy);
      }
      // Top-Right Corner
      else if (x > right - R && y < top + R) {
        isCorner = true;
        const dx = x - (right - R);
        const dy = (top + R) - y;
        dist = Math.sqrt(dx * dx + dy * dy);
      }
      // Bottom-Left Corner
      else if (x < left + R && y > bottom - R) {
        isCorner = true;
        const dx = (left + R) - x;
        const dy = y - (bottom - R);
        dist = Math.sqrt(dx * dx + dy * dy);
      }
      // Bottom-Right Corner
      else if (x > right - R && y > bottom - R) {
        isCorner = true;
        const dx = x - (right - R);
        const dy = y - (bottom - R);
        dist = Math.sqrt(dx * dx + dy * dy);
      }

      if (isCorner) {
        const idx = (y * W + x) * 4;
        if (dist > R + 3) {
          // Completely outside: pure white/light paper background
          png.data[idx] = bgR;
          png.data[idx+1] = bgG;
          png.data[idx+2] = bgB;
        } else if (dist > R - 1) {
          // Smooth anti-aliased edge + subtle dark die-cut bevel shadow
          const t = (dist - (R - 1)) / 4.0; // 0 at inside, 1 at outside
          // Soft shadow tone around edge
          const shadowR = Math.round(bgR * 0.88);
          const shadowG = Math.round(bgG * 0.88);
          const shadowB = Math.round(bgB * 0.86);

          if (t < 0.5) {
            // inside bevel transition
            const subT = t / 0.5;
            png.data[idx] = Math.round(png.data[idx] * (1 - subT) + shadowR * subT);
            png.data[idx+1] = Math.round(png.data[idx+1] * (1 - subT) + shadowG * subT);
            png.data[idx+2] = Math.round(png.data[idx+2] * (1 - subT) + shadowB * subT);
          } else {
            // outside shadow to background transition
            const subT = (t - 0.5) / 0.5;
            png.data[idx] = Math.round(shadowR * (1 - subT) + bgR * subT);
            png.data[idx+1] = Math.round(shadowG * (1 - subT) + bgG * subT);
            png.data[idx+2] = Math.round(shadowB * (1 - subT) + bgB * subT);
          }
        }
      }
    }
  }

  // Verify QR scan
  const scan = jsQR(new Uint8ClampedArray(png.data), W, H);
  console.log(`Scan verification after rounded corners (${pngPath}):`, scan ? `✅ SUCCESS! (${scan.data})` : '❌ Failed');

  // Write updated PNG
  fs.writeFileSync(outPngPath, PNG.sync.write(png));
  // Convert to JPG
  execSync(`ffmpeg -y -i ${outPngPath} -q:v 1 ${outJpgPath}`);
}

// 1. Process Gold Sticker
makeCornersRounded(
  'public/assets/bhraava_di_hatti_gold_sticker.png',
  'public/assets/bhraava_di_hatti_gold_sticker.png',
  'public/assets/bhraava_di_hatti_gold_sticker.jpg'
);

// 2. Process Badge Sticker
makeCornersRounded(
  'public/assets/bhraava_di_hatti_badge_sticker.png',
  'public/assets/bhraava_di_hatti_badge_sticker.png',
  'public/assets/bhraava_di_hatti_badge_sticker.jpg'
);

// 3. Sync to finals and artifacts
execSync('cp public/assets/bhraava_di_hatti_gold_sticker.png public/assets/bhraava_di_hatti_sticker_final.png');
execSync('cp public/assets/bhraava_di_hatti_gold_sticker.png public/assets/bhraava_di_hatti_sticker_final_print.png');
execSync('cp public/assets/bhraava_di_hatti_gold_sticker.jpg public/assets/bhraava_di_hatti_sticker_final.jpg');
execSync('cp public/assets/bhraava_di_hatti_gold_sticker.jpg public/assets/bhraava_di_hatti_sticker_final_print.jpg');
execSync('cp public/assets/bhraava_di_hatti_gold_sticker.jpg .aistudio/artifacts/brain/c9bbc2ef-f95c-4e7c-aa01-df8aafc449d8/bhraava_di_hatti_sticker_ready_print.jpg');
execSync('cp public/assets/bhraava_di_hatti_badge_sticker.jpg .aistudio/artifacts/brain/c9bbc2ef-f95c-4e7c-aa01-df8aafc449d8/bhraava_di_hatti_sticker_white_badge.jpg');

console.log('🎉 ALL ROUNDED CORNER STICKERS GENERATED SUCCESSFULLY!');
