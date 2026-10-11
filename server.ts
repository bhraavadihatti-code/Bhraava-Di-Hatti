import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Product, Order, ShopSettings, OrderStatus } from './src/types.js';
import { INITIAL_PRODUCTS, DEFAULT_SHOP_SETTINGS, DEFAULT_CATEGORIES } from './src/data/initialProducts.js';
import { 
  syncProductToGoogleSheets, 
  syncOrderToGoogleSheets, 
  fetchGoogleSheetAll,
  isSheetWriteActiveOrRecent,
  getGoogleAppsScriptTemplate,
  formatProductForSheet,
  formatOrderForSheet
} from './src/lib/googleSheetsService.js';
import { formatImageUrl } from './src/lib/imageUtils.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Prevent aggressive HTTP caching on API routes for real-time cross-device sync
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Error handling for JSON body parsing
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error('Express request error:', err);
    return res.status(400).json({ error: 'Invalid payload or file size too large.' });
  }
  next();
});

// Data storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DELETED_PRODUCTS_FILE = path.join(DATA_DIR, 'deleted_products.json');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded images and static assets
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/src/assets', express.static(path.join(process.cwd(), 'src', 'assets')));

// Helpers for file reading/writing and image storage
function cleanImageUrl(url: string): string {
  if (!url) return '';
  return formatImageUrl(url);
}

/**
 * Saves a base64 image string to disk in /data/uploads and returns a clean URL.
 */
function saveBase64Image(dataUri: string, prefix = 'product'): string {
  try {
    if (!dataUri || !dataUri.startsWith('data:image/')) {
      return dataUri;
    }
    const matches = dataUri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) {
      return dataUri;
    }
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `/uploads/${fileName}`;
  } catch (e) {
    console.warn('Failed to save base64 image to disk:', e);
    return dataUri;
  }
}

// In-memory persistent caches for cross-device sync and speed
let cachedProducts: Product[] | null = null;
let cachedOrders: Order[] | null = null;
let cachedSettings: ShopSettings | null = null;

// Track locally added/updated/deleted products so background Google Sheet sync
// never wipes out newly uploaded products or resurrects deleted products
const recentlyModifiedProducts = new Map<string, number>();
const deletedProductIds = new Set<string>();
let lastLocalProductWriteAt = 0;
const DEFAULT_FALLBACK_IMG = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';

// Load persisted deleted product IDs on startup
try {
  if (fs.existsSync(DELETED_PRODUCTS_FILE)) {
    const rawDel = JSON.parse(fs.readFileSync(DELETED_PRODUCTS_FILE, 'utf-8'));
    if (Array.isArray(rawDel)) {
      rawDel.forEach((id) => {
        if (typeof id === 'string' && id.trim()) {
          deletedProductIds.add(id.trim());
        }
      });
    }
  }
} catch {}

function saveDeletedProductIds(): void {
  try {
    fs.writeFileSync(DELETED_PRODUCTS_FILE, JSON.stringify(Array.from(deletedProductIds), null, 2), 'utf-8');
  } catch {}
}

function isProductDeleted(id: string): boolean {
  const clean = String(id || '').trim();
  if (!clean) return false;
  if (deletedProductIds.has(clean) || deletedProductIds.has(clean.toUpperCase()) || deletedProductIds.has(clean.toLowerCase())) {
    return true;
  }
  return false;
}

function markProductDeleted(id: string): void {
  const clean = String(id || '').trim();
  if (!clean) return;
  deletedProductIds.add(clean);
  deletedProductIds.add(clean.toUpperCase());
  saveDeletedProductIds();
}

function unmarkProductDeleted(id: string): void {
  const clean = String(id || '').trim();
  if (!clean) return;
  deletedProductIds.delete(clean);
  deletedProductIds.delete(clean.toUpperCase());
  deletedProductIds.delete(clean.toLowerCase());
  saveDeletedProductIds();
}

