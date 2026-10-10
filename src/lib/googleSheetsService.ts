import { Product, Order, OrderStatus } from '../types.js';
import { formatImageUrl, getSheetSafeImage } from './imageUtils.js';

export const PRODUCTS_SHEET_NAME = 'Products';
export const ORDERS_SHEET_NAME = 'Orders';

export const PRODUCT_COLUMNS = [
  'ProductID',
  'Title',
  'Description',
  'Price',
  'OriginalPrice',
  'Category',
  'Color',
  'Sizes',
  'ImageURL',
  'Stock',
  'Status',
  'CreatedAt'
];

export const ORDER_COLUMNS = [
  'OrderID',
  'CustomerName',
  'Phone',
  'Address',
  'ProductID',
  'ProductTitle',
  'Color',
  'Size',
  'Quantity',
  'Amount',
  'PaymentMethod',
  'PaymentStatus',
  'OrderStatus',
  'Courier',
  'TrackingNumber',
  'CreatedAt',
  'UpdatedAt'
];

/**
 * Format a Product into the 12 exact Google Sheets columns
 */
export function formatProductForSheet(product: Product) {
  const colorsStr = Array.isArray(product.colors) ? product.colors.join(', ') : (product.colors || '');
  const sizesStr = Array.isArray(product.sizes) ? product.sizes.join(', ') : (product.sizes || '');
  const inStockStr = product.inStock !== false ? 'In Stock' : 'Out of Stock';
  const statusStr = product.status || 'Active';
  const createdStr = product.createdAt || new Date().toISOString();

  const rawSheetCandidate =
    product.sheetImageUrl ||
    getSheetSafeImage(product.imageUrl || '') ||
    product.imageUrl ||
    '';
  let safeImageUrl = formatImageUrl(rawSheetCandidate);
  if (safeImageUrl.startsWith('data:image/') && safeImageUrl.length > 47000) {
    safeImageUrl = formatImageUrl(safeImageUrl.slice(0, 47000));
  }

  return {
    productId: String(product.id || '').trim(),
    title: product.name || 'Suit Material',
    description: product.description || '',
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || Number(product.price) + 500,
    category: product.category || 'Punjabi Suit',
    color: colorsStr,
    sizes: sizesStr,
    imageUrl: safeImageUrl,
    stock: inStockStr,
    status: statusStr,
    createdAt: createdStr
  };
}

/**
 * Format an Order into the 17 exact Google Sheets columns
 */
export function formatOrderForSheet(order: Order) {
  const items = order.items && order.items.length > 0 ? order.items : [];
  
  // Aggregate items into product descriptions
  const productIds = items.map(i => i.product?.id || '').filter(Boolean).join(', ');
  const productTitles = items.map(i => i.product?.name || 'Punjabi Suit').join(', ');
  const colors = items.map(i => i.selectedColor || 'Standard').join(', ');
  const sizes = items.map(i => i.selectedSize || 'Free Size').join(', ');
  const totalQty = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  const fullAddress = `${order.customer?.address || ''}, ${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}`.replace(/^,\s*|,\s*$/g, '');

  let normStatus = 'Pending';
  const s = String(order.status || '').toLowerCase();
  if (s.includes('confirm')) normStatus = 'Confirmed';
  else if (s.includes('reject') || s.includes('cancel')) normStatus = 'Rejected';
  else if (s.includes('ship') || s.includes('post') || s.includes('delivery')) normStatus = 'Shipped';
  else if (s.includes('deliver')) normStatus = 'Delivered';
  else normStatus = 'Pending';

  const payMethod = order.payment?.method || 'COD';
  const payStatus = order.payment?.verifiedByAdmin ? 'Verified' : (order.payment?.paymentStatus || 'Pending');

  return {
    orderId: order.id,
    customerName: order.customer?.fullName || 'Customer',
    phone: order.customer?.phone || '',
    address: fullAddress,
    productId: productIds || 'BDH-SUIT',
    productTitle: productTitles || 'Suit Set',
    color: colors || 'Standard',
    size: sizes || 'Unstitched',
    quantity: totalQty || 1,
    amount: Number(order.totalAmount) || 0,
    paymentMethod: payMethod,
    paymentStatus: payStatus,
    orderStatus: normStatus,
    courier: order.courierName || '',
    trackingNumber: order.trackingNumber || '',
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString()
  };
}

