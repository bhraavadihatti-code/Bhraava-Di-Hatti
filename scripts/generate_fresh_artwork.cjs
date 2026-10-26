const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

async function generateArtwork() {
  console.log('Generating pixel-perfect fresh graphic sticker artwork...');

  const URL = 'https://bhraavadihatti.netlify.app/links';
  
  // Generate QR Code matrix
  const qrData = QRCode.create(URL, { errorCorrectionLevel: 'H' });
  const qrModules = qrData.modules;
  const qrSize = qrModules.size;

  // Dimensions: 2400 x 1400 (aspect ratio ~1.714, standard 3.5" x 2.05" visiting card / metallic sticker size)
  const W = 2400;
  const H = 1400;

  // QR placement & sizing:
  // Placed at x: 1310, y: 360, size: 480x480
  const qrX = 1310;
  const qrY = 360;
  const qrBox = 480;
  const cellSize = qrBox / qrSize;

  let qrRects = '';
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (qrModules.get(r, c)) {
        const x = (qrX + c * cellSize).toFixed(2);
        const y = (qrY + r * cellSize).toFixed(2);
        const w = (cellSize + 0.35).toFixed(2);
        const h = (cellSize + 0.35).toFixed(2);
        qrRects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#160e04" />\n`;
      }
    }
  }

  // Bracket and arrow coordinates:
  // Bracket spine at x: 1845
  // Arrows go to x: 1940
  // Icons centered at x: 2045, Y centers: 415, 555, 695, 835
  const iconY = [415, 555, 695, 835];
  const arrowStartX = 1845;
  const arrowEndX = 1935;
  const iconCenterX = 2045;

  function buildSVG(variant) {
    const isBadge = variant === 'badge';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <!-- Brushed Gold Multi-Stop Metallic Gradient -->
    <linearGradient id="goldPlate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f6e4a4" />
      <stop offset="10%" stop-color="#ecd07c" />
      <stop offset="22%" stop-color="#fbf3d2" />
      <stop offset="38%" stop-color="#dbb85a" />
      <stop offset="52%" stop-color="#edd688" />
      <stop offset="68%" stop-color="#c99f36" />
      <stop offset="84%" stop-color="#fbf1cb" />
      <stop offset="100%" stop-color="#d9b657" />
    </linearGradient>

    <!-- Fine Brushed Metallic Texture -->
    <pattern id="brushedTexture" width="200" height="4" patternUnits="userSpaceOnUse">
      <line x1="0" y1="1" x2="200" y2="1" stroke="#ffffff" stroke-width="0.75" stroke-opacity="0.22" />
      <line x1="0" y1="3" x2="200" y2="3" stroke="#8c6a21" stroke-width="0.75" stroke-opacity="0.13" />
    </pattern>

    <!-- Ambient Surface Sheen Overlay -->
    <linearGradient id="surfaceSheen" x1="0%" y1="0%" x2="15%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.30" />
      <stop offset="25%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="50%" stop-color="#000000" stop-opacity="0.0" />
      <stop offset="85%" stop-color="#4a330b" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#261a04" stop-opacity="0.22" />
    </linearGradient>

    <!-- Deep Engraved / Laser Cut Text Filter -->
    <filter id="engraved" x="-5%" y="-5%" width="110%" height="110%">
      <!-- Bottom right light specular catch -->
      <feDropShadow dx="1.2" dy="2.0" stdDeviation="0.8" flood-color="#fff8db" flood-opacity="0.85" />
      <!-- Top left deep shadow cavity -->
      <feDropShadow dx="-1.0" dy="-1.5" stdDeviation="0.7" flood-color="#0a0501" flood-opacity="0.6" />
    </filter>

    <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#54380a" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- 1. BASE DIE-CUT STICKER CARD (Clean Transparent Cutout) -->
  <g id="plaqueBody">
    <!-- Rounded Gold Body -->
    <rect x="25" y="25" width="${W - 50}" height="${H - 50}" rx="72" ry="72" fill="url(#goldPlate)" />
    <!-- Brushed texture -->
    <rect x="25" y="25" width="${W - 50}" height="${H - 50}" rx="72" ry="72" fill="url(#brushedTexture)" />
    <!-- Specular sheen -->
    <rect x="25" y="25" width="${W - 50}" height="${H - 50}" rx="72" ry="72" fill="url(#surfaceSheen)" />

    <!-- Outer Rim Edge -->
    <rect x="25" y="25" width="${W - 50}" height="${H - 50}" rx="72" ry="72" fill="none" stroke="#a07d2c" stroke-width="7" />
    <rect x="28" y="28" width="${W - 56}" height="${H - 56}" rx="69" ry="69" fill="none" stroke="#fff7d6" stroke-width="3" stroke-opacity="0.75" />

    <!-- Inner Engraved Border Line (Signature Plaque Inset) -->
    <rect x="68" y="68" width="${W - 136}" height="${H - 136}" rx="50" ry="50" fill="none" stroke="#160e04" stroke-width="7" />
    <rect x="71" y="71" width="${W - 142}" height="${H - 142}" rx="48" ry="48" fill="none" stroke="#fffceb" stroke-width="2.5" stroke-opacity="0.8" />
  </g>

  <!-- 2. TOP BRAND HEADER: BHRAAVA DI HATTI -->
  <g id="brandTitle" filter="url(#engraved)">
    <text x="140" y="295" 
          font-family="'Anton', 'Impact', sans-serif" 
          font-size="205" 
          letter-spacing="5.5" 
          fill="#160e04">BHRAAVA DI HATTI</text>
  </g>

  <!-- 3. TOP-RIGHT: DISCOVER MORE -->
  <g id="discoverMore" filter="url(#engraved)">
    <text x="1875" y="195" 
          font-family="'Roboto Condensed', sans-serif" 
          font-style="italic" 
          font-weight="900" 
          font-size="76" 
          letter-spacing="1" 
          fill="#160e04">Discover</text>
    <text x="1925" y="278" 
          font-family="'Roboto Condensed', sans-serif" 
          font-style="italic" 
          font-weight="900" 
          font-size="76" 
          letter-spacing="1" 
          fill="#160e04">More</text>
  </g>

  <!-- 4. LEFT DETAILS COLUMN -->
  <g id="leftTextDetails" filter="url(#engraved)">
    <!-- Line 1: Exclusive Suit Collection (Italic condensed) -->
    <text x="145" y="475" 
          font-family="'Roboto Condensed', sans-serif" 
          font-style="italic" 
          font-weight="900" 
          font-size="94" 
          letter-spacing="1" 
          fill="#160e04">Exclusive Suit Collection</text>

    <!-- Line 2: Order / WhatsApp: (Italic condensed) -->
    <text x="280" y="635" 
          font-family="'Roboto Condensed', sans-serif" 
          font-style="italic" 
          font-weight="900" 
          font-size="90" 
          letter-spacing="1.5" 
          fill="#160e04">Order / WhatsApp:</text>

    <!-- Line 3: 94171 24082 | 99150 46357 (Bold condensed numbers, cleanly ending before QR code) -->
    <text x="145" y="795" 
          font-family="'Roboto Condensed', sans-serif" 
          font-weight="900" 
          font-size="88" 
          letter-spacing="2.5" 
          fill="#160e04">94171 24082 | 99150 46357</text>
  </g>

  <!-- 5. BOTTOM ADDRESS LINE (100% Spelled Correctly: "Road") -->
  <g id="addressLine" filter="url(#engraved)">
    <text x="145" y="1050" 
          font-family="'Roboto Condensed', sans-serif" 
          font-weight="900" 
          font-size="80" 
          letter-spacing="1.5" 
          fill="#160e04">Bus Stand Road, Maur Mandi, District Bathinda</text>
  </g>

  <!-- 6. CENTER-RIGHT: FUNCTIONAL QR CODE -->
  <g id="qrSection">
    ${isBadge ? `
    <!-- Option 2: Pure White Badge for 100% Optical QR Scanner Contrast -->
    <rect x="${qrX - 22}" y="${qrY - 22}" width="${qrBox + 44}" height="${qrBox + 44}" rx="26" ry="26" fill="#ffffff" filter="url(#badgeShadow)" />
    <rect x="${qrX - 22}" y="${qrY - 22}" width="${qrBox + 44}" height="${qrBox + 44}" rx="26" ry="26" fill="none" stroke="#2a1805" stroke-width="4.5" />
    ` : `
    <!-- Option 1: Direct Brushed Satin Metallic Plate -->
    <rect x="${qrX - 18}" y="${qrY - 18}" width="${qrBox + 36}" height="${qrBox + 36}" rx="22" ry="22" fill="#faecc0" fill-opacity="0.65" />
    <rect x="${qrX - 18}" y="${qrY - 18}" width="${qrBox + 36}" height="${qrBox + 36}" rx="22" ry="22" fill="none" stroke="#362208" stroke-width="3" />
    `}

    <!-- Crisp Sharp QR Code Modules -->
    <g id="qrModules">
      ${qrRects}
    </g>
  </g>

  <!-- 7. RIGHT COLUMN: BRACKET & BRANCHING ARROWS -->
  <g id="bracketTree" filter="url(#engraved)">
    <!-- Curly bracket spine -->
    <path d="M ${arrowStartX},${iconY[0]} 
             C ${arrowStartX - 28},${iconY[0]} ${arrowStartX - 22},${(iconY[1] + iconY[2]) / 2 - 35} ${arrowStartX - 42},${(iconY[1] + iconY[2]) / 2} 
             C ${arrowStartX - 22},${(iconY[1] + iconY[2]) / 2 + 35} ${arrowStartX - 28},${iconY[3]} ${arrowStartX},${iconY[3]}" 
          fill="none" stroke="#160e04" stroke-width="6.5" stroke-linecap="round" />

    <!-- 4 Branching Arrows pointing to each icon -->
    <!-- Arrow 1: to YouTube (y: 415) -->
    <line x1="${arrowStartX}" y1="${iconY[0]}" x2="${arrowEndX}" y2="${iconY[0]}" stroke="#160e04" stroke-width="6.5" stroke-linecap="round" />
    <polygon points="${arrowEndX - 6},${iconY[0] - 12} ${arrowEndX + 18},${iconY[0]} ${arrowEndX - 6},${iconY[0] + 12}" fill="#160e04" />

    <!-- Arrow 2: to Google (y: 555) -->
    <line x1="${arrowStartX - 30}" y1="${iconY[1]}" x2="${arrowEndX}" y2="${iconY[1]}" stroke="#160e04" stroke-width="6.5" stroke-linecap="round" />
    <polygon points="${arrowEndX - 6},${iconY[1] - 12} ${arrowEndX + 18},${iconY[1]} ${arrowEndX - 6},${iconY[1] + 12}" fill="#160e04" />

    <!-- Arrow 3: to WhatsApp (y: 695) -->
    <line x1="${arrowStartX - 30}" y1="${iconY[2]}" x2="${arrowEndX}" y2="${iconY[2]}" stroke="#160e04" stroke-width="6.5" stroke-linecap="round" />
    <polygon points="${arrowEndX - 6},${iconY[2] - 12} ${arrowEndX + 18},${iconY[2]} ${arrowEndX - 6},${iconY[2] + 12}" fill="#160e04" />

    <!-- Arrow 4: to Instagram (y: 835) -->
    <line x1="${arrowStartX}" y1="${iconY[3]}" x2="${arrowEndX}" y2="${iconY[3]}" stroke="#160e04" stroke-width="6.5" stroke-linecap="round" />
    <polygon points="${arrowEndX - 6},${iconY[3] - 12} ${arrowEndX + 18},${iconY[3]} ${arrowEndX - 6},${iconY[3] + 12}" fill="#160e04" />
  </g>

  <!-- 8. 4 SOCIAL ICONS (High-Precision Engraved Vector Silhouettes) -->
  <g id="socialIcons" filter="url(#engraved)" fill="#160e04">
    <!-- 1. YOUTUBE ICON (y: 415) -->
    <g transform="translate(${iconCenterX - 63}, ${iconY[0] - 44})">
      <!-- YouTube rounded rectangle pill -->
      <rect x="0" y="0" width="126" height="88" rx="26" ry="26" fill="#160e04" />
      <!-- Golden play triangle cutout -->
      <polygon points="50,25 50,63 85,44" fill="#f6e4a4" />
    </g>

    <!-- 2. GOOGLE 'G' ICON (y: 555) -->
    <g transform="translate(${iconCenterX - 45}, ${iconY[1] - 45})">
      <!-- Pristine Google 'G' geometry -->
      <path d="M 45 0 C 69.8 0 90 20.2 90 45 C 90 69.8 69.8 90 45 90 C 20.2 90 0 69.8 0 45 C 0 20.2 20.2 0 45 0 Z" fill="#160e04" />
      <!-- Inner cutout -->
      <path d="M 45 18 C 30.1 18 18 30.1 18 45 C 18 59.9 30.1 72 45 72 C 57.5 72 67.8 63.5 70.8 52 L 45 52 L 45 38 L 86 38 C 86.7 40.3 87 42.6 87 45 C 87 68.2 68.2 87 45 87 C 21.8 87 3 68.2 3 45 C 3 21.8 21.8 3 45 3 C 56.4 3 66.8 7.6 74.3 15.1 L 63.6 25.8 C 58.7 20.9 52.2 18 45 18 Z" fill="#f6e4a4" />
    </g>

    <!-- 3. WHATSAPP ICON (y: 695) -->
    <g transform="translate(${iconCenterX - 45}, ${iconY[2] - 45})">
      <!-- WhatsApp Speech bubble -->
      <path d="M 45 3 C 21.2 3 2 22.2 2 46 C 2 54.2 4.7 62.1 9.5 69 L 3 90 L 24.8 83.8 C 31 87.8 38 90 45 90 C 68.8 90 88 70.8 88 46 C 88 22.2 68.8 3 45 3 Z" fill="#160e04" />
      <!-- Telephone handset cutout -->
      <path d="M 31 29 C 29 29 27 30 25 33 C 22 37 19 44 22 53 C 25 62 33 72 44 77 C 53 81 60 78 64 75 C 67 73 68 71 68 69 C 68 67 63 60 59 58 C 57 57 55 57 53 59 C 51 61 49 63 47 63 C 45 63 41 61 36 56 C 31 51 29 47 29 45 C 29 43 31 41 33 39 C 35 37 35 35 34 33 C 32 29 28 29 27 29 Z" fill="#f6e4a4" />
    </g>

    <!-- 4. INSTAGRAM ICON (y: 835) -->
    <g transform="translate(${iconCenterX - 45}, ${iconY[3] - 45})">
      <!-- Camera rounded box -->
      <rect x="5" y="5" width="80" height="80" rx="24" ry="24" fill="none" stroke="#160e04" stroke-width="15" />
      <!-- Camera lens -->
      <circle cx="45" cy="45" r="20" fill="none" stroke="#160e04" stroke-width="13" />
      <!-- Flash sensor dot -->
      <circle cx="68" cy="22" r="6.5" fill="#160e04" />
    </g>
  </g>
</svg>`;
  }

  const resvgOpts = {
    fitTo: { mode: 'width', value: W },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Anton'
    }
  };

  const svgGold = buildSVG('gold');
  const svgBadge = buildSVG('badge');

  console.log('Rendering SVG to High-Res PNG with custom fonts...');
  const pngGoldBuffer = new Resvg(svgGold, resvgOpts).render().asPng();
  const pngBadgeBuffer = new Resvg(svgBadge, resvgOpts).render().asPng();

  const publicAssetsDir = path.join(process.cwd(), 'public/assets');

  // Save SVG
  fs.writeFileSync(path.join(publicAssetsDir, 'bhraava_di_hatti_gold_sticker.svg'), svgGold);
  fs.writeFileSync(path.join(publicAssetsDir, 'bhraava_di_hatti_badge_sticker.svg'), svgBadge);
  fs.writeFileSync(path.join(publicAssetsDir, 'bhraava_di_hatti_sticker.svg'), svgGold);

  // Save PNG
  fs.writeFileSync(path.join(publicAssetsDir, 'bhraava_di_hatti_gold_sticker.png'), pngGoldBuffer);
  fs.writeFileSync(path.join(publicAssetsDir, 'bhraava_di_hatti_badge_sticker.png'), pngBadgeBuffer);
  fs.writeFileSync(path.join(publicAssetsDir, 'bhraava_di_hatti_sticker_final.png'), pngGoldBuffer);
  fs.writeFileSync(path.join(publicAssetsDir, 'bhraava_di_hatti_sticker_final_print.png'), pngGoldBuffer);

  // Convert to high-fidelity JPG
  await sharp(pngGoldBuffer)
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicAssetsDir, 'bhraava_di_hatti_gold_sticker.jpg'));

  await sharp(pngBadgeBuffer)
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicAssetsDir, 'bhraava_di_hatti_badge_sticker.jpg'));

  await sharp(pngGoldBuffer)
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicAssetsDir, 'bhraava_di_hatti_sticker_final.jpg'));

  await sharp(pngGoldBuffer)
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toFile(path.join(publicAssetsDir, 'bhraava_di_hatti_sticker_final_print.jpg'));

  // Realistic 3D Mockup on luxury warm surface
  console.log('Rendering 3D Mockup on soft studio surface...');
  const mockupW = 2400;
  const mockupH = 1600;
  const mockupCardW = 1750;

  const cardResized = await sharp(pngGoldBuffer)
    .resize(mockupCardW)
    .toBuffer();

  const mockupBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${mockupW}" height="${mockupH}">
    <defs>
      <radialGradient id="luxBg" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#f5f0e6" />
        <stop offset="100%" stop-color="#ded4c3" />
      </radialGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#2d1c07" flood-opacity="0.32" />
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.15" />
      </filter>
    </defs>
    <rect width="${mockupW}" height="${mockupH}" fill="url(#luxBg)" />
    <!-- Soft shadow pad under card -->
    <rect x="325" y="290" width="1750" height="1020" rx="55" ry="55" fill="#362208" filter="url(#cardShadow)" opacity="0.35" />
  </svg>`;

  const mockupBg = new Resvg(mockupBgSvg, { fitTo: { mode: 'width', value: mockupW } }).render().asPng();

  await sharp(mockupBg)
    .composite([
      {
        input: cardResized,
        top: 290,
        left: 325
      }
    ])
    .jpeg({ quality: 96 })
    .toFile(path.join(publicAssetsDir, 'bhraava_di_hatti_mockup_3d.jpg'));

  // Copy to brain artifacts directory
  const artifactDir = '/app/applet/.aistudio/artifacts/brain/c9bbc2ef-f95c-4e7c-aa01-df8aafc449d8';
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(
      path.join(publicAssetsDir, 'bhraava_di_hatti_gold_sticker.jpg'),
      path.join(artifactDir, 'bhraava_di_hatti_sticker_ready_print.jpg')
    );
    fs.copyFileSync(
      path.join(publicAssetsDir, 'bhraava_di_hatti_badge_sticker.jpg'),
      path.join(artifactDir, 'bhraava_di_hatti_sticker_white_badge.jpg')
    );
  }

  // Verify QR scan
  for (const name of ['bhraava_di_hatti_gold_sticker.png', 'bhraava_di_hatti_badge_sticker.png']) {
    const pngPath = path.join(publicAssetsDir, name);
    const data = fs.readFileSync(pngPath);
    const png = PNG.sync.read(data);
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    if (code) {
      console.log(`✅ ${name}: Scanned Successfully -> "${code.data}"`);
    } else {
      console.error(`❌ ${name}: QR scan failed!`);
    }
  }

  console.log('Artwork generation complete!');
}

generateArtwork().catch(err => {
  console.error(err);
  process.exit(1);
});