function mergeProductsWithSheet(
  localProducts: Product[],
  sheetProducts: Product[]
): Product[] {
  if (!Array.isArray(sheetProducts)) {
    return localProducts;
  }

  const now = Date.now();
  const localMap = new Map<string, Product>(localProducts.map(p => [String(p.id).trim(), p]));
  const sheetIdSet = new Set<string>();
  const mergedFromSheet: Product[] = [];

  for (const rawSheetProd of sheetProducts) {
    const id = String(rawSheetProd.id || '').trim();
    if (!id || isProductDeleted(id)) continue;
    sheetIdSet.add(id);

    const cleanedSheetImg = cleanImageUrl(rawSheetProd.imageUrl || '');
    const localProd = localMap.get(id);

    if (!localProd) {
      mergedFromSheet.push({
        ...rawSheetProd,
        imageUrl: cleanedSheetImg || DEFAULT_FALLBACK_IMG,
        images: [cleanedSheetImg || DEFAULT_FALLBACK_IMG]
      });
      continue;
    }

    // If this product was uploaded or edited locally within the last 60 seconds,
    // keep the local version as authoritative so stale sheet reads never overwrite it
    const modifiedAt = recentlyModifiedProducts.get(id) || 0;
    if (now - modifiedAt < 60000) {
      mergedFromSheet.push(localProd);
      continue;
    }

    const cleanedLocalImg = cleanImageUrl(localProd.imageUrl || '');
    const keepLocalHd =
      (cleanedLocalImg.startsWith('data:image/') &&
        cleanedSheetImg.startsWith('data:image/') &&
        cleanedLocalImg.length >= cleanedSheetImg.length) ||
      cleanedLocalImg.startsWith('/uploads/');

    const bestPrimaryImg = keepLocalHd
      ? cleanedLocalImg
      : cleanedSheetImg && cleanedSheetImg !== DEFAULT_FALLBACK_IMG
      ? cleanedSheetImg
      : cleanedLocalImg || cleanedSheetImg || DEFAULT_FALLBACK_IMG;

    const extraLocalImgs = Array.isArray(localProd.images)
      ? localProd.images.slice(1).map(img => cleanImageUrl(img)).filter(Boolean)
      : [];

    mergedFromSheet.push({
      ...localProd,
      ...rawSheetProd,
      imageUrl: bestPrimaryImg,
      sheetImageUrl:
        localProd.sheetImageUrl ||
        (cleanedSheetImg.startsWith('data:image/') ? cleanedSheetImg : undefined),
      images: [bestPrimaryImg, ...extraLocalImgs]
    });
  }

  // Only preserve local products not yet in Google Sheets if they were JUST created
  // within the last 45 seconds (never re-add older deleted products back to the sheet!)
  const localOnlyProducts: Product[] = [];
  for (const localProd of localProducts) {
    const id = String(localProd.id || '').trim();
    if (!id || isProductDeleted(id)) continue;
    if (!sheetIdSet.has(id)) {
      const modifiedAt = recentlyModifiedProducts.get(id) || 0;
      if (now - modifiedAt < 45000) {
        localOnlyProducts.push(localProd);
      }
    }
  }

  return [...localOnlyProducts, ...mergedFromSheet];
}

// Idempotency tracking to strictly prevent duplicate orders
interface RecentSubmission {
  id: string;
  fingerprint: string;
  timestamp: number;
}
const recentOrderSubmissions: RecentSubmission[] = [];

function loadProducts(): Product[] {
  if (cachedProducts !== null) {
    return cachedProducts;
  }
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      if (data && data.trim()) {
        const savedProducts: Product[] = JSON.parse(data);
        if (Array.isArray(savedProducts) && savedProducts.length > 0) {
          cachedProducts = savedProducts.map(p => ({
            ...p,
            imageUrl: cleanImageUrl(p.imageUrl),
            images: Array.isArray(p.images) && p.images.length > 0
              ? p.images.map(img => cleanImageUrl(img))
              : [cleanImageUrl(p.imageUrl)]
          }));
          return cachedProducts;
        }
      }
    }
  } catch (err) {
    console.error('Error reading products file, falling back to initial:', err);
  }
  if (!cachedProducts || cachedProducts.length === 0) {
    cachedProducts = INITIAL_PRODUCTS;
    saveProducts(INITIAL_PRODUCTS);
  }
  return cachedProducts;
}

function saveProducts(products: Product[]): void {
  cachedProducts = products;
  try {
    const tmpFile = `${PRODUCTS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(products, null, 2), 'utf-8');
    fs.renameSync(tmpFile, PRODUCTS_FILE);
  } catch (err) {
    console.error('Error saving products file:', err);
  }
}

function loadOrders(): Order[] {
  if (cachedOrders !== null) {
    return cachedOrders;
  }
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      if (data && data.trim()) {
        const savedOrders: Order[] = JSON.parse(data);
        if (Array.isArray(savedOrders)) {
          cachedOrders = savedOrders;
          return cachedOrders;
        }
      }
    }
  } catch (err) {
    console.error('Error reading orders file:', err);
  }

  if (cachedOrders === null) {
    // Default sample order
    const initialOrders: Order[] = [
      {
        id: "BDH-2026-00001",
        utsNumber: "420819234812",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        customer: {
          fullName: "Gurpreet Singh",
          phone: "94171-24082",
          email: "gurpreet@example.com",
          address: "House 142, Bus Stand Road, Maur Mandi",
          city: "District Bathinda",
          state: "Punjab",
          pincode: "151509",
          notes: "Unstitched Punjabi Suit Material - Speed Post India Post"
        },
        items: [
          {
            product: INITIAL_PRODUCTS[0],
            selectedColor: "Crimson Red",
            selectedSize: "L (40)",
            quantity: 1
          }
        ],
        subtotal: 650,
        discount: 0,
        shippingFee: 0,
        totalAmount: 650,
        payment: {
          method: "COD",
          paymentStatus: "Pending",
          verifiedByAdmin: false
        },
        status: "Pending"
      }
    ];
    cachedOrders = initialOrders;
    saveOrders(initialOrders);
  }
  return cachedOrders;
}

function saveOrders(orders: Order[]): void {
  cachedOrders = orders;
  try {
    const tmpFile = `${ORDERS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(orders, null, 2), 'utf-8');
    fs.renameSync(tmpFile, ORDERS_FILE);
  } catch (err) {
    console.error('Error saving orders file:', err);
  }
}