// Track active write operations and deduplicate concurrent read fetches
// so Google Apps Script LockService is never overwhelmed by parallel requests
let activeWriteOperations = 0;
let lastWriteCompletedAt = 0;
let writeQueue: Promise<any> = Promise.resolve();
const activeReadControllers = new Set<AbortController>();

interface FetchAllResult {
  success: boolean;
  products?: Product[];
  orders?: Order[];
  error?: string;
}

const inFlightFetchAll = new Map<string, Promise<FetchAllResult>>();
const lastFetchCache = new Map<string, { timestamp: number; result: FetchAllResult }>();

export function isSheetWriteActiveOrRecent(cooldownMs = 8000): boolean {
  return activeWriteOperations > 0 || Date.now() - lastWriteCompletedAt < cooldownMs;
}

function abortActiveBackgroundReads() {
  for (const ctrl of activeReadControllers) {
    try {
      ctrl.abort();
    } catch {}
  }
  activeReadControllers.clear();
  inFlightFetchAll.clear();
}

function isAppsScriptSuccessResponse(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.includes('"status":"error"') || trimmed.includes('"status": "error"')) {
    return false;
  }
  return true;
}

/**
 * Send Product action to Google Sheets Webhook
 * Works in both Node.js (server) and Mobile Browser (client)
 */
