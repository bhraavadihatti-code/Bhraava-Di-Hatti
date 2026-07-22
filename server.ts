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
function loadProducts(): Product[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const savedProducts: Product[] = JSON.parse(data);
      const savedIds = new Set(savedProducts.map(p => p.id));
      const missing = INITIAL_PRODUCTS.filter(p => !savedIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...missing, ...savedProducts];
        saveProducts(merged);
        return merged;
      }
      return savedProducts;
    }
  } catch (err) {
    console.error('Error reading products file, falling back to initial:', err);
  }
  // Initialize file with default products
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
      return JSON.parse(data);
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

  req.on('close', () => {
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
    
    if (!newProduct.id) {
      newProduct.id = `BDH-${Date.now().toString().slice(-4)}`;
    }
    newProduct.firmName = newProduct.firmName || "Jai Durga Cloth Emporium";
    newProduct.shopName = newProduct.shopName || "Bhraava Di Hatti";

    const products = loadProducts();
    products.unshift(newProduct);
    saveProducts(products);

    broadcastSSE({ type: 'PRODUCTS_UPDATED' });

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

    products[index] = { ...products[index], ...updatedData };
    saveProducts(products);

    broadcastSSE({ type: 'PRODUCTS_UPDATED' });

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

    broadcastSSE({ type: 'PRODUCTS_UPDATED' });

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
  const { customer, items, subtotal, discount, shippingFee, totalAmount, payment } = req.body;

  if (!customer || !items || !items.length || !payment || !payment.utrNumber) {
    return res.status(400).json({ error: 'Incomplete order details or missing UTR/UTS payment reference number.' });
  }

  const orders = loadOrders();
  const orderCount = orders.length + 1001;
  const newOrder: Order = {
    id: `BDH-2026-${orderCount}`,
    utsNumber: payment.utrNumber.trim(),
    createdAt: new Date().toISOString(),
    customer,
    items,
    subtotal: subtotal || 0,
    discount: discount || 0,
    shippingFee: shippingFee || 0,
    totalAmount: totalAmount || 0,
    payment: {
      method: 'UPI_QR',
      upiIdUsed: payment.upiIdUsed || loadSettings().upiId,
      utrNumber: payment.utrNumber.trim(),
      screenshotUrl: payment.screenshotUrl,
      paymentTimestamp: new Date().toISOString(),
      verifiedByAdmin: false
    },
    status: 'pending_acceptance'
  };

  orders.unshift(newOrder);
  saveOrders(orders);

  // Broadcast real-time push notification alert to Admin
  broadcastSSE({
    type: 'NEW_ORDER',
    message: `🚨 New Order received! Order #${newOrder.id} from ${newOrder.customer.fullName} for ₹${newOrder.totalAmount} (UTS: ${newOrder.utsNumber})`,
    order: newOrder,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(newOrder);
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