function loadSettings(): ShopSettings {
  if (cachedSettings !== null) {
    return cachedSettings;
  }
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      if (data && data.trim()) {
        const parsed: ShopSettings = JSON.parse(data);
        if (parsed) {
          if (!parsed.categories || parsed.categories.length === 0) {
            parsed.categories = DEFAULT_CATEGORIES;
          }
          if (!parsed.upiId) {
            parsed.upiId = DEFAULT_SHOP_SETTINGS.upiId;
          }
          if (!parsed.googleSheetWebhookUrl) {
            parsed.googleSheetWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbwJrtBmrcGAKu41hddYZNltiQiFFg_WNfLhluhTJSW1tkOU4aWKE1D0-11MRqekMjjj/exec";
          }
          cachedSettings = parsed;
          return cachedSettings;
        }
      }
    }
  } catch (err) {
    console.error('Error reading settings file:', err);
  }
  cachedSettings = DEFAULT_SHOP_SETTINGS;
  saveSettings(DEFAULT_SHOP_SETTINGS);
  return cachedSettings;
}

function saveSettings(settings: ShopSettings): void {
  cachedSettings = settings;
  try {
    const tmpFile = `${SETTINGS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(settings, null, 2), 'utf-8');
    fs.renameSync(tmpFile, SETTINGS_FILE);
  } catch (err) {
    console.error('Error saving settings file:', err);
  }
}

/**
 * Automatically generates a unique Order/Ticket Number in the exact format:
 * BDH-2026-00001, BDH-2026-00002, etc.
 */
function generateNextOrderId(orders: Order[]): string {
  let maxSeq = 0;
  const currentYear = 2026;

  orders.forEach((o) => {
    // Match BDH-2026-00001 or BDH-2026-1001 or BDH-1001
    const match5 = o.id.match(/^BDH-(\d{4})-(\d+)$/i);
    if (match5) {
      const num = parseInt(match5[2], 10);
      if (num > maxSeq) maxSeq = num;
    } else {
      const matchAny = o.id.match(/(\d+)$/);
      if (matchAny) {
        const num = parseInt(matchAny[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `BDH-${currentYear}-${String(nextSeq).padStart(5, '0')}`;
}

// Real-time SSE Notification clients list
interface SSEClient {
  id: string;
  res: express.Response;
}
let sseClients: SSEClient[] = [];

function broadcastSSE(eventData: any) {
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } catch (e) {
      console.error('Error sending SSE:', e);
    }
  });
}

// ----------------------------------------------------
// TELEGRAM BOT NOTIFICATIONS ENGINE
// ----------------------------------------------------
async function sendTelegramAlert(order: Order, title: string = "🚨 NEW ORDER RECEIVED") {
  try {
    const settings = loadSettings();
    const token = (settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "8752135508:AAF2X43YeNzGKFazG9cFzMUNzVgnMs3Vju0").trim();
    let chatId = (settings.telegramChatId || "").trim();

    if (!token) return;

    if (!chatId) {
      try {
        const updateRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        if (updateRes.ok) {
          const updateData = await updateRes.json();
          if (updateData?.result && Array.isArray(updateData.result) && updateData.result.length > 0) {
            const valid = updateData.result.reverse().find((u: any) => u.message?.chat?.id || u.channel_post?.chat?.id);
            if (valid) {
              const detected = valid.message?.chat?.id || valid.channel_post?.chat?.id;
              if (detected) {
                chatId = String(detected);
                settings.telegramChatId = chatId;
                saveSettings(settings);
              }
            }
          }
        }
      } catch (e) {}
    }

    if (!chatId) return;

    const itemsSummary = (order.items || []).map((i, idx) => 
      `  ${idx + 1}. <b>${i.product?.name || 'Suit Item'}</b>\n     Color: ${i.selectedColor || 'Standard'} | Size: ${i.selectedSize || 'Standard'}\n     Qty: ${i.quantity} x ₹${i.product?.price || 0}`
    ).join('\n\n');

    const messageText = 
`<b>${title}</b>
🏬 <b>Shop:</b> Bhraava Di Hatti (Jai Durga Cloth Emporium)

📦 <b>Order ID:</b> <code>${order.id}</code>
💵 <b>Total Amount:</b> ₹${order.totalAmount}
💳 <b>Payment:</b> ${order.payment?.method || 'COD'} (${order.payment?.paymentStatus || 'Pending'})

👤 <b>Customer Details:</b>
• <b>Name:</b> ${order.customer?.fullName || 'N/A'}
• <b>Phone:</b> <code>${order.customer?.phone || 'N/A'}</code>
• <b>Address:</b> ${order.customer?.address || ''}, ${order.customer?.city || ''} - ${order.customer?.pincode || ''}
${order.customer?.notes ? `• <b>Notes:</b> ${order.customer.notes}\n` : ''}
🛒 <b>Items Ordered:</b>
${itemsSummary}

⚡ <b>Status:</b> ${String(order.status).toUpperCase()}
${order.trackingNumber ? `🚚 <b>Tracking:</b> ${order.courierName || 'Courier'} - <code>${order.trackingNumber}</code>\n` : ''}
<i>Bhraava Di Hatti - Central Google Sheets Sync Engine</i>`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.warn('Failed to send Telegram alert:', err);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// SSE real-time stream for instant cross-device updates
app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now().toString();
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(heartbeatTimer);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Image Upload Endpoint (stores locally, outputs clean URL for Google Sheets)
app.post('/api/upload-image', (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    const cleanUrl = saveBase64Image(image, filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '') : 'suit');
    res.json({ success: true, url: cleanUrl });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to upload image' });
  }
});

// Lightweight version check so clients don't re-download large base64 payloads unnecessarily
app.get('/api/products/version', (req, res) => {
  const products = loadProducts();
  const signature = products.map(p => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`).join('|');
  res.json({
    count: products.length,
    signature
  });
});