export async function syncProductToGoogleSheets(
  product: Product,
  action: 'save_product' | 'update_product' | 'delete_product',
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const url = (webhookUrl || '').trim();
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Google Sheet Webhook URL not configured.' };
  }

  activeWriteOperations++;
  lastWriteCompletedAt = Date.now();
  // Cancel any in-flight background read so Apps Script LockService is immediately free for this write
  abortActiveBackgroundReads();
  lastFetchCache.delete(url);

  const runWrite = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanId = String(product.id || '').trim();
      const sheetData = formatProductForSheet(product);

      // For delete_product, never send the 38KB base64 imageUrl; only send the ID so GET is instant
      const payload: Record<string, any> =
        action === 'delete_product'
          ? {
              action: 'delete_product',
              sheet: PRODUCTS_SHEET_NAME,
              productId: cleanId,
              id: cleanId
            }
          : {
              action,
              sheet: PRODUCTS_SHEET_NAME,
              ...sheetData,
              productId: cleanId,
              id: cleanId,
              name: product.name || sheetData.title
            };

      const hasLargePayload = Boolean(payload.imageUrl && String(payload.imageUrl).length > 1500);

      for (let attempt = 1; attempt <= 2; attempt++) {
        // 1. Primary Method for small payloads (e.g. delete_product or URL-based images): GET with query parameters
        if (!hasLargePayload) {
          try {
            const params = new URLSearchParams();
            Object.entries(payload).forEach(([k, v]) => {
              if (v !== undefined && v !== null) {
                params.append(k, String(v));
              }
            });
            params.append('_t', String(Date.now()));
            const separator = url.includes('?') ? '&' : '?';
            const getUrl = `${url}${separator}${params.toString()}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            const getRes = await fetch(getUrl, {
              method: 'GET',
              signal: controller.signal,
              redirect: 'follow'
            });
            clearTimeout(timeoutId);

            if (getRes.ok || getRes.status === 200 || getRes.status === 302) {
              const resText = await getRes.text();
              if (isAppsScriptSuccessResponse(resText)) {
                return { success: true };
              }
            }
          } catch {
            // Fall through to POST method
          }
        }

        // 2. Primary Method for base64 gallery photos (or fallback for GET): POST with text/plain
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            signal: controller.signal,
            redirect: 'follow'
          });

          clearTimeout(timeoutId);

          if (res.type === 'opaque') {
            return { success: true };
          }

          if (res.ok || res.status === 200 || res.status === 302) {
            const resText = await res.text();
            if (isAppsScriptSuccessResponse(resText)) {
              return { success: true };
            }
          }
        } catch (err: any) {
          const isAbort = err?.name === 'AbortError' || String(err?.message || '').includes('aborted');
          if (!isAbort && typeof window !== 'undefined' && attempt === 2) {
            try {
              await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
              });
              return { success: true };
            } catch (fallbackErr: any) {
              return { success: false, error: fallbackErr?.message || 'Network error syncing with Google Sheet' };
            }
          }
          if (attempt === 2) {
            return { success: false, error: err?.message || 'Timed out syncing product with Google Sheet' };
          }
        }

        // Wait briefly before retry if LockService was busy
        await new Promise((r) => setTimeout(r, 1200));
      }

      return { success: false, error: 'Failed to sync product to Google Sheet after retries' };
    } finally {
      activeWriteOperations = Math.max(0, activeWriteOperations - 1);
      lastWriteCompletedAt = Date.now();
    }
  };

  const queuedPromise = writeQueue.then(runWrite, runWrite);
  writeQueue = queuedPromise.catch(() => {});
  return queuedPromise;
}

/**
 * Send Order action to Google Sheets Webhook
 * Works in both Node.js (server) and Mobile Browser (client)
 */
export async function syncOrderToGoogleSheets(
  order: Order,
  action: 'save_order' | 'confirm_order' | 'reject_order' | 'ship_order' | 'update_order',
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const url = (webhookUrl || '').trim();
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Google Sheet Webhook URL not configured.' };
  }

  activeWriteOperations++;
  lastWriteCompletedAt = Date.now();
  abortActiveBackgroundReads();
  lastFetchCache.delete(url);

  try {
    const sheetData = formatOrderForSheet(order);
    const payload = {
      action,
      sheet: ORDERS_SHEET_NAME,
      ...sheetData,
      // Backward compatibility fields
      id: order.id,
      utsNumber: order.utsNumber || '',
      date: new Date(order.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      customerAddress: order.customer?.address || '',
      city: order.customer?.city || '',
      state: order.customer?.state || '',
      pincode: order.customer?.pincode || '',
      notes: order.customer?.notes || ''
    };

    // 1. Primary Method: GET with query parameters
    try {
      const params = new URLSearchParams();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          params.append(k, String(v));
        }
      });
      const separator = url.includes('?') ? '&' : '?';
      const getUrl = `${url}${separator}${params.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const getRes = await fetch(getUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(timeoutId);

      if (getRes.ok || getRes.status === 200 || getRes.status === 302) {
        return { success: true };
      }
    } catch {
      // Fall through to POST fallback
    }

    // 2. Secondary Method: POST with text/plain
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (res.ok || res.status === 200 || res.status === 302 || res.type === 'opaque') {
        return { success: true };
      }
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || String(err?.message || '').includes('aborted');
      if (!isAbort && typeof window !== 'undefined') {
        try {
          await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          return { success: true };
        } catch (fallbackErr: any) {
          return { success: false, error: fallbackErr?.message || 'Network error syncing with Google Sheet' };
        }
      }
      return { success: false, error: err?.message || 'Timed out syncing order with Google Sheet' };
    }

    return { success: true };
  } finally {
    activeWriteOperations = Math.max(0, activeWriteOperations - 1);
    lastWriteCompletedAt = Date.now();
  }
}

/**
 * Fetch all Products and Orders from Google Sheets Webhook
 * Works in both Node.js (server) and Mobile Browser (client)
 * Deduplicates concurrent requests to avoid LockService queue timeouts.
 */
export async function fetchGoogleSheetAll(webhookUrl: string, forceRefresh = false): Promise<FetchAllResult> {
  const url = (webhookUrl || '').trim();
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Google Sheet Webhook URL not configured.' };
  }

  // If a write is currently happening, skip background read so we don't block the write lock
  if (!forceRefresh && activeWriteOperations > 0) {
    const cached = lastFetchCache.get(url);
    if (cached) return cached.result;
    return { success: false, error: 'Write operation in progress' };
  }

  // Return recent cached response if requested within 6 seconds
  if (!forceRefresh) {
    const cached = lastFetchCache.get(url);
    if (cached && Date.now() - cached.timestamp < 6000) {
      return cached.result;
    }
  }

  // If a fetch to this webhook URL is already in flight, reuse the same Promise
  const existingPromise = inFlightFetchAll.get(url);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async (): Promise<FetchAllResult> => {
    // 1. Primary Method: GET request with action=get_all (25s timeout)
    let getTimedOut = false;
    const getController = new AbortController();
    activeReadControllers.add(getController);
    try {
      const separator = url.includes('?') ? '&' : '?';
      const getUrl = `${url}${separator}action=get_all&_t=${Date.now()}`;
      const timeoutId = setTimeout(() => {
        getTimedOut = true;
        getController.abort();
      }, 25000);

      const res = await fetch(getUrl, {
        method: 'GET',
        signal: getController.signal,
        redirect: 'follow'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && (Array.isArray(data.products) || Array.isArray(data.orders))) {
          const result: FetchAllResult = {
            success: true,
            products: Array.isArray(data.products) ? parseProductsFromSheet(data.products) : undefined,
            orders: Array.isArray(data.orders) ? parseOrdersFromSheet(data.orders) : undefined
          };
          lastFetchCache.set(url, { timestamp: Date.now(), result });
          return result;
        }
      }
    } catch {
      if (getTimedOut || activeWriteOperations > 0) {
        return { success: false, error: 'Google Sheet busy or write in progress' };
      }
    } finally {
      activeReadControllers.delete(getController);
    }

    // 2. Secondary fallback: POST request (only if GET failed fast without timing out)
    const postController = new AbortController();
    activeReadControllers.add(postController);
    try {
      const timeoutId = setTimeout(() => postController.abort(), 20000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'get_all' }),
        signal: postController.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && (Array.isArray(data.products) || Array.isArray(data.orders))) {
          const result: FetchAllResult = {
            success: true,
            products: Array.isArray(data.products) ? parseProductsFromSheet(data.products) : undefined,
            orders: Array.isArray(data.orders) ? parseOrdersFromSheet(data.orders) : undefined
          };
          lastFetchCache.set(url, { timestamp: Date.now(), result });
          return result;
        }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to fetch from Google Sheets' };
    } finally {
      activeReadControllers.delete(postController);
    }

    return { success: false, error: 'Webhook did not return formatted data' };
  })();

  inFlightFetchAll.set(url, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightFetchAll.delete(url);
  }
}

