import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Product, Order, ShopSettings, OrderStatus } from './src/types.js';
import { INITIAL_PRODUCTS, DEFAULT_SHOP_SETTINGS } from './src/data/initialProducts.js';

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
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers for file reading/writing
function cleanImageUrl(url: string): string {
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

function loadProducts(): Product[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const savedProducts: Product[] = JSON.parse(data);
      if (Array.isArray(savedProducts) && savedProducts.length > 0) {
        return savedProducts;
      }
    }
  } catch (err) {
    console.error('Error reading products file, falling back to initial:', err);
  }
  saveProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

function saveProducts(products: Product[]): void {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving products:', err);
  }
}

function loadOrders(): Order[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading orders file:', err);
  }
  // Default mock sample order to show admin panel immediately
  const initialOrders: Order[] = [
    {
      id: "BDH-2026-1001",
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
      subtotal: 2499,
      discount: 100,
      shippingFee: 0,
      totalAmount: 2399,
      payment: {
        method: "UPI_QR",
        upiIdUsed: DEFAULT_SHOP_SETTINGS.upiId,
        utrNumber: "420819234812",
        paymentTimestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        verifiedByAdmin: false
      },
      status: "pending_acceptance"
    }
  ];
  saveOrders(initialOrders);
  return initialOrders;
}

function saveOrders(orders: Order[]): void {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving orders:', err);
  }
}