// Products API (supports optional ?limit=&offset= pagination)
app.get('/api/products', (req, res) => {
  const products = loadProducts();
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 0;
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

  if (limit > 0) {
    const sliced = products.slice(offset, offset + limit);
    return res.json({
      products: sliced,
      total: products.length,
      hasMore: offset + limit < products.length
    });
  }

  res.json(products);
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct: Product = req.body;
    if (!newProduct || !newProduct.name || !newProduct.price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const products = loadProducts();
    let targetId = newProduct.id ? newProduct.id.trim() : '';
    
    if (!targetId) {
      let maxNum = 100;
      products.forEach((p) => {
        const match = p.id.match(/^BDH-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      targetId = `BDH-${maxNum + 1}`;
    }

    // Normalize image URLs (keep compressed base64 intact so Google Sheets & mobile phones can render directly)
    if (newProduct.imageUrl) {
      newProduct.imageUrl = cleanImageUrl(newProduct.imageUrl);
    }

    if (Array.isArray(newProduct.images) && newProduct.images.length > 0) {
      newProduct.images = newProduct.images.map(img => cleanImageUrl(img)).filter(Boolean);
    } else if (newProduct.imageUrl) {
      newProduct.images = [newProduct.imageUrl];
    } else {
      const defaultImg = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
      newProduct.imageUrl = defaultImg;
      newProduct.images = [defaultImg];
    }

    newProduct.id = targetId;
    newProduct.firmName = newProduct.firmName || "Jai Durga Cloth Emporium";
    newProduct.shopName = newProduct.shopName || "Bhraava Di Hatti";
    newProduct.price = Number(newProduct.price);
    newProduct.originalPrice = newProduct.originalPrice ? Number(newProduct.originalPrice) : newProduct.price + 500;
    newProduct.status = newProduct.status || 'Active';
    newProduct.createdAt = newProduct.createdAt || new Date().toISOString();

    const existingIdx = products.findIndex(p => String(p.id).trim().toLowerCase() === targetId.toLowerCase());
    if (existingIdx !== -1) {
      products[existingIdx] = { ...products[existingIdx], ...newProduct };
    } else {
      products.unshift(newProduct);
    }

    lastLocalProductWriteAt = Date.now();
    recentlyModifiedProducts.set(newProduct.id, Date.now());
    unmarkProductDeleted(newProduct.id);

    saveProducts(products);

    // Automatically ensure any custom variety/brand in product category/tags is saved to settings.categories
    const settings = loadSettings();
    const incomingVarieties = [
      newProduct.category || '',
      ...(Array.isArray(newProduct.tags) ? newProduct.tags : [])
    ]
      .flatMap((v) => String(v).split(','))
      .map((s) => s.trim())
      .filter((s) => Boolean(s && s.toLowerCase() !== 'all'));

    if (incomingVarieties.length > 0) {
      const currentCats = Array.isArray(settings.categories) && settings.categories.length > 0
        ? [...settings.categories]
        : ['All', 'Punjabi Suit', 'Farshi Suit', 'Cotton Suit', 'Dupatta Suit', 'Trousers Salwar Suits', 'AK Tax', 'Om Creation', 'Shiva'];
      let catsUpdated = false;
      for (const v of incomingVarieties) {
        if (!currentCats.some((c) => String(c).trim().toLowerCase() === v.toLowerCase())) {
          currentCats.push(v);
          catsUpdated = true;
        }
      }
      if (catsUpdated) {
        settings.categories = currentCats;
        saveSettings(settings);
        broadcastSSE({ type: 'SETTINGS_UPDATED', settings });
      }
    }

    // Broadcast SSE to all connected phones/admin immediately
    broadcastSSE({ type: 'PRODUCTS_UPDATED', products });

    // Await Google Sheets sync so Cloud Run keeps CPU active until the row is written
    let sheetSynced = false;
    const webhookUrl = settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
    if (webhookUrl) {
      try {
        const syncRes = await syncProductToGoogleSheets(
          newProduct,
          existingIdx !== -1 ? 'update_product' : 'save_product',
          webhookUrl
        );
        sheetSynced = syncRes.success;
      } catch (e) {
        console.warn('Google Sheet product sync error:', e);
      }
    }

    return res.status(201).json({ ...newProduct, sheetSynced });
  } catch (err: any) {
    console.error('Error adding product:', err);
    return res.status(500).json({ error: err?.message || 'Server error adding product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();
    const updatedData: Partial<Product> = req.body;
    const products = loadProducts();
    
    const index = products.findIndex(p => String(p.id).trim().toLowerCase() === cleanId.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (updatedData.imageUrl) {
      updatedData.imageUrl = cleanImageUrl(updatedData.imageUrl);
    }
    if (Array.isArray(updatedData.images) && updatedData.images.length > 0) {
      updatedData.images = updatedData.images.map(img => cleanImageUrl(img)).filter(Boolean);
    }

    products[index] = { ...products[index], ...updatedData };
    const finalId = String(products[index].id || cleanId).trim();

    lastLocalProductWriteAt = Date.now();
    recentlyModifiedProducts.set(finalId, Date.now());
    unmarkProductDeleted(finalId);

    saveProducts(products);

    const settings = loadSettings();
    const incomingVarieties = [
      products[index].category || '',
      ...(Array.isArray(products[index].tags) ? products[index].tags : [])
    ]
      .flatMap((v) => String(v).split(','))
      .map((s) => s.trim())
      .filter((s) => Boolean(s && s.toLowerCase() !== 'all'));

    if (incomingVarieties.length > 0) {
      const currentCats = Array.isArray(settings.categories) && settings.categories.length > 0
        ? [...settings.categories]
        : ['All', 'Punjabi Suit', 'Farshi Suit', 'Cotton Suit', 'Dupatta Suit', 'Trousers Salwar Suits', 'AK Tax', 'Om Creation', 'Shiva'];
      let catsUpdated = false;
      for (const v of incomingVarieties) {
        if (!currentCats.some((c) => String(c).trim().toLowerCase() === v.toLowerCase())) {
          currentCats.push(v);
          catsUpdated = true;
        }
      }
      if (catsUpdated) {
        settings.categories = currentCats;
        saveSettings(settings);
        broadcastSSE({ type: 'SETTINGS_UPDATED', settings });
      }
    }

    broadcastSSE({ type: 'PRODUCTS_UPDATED', products });

    let sheetSynced = false;
    const webhookUrl = settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
    if (webhookUrl) {
      try {
        const syncRes = await syncProductToGoogleSheets(products[index], 'update_product', webhookUrl);
        sheetSynced = syncRes.success;
      } catch (e) {
        console.warn('Google Sheet product update error:', e);
      }
    }

    res.json({ ...products[index], sheetSynced });
  } catch (err: any) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err?.message || 'Server error updating product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();
    let products = loadProducts();
    const target =
      products.find(p => String(p.id).trim().toLowerCase() === cleanId.toLowerCase()) ||
      ({ id: cleanId, name: cleanId, price: 0 } as Product);

    products = products.filter(p => String(p.id).trim().toLowerCase() !== cleanId.toLowerCase());

    lastLocalProductWriteAt = Date.now();
    markProductDeleted(cleanId);
    if (target.id) markProductDeleted(target.id);
    recentlyModifiedProducts.delete(cleanId);
    recentlyModifiedProducts.delete(target.id);

    saveProducts(products);

    broadcastSSE({ type: 'PRODUCTS_UPDATED', products });

    let sheetSynced = false;
    const settings = loadSettings();
    const webhookUrl = settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
    if (webhookUrl) {
      try {
        const syncRes = await syncProductToGoogleSheets(target, 'delete_product', webhookUrl);
        sheetSynced = syncRes.success;
      } catch (e) {
        console.warn('Google Sheet product delete error:', e);
      }
    }

    res.json({ success: true, id: cleanId, sheetSynced });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err?.message || 'Server error deleting product' });
  }
});

// Orders API
app.get('/api/orders', (req, res) => {
  const orders = loadOrders();
  res.json(orders);
});

// Create Order (With Duplicate Protection & Google Sheets Sync)
app.post('/api/orders', async (req, res) => {
  try {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: 'Empty order payload.' });
    }

    const rawCust = body.customer || {};
    const customer = {
      fullName: String(rawCust.fullName || 'Customer').trim() || 'Customer',
      phone: String(rawCust.phone || '').trim(),
      email: String(rawCust.email || '').trim(),
      address: String(rawCust.address || 'Address provided').trim(),
      city: String(rawCust.city || 'District Bathinda').trim(),
      state: String(rawCust.state || 'Punjab').trim(),
      pincode: String(rawCust.pincode || '151509').trim(),
      notes: String(rawCust.notes || '').trim()
    };

    if (!customer.phone || customer.phone.length < 8) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = Number(body.subtotal) || 0;
    const discount = Number(body.discount) || 0;
    const shippingFee = Number(body.shippingFee) || 0;
    const totalAmount = Number(body.totalAmount) || (subtotal + shippingFee - discount);
    const payment = body.payment || {};
    const existingId = body.id ? String(body.id).trim() : '';

    const orders = loadOrders();

    // 1. DUPLICATE PROTECTION: Check if order ID already exists
    if (existingId) {
      const match = orders.find(o => o.id === existingId);
      if (match) {
        console.log(`Order ${existingId} already exists, returning existing to prevent duplicates.`);
        return res.status(200).json(match);
      }
    }

    // 2. DUPLICATE PROTECTION: Idempotency fingerprint check (same phone, amount within 30s)
    const fingerprint = `${customer.phone}_${totalAmount}_${items.length}`;
    const now = Date.now();
    const recentDupe = recentOrderSubmissions.find(s => s.fingerprint === fingerprint && (now - s.timestamp) < 30000);
    if (recentDupe) {
      const match = orders.find(o => o.id === recentDupe.id);
      if (match) {
        console.log(`Duplicate order submission blocked by fingerprint: ${fingerprint}`);
        return res.status(200).json(match);
      }
    }

    // Generate unique OrderID formatted as BDH-2026-00001
    const targetOrderId = existingId || generateNextOrderId(orders);

    // Initial order status defaults to "Pending"
    const orderStatus: OrderStatus = body.status || 'Pending';
    const payMethod = payment.method || 'COD';
    const payStatus = payment.paymentStatus || 'Pending';
    const utrRef = (payment.utrNumber || body.utsNumber || '').trim();

    const newOrder: Order = {
      id: targetOrderId,
      utsNumber: utrRef,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer,
      items,
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      payment: {
        method: payMethod,
        upiIdUsed: payment.upiIdUsed || loadSettings().upiId,
        utrNumber: utrRef,
        screenshotUrl: payment.screenshotUrl,
        paymentTimestamp: payment.paymentTimestamp || new Date().toISOString(),
        verifiedByAdmin: payment.verifiedByAdmin || false,
        paymentStatus: payStatus
      },
      status: orderStatus,
      courierName: body.courierName || '',
      trackingNumber: body.trackingNumber || '',
      adminNotes: body.adminNotes || '',
      rejectionReason: body.rejectionReason || ''
    };

    // Save to memory and disk
    orders.unshift(newOrder);
    saveOrders(orders);

    // Record submission fingerprint for duplicate protection
    recentOrderSubmissions.push({ id: targetOrderId, fingerprint, timestamp: now });
    if (recentOrderSubmissions.length > 50) recentOrderSubmissions.shift();

    // Broadcast real-time SSE to Admin & all connected phones
    broadcastSSE({
      type: 'NEW_ORDER',
      message: `🚨 New Order #${newOrder.id} from ${newOrder.customer.fullName} for ₹${newOrder.totalAmount}`,
      order: newOrder,
      timestamp: new Date().toISOString()
    });

    // Send instant Telegram alert
    sendTelegramAlert(newOrder, "🚨 NEW ORDER RECEIVED!").catch(() => {});

    // Save order to Google Sheets Orders tab
    const settings = loadSettings();
    const webhookUrl = settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
    if (webhookUrl) {
      syncOrderToGoogleSheets(newOrder, 'save_order', webhookUrl).catch(err => {
        console.warn('Google Sheet background order sync error:', err);
      });
    }

    return res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Error in POST /api/orders:', err);
    return res.status(500).json({ error: 'Failed to save order on server.' });
  }
});