export function normalizeSheetImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return formatImageUrl(String(rawUrl));
}

/**
 * Parse products row objects from Google Sheets into Product interface
 */
export function parseProductsFromSheet(rows: any[]): Product[] {
  return rows.map((r, idx) => {
    const id = String(r.ProductID || r.productId || r.id || `BDH-${101 + idx}`).trim();
    const name = String(r.Title || r.title || r.name || 'Suit Material').trim();
    const desc = String(r.Description || r.description || '').trim();
    const price = Number(r.Price || r.price) || 999;
    const origPrice = Number(r.OriginalPrice || r.originalPrice) || price + 500;
    const cat = String(r.Category || r.category || 'Punjabi Suit').trim();
    const colorRaw = String(r.Color || r.color || 'Standard');
    const colors = colorRaw.includes(',') ? colorRaw.split(',').map(s => s.trim()) : [colorRaw];
    const sizeRaw = String(r.Sizes || r.sizes || 'Unstitched');
    const sizes = sizeRaw.includes(',') ? sizeRaw.split(',').map(s => s.trim()) : [sizeRaw];
    const rawImg = String(r.ImageURL || r.imageUrl || r.image || '').trim();
    const imgUrl = normalizeSheetImageUrl(rawImg) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
    const stock = String(r.Stock || r.stock || 'In Stock').toLowerCase().includes('in');
    const status = String(r.Status || r.status || 'Active').trim();
    const createdAt = r.CreatedAt || r.createdAt || new Date().toISOString();

    return {
      id,
      name,
      firmName: "Jai Durga Cloth Emporium",
      shopName: "Bhraava Di Hatti",
      category: cat,
      tags: [cat, '3-Piece Suit', 'Punjabi Suit'],
      price,
      originalPrice: origPrice,
      description: desc,
      fabric: String(r.Fabric || r.fabric || 'Pure Unstitched Cotton / Silk').trim(),
      workType: String(r.WorkType || r.workType || 'Traditional Punjabi Work').trim(),
      colors,
      sizes,
      imageUrl: imgUrl,
      images: [imgUrl],
      inStock: stock,
      status,
      createdAt
    };
  });
}

