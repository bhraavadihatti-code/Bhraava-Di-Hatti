import { Product, Order, OrderStatus } from '../types.js';

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

  return {
    productId: product.id,
    title: product.name,
    description: product.description || '',
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || Number(product.price) + 500,
    category: product.category || 'Punjabi Suit',
    color: colorsStr,
    sizes: sizesStr,
    imageUrl: product.imageUrl || '',
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

/**
 * Send Product action to Google Sheets Webhook
 */
export async function syncProductToGoogleSheets(
  product: Product,
  action: 'save_product' | 'update_product' | 'delete_product',
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, error: 'Google Sheet Webhook URL not configured.' };
  }

  try {
    const sheetData = formatProductForSheet(product);
    const payload = {
      action,
      sheet: PRODUCTS_SHEET_NAME,
      ...sheetData
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (res.ok || res.status === 200 || res.status === 302) {
      console.log(`✅ Google Sheet Sync: Product [${product.id}] synced successfully (${action})`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.warn(`⚠️ Google Sheet Sync returned ${res.status}: ${errText}`);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }
  } catch (err: any) {
    console.warn(`⚠️ Google Sheet Sync error for Product [${product.id}]:`, err?.message || err);
    return { success: false, error: err?.message || 'Network error syncing with Google Sheet' };
  }
}

/**
 * Send Order action to Google Sheets Webhook
 */
export async function syncOrderToGoogleSheets(
  order: Order,
  action: 'save_order' | 'confirm_order' | 'reject_order' | 'ship_order' | 'update_order',
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, error: 'Google Sheet Webhook URL not configured.' };
  }

  try {
    const sheetData = formatOrderForSheet(order);
    const payload = {
      action,
      sheet: ORDERS_SHEET_NAME,
      // Pass full columns format
      ...sheetData,
      // Also pass backward compatibility fields for older scripts
      id: order.id,
      utsNumber: order.utsNumber || '',
      date: new Date(order.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      customerAddress: order.customer?.address || '',
      city: order.customer?.city || '',
      state: order.customer?.state || '',
      pincode: order.customer?.pincode || '',
      notes: order.customer?.notes || ''
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (res.ok || res.status === 200 || res.status === 302) {
      console.log(`✅ Google Sheet Sync: Order [${order.id}] synced successfully (${action})`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.warn(`⚠️ Google Sheet Sync returned ${res.status}: ${errText}`);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }
  } catch (err: any) {
    console.warn(`⚠️ Google Sheet Sync error for Order [${order.id}]:`, err?.message || err);
    return { success: false, error: err?.message || 'Network error syncing with Google Sheet' };
  }
}

/**
 * Fetch all Products and Orders from Google Sheets Webhook
 */
export async function fetchGoogleSheetAll(webhookUrl: string): Promise<{
  success: boolean;
  products?: Product[];
  orders?: Order[];
  error?: string;
}> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, error: 'Google Sheet Webhook URL not configured.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Try POST action: "get_all"
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_all' }),
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (Array.isArray(data.products) || Array.isArray(data.orders))) {
        return {
          success: true,
          products: Array.isArray(data.products) ? parseProductsFromSheet(data.products) : undefined,
          orders: Array.isArray(data.orders) ? parseOrdersFromSheet(data.orders) : undefined
        };
      }
    }
    return { success: false, error: 'Webhook did not return formatted data' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch from Google Sheets' };
  }
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
    const imgUrl = String(r.ImageURL || r.imageUrl || r.image || '').trim() || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
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

  const rowValues = [
    prodId,
    data.title || data.name || "",
    data.description || "",
    data.price || 0,
    data.originalPrice || 0,
    data.category || "Punjabi Suit",
    data.color || "",
    data.sizes || "",
    data.imageUrl || data.image || "",
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