// Update Order Status (Confirm, Reject, Add Tracking)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, courierName, trackingNumber, adminNotes, rejectionReason, verifiedByAdmin } = req.body;

    const orders = loadOrders();
    const index = orders.findIndex(o => o.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = orders[index];
    const newStatus = (status as OrderStatus) || currentOrder.status;
    const nowIso = new Date().toISOString();

    const updatedOrder: Order = {
      ...currentOrder,
      status: newStatus,
      updatedAt: nowIso,
      courierName: courierName !== undefined ? courierName : currentOrder.courierName,
      trackingNumber: trackingNumber !== undefined ? trackingNumber : currentOrder.trackingNumber,
      adminNotes: adminNotes !== undefined ? adminNotes : currentOrder.adminNotes,
      rejectionReason: rejectionReason !== undefined ? rejectionReason : currentOrder.rejectionReason,
      payment: {
        ...currentOrder.payment,
        verifiedByAdmin: verifiedByAdmin !== undefined ? verifiedByAdmin : (newStatus === 'Confirmed' || currentOrder.payment.verifiedByAdmin),
        paymentStatus: (newStatus === 'Confirmed' || newStatus === 'Shipped') ? 'Verified' : currentOrder.payment.paymentStatus
      }
    };

    orders[index] = updatedOrder;
    saveOrders(orders);

    // Determine Google Sheets action
    let action: 'confirm_order' | 'reject_order' | 'ship_order' | 'update_order' = 'update_order';
    const s = String(newStatus).toLowerCase();
    if (s.includes('confirm')) {
      action = 'confirm_order';
    } else if (s.includes('reject') || s.includes('cancel')) {
      action = 'reject_order';
    } else if (s.includes('ship') || trackingNumber) {
      action = 'ship_order';
    }

    // Broadcast SSE update so customer "My Orders" reflects immediately
    broadcastSSE({
      type: 'ORDER_UPDATED',
      order: updatedOrder
    });

    // Send Telegram alert on status change
    sendTelegramAlert(updatedOrder, `🔔 ORDER STATUS: ${String(newStatus).toUpperCase()}`).catch(() => {});

    // Update the SAME row in Google Sheets
    const settings = loadSettings();
    const webhookUrl = settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
    if (webhookUrl) {
      syncOrderToGoogleSheets(updatedOrder, action, webhookUrl).catch(e => {
        console.warn('Google Sheet background status update error:', e);
      });
    }

    return res.json(updatedOrder);
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Force Bi-Directional Google Sheets Sync
app.post('/api/googlesheet/sync', async (req, res) => {
  try {
    const settings = loadSettings();
    const webhookUrl = (req.body.webhookUrl || settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "").trim();

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Google Sheet Webhook URL is not configured.' });
    }

    let updatedProducts = loadProducts();
    let updatedOrders = loadOrders();

    // If a product write just happened, return current authoritative state without overwriting
    if (isSheetWriteActiveOrRecent(10000) || Date.now() - lastLocalProductWriteAt < 15000) {
      return res.json({
        success: true,
        message: 'Local product changes active and syncing to Google Sheets!',
        products: updatedProducts,
        orders: updatedOrders,
        productsCount: updatedProducts.length,
        ordersCount: updatedOrders.length,
        lastSync: settings.googleSheetLastSync || new Date().toISOString()
      });
    }

    const result = await fetchGoogleSheetAll(webhookUrl);

    if (result.success) {
      if (Array.isArray(result.products)) {
        updatedProducts = mergeProductsWithSheet(updatedProducts, result.products);
        saveProducts(updatedProducts);
        broadcastSSE({ type: 'PRODUCTS_UPDATED', products: updatedProducts });
      }

      if (Array.isArray(result.orders) && result.orders.length > 0) {
        updatedOrders = result.orders;
        saveOrders(updatedOrders);
        broadcastSSE({ type: 'ORDER_UPDATED' });
      }

      settings.googleSheetLastSync = new Date().toISOString();
      saveSettings(settings);

      return res.json({
        success: true,
        message: 'Successfully synchronized with Google Sheets!',
        products: updatedProducts,
        orders: updatedOrders,
        productsCount: updatedProducts.length,
        ordersCount: updatedOrders.length,
        lastSync: settings.googleSheetLastSync
      });
    } else {
      return res.json({
        success: true,
        message: 'Connected to Google Sheet Webhook. Orders and Products will sync on every change!',
        products: updatedProducts,
        orders: updatedOrders,
        productsCount: updatedProducts.length,
        ordersCount: updatedOrders.length
      });
    }
  } catch (err: any) {
    console.error('Google Sheet manual sync error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to sync with Google Sheets' });
  }
});