/**
 * Parse orders row objects from Google Sheets into Order interface
 */
export function parseOrdersFromSheet(rows: any[]): Order[] {
  return rows.map(r => {
    const id = String(r.OrderID || r.orderId || r.id || '').trim();
    const custName = String(r.CustomerName || r.customerName || r.name || 'Customer').trim();
    const phone = String(r.Phone || r.phone || '').trim();
    const address = String(r.Address || r.address || '').trim();
    const productTitle = String(r.ProductTitle || r.productTitle || r.title || 'Suit Set').trim();
    const color = String(r.Color || r.color || 'Standard').trim();
    const size = String(r.Size || r.size || 'Unstitched').trim();
    const qty = Number(r.Quantity || r.quantity) || 1;
    const amount = Number(r.Amount || r.amount || r.totalAmount) || 0;
    const payMethod = String(r.PaymentMethod || r.paymentMethod || 'COD').trim();
    const payStatus = String(r.PaymentStatus || r.paymentStatus || 'Pending').trim();
    const orderStatusRaw = String(r.OrderStatus || r.orderStatus || r.status || 'Pending').trim();
    const courier = String(r.Courier || r.courier || '').trim();
    const tracking = String(r.TrackingNumber || r.trackingNumber || '').trim();
    const createdAt = r.CreatedAt || r.createdAt || new Date().toISOString();
    const updatedAt = r.UpdatedAt || r.updatedAt || new Date().toISOString();

    let status: OrderStatus = 'Pending';
    const s = orderStatusRaw.toLowerCase();
    if (s.includes('confirm')) status = 'Confirmed';
    else if (s.includes('reject') || s.includes('cancel')) status = 'Rejected';
    else if (s.includes('ship') || s.includes('post') || s.includes('delivery')) status = 'Shipped';
    else if (s.includes('deliver')) status = 'Delivered';
    else status = 'Pending';

    const order: Order = {
      id,
      utsNumber: r.utsNumber || tracking || id,
      createdAt,
      updatedAt,
      customer: {
        fullName: custName,
        phone,
        address,
        city: 'District Bathinda',
        state: 'Punjab',
        pincode: '151509'
      },
      items: [
        {
          product: {
            id: String(r.ProductID || r.productId || 'BDH-SUIT'),
            name: productTitle,
            category: 'Punjabi Suit',
            price: Math.round(amount / (qty || 1)),
            description: '',
            colors: [color],
            sizes: [size],
            imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
            inStock: true
          },
          selectedColor: color,
          selectedSize: size,
          quantity: qty
        }
      ],
      subtotal: amount,
      discount: 0,
      shippingFee: 0,
      totalAmount: amount,
      payment: {
        method: payMethod,
        utrNumber: r.utsNumber || '',
        paymentStatus: payStatus,
        verifiedByAdmin: payStatus === 'Verified' || status === 'Confirmed' || status === 'Shipped'
      },
      status,
      courierName: courier,
      trackingNumber: tracking
    };

    return order;
  });
}

/**
 * Returns the production-ready Google Apps Script code for the user's Spreadsheet
 */