function loadSettings(): ShopSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed: ShopSettings = JSON.parse(data);
      if (parsed) {
        if (!parsed.upiId || parsed.upiId === 'bhraavadihatti@upi') {
          parsed.upiId = DEFAULT_SHOP_SETTINGS.upiId;
          saveSettings(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading settings file:', err);
  }
  saveSettings(DEFAULT_SHOP_SETTINGS);
  return DEFAULT_SHOP_SETTINGS;
}

function saveSettings(settings: ShopSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving settings:', err);
  }
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
// API ROUTES
// ----------------------------------------------------

// SSE real-time stream for Admin Notifications
app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now().toString();
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial ping connection
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  // Heartbeat ping every 15s to keep connection alive on Cloud Run & mobile devices
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

// Products API
app.get('/api/products', (req, res) => {
  const products = loadProducts();
  res.json(products);
});

app.post('/api/products/sync-from-code', (req, res) => {
  try {
    saveProducts(INITIAL_PRODUCTS);
    broadcastSSE({ type: 'PRODUCTS_UPDATED' });
    res.json({ success: true, count: INITIAL_PRODUCTS.length, products: INITIAL_PRODUCTS });
  } catch (err: any) {
    console.error('Error syncing products from code:', err);
    res.status(500).json({ error: err?.message || 'Failed to sync products from code' });
  }
});

app.post('/api/products/bulk', (req, res) => {
  try {
    const newProducts = req.body;
    if (!Array.isArray(newProducts)) {
      return res.status(400).json({ error: 'Expected an array of products' });
    }
    saveProducts(newProducts);
    broadcastSSE({ type: 'PRODUCTS_UPDATED' });
    res.json({ success: true, count: newProducts.length, products: newProducts });
  } catch (err: any) {
    console.error('Error saving bulk products:', err);
    res.status(500).json({ error: err?.message || 'Failed to save bulk products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const newProduct: Product = req.body;
    if (!newProduct || !newProduct.name || !newProduct.price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const products = loadProducts();
    
    // Ensure unique SKU / ID
    if (!newProduct.id || products.some(p => p.id === newProduct.id)) {
      let maxNum = 100;
      products.forEach((p) => {
        const match = p.id.match(/^BDH-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      newProduct.id = `BDH-${maxNum + 1}`;
    }

    newProduct.firmName = newProduct.firmName || "Jai Durga Cloth Emporium";
    newProduct.shopName = newProduct.shopName || "Bhraava Di Hatti";
    newProduct.price = Number(newProduct.price);
    newProduct.originalPrice = newProduct.originalPrice ? Number(newProduct.originalPrice) : newProduct.price + 500;

    if (newProduct.imageUrl) {
      newProduct.imageUrl = cleanImageUrl(newProduct.imageUrl);
    }
    if (Array.isArray(newProduct.images) && newProduct.images.length > 0) {
      newProduct.images = newProduct.images.map(img => cleanImageUrl(img));
    } else if (newProduct.imageUrl) {
      newProduct.images = [newProduct.imageUrl];
    } else {
      const defaultImg = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
      newProduct.imageUrl = defaultImg;
      newProduct.images = [defaultImg];
    }

    if (!newProduct.imageUrl && newProduct.images.length > 0) {
      newProduct.imageUrl = newProduct.images[0];
    }

    products.unshift(newProduct);
    saveProducts(products);

    broadcastSSE({ type: 'PRODUCTS_UPDATED', products });

    res.status(201).json(newProduct);
  } catch (err: any) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: err?.message || 'Server error adding product' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedData: Partial<Product> = req.body;
    const products = loadProducts();
    
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (updatedData.imageUrl) {
      updatedData.imageUrl = cleanImageUrl(updatedData.imageUrl);
    }
    if (Array.isArray(updatedData.images)) {
      updatedData.images = updatedData.images.map(img => cleanImageUrl(img));
    }

    products[index] = { ...products[index], ...updatedData };
    saveProducts(products);

    broadcastSSE({ type: 'PRODUCTS_UPDATED', products });

    res.json(products[index]);
  } catch (err: any) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err?.message || 'Server error updating product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    let products = loadProducts();
    products = products.filter(p => p.id !== id);
    saveProducts(products);

    broadcastSSE({ type: 'PRODUCTS_UPDATED', products });

    res.json({ success: true, id });
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

app.post('/api/orders', (req, res) => {
  try {
    const { customer, items, subtotal, discount, shippingFee, totalAmount, payment, utsNumber } = req.body;

    if (!customer || !customer.fullName || !items || !items.length) {
      return res.status(400).json({ error: 'Incomplete order details. Please provide customer details and items.' });
    }

    const utrRef = (payment?.utrNumber || utsNumber || `UTS-${Date.now().toString().slice(-6)}`).toString().trim();

    const orders = loadOrders();
    const orderCount = orders.length + 1001;
    const newOrder: Order = {
      id: `BDH-2026-${orderCount}`,
      utsNumber: utrRef,
      createdAt: new Date().toISOString(),
      customer,
      items,
      subtotal: subtotal || 0,
      discount: discount || 0,
      shippingFee: shippingFee || 0,
      totalAmount: totalAmount || 0,
      payment: {
        method: 'UPI_QR',
        upiIdUsed: payment?.upiIdUsed || loadSettings().upiId,
        utrNumber: utrRef,
        screenshotUrl: payment?.screenshotUrl,
        paymentTimestamp: new Date().toISOString(),
        verifiedByAdmin: false
      },
      status: 'pending_acceptance'
    };

    orders.unshift(newOrder);
    saveOrders(orders);

    // Broadcast real-time push notification alert to Admin
    try {
      broadcastSSE({
        type: 'NEW_ORDER',
        message: `🚨 New Order received! Order #${newOrder.id} from ${newOrder.customer.fullName} for ₹${newOrder.totalAmount} (UTS: ${newOrder.utsNumber})`,
        order: newOrder,
        timestamp: new Date().toISOString()
      });
    } catch (sseErr) {
      console.warn('SSE broadcast warning:', sseErr);
    }

    return res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Error in POST /api/orders:', err);
    return res.status(500).json({ error: 'Failed to save order on server.' });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, courierName, trackingNumber, adminNotes, rejectionReason, verifiedByAdmin } = req.body;

  const orders = loadOrders();
  const index = orders.findIndex(o => o.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const currentOrder = orders[index];
  const updatedOrder: Order = {
    ...currentOrder,
    status: (status as OrderStatus) || currentOrder.status,
    courierName: courierName !== undefined ? courierName : currentOrder.courierName,
    trackingNumber: trackingNumber !== undefined ? trackingNumber : currentOrder.trackingNumber,
    adminNotes: adminNotes !== undefined ? adminNotes : currentOrder.adminNotes,
    rejectionReason: rejectionReason !== undefined ? rejectionReason : currentOrder.rejectionReason,
    payment: {
      ...currentOrder.payment,
      verifiedByAdmin: verifiedByAdmin !== undefined ? verifiedByAdmin : (status === 'payment_verified' || status === 'processing' || currentOrder.payment.verifiedByAdmin)
    }
  };

  orders[index] = updatedOrder;
  saveOrders(orders);

  // Broadcast status change
  broadcastSSE({
    type: 'ORDER_UPDATED',
    order: updatedOrder
  });

  res.json(updatedOrder);
});

// Track Order Endpoint for Customers
app.get('/api/orders/track/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase();
  const orders = loadOrders();

  if (query === 'all' || query === '') {
    return res.json(orders);
  }

  const matched = orders.filter(o => 
    o.id.toLowerCase().includes(query) || 
    o.utsNumber.toLowerCase().includes(query) ||
    o.customer.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) ||
    o.customer.fullName.toLowerCase().includes(query) ||
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
  });
}

startServer();