// Google Sheet Connection Status Endpoint
app.get('/api/googlesheet/status', (req, res) => {
  const settings = loadSettings();
  const webhookUrl = settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
  const products = loadProducts();
  const orders = loadOrders();

  res.json({
    connected: Boolean(webhookUrl && webhookUrl.startsWith('http')),
    webhookUrl,
    productsCount: products.length,
    ordersCount: orders.length,
    lastSync: settings.googleSheetLastSync || new Date().toISOString()
  });
});

// Google Apps Script Template Code Endpoint
app.get('/api/googlesheet/script-code', (req, res) => {
  res.type('text/plain').send(getGoogleAppsScriptTemplate());
});

// Test Google Sheet Webhook Endpoint
app.post('/api/googlesheet/test', async (req, res) => {
  try {
    const settings = loadSettings();
    const webhookUrl = (req.body.webhookUrl || settings.googleSheetWebhookUrl || "").trim();

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Google Sheet Webhook URL is missing.' });
    }

    const testPayload = {
      action: "save_order",
      orderId: "BDH-TEST-00001",
      customerName: "Test Customer (Bhraava Di Hatti)",
      phone: "94171-24082",
      address: "Main Market, Rampura Phul, Bathinda, Punjab - 151509",
      productTitle: "Farshi Salwar Suit Material",
      color: "Deep Maroon",
      size: "Unstitched",
      quantity: 1,
      amount: 650,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const testRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      redirect: 'follow'
    });

    if (testRes.ok || testRes.status === 200 || testRes.status === 302 || testRes.status === 201) {
      return res.json({ success: true, message: 'Test connection successful! Row sent to your Google Sheet.' });
    } else {
      const text = await testRes.text();
      return res.status(400).json({ error: `Google Apps Script returned status ${testRes.status}: ${text}` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to send Google Sheet test row' });
  }
});

// Auto-detect Telegram Chat ID from recent bot messages
app.get('/api/telegram/autodetect', async (req, res) => {
  try {
    const settings = loadSettings();
    const token = (settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "8752135508:AAF2X43YeNzGKFazG9cFzMUNzVgnMs3Vju0").trim();
    
    if (!token) {
      return res.status(400).json({ error: 'Telegram Bot Token is not configured.' });
    }

    const updateRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return res.status(400).json({ error: `Telegram API Error: ${errText}` });
    }

    const data = await updateRes.json();
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
      return res.status(400).json({ 
        error: 'No messages found in bot history. Please open Telegram, search for your bot, send /start or any message to it, and try again!' 
      });
    }

    const validUpdate = data.result.reverse().find((u: any) => u.message?.chat?.id || u.channel_post?.chat?.id);
    if (!validUpdate) {
      return res.status(400).json({ error: 'No user chat ID found in recent bot updates.' });
    }

    const chat = validUpdate.message?.chat || validUpdate.channel_post?.chat;
    const detectedChatId = String(chat.id);
    const firstName = chat.first_name || chat.title || 'Admin';

    settings.telegramChatId = detectedChatId;
    saveSettings(settings);

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: detectedChatId,
        text: `✅ <b>Telegram Order Alert System Connected!</b>\n\nHello ${firstName}! Your Telegram chat is now linked with Bhraava Di Hatti (Jai Durga Cloth Emporium). You will receive instant alerts for every new order placed on any phone!`,
        parse_mode: 'HTML'
      })
    }).catch(() => {});

    return res.json({ 
      success: true, 
      chatId: detectedChatId, 
      firstName,
      message: `Successfully connected Telegram Chat ID: ${detectedChatId} (${firstName})` 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to auto-detect Telegram Chat ID' });
  }
});