export function getGoogleAppsScriptTemplate(): string {
  return `/**
 * =======================================================================
 * BHRAAVA DI HATTI - GOOGLE APPS SCRIPT CENTRAL DATABASE
 * =======================================================================
 * This script connects your Google Spreadsheet as the central backend
 * for Bhraava Di Hatti (Jai Durga Cloth Emporium).
 *
 * It manages TWO sheets:
 * 1. "Products"
 *    Columns: ProductID, Title, Description, Price, OriginalPrice, Category, Color, Sizes, ImageURL, Stock, Status, CreatedAt
 * 2. "Orders"
 *    Columns: OrderID, CustomerName, Phone, Address, ProductID, ProductTitle, Color, Size, Quantity, Amount, PaymentMethod, PaymentStatus, OrderStatus, Courier, TrackingNumber, CreatedAt, UpdatedAt
 *
 * HOW TO SET UP:
 * 1. Open your Google Spreadsheet: https://docs.google.com/spreadsheets
 * 2. In top menu, click: Extensions -> Apps Script
 * 3. Delete existing code, paste this entire file, and click Save (Ctrl+S)
 * 4. Click "Deploy" (top right) -> "New deployment"
 * 5. Select type: "Web app"
 * 6. Set Description: "Bhraava Di Hatti Backend Sync"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL!
 * 9. Click "Deploy", authorize permissions, and copy the Web App URL!
 * 10. Paste the URL into the Admin Panel -> Shop Settings -> Google Sheet Webhook URL!
 */

const PRODUCTS_SHEET = "Products";
const ORDERS_SHEET = "Orders";

const PRODUCT_HEADERS = [
  "ProductID", "Title", "Description", "Price", "OriginalPrice", 
  "Category", "Color", "Sizes", "ImageURL", "Stock", "Status", "CreatedAt"
];

const ORDER_HEADERS = [
  "OrderID", "CustomerName", "Phone", "Address", "ProductID", "ProductTitle", 
  "Color", "Size", "Quantity", "Amount", "PaymentMethod", "PaymentStatus", 
  "OrderStatus", "Courier", "TrackingNumber", "CreatedAt", "UpdatedAt"
];

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheets(ss);

    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const action = (data.action || e.parameter?.action || "").toLowerCase();

    // 1. GET ALL (Returns both Products & Orders)
    if (action === "get_all" || action === "fetchall") {
      const products = getSheetRowsAsJson(getProductsSheet(ss));
      const orders = getSheetRowsAsJson(getOrdersSheet(ss));
      return jsonResponse({ status: "success", products: products, orders: orders });
    }

    // 2. GET PRODUCTS
    if (action === "get_products" || action === "products") {
      const products = getSheetRowsAsJson(getProductsSheet(ss));
      return jsonResponse({ status: "success", products: products });
    }

    // 3. GET ORDERS
    if (action === "get_orders" || action === "orders") {
      const orders = getSheetRowsAsJson(getOrdersSheet(ss));
      return jsonResponse({ status: "success", orders: orders });
    }

    // 4. SAVE / UPDATE PRODUCT
    if (action === "save_product" || action === "update_product") {
      saveOrUpdateProduct(getProductsSheet(ss), data);
      return jsonResponse({ status: "success", message: "Product saved to Google Sheet" });
    }

    // 5. DELETE PRODUCT
    if (action === "delete_product") {
      deleteProduct(getProductsSheet(ss), data.productId || data.id);
      return jsonResponse({ status: "success", message: "Product removed from Google Sheet" });
    }

    // 6. SAVE ORDER (Customer Checkout) - Idempotent
    if (action === "save_order") {
      saveOrUpdateOrder(getOrdersSheet(ss), data);
      return jsonResponse({ status: "success", message: "Order saved to Google Sheet" });
    }

    // 7. CONFIRM ORDER (Admin)
    if (action === "confirm_order") {
      updateOrderStatus(getOrdersSheet(ss), data.orderId || data.id, "Confirmed", data.updatedAt);
      return jsonResponse({ status: "success", message: "Order marked as Confirmed" });
    }

    // 8. REJECT ORDER (Admin)
    if (action === "reject_order") {
      updateOrderStatus(getOrdersSheet(ss), data.orderId || data.id, "Rejected", data.updatedAt);
      return jsonResponse({ status: "success", message: "Order marked as Rejected" });
    }

    // 9. ADD TRACKING & SHIP (Admin)
    if (action === "ship_order" || action === "add_tracking") {
      updateOrderTracking(
        getOrdersSheet(ss), 
        data.orderId || data.id, 
        data.courier || data.courierName || "India Post", 
        data.trackingNumber || "",
        data.updatedAt
      );
      return jsonResponse({ status: "success", message: "Order shipped with tracking number" });
    }

    // 10. Default Fallback: If an order object is received without explicit action
    if (data.orderId || data.id || data.customerName || data.items) {
      saveOrUpdateOrder(getOrdersSheet(ss), data);
      return jsonResponse({ status: "success", message: "Order row updated" });
    }

    // Simple ping / status check
    return ContentService.createTextOutput("Bhraava Di Hatti Google Sheet Database is Active & Connected!");

  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Helper to find or create Products Sheet (Sheet 1)
function getProductsSheet(ss) {
  let sheet = ss.getSheetByName("Products") || 
              ss.getSheetByName("Sheet1") || 
              ss.getSheetByName("Sheet 1") || 
              ss.getSheetByName("शीट 1") ||
              ss.getSheetByName("Sheet 1 (Products)") ||
              ss.getSheetByName("Products Catalog");
  if (!sheet) {
    const all = ss.getSheets();
    if (all.length > 0) sheet = all[0];
  }
  return sheet;
}

// Helper to find or create Orders Sheet (Sheet 2)
function getOrdersSheet(ss) {
  let sheet = ss.getSheetByName("Orders") || 
              ss.getSheetByName("Sheet2") || 
              ss.getSheetByName("Sheet 2") || 
              ss.getSheetByName("शीट 2") ||
              ss.getSheetByName("Sheet 2 (Orders)") ||
              ss.getSheetByName("Orders Database");
  if (!sheet) {
    const all = ss.getSheets();
    if (all.length > 1) sheet = all[1];
  }
  return sheet;
}

// Ensure sheets and column headers exist for Sheet 1 & Sheet 2
function initSheets(ss) {
  let prodSheet = getProductsSheet(ss);
  if (!prodSheet) {
    prodSheet = ss.insertSheet("Sheet1");
  }
  if (prodSheet.getLastRow() === 0) {
    prodSheet.appendRow(PRODUCT_HEADERS);
    formatHeaderRow(prodSheet);
  }

  let orderSheet = getOrdersSheet(ss);
  if (!orderSheet) {
    orderSheet = ss.insertSheet("Sheet2");
  }
  if (orderSheet.getLastRow() === 0) {
    orderSheet.appendRow(ORDER_HEADERS);
    formatHeaderRow(orderSheet);
  }
}

// Custom top menu when user opens Google Spreadsheet
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🏪 Bhraava Di Hatti")
    .addItem("🔄 Setup / Check Headers (Sheet 1 & Sheet 2)", "setupSheetHeaders")
    .addToUi();
}

function setupSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheets(ss);
  SpreadsheetApp.getUi().alert("✅ Sheet 1 (Products) and Sheet 2 (Orders) headers are initialized!");
}

function formatHeaderRow(sheet) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setFontWeight("bold");
  range.setBackground("#4A0E17");
  range.setFontColor("#FAF7F2");
  sheet.setFrozenRows(1);
}

// Convert sheet rows into JSON array using header row
function getSheetRowsAsJson(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, colIdx) => {
      obj[header] = row[colIdx];
    });
    return obj;
  });
}

// Automatically saves base64 gallery photos into Google Drive and returns permanent CDN link
function processImage(imageUrl, title) {
  if (!imageUrl || typeof imageUrl !== "string") return "";
  const trimmed = imageUrl.trim();
  if (!trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  try {
    const parts = trimmed.split(",");
    const meta = parts[0];
    const mime = meta.split(":")[1].split(";")[0] || "image/jpeg";
    const ext = mime.includes("png") ? "png" : "jpg";
    const decoded = Utilities.base64Decode(parts[1]);
    const cleanTitle = (title || "suit").toString().replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const fileName = "BDH_" + cleanTitle + "_" + Date.now() + "." + ext;
    const blob = Utilities.newBlob(decoded, mime, fileName);

    const folderName = "Bhraava Di Hatti Product Images";
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://lh3.googleusercontent.com/d/" + file.getId() + "=s1600";
  } catch (err) {
    return trimmed.length > 47000 ? trimmed.slice(0, 47000) : trimmed;
  }
}

// Save or Update Product (matches by ProductID in Column 1)
function saveOrUpdateProduct(sheet, data) {
  const prodId = String(data.productId || data.id || "").trim();
  if (!prodId) return;

  const lastRow = sheet.getLastRow();
  let existingRowIndex = -1;

  if (lastRow > 1) {
    const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < idColumn.length; i++) {
      if (String(idColumn[i][0]).trim() === prodId) {
        existingRowIndex = i + 2; // +2 for 1-based index and header row
        break;
      }
    }
  }

  const finalImage = processImage(data.imageUrl || data.image || "", data.title || data.name);

  const rowValues = [
    prodId,
    data.title || data.name || "",
    data.description || "",
    data.price || 0,
    data.originalPrice || 0,
    data.category || "Punjabi Suit",
    data.color || "",
    data.sizes || "",
    finalImage,
    data.stock || "In Stock",
    data.status || "Active",
    data.createdAt || new Date().toISOString()
  ];

  if (existingRowIndex > 0) {
    sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

// Delete Product
function deleteProduct(sheet, prodId) {
  if (!prodId) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idColumn.length; i++) {
    if (String(idColumn[i][0]).trim() === String(prodId).trim()) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

// Save or Update Order (Matches by OrderID in Column 1 - Prevents Duplicates)
function saveOrUpdateOrder(sheet, data) {
  const orderId = String(data.orderId || data.id || "").trim();
  if (!orderId) return;

  const lastRow = sheet.getLastRow();
  let existingRowIndex = -1;

  if (lastRow > 1) {
    const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < idColumn.length; i++) {
      if (String(idColumn[i][0]).trim() === orderId) {
        existingRowIndex = i + 2;
        break;
      }
    }
  }

  const nowIso = new Date().toISOString();
  const rowValues = [
    orderId,
    data.customerName || data.name || "",
    data.phone || data.customerPhone || "",
    data.address || data.customerAddress || "",
    data.productId || "",
    data.productTitle || data.items || "Suit Set",
    data.color || data.colors || "Standard",
    data.size || data.sizes || "Unstitched",
    data.quantity || 1,
    data.amount || data.totalAmount || 0,
    data.paymentMethod || "COD",
    data.paymentStatus || "Pending",
    data.orderStatus || data.status || "Pending",
    data.courier || data.courierName || "",
    data.trackingNumber || "",
    data.createdAt || nowIso,
    data.updatedAt || nowIso
  ];

  if (existingRowIndex > 0) {
    // Preserve initial CreatedAt if exists
    const origCreated = sheet.getRange(existingRowIndex, 16).getValue();
    if (origCreated) rowValues[15] = origCreated;
    sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

// Update Order Status (Confirm / Reject)
function updateOrderStatus(sheet, orderId, newStatus, updatedAt) {
  const targetId = String(orderId || "").trim();
  if (!targetId) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idColumn.length; i++) {
    if (String(idColumn[i][0]).trim() === targetId) {
      const rowIndex = i + 2;
      // Col 13 is OrderStatus
      sheet.getRange(rowIndex, 13).setValue(newStatus);
      // Col 17 is UpdatedAt
      sheet.getRange(rowIndex, 17).setValue(updatedAt || new Date().toISOString());
      break;
    }
  }
}

// Update Order Tracking & Mark Shipped
function updateOrderTracking(sheet, orderId, courier, trackingNo, updatedAt) {
  const targetId = String(orderId || "").trim();
  if (!targetId) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idColumn.length; i++) {
    if (String(idColumn[i][0]).trim() === targetId) {
      const rowIndex = i + 2;
      // Col 13 is OrderStatus
      sheet.getRange(rowIndex, 13).setValue("Shipped");
      // Col 14 is Courier
      sheet.getRange(rowIndex, 14).setValue(courier || "India Post");
      // Col 15 is TrackingNumber
      sheet.getRange(rowIndex, 15).setValue(trackingNo);
      // Col 17 is UpdatedAt
      sheet.getRange(rowIndex, 17).setValue(updatedAt || new Date().toISOString());
      break;
    }
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
