import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product, ShopSettings } from '../types';
import { playOrderAlertSound } from '../utils/audioAlert';
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
  LogOut
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
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newColorInput, setNewColorInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProductForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
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
      imageUrl: productForm.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
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
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg">
                              <span className="font-medium text-gray-800 line-clamp-1">{item.product.name} ({item.selectedSize}, {item.selectedColor})</span>
                              <span className="font-mono font-bold text-gray-900">x{item.quantity}</span>
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
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add New Item (Next: {getSuggestedSerialNo()})
              </button>
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
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
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

              {/* Photo Upload & Preview */}
              <div className="space-y-2 border-t pt-2">
                <label className="block font-bold text-gray-800 mb-1">Product Photo Upload</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 space-y-2">
                    <div>
                      <span className="text-[11px] text-gray-600 block mb-1">Option A: Upload Photo directly from Phone / Computer</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer border border-gray-300 rounded-xl p-1"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-600 block mb-1">Option B: Or paste Image URL link</span>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 p-2 rounded-2xl bg-amber-50/50">
                    <span className="text-[10px] font-bold text-amber-900 mb-1">Photo Preview:</span>
                    {productForm.imageUrl ? (
                      <img
                        src={productForm.imageUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-20 h-24 object-cover rounded-xl border border-amber-300 shadow-xs"
                      />
                    ) : (
                      <div className="w-20 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] text-gray-400">
                        No Photo
                      </div>
                    )}
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

    </div>
  );
};