// Test Telegram Bot Notification Endpoint
app.post('/api/telegram/test', async (req, res) => {
  try {
    const settings = loadSettings();
    const token = (settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "8752135508:AAF2X43YeNzGKFazG9cFzMUNzVgnMs3Vju0").trim();
    const chatId = (req.body.chatId || settings.telegramChatId || "").trim();

    if (!token) {
      return res.status(400).json({ error: 'Telegram Bot Token is missing.' });
    }
    if (!chatId) {
      return res.status(400).json({ error: 'Telegram Chat ID is missing. Click Auto-Detect Chat ID first or enter your Chat ID.' });
    }

    const testRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🎉 <b>Telegram Order Notification Test Successful!</b>\n\n🏬 Store: Bhraava Di Hatti (Jai Durga Cloth Emporium)\n⚡ Status: Live & Ready\n\nYou will receive instant alerts on this Telegram chat for every new customer order!`,
        parse_mode: 'HTML'
      })
    });

    if (testRes.ok) {
      return res.json({ success: true, message: 'Test message sent successfully to Telegram!' });
    } else {
      const errText = await testRes.text();
      return res.status(400).json({ error: `Telegram error: ${errText}` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to send Telegram test message' });
  }
});

// Track Order Endpoint for Customers (Direct from Database)
app.get('/api/orders/track/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase();
  const orders = loadOrders();

  if (query === 'all' || query === '') {
    return res.json(orders);
  }

  const cleanNum = query.replace(/[^0-9]/g, '');
  const matched = orders.filter(o => 
    o.id.toLowerCase().includes(query) || 
    (o.utsNumber && o.utsNumber.toLowerCase().includes(query)) ||
    (o.customer?.phone && cleanNum && o.customer.phone.replace(/[^0-9]/g, '').includes(cleanNum)) ||
    (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(query)) ||
    (o.trackingNumber && o.trackingNumber.toLowerCase().includes(query))
  );

  res.json(matched);
});

// Settings API
app.get('/api/settings', (req, res) => {
  const settings = loadSettings();
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  const current = loadSettings();
  const updated = { ...current, ...newSettings };
  saveSettings(updated);
  broadcastSSE({ type: 'SETTINGS_UPDATED', settings: updated });
  res.json(updated);
});

// ----------------------------------------------------
// VITE / STATIC SERVING SETUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bhraava Di Hatti - Jai Durga Cloth Emporium server running on http://0.0.0.0:${PORT}`);
    
    const syncSheetToServer = async () => {
      try {
        // Do not overwrite or race while a local product upload/edit/delete is in progress or recent
        if (isSheetWriteActiveOrRecent(15000) || Date.now() - lastLocalProductWriteAt < 25000) {
          return;
        }

        const settings = loadSettings();
        const webhook = settings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
        if (!webhook) return;

        const res = await fetchGoogleSheetAll(webhook);
        // Re-check write lock after async fetch completes!
        if (isSheetWriteActiveOrRecent(15000) || Date.now() - lastLocalProductWriteAt < 25000) {
          return;
        }

        if (res.success && Array.isArray(res.products)) {
          const current = loadProducts();
          const currentSig = current.map(p => `${p.id}:${p.name}:${p.price}:${(p.imageUrl || '').length}`).join('|');
          const nextProducts = mergeProductsWithSheet(current, res.products);
          const nextSig = nextProducts.map(p => `${p.id}:${p.name}:${p.price}:${(p.imageUrl || '').length}`).join('|');

          if (currentSig !== nextSig) {
            console.log(`✅ Synced ${nextProducts.length} products from Google Sheets`);
            saveProducts(nextProducts);
            broadcastSSE({ type: 'PRODUCTS_UPDATED', products: nextProducts });
          }
        }
      } catch {}
    };

    // Initial Google Sheets background sync check + periodic 45s server-side sync
    syncSheetToServer();
    setInterval(syncSheetToServer, 45000);
  });
}

startServer();
