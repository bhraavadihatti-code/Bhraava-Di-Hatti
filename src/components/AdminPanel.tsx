import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product, ShopSettings } from '../types';
import { playOrderAlertSound } from '../utils/audioAlert';
import { compressImageFile } from '../lib/imageUtils';
import { 
  Store, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Package, 
  Search, 
  PhoneCall, 
  MessageSquare, 
  Printer, 
  DollarSign, 
  Clock, 
  Lock, 
  Plus, 
  Edit3, 
  Trash2, 
  Settings, 
  QrCode, 
  AlertCircle,
  Volume2,
  VolumeX,
  Eye,
  LogOut,
  RefreshCw,
  FileText,
  Sparkles,
  Camera,
  Zap
} from 'lucide-react';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  settings: ShopSettings;
  onUpdateOrderStatus: (orderId: string, payload: any) => Promise<void>;
  onAddProduct: (product: Product) => Promise<void>;
  onUpdateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  products,
  settings,
  onUpdateOrderStatus,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateSettings,
  onLogout
}) => {
  // Simple PIN protection state (default PIN: 1234)
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default unlocked for easy shop access, can lock if desired

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time audio chime & push alert toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsGranted, setNotificationsGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission === 'granted' : false
  );
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  // Ship Modal State
  const [shippingModalOrder, setShippingModalOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('BlueDart / Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Deleted Serial Numbers log
  const [deletedSerialNumbers, setDeletedSerialNumbers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bdh_deleted_serials');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save deleted serials to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('bdh_deleted_serials', JSON.stringify(deletedSerialNumbers));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [deletedSerialNumbers]);

  // Helper to suggest next serial number
  const getSuggestedSerialNo = () => {
    let maxNum = 100;
    products.forEach((p) => {
      const match = p.id.match(/^BDH-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `BDH-${maxNum + 1}`;
  };

  // Add Product Form state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    id: '',
    name: '',
    price: '',
    category: 'Punjabi Suits',
    imageUrl: '',
    color: 'Standard / Multi'
  });
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newColorInput, setNewColorInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  const handleWorkerQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name.trim() || !workerForm.price) {
      alert('❌ Please fill in Product Name and Price!');
      return;
    }
    const priceNum = Number(workerForm.price);
    const finalProduct: Product = {
      id: workerForm.id || getSuggestedSerialNo(),
      name: workerForm.name.trim(),
      firmName: settings.firmName || "Jai Durga Cloth Emporium",
      shopName: settings.shopName || "Bhraava Di Hatti",
      category: workerForm.category || 'Punjabi Suits',
      tags: [workerForm.category || 'Punjabi Suits', 'Shop Item'],
      price: priceNum,
      originalPrice: priceNum + 500,
      description: `${workerForm.name.trim()} - Unstitched cloth suit material available at ${settings.shopName}.`,
      fabric: '100% Pure High Quality Cotton/Silk',
      workType: 'Gotta Patti & Zari Thread Work',
      colors: [workerForm.color || 'Standard / Multi'],
      sizes: ['Unstitched', 'L (40)', 'XL (42)'],
      imageUrl: workerForm.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      images: [workerForm.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'],
      inStock: true,
      isBestSeller: false,
      isNewArrival: true,
      rating: 4.9
    };

    try {
      await onAddProduct(finalProduct);
      alert(`🎉 Product "${finalProduct.name}" (${finalProduct.id}) Added Live!`);
      setShowWorkerModal(false);
      setWorkerForm({
        id: '',
        name: '',
        price: '',
        category: 'Punjabi Suits',
        imageUrl: '',
        color: 'Standard / Multi'
      });
    } catch (err: any) {
      alert(`❌ Error saving product: ${err?.message}`);
    }
  };

  const handleSyncFromCode = async () => {
    if (!confirm('Sync products directly from code file (/src/data/initialProducts.ts)?\n\nThis will load all products defined in code!')) return;
    try {
      const res = await fetch('/api/products/sync-from-code', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Successfully synced ${data.count} products from code (initialProducts.ts)!`);
        window.location.reload();
      } else {
        alert(`❌ Sync failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Error syncing from code: ${e?.message}`);
    }
  };

  const handleSaveBulkJson = async () => {
    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsed)) {
        alert('❌ Invalid JSON format: Must be an array of products starting with [ and ending with ]');
        return;
      }
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Successfully saved ${data.count} products from JSON!`);
        setShowBulkModal(false);
        window.location.reload();
      } else {
        alert(`❌ Error saving bulk products: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Invalid JSON syntax: ${e?.message}`);
    }
  };

  const [productForm, setProductForm] = useState<Partial<Product>>({
    id: 'BDH-109',
    name: '',
    category: 'Punjabi Suits',
    tags: ['Punjabi Suits', 'Cotton Suit', '3-Piece Material'],
    price: 1999,
    originalPrice: 2999,
    description: '',
    fabric: 'Pure Cotton / Silk',
    workType: 'Heavy Embroidery & Zari Work',
    colors: ['Red', 'Royal Blue', 'Bottle Green', 'Mustard Yellow'],
    sizes: ['Unstitched', 'L (40)', 'XL (42)'],
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    inStock: true
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setProductForm((prev) => ({ ...prev, imageUrl: compressed }));
      } catch (err) {
        console.error('Image compress error:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setProductForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddColor = () => {
    if (newColorInput.trim()) {
      setProductForm((prev) => ({
        ...prev,
        colors: [...(prev.colors || []), newColorInput.trim()]
      }));
      setNewColorInput('');
    }
  };

  const handleRemoveColor = (col: string) => {
    setProductForm((prev) => ({
      ...prev,
      colors: (prev.colors || []).filter((c) => c !== col)
    }));
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && (productForm.tags || []).length < 3) {
      setProductForm((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTagInput.trim()]
      }));
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setProductForm((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== t)
    }));
  };

  // Settings Form state
  const [settingsForm, setSettingsForm] = useState<ShopSettings>(settings);

  // Sync settings form when prop changes
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Request browser Web Push notifications
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationsGranted(perm === 'granted');
    }
  };

  // SSE Stream Listener for Real-time New Orders
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_ORDER' && data.order) {
            // Play alert sound chime
            if (soundEnabled) {
              playOrderAlertSound();
            }

            // Fire browser push notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`🚨 New Order #${data.order.id}!`, {
                body: `Customer: ${data.order.customer.fullName} | Total: ₹${data.order.totalAmount} | UTS: ${data.order.utsNumber}`,
                icon: '/icon.png'
              });
            }

            // Show banner alert
            setNewOrderAlert(data.order);
            setTimeout(() => setNewOrderAlert(null), 10000);
          }
        } catch (e) {
          console.error('SSE JSON error:', e);
        }
      };
    } catch (err) {
      console.warn('SSE connection fail:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [soundEnabled]);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesQuery = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.utsNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.phone.includes(searchQuery) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  // Metrics calculation
  const pendingCount = orders.filter(o => o.status === 'pending_acceptance').length;
  const confirmedCount = orders.filter(o => o.status === 'order_confirmed').length;
  const postOfficeShippedCount = orders.filter(o => o.status === 'shipping_post_office').length;
  const outForDeliveryCount = orders.filter(o => o.status === 'out_for_delivery').length;
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.totalAmount, 0);

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingModalOrder) return;
    await onUpdateOrderStatus(shippingModalOrder.id, {
      status: 'shipping_post_office',
      courierName: courierName || 'India Post (Speed Post)',
      trackingNumber: trackingNumber.trim()
    });
    setShippingModalOrder(null);
    setTrackingNumber('');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const allImagesList = Array.from(new Set([
      productForm.imageUrl,
      ...(productForm.images || [])
    ].filter((img): img is string => Boolean(img && img.trim()))));

    const finalProduct: Product = {
      id: productForm.id || getSuggestedSerialNo(),
      name: productForm.name,
      firmName: settings.firmName,
      shopName: settings.shopName,
      category: productForm.category || 'Punjabi Suits',
      tags: productForm.tags && productForm.tags.length > 0 ? productForm.tags : [productForm.category || 'Punjabi Suits'],
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : Number(productForm.price) + 500,
      description: productForm.description || '',
      fabric: productForm.fabric || 'Pure Unstitched Cotton/Silk',
      workType: productForm.workType || 'Traditional Punjabi Work',
      colors: productForm.colors && productForm.colors.length > 0 ? productForm.colors : ['Crimson Red', 'Royal Blue'],
      sizes: productForm.sizes && productForm.sizes.length > 0 ? productForm.sizes : ['Unstitched'],
      imageUrl: allImagesList[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      images: allImagesList,
      inStock: productForm.inStock !== undefined ? productForm.inStock : true,
      isBestSeller: productForm.isBestSeller || false,
      isNewArrival: productForm.isNewArrival || true,
      rating: 4.8
    };

    if (editingProductId) {
      await onUpdateProduct(editingProductId, finalProduct);
    } else {
      await onAddProduct(finalProduct);
    }

    // Remove reused ID from deletedSerialNumbers list if present
    setDeletedSerialNumbers((prev) => prev.filter((id) => id !== finalProduct.id));

    setShowAddProductModal(false);
    setEditingProductId(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(settingsForm);
    alert('Shop settings updated successfully!');
  };

  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Packing Slip - ${order.id}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #111; }
            .header { border-bottom: 2px solid #888; padding-bottom: 10px; margin-bottom: 15px; }
            .badge { background: #fee2e2; color: #991b1b; padding: 4px 8px; font-weight: bold; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.shopName}</h2>
            <p style="margin:2px 0; font-size:13px;">${settings.firmName} | ${settings.address}, ${settings.city}</p>
            <p style="margin:2px 0; font-size:13px;">Phone: ${settings.phoneNumber} | GST: ${settings.gstNumber || 'N/A'}</p>
          </div>
          <h3>Shipping Label / Order Invoice #${order.id}</h3>
          <p><strong>UTS/UTR No:</strong> ${order.utsNumber}</p>
          <p><strong>Customer:</strong> ${order.customer.fullName} (${order.customer.phone})</p>
          <p><strong>Delivery Address:</strong> ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}</p>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Color & Size</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.selectedColor}, ${item.selectedSize}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.product.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h3 style="text-align:right;">Total Paid: ₹${order.totalAmount}</h3>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-16">
      
      {/* Top Banner Alert for Instant New Orders */}
      {newOrderAlert && (
        <div className="bg-red-800 text-white px-4 py-3 shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Bell className="w-5 h-5 text-amber-300 animate-spin" />
            <span>🚨 NEW ORDER RECEIVED! Order #{newOrderAlert.id} from {newOrderAlert.customer.fullName} (₹{newOrderAlert.totalAmount}) - UTS: {newOrderAlert.utsNumber}</span>
          </div>
          <button 
            onClick={() => setNewOrderAlert(null)}
            className="text-xs bg-white text-red-900 font-extrabold px-3 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Top Bar */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-900 text-amber-50 p-4 shadow-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xl border border-amber-400/40">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-amber-100">
                {settings.shopName} — Shop Owner Portal
              </h1>
              <p className="text-xs text-amber-200/80">
                {settings.firmName} | Live Orders & Catalog Management
              </p>
            </div>
          </div>

          {/* Sound, Notification & Log Out Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                soundEnabled ? 'bg-amber-800 text-amber-100 border border-amber-600' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Sound Muted'}</span>
            </button>

            {!notificationsGranted && (
              <button
                onClick={requestNotificationPermission}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Enable Alerts</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md border border-red-400/80 transition-all cursor-pointer"
                title="Log Out Admin & Return to Website"
              >
                <LogOut className="w-4 h-4 text-amber-200" />
                <span>Log Out</span>
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-300 pb-3 mb-6 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'orders'
                  ? 'bg-amber-900 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders Management</span>
              {pendingCount > 0 && (
                <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  {pendingCount} New
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'products'
                  ? 'bg-amber-900 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Product Catalog ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-900 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Shop Settings & UPI</span>
            </button>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 flex items-center gap-1.5 transition-all shrink-0 ml-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock & Exit to Web</span>
            </button>
          )}
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Key Metrics Cards for Tickets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">1. Pending Payment</p>
                <p className="text-2xl font-black text-red-900 mt-1">{pendingCount}</p>
                <p className="text-[11px] text-amber-700">Check UTR Reference</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">2. Confirmed & Packing</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{confirmedCount}</p>
                <p className="text-[11px] text-blue-700">Packing unstitched suit</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">3. India Post Shipped</p>
                <p className="text-2xl font-black text-indigo-900 mt-1">{postOfficeShippedCount}</p>
                <p className="text-[11px] text-indigo-700">Post Office Tracking Added</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">4. Out for Delivery</p>
                <p className="text-2xl font-black text-green-800 font-mono mt-1">{outForDeliveryCount}</p>
                <p className="text-[11px] text-green-700">Postman delivering</p>
              </div>
            </div>

            {/* Ticket Pipeline Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row gap-3 items-center justify-between">
              
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All Tickets' },
                  { id: 'pending_acceptance', label: '🚨 1. Pending Payment' },
                  { id: 'order_confirmed', label: '✅ 2. Confirmed' },
                  { id: 'shipping_post_office', label: '📮 3. Post Office Shipped' },
                  { id: 'out_for_delivery', label: '🚚 4. Out for Delivery' },
                  { id: 'delivered', label: '🏁 5. Delivered' },
                  { id: 'cancelled', label: '❌ Cancelled' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      statusFilter === f.id
                        ? 'bg-amber-800 text-white shadow-sm scale-105'
                        : 'bg-slate-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search Name, UTR, or Post Tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
              </div>

            </div>

            {/* Orders Tickets Grid */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center text-gray-400 text-sm">
                  No order tickets found matching the selected stage filter.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
                      order.status === 'pending_acceptance'
                        ? 'border-2 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                        : 'border-gray-200'
                    }`}
                  >
                    
                    {/* Ticket Header */}
                    <div className="bg-slate-50 p-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-red-900 text-sm">Ticket #{order.id}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Prominent UTR Payment Badge */}
                      <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 font-mono font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-xs">
                        <QrCode className="w-4 h-4 text-amber-800" />
                        <span>UTR / UTS: {order.utsNumber}</span>
                      </div>

                      {/* Ticket Status Stage Pill */}
                      <div>
                        {order.status === 'pending_acceptance' && (
                          <span className="bg-amber-500 text-amber-950 font-extrabold px-3 py-1 rounded-full uppercase text-[10px] animate-pulse">
                            Pending Payment Verification
                          </span>
                        )}
                        {order.status === 'order_confirmed' && (
                          <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-[10px]">
                            Confirmed & Packing Suit
                          </span>
                        )}
                        {order.status === 'shipping_post_office' && (
                          <span className="bg-indigo-700 text-white font-bold px-3 py-1 rounded-full text-[10px]">
                            Dispatched (Post Office)
                          </span>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <span className="bg-purple-700 text-white font-bold px-3 py-1 rounded-full text-[10px]">
                            Out For Delivery
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="bg-green-700 text-white font-bold px-3 py-1 rounded-full text-[10px]">
                            Delivered
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="bg-red-700 text-white font-bold px-3 py-1 rounded-full text-[10px]">
                            Cancelled / Refunded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Ticket Body Details */}
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                      
                      {/* Customer Info */}
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900 text-sm">{order.customer.fullName}</p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
                          <a href={`tel:${order.customer.phone}`} className="hover:underline font-mono">
                            {order.customer.phone}
                          </a>
                        </p>
                        <p className="text-gray-500 leading-snug">
                          📍 {order.customer.address}, {order.customer.city} ({order.customer.pincode})
                        </p>
                        {order.customer.notes && (
                          <p className="text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1">
                            Note: {order.customer.notes}
                          </p>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-gray-200 pt-3 lg:pt-0 lg:pl-4">
                        <p className="font-bold text-gray-800">Unstitched Fabrics Ordered ({order.items.length}):</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="bg-amber-50/80 border border-amber-200 p-2 rounded-xl space-y-1">
                              <div className="flex items-start justify-between text-[11px] gap-2">
                                <span className="font-bold text-stone-900 leading-tight">{item.product.name}</span>
                                <span className="font-mono font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded-md text-[10px] shrink-0">x{item.quantity}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="bg-[#32080E] text-amber-200 font-extrabold px-2.5 py-0.5 rounded-md border border-amber-700/60 shadow-2xs flex items-center gap-1">
                                  🎨 Color: <span className="text-white underline">{item.selectedColor || 'Standard'}</span>
                                </span>
                                <span className="bg-white text-stone-800 font-bold px-2 py-0.5 rounded-md border border-amber-300">
                                  📏 Size: {item.selectedSize || 'Free Size'}
                                </span>
                                <span className="font-mono text-stone-700 font-bold ml-auto text-[11px]">
                                  ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Amount & Manual Action Buttons */}
                      <div className="border-t lg:border-t-0 lg:border-l border-gray-200 pt-3 lg:pt-0 lg:pl-4 flex flex-col justify-between">
                        
                        <div>
                          <p className="text-gray-500">Total Amount Paid via UPI:</p>
                          <p className="text-2xl font-black font-mono text-red-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          
                          {order.trackingNumber ? (
                            <div className="bg-indigo-50 border border-indigo-200 p-2 rounded-xl text-[11px] text-indigo-900 mt-2 font-mono">
                              <strong>{order.courierName || 'India Post'}:</strong>
                              <p className="font-bold text-xs text-indigo-950 mt-0.5">Tracking No: {order.trackingNumber}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-700 italic mt-1">
                              Post office tracking number pending
                            </p>
                          )}
                        </div>

                        {/* Owner Manual Stage Actions */}
                        <div className="pt-3 flex flex-wrap gap-2">
                          
                          {/* Stage 1: Pending Payment -> Confirm or Cancel */}
                          {order.status === 'pending_acceptance' && (
                            <>
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, { status: 'order_confirmed', verifiedByAdmin: true })}
                                className="bg-green-700 hover:bg-green-800 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Confirm Payment & Accept
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for declining / cancelling order?');
                                  if (reason !== null) {
                                    onUpdateOrderStatus(order.id, { status: 'cancelled', rejectionReason: reason || 'Invalid UTR Number' });
                                  }
                                }}
                                className="bg-red-700 hover:bg-red-800 text-white font-bold px-2.5 py-2 rounded-xl text-xs"
                              >
                                Cancel Order
                              </button>
                            </>
                          )}

                          {/* Stage 2: Confirmed -> Post Office Dispatch */}
                          {order.status === 'order_confirmed' && (
                            <button
                              onClick={() => {
                                setShippingModalOrder(order);
                                setCourierName('India Post (Speed Post / Regd. Parcel)');
                              }}
                              className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1"
                            >
                              <Truck className="w-4 h-4" /> Add Post Office Tracking & Ship
                            </button>
                          )}

                          {/* Stage 3: Post Office Shipped -> Out for Delivery */}
                          {order.status === 'shipping_post_office' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, { status: 'out_for_delivery' })}
                              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1"
                            >
                              <Truck className="w-4 h-4" /> Mark Out For Delivery
                            </button>
                          )}

                          {/* Stage 4: Out for Delivery -> Delivered */}
                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, { status: 'delivered' })}
                              className="bg-green-800 hover:bg-green-900 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1"
                            >
                              <Package className="w-4 h-4" /> Mark Delivered
                            </button>
                          )}

                          {/* Edit Post Office Tracking Button if already shipped */}
                          {(order.status === 'shipping_post_office' || order.status === 'out_for_delivery') && (
                            <button
                              onClick={() => {
                                setShippingModalOrder(order);
                                setCourierName(order.courierName || 'India Post (Speed Post)');
                                setTrackingNumber(order.trackingNumber || '');
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-2.5 py-2 rounded-xl text-xs"
                            >
                              Edit Tracking No
                            </button>
                          )}

                          <button
                            onClick={() => printInvoice(order)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-2.5 py-2 rounded-xl text-xs flex items-center gap-1"
                            title="Print Postal Label / Parcel Address"
                          >
                            <Printer className="w-4 h-4" /> Print Postal Label
                          </button>

                          <a
                            href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${order.customer.fullName}, update from Bhraava Di Hatti regarding your Unstitched Suit Order #${order.id}. Ticket status: ${order.status.toUpperCase()}.${order.trackingNumber ? ` India Post Tracking: ${order.trackingNumber}` : ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-100 hover:bg-green-200 text-green-900 font-bold px-2.5 py-2 rounded-xl text-xs flex items-center gap-1"
                          >
                            <MessageSquare className="w-4 h-4" /> WhatsApp
                          </a>

                        </div>

                      </div>

                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* TAB 2: CATALOG MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  Manage Shop Clothing Catalog ({products.length})
                </h3>
                <p className="text-xs text-gray-500">Add, edit, or remove unstitched suit inventory & color variants</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setWorkerForm({
                      id: getSuggestedSerialNo(),
                      name: '',
                      price: '',
                      category: 'Punjabi Suits',
                      imageUrl: '',
                      color: 'Standard / Multi'
                    });
                    setShowWorkerModal(true);
                  }}
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 border border-amber-400 cursor-pointer animate-pulse"
                  title="Super easy 3-step form for shop staff to add products with camera photo"
                >
                  <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" /> ⚡ Easy Shop Worker Add (आसान वर्कर फॉर्म)
                </button>

                <button
                  onClick={handleSyncFromCode}
                  className="bg-emerald-800 hover:bg-emerald-900 text-amber-100 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 border border-emerald-600 cursor-pointer"
                  title="Reload all products defined in src/data/initialProducts.ts code file"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-300" /> Sync Code
                </button>

                <button
                  onClick={() => {
                    setBulkJsonText(JSON.stringify(products, null, 2));
                    setShowBulkModal(true);
                  }}
                  className="bg-stone-800 hover:bg-stone-900 text-stone-100 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 border border-stone-600 cursor-pointer"
                  title="View or Paste product catalog in raw JSON format"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" /> JSON
                </button>

                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({
                      id: getSuggestedSerialNo(),
                      name: '',
                      category: 'Punjabi Suits',
                      tags: ['Punjabi Suits', 'Cotton Suit', '3-Piece Material'],
                      price: 1999,
                      originalPrice: 2999,
                      description: 'Premium unstitched Punjabi suit material with heavy embroidery dupatta.',
                      fabric: '100% Pure Cotton',
                      workType: 'Gotta Patti & Zari Embroidery',
                      colors: ['Crimson Red', 'Royal Blue', 'Bottle Green', 'Mustard Yellow'],
                      sizes: ['Unstitched', 'L (40)', 'XL (42)'],
                      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                      inStock: true
                    });
                    setShowAddProductModal(true);
                  }}
                  className="bg-amber-900/80 hover:bg-amber-950 text-white font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Full Form ({getSuggestedSerialNo()})
                </button>
              </div>
            </div>

            {/* Deleted / Recycled Serial Numbers Banner */}
            {deletedSerialNumbers.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-950 font-medium">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-red-900 bg-amber-200 px-2 py-0.5 rounded">
                    ♻️ Deleted / Recycled Serial IDs:
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {deletedSerialNumbers.map((sNum) => (
                      <span key={sNum} className="font-mono font-bold bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md shadow-2xs">
                        {sNum}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setDeletedSerialNumbers([])}
                  className="text-[11px] text-gray-500 hover:text-red-700 underline shrink-0"
                >
                  Clear Log
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between p-3">
                  <div className="flex gap-3">
                    <img
                      src={p.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
                      }}
                      className="w-22 h-28 object-cover rounded-xl border border-gray-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-amber-100 text-amber-950 font-mono font-black text-[10px] px-2 py-0.5 rounded border border-amber-300">
                          {p.id}
                        </span>
                        <span className="bg-slate-100 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded border border-slate-200">
                          {p.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                      
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="font-extrabold text-red-900 text-sm">₹{p.price.toLocaleString('en-IN')}</span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[11px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      {p.originalPrice && p.originalPrice > p.price && (
                        <p className="text-[10px] font-bold text-green-700">
                          YOU SAVE ₹{(p.originalPrice - p.price).toLocaleString('en-IN')}
                        </p>
                      )}

                      <p className="text-gray-500 text-[11px] truncate">Fabric: {p.fabric}</p>

                      {p.colors && p.colors.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {p.colors.slice(0, 3).map((col, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {col}
                            </span>
                          ))}
                          {p.colors.length > 3 && (
                            <span className="text-[9px] text-gray-400">+{p.colors.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => onUpdateProduct(p.id, { inStock: !p.inStock })}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${p.inStock ? 'border-green-300 text-green-800 bg-green-50' : 'border-red-300 text-red-700 bg-red-50'}`}
                    >
                      {p.inStock ? 'In Stock ✓' : 'Out of Stock ✗'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProductForm(p);
                          setShowAddProductModal(true);
                        }}
                        className="p-1.5 text-gray-600 hover:text-amber-800 rounded-lg hover:bg-amber-50"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete product ${p.name} (${p.id})? This serial number will be logged for recycling.`)) {
                            if (p.id) setDeletedSerialNumbers(prev => [...new Set([...prev, p.id])]);
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: SHOP SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 max-w-2xl mx-auto shadow-xs">
            <h3 className="text-lg font-bold font-serif text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-800" />
              Configure Shop & Online UPI Settings
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={settingsForm.shopName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Firm Name</label>
                  <input
                    type="text"
                    value={settingsForm.firmName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, firmName: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Admin Lock PIN Setting */}
              <div className="bg-amber-100/70 border border-amber-300 p-3.5 rounded-2xl space-y-1">
                <label className="block font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-900" /> Admin Security Passcode / PIN:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={settingsForm.adminPin || '7860'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                    className="w-full bg-white border border-amber-400 font-mono font-extrabold text-red-950 tracking-widest rounded-xl p-2.5 text-sm"
                    placeholder="7860"
                  />
                </div>
                <p className="text-[10px] text-amber-900 font-medium">
                  This PIN protects your owner portal when switching to Admin view. (Default: 7860)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">Shop UPI ID (for QR Code)</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.upiId}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                    className="w-full bg-white border border-amber-400 font-mono font-bold rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-950 mb-1">Payee Name in UPI App</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.payeeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, payeeName: e.target.value })}
                    className="w-full bg-white border border-amber-400 font-bold rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Primary Phone Number</label>
                  <input
                    type="text"
                    value={settingsForm.phoneNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phoneNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Secondary Phone Number</label>
                  <input
                    type="text"
                    value={settingsForm.phoneNumber2 || '99150-46357'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phoneNumber2: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Shop Street Address</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Top Announcement Notice Text</label>
                <input
                  type="text"
                  value={settingsForm.noticeText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, noticeText: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-md"
              >
                Save Shop Settings
              </button>

            </form>
          </div>
        )}

      </div>

      {/* Courier Shipping Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-base font-serif text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-800" />
              Post Office Shipment Ticket #{shippingModalOrder.id}
            </h3>
            <p className="text-xs text-gray-600">
              Customer: <strong>{shippingModalOrder.customer.fullName}</strong> ({shippingModalOrder.customer.phone})<br />
              📍 {shippingModalOrder.customer.address}, {shippingModalOrder.customer.city} - {shippingModalOrder.customer.pincode}
            </p>

            <form onSubmit={handleShipSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Postal / Courier Service</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. India Post (Speed Post / Parcel)"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">India Post Article / Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ED123456789IN or CP987654321IN"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm font-mono font-bold"
                />
                <p className="text-[11px] text-gray-500 mt-1">This India Post consignment number will be stored on customer's order ticket.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShippingModalOrder(null)}
                  className="w-1/2 bg-gray-100 text-gray-800 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
                >
                  Save & Move to Shipped
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto border border-amber-300">
            
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-lg font-serif text-gray-900">
                  {editingProductId ? `Edit Product ${productForm.id}` : 'Add New Unstitched Suit / Dress'}
                </h3>
                <p className="text-xs text-amber-900 font-medium">Bhraava Di Hatti Inventory Manager</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)}>
                <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* Product Serial No. */}
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-amber-950">
                    Product Serial Number (SKU):
                  </label>
                  <span className="text-[11px] font-mono text-amber-900 font-bold">
                    Prefix: BDH-
                  </span>
                </div>
                
                <input
                  type="text"
                  required
                  value={productForm.id || 'BDH-109'}
                  onChange={(e) => setProductForm({ ...productForm, id: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-amber-400 rounded-xl px-3 py-2 text-sm font-mono font-black text-red-950"
                  placeholder="e.g. BDH-109"
                />

                {/* Recycled deleted serials quick selection */}
                {deletedSerialNumbers.length > 0 && (
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-amber-900">Reuse Deleted ID:</span>
                    {deletedSerialNumbers.map((sNum) => (
                      <button
                        key={sNum}
                        type="button"
                        onClick={() => setProductForm((prev) => ({ ...prev, id: sNum }))}
                        className="bg-white border border-amber-400 hover:bg-amber-200 text-amber-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs"
                      >
                        {sNum}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">Product Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Maroon Velvet Heavy Unstitched Punjabi Suit"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm font-medium"
                />
              </div>

              {/* Main Category & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Main Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm font-semibold"
                  >
                    {['Punjabi Suits', 'Banarasi Sarees', 'Lehengas', 'Men Kurtas', 'Dress Materials', 'Dupattas & Shawls', 'Festive Collection'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Category Tags (Max 3)
                  </label>
                  <div className="flex gap-1 mb-1">
                    <input
                      type="text"
                      placeholder="e.g. Cotton Suit, 3-Piece"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-amber-800 text-white font-bold px-3 py-1 rounded-lg text-xs shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(productForm.tags || []).map((t, idx) => (
                      <span key={idx} className="bg-amber-100 text-amber-950 font-semibold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 border border-amber-300">
                        {t}
                        <button type="button" onClick={() => handleRemoveTag(t)} className="text-red-700 font-bold ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing & "You Save" Calculation */}
              <div className="bg-amber-50/90 p-3.5 rounded-2xl border border-amber-300 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Original MRP Price (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3499"
                      value={productForm.originalPrice || ''}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                      className="w-full bg-white border border-gray-300 rounded-xl p-2 text-sm font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-950 mb-1">BDH Sale Price (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 2499"
                      value={productForm.price || ''}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full bg-white border border-amber-400 rounded-xl p-2 text-sm font-mono font-extrabold text-red-950"
                    />
                  </div>
                </div>

                {productForm.originalPrice && productForm.price && productForm.originalPrice > productForm.price && (
                  <div className="bg-green-100 border border-green-300 p-2 rounded-xl text-center text-xs font-bold text-green-900">
                    🎉 Customer Saves: <span className="font-mono text-sm font-extrabold text-green-950">₹{(productForm.originalPrice - productForm.price).toLocaleString('en-IN')}!</span>
                  </div>
                )}
              </div>

              {/* Photo Upload & Multi-Photo Gallery (4-5 Photos) */}
              <div className="space-y-3 border-t pt-3 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-amber-950 text-xs uppercase tracking-wider">
                    📸 Product Photos Gallery (Up to 5 Photos)
                  </label>
                  <span className="text-[10px] text-amber-900 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full font-mono">
                    {Array.from(new Set([productForm.imageUrl, ...(productForm.images || [])].filter(Boolean))).length} / 5 Loaded
                  </span>
                </div>

                {/* Primary Cover Photo 1 */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-800">Photo 1 (Main Cover Image):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-amber-800 file:text-white cursor-pointer border border-gray-300 rounded-xl p-1 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Or paste main image URL https://..."
                      value={productForm.imageUrl || ''}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="sm:col-span-2 w-full bg-white border border-amber-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>

                {/* Additional Photos 2, 3, 4, 5 Inputs */}
                <div className="space-y-2 pt-2 border-t border-amber-200">
                  <span className="text-[11px] font-bold text-stone-800 block">Additional Angle & Fabric Photos (Photos 2 to 5):</span>
                  {[1, 2, 3, 4].map((photoIdx) => {
                    const currentImgs = productForm.images || [];
                    const currentVal = currentImgs[photoIdx] || '';
                    return (
                      <div key={photoIdx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-amber-950 w-16 shrink-0">Photo #{photoIdx + 1}:</span>
                        <input
                          type="text"
                          placeholder={`Paste URL for photo ${photoIdx + 1} (e.g., Dupatta close-up / back view)`}
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProductForm((prev) => {
                              const updatedImgs = [...(prev.images || [])];
                              updatedImgs[photoIdx] = val;
                              return { ...prev, images: updatedImgs };
                            });
                          }}
                          className="w-full bg-white border border-gray-300 rounded-xl p-1.5 text-xs font-mono"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (fileEv) => {
                            const file = fileEv.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressImageFile(file);
                                setProductForm((prev) => {
                                  const updatedImgs = [...(prev.images || [])];
                                  updatedImgs[photoIdx] = base64;
                                  return { ...prev, images: updatedImgs };
                                });
                              } catch (err) {
                                console.error('Compress photo error:', err);
                              }
                            }
                          }}
                          className="w-24 text-[10px] text-gray-500 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-amber-200 file:text-amber-950 cursor-pointer border rounded-lg"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Thumbnail Preview strip for all 5 photos */}
                <div className="pt-2 border-t border-amber-200">
                  <span className="text-[10px] font-bold text-amber-900 block mb-1">Loaded Photos Preview:</span>
                  <div className="flex items-center gap-2 overflow-x-auto p-1 bg-white rounded-xl border border-amber-200 min-h-16">
                    {Array.from(new Set([productForm.imageUrl, ...(productForm.images || [])].filter((img): img is string => Boolean(img && img.trim())))).map((img, i) => (
                      <div key={i} className="relative group shrink-0">
                        <img
                          src={img}
                          alt={`Preview ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-12 h-14 object-cover rounded-lg border border-amber-400 shadow-2xs"
                        />
                        <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[8px] px-1 font-mono rounded-tl">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Colors Manager */}
              <div className="border-t pt-2">
                <label className="block font-bold text-gray-800 mb-1">Available Colors / Variants</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Royal Blue, Crimson Red, Mustard, Peach"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs shrink-0"
                  >
                    + Add Color
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(productForm.colors || []).map((col, idx) => (
                    <span key={idx} className="bg-slate-100 border border-slate-300 text-gray-800 font-semibold px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
                      🎨 {col}
                      <button type="button" onClick={() => handleRemoveColor(col)} className="text-red-600 font-extrabold hover:text-red-900">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Fabric & Work Type */}
              <div className="grid grid-cols-2 gap-2 border-t pt-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fabric Material</label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Cotton / Chinon Silk"
                    value={productForm.fabric}
                    onChange={(e) => setProductForm({ ...productForm, fabric: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Work / Embroidery Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy Gotta Patti Embroidery"
                    value={productForm.workType}
                    onChange={(e) => setProductForm({ ...productForm, workType: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Product Details</label>
                <textarea
                  rows={2}
                  placeholder="Mention suit details like top length, bottom meter, dupatta fabric..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-xs"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-800 hover:bg-amber-900 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
                >
                  Save Product to Catalog
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* BULK JSON CODE EDITOR MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-amber-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-700" /> Bulk Products Code / JSON Editor
                </h2>
                <p className="text-xs text-stone-500">
                  Directly edit or paste product catalog JSON. You can also edit <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono text-[11px]">src/data/initialProducts.ts</code> in code!
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-950 space-y-1 font-medium">
              <p>💡 <strong>Two ways to add products easily in Code:</strong></p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-700">
                <li><strong>Method 1:</strong> Edit the code file <code className="bg-white text-red-900 px-1 rounded font-mono">src/data/initialProducts.ts</code> and then click <span className="font-bold text-emerald-800">"Sync Products from Code"</span> button!</li>
                <li><strong>Method 2:</strong> Copy or paste the product JSON array directly in the box below and click <span className="font-bold text-amber-900">"Save All JSON Products"</span>.</li>
              </ul>
            </div>

            <textarea
              rows={14}
              value={bulkJsonText}
              onChange={(e) => setBulkJsonText(e.target.value)}
              placeholder="Paste JSON array here..."
              className="w-full bg-stone-900 text-emerald-400 font-mono text-xs p-3 rounded-2xl border border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shrink min-h-60"
            />

            <div className="flex items-center justify-between pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(bulkJsonText);
                    alert(`✅ Valid JSON! Contains ${parsed.length} products.`);
                  } catch (e: any) {
                    alert(`❌ Invalid JSON: ${e?.message}`);
                  }
                }}
                className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-3 py-2 rounded-xl"
              >
                Verify JSON Syntax
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkJson}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  Save All JSON Products
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SHOP WORKER EASY QUICK-ADD MODAL */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 border-2 border-amber-500 animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-800 text-white flex items-center justify-center shadow-md">
                  <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-amber-950 font-serif">
                    आसान दुकान वर्कर फॉर्म (Quick Worker Form)
                  </h2>
                  <p className="text-[11px] text-stone-500 font-medium">
                    1-Minute Easy Product Add for Shop Employees
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkerModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWorkerQuickSave} className="space-y-4">
              
              {/* Item Serial Code */}
              <div className="bg-amber-50/80 p-2.5 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider block">Item Serial Code (आइटम कोड)</span>
                  <span className="text-xs text-stone-600 font-medium">Auto-assigned for stock tracking</span>
                </div>
                <input
                  type="text"
                  required
                  value={workerForm.id}
                  onChange={(e) => setWorkerForm({ ...workerForm, id: e.target.value })}
                  className="bg-white border-2 border-amber-400 font-mono font-extrabold text-amber-950 text-sm px-3 py-1 rounded-xl text-center w-28 shadow-xs"
                />
              </div>

              {/* Step 1: Photo Upload / Camera Capture */}
              <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <label className="block text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-700" /> 1. Photo (कपड़े की फोटो खींचें या चुनें)
                </label>

                {workerForm.imageUrl ? (
                  <div className="relative w-full h-36 bg-black rounded-2xl overflow-hidden border-2 border-amber-500 shadow-inner group">
                    <img src={workerForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setWorkerForm({ ...workerForm, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2.5 py-1 rounded-xl shadow-md"
                    >
                      Remove / Retake 🔄
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-400 rounded-2xl bg-amber-50/60 hover:bg-amber-100/70 cursor-pointer transition-colors p-2 text-center">
                    <Camera className="w-8 h-8 text-amber-800 mb-1 animate-bounce" />
                    <span className="text-xs font-extrabold text-amber-950">📸 Click to Take Photo / Choose File</span>
                    <span className="text-[10px] text-amber-800">Mobile camera will open directly</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file);
                            setWorkerForm((prev) => ({ ...prev, imageUrl: compressed }));
                          } catch (err) {
                            console.error('Compress fail:', err);
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Step 2: Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-stone-900 mb-1">
                    2. Product Name (कपड़े का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pink Embroidery Punjabi Suit"
                    value={workerForm.name}
                    onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                    className="w-full bg-stone-50 border-2 border-stone-300 focus:border-amber-600 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-900 mb-1">
                    3. Price in ₹ (बेचने का दाम) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-500">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="1499"
                      value={workerForm.price}
                      onChange={(e) => setWorkerForm({ ...workerForm, price: e.target.value })}
                      className="w-full bg-stone-50 border-2 border-stone-300 focus:border-amber-600 rounded-xl p-2.5 pl-7 text-xs font-extrabold text-emerald-950 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Category Selection */}
              <div>
                <label className="block text-xs font-extrabold text-stone-900 mb-1.5">
                  4. Select Category (सामान की वैराइटी)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {['Punjabi Suits', 'Banarasi Sarees', 'Lehengas', 'Men Kurtas', 'Dress Materials', 'Dupattas & Shawls'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setWorkerForm({ ...workerForm, category: cat })}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        workerForm.category === cat
                          ? 'bg-amber-800 text-white border-amber-900 shadow-md scale-95'
                          : 'bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-2xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white font-extrabold py-3 rounded-2xl text-xs shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" /> Save & Publish Live (सामान जोड़ें)
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
