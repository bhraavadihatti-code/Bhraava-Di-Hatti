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
  Eye
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
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  products,
  settings,
  onUpdateOrderStatus,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateSettings
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

  // Add Product Form state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'Punjabi Suits',
    price: 1999,
    originalPrice: 2999,
    description: '',
    fabric: 'Pure Cotton / Silk',
    workType: 'Embroidery Work',
    colors: ['Red', 'Blue', 'Green'],
    sizes: ['Unstitched', 'L (40)', 'XL (42)'],
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    inStock: true
  });

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
      o.customer.phone.includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  // Metrics calculation
  const pendingCount = orders.filter(o => o.status === 'pending_acceptance').length;
  const verifiedCount = orders.filter(o => o.status === 'payment_verified' || o.status === 'processing').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const totalRevenue = orders.filter(o => o.status !== 'rejected').reduce((acc, o) => acc + o.totalAmount, 0);

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingModalOrder) return;
    await onUpdateOrderStatus(shippingModalOrder.id, {
      status: 'shipped',
      courierName,
      trackingNumber
    });
    setShippingModalOrder(null);
    setTrackingNumber('');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    if (editingProductId) {
      await onUpdateProduct(editingProductId, productForm);
    } else {
      await onAddProduct(productForm as Product);
    }

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

          {/* Sound & Notification Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                soundEnabled ? 'bg-amber-800 text-amber-100 border border-amber-600' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Sound ON' : 'Sound Muted'}</span>
            </button>

            {!notificationsGranted && (
              <button
                onClick={requestNotificationPermission}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" /> Enable Push Alerts
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-300 pb-3 mb-6 overflow-x-auto">
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

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Pending Acceptance</p>
                <p className="text-2xl font-black text-red-900 mt-1">{pendingCount}</p>
                <p className="text-[11px] text-amber-700">Requires UTR verification</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Verified & Packing</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{verifiedCount}</p>
                <p className="text-[11px] text-blue-700">Ready for courier dispatch</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Shipped Orders</p>
                <p className="text-2xl font-black text-indigo-900 mt-1">{shippedCount}</p>
                <p className="text-[11px] text-indigo-700">In transit to customer</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Sales Revenue</p>
                <p className="text-2xl font-black text-green-800 font-mono mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-green-700">Online UPI Payments</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row gap-3 items-center justify-between">
              
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'pending_acceptance', label: '🚨 Pending Acceptance' },
                  { id: 'payment_verified', label: 'Accepted & Packing' },
                  { id: 'shipped', label: 'Shipped' },
                  { id: 'delivered', label: 'Delivered' },
                  { id: 'rejected', label: 'Rejected' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      statusFilter === f.id
                        ? 'bg-amber-800 text-white shadow-sm'
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
                  placeholder="Search Name, Phone, or UTS No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
              </div>

            </div>

            {/* Orders Cards Grid */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center text-gray-400 text-sm">
                  No orders found matching the selected filter.
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
                    
                    {/* Header */}
                    <div className="bg-slate-50 p-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-red-900 text-sm">#{order.id}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Prominent UTS/UTR Payment Number Badge */}
                      <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 font-mono font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-xs">
                        <QrCode className="w-4 h-4 text-amber-800" />
                        <span>UTS Ref: {order.utsNumber}</span>
                      </div>

                      <div>
                        {order.status === 'pending_acceptance' && (
                          <span className="bg-amber-500 text-amber-950 font-extrabold px-3 py-1 rounded-full uppercase text-[10px] animate-pulse">
                            Needs Acceptance
                          </span>
                        )}
                        {order.status === 'payment_verified' && (
                          <span className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-full text-[10px]">
                            Accepted & Packing
                          </span>
                        )}
                        {order.status === 'shipped' && (
                          <span className="bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-full text-[10px]">
                            Shipped
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="bg-green-700 text-white font-bold px-2.5 py-1 rounded-full text-[10px]">
                            Delivered
                          </span>
                        )}
                        {order.status === 'rejected' && (
                          <span className="bg-red-700 text-white font-bold px-2.5 py-1 rounded-full text-[10px]">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Body Details */}
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
                        <p className="font-bold text-gray-800">Items ({order.items.length}):</p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg">
                              <span className="font-medium text-gray-800 line-clamp-1">{item.product.name} ({item.selectedSize}, {item.selectedColor})</span>
                              <span className="font-mono font-bold text-gray-900">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="border-t lg:border-t-0 lg:border-l border-gray-200 pt-3 lg:pt-0 lg:pl-4 flex flex-col justify-between">
                        
                        <div>
                          <p className="text-gray-500">Total Amount Paid via UPI:</p>
                          <p className="text-2xl font-black font-mono text-red-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          {order.courierName && (
                            <p className="text-[11px] text-indigo-800 mt-1">
                              Courier: <strong>{order.courierName}</strong> ({order.trackingNumber})
                            </p>
                          )}
                        </div>

                        {/* Owner Manual Acceptance & Process Buttons */}
                        <div className="pt-3 flex flex-wrap gap-2">
                          
                          {order.status === 'pending_acceptance' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, { status: 'payment_verified', verifiedByAdmin: true })}
                              className="bg-green-700 hover:bg-green-800 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Accept Order
                            </button>
                          )}

                          {(order.status === 'pending_acceptance' || order.status === 'payment_verified' || order.status === 'processing') && (
                            <button
                              onClick={() => {
                                setShippingModalOrder(order);
                                setCourierName('BlueDart / Delhivery');
                              }}
                              className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1"
                            >
                              <Truck className="w-4 h-4" /> Ship Order
                            </button>
                          )}

                          {order.status === 'shipped' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, { status: 'delivered' })}
                              className="bg-green-800 hover:bg-green-900 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1"
                            >
                              <Package className="w-4 h-4" /> Mark Delivered
                            </button>
                          )}

                          {order.status !== 'rejected' && order.status !== 'delivered' && (
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for declining order?');
                                if (reason) {
                                  onUpdateOrderStatus(order.id, { status: 'rejected', rejectionReason: reason });
                                }
                              }}
                              className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-2.5 py-2 rounded-xl text-xs"
                            >
                              Decline
                            </button>
                          )}

                          <button
                            onClick={() => printInvoice(order)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-2.5 py-2 rounded-xl text-xs flex items-center gap-1"
                            title="Print Shipping Label / Invoice"
                          >
                            <Printer className="w-4 h-4" /> Print
                          </button>

                          <a
                            href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${order.customer.fullName}, update from Bhraava Di Hatti regarding your Order #${order.id}. Current status: ${order.status.toUpperCase()}.`)}`}
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
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 font-serif">
                Manage Shop Clothing Catalog ({products.length})
              </h3>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({
                    name: '',
                    category: 'Punjabi Suits',
                    price: 1999,
                    originalPrice: 2999,
                    description: '',
                    fabric: 'Pure Cotton / Silk',
                    workType: 'Embroidery Work',
                    colors: ['Red', 'Blue', 'Green'],
                    sizes: ['Unstitched', 'L (40)', 'XL (42)'],
                    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                    inStock: true
                  });
                  setShowAddProductModal(true);
                }}
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add New Item
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between p-3">
                  <div className="flex gap-3">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-24 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="flex-1 min-w-0 text-xs space-y-1">
                      <span className="bg-amber-50 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-200">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                      <p className="text-gray-500 font-mono font-bold text-red-900">₹{p.price.toLocaleString('en-IN')}</p>
                      <p className="text-gray-500 text-[11px]">Fabric: {p.fabric}</p>
                      <p className={`font-bold text-[10px] ${p.inStock ? 'text-green-700' : 'text-red-600'}`}>
                        {p.inStock ? 'In Stock' : 'Out of Stock'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => onUpdateProduct(p.id, { inStock: !p.inStock })}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      {p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                    </button>
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
                        if (confirm(`Delete ${p.name}?`)) onDeleteProduct(p.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                  <label className="block font-bold text-gray-700 mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    value={settingsForm.phoneNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phoneNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">WhatsApp Number for Receipts</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
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
            <h3 className="font-bold text-base font-serif text-gray-900">
              Ship Order #{shippingModalOrder.id}
            </h3>
            <p className="text-xs text-gray-500">
              Customer: {shippingModalOrder.customer.fullName} ({shippingModalOrder.customer.phone})
            </p>

            <form onSubmit={handleShipSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Courier Partner Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BlueDart, Delhivery, DTDC, India Post"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tracking Waybill / AWB Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BD123456789IN"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 text-sm font-mono font-bold"
                />
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
                  Confirm Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base font-serif text-gray-900">
                {editingProductId ? 'Edit Product' : 'Add New Clothing Product'}
              </h3>
              <button onClick={() => setShowAddProductModal(false)}><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-sm"
                  >
                    {['Punjabi Suits', 'Banarasi Sarees', 'Lehengas', 'Men Kurtas', 'Dress Materials', 'Dupattas & Shawls', 'Festive Collection'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fabric Type</label>
                  <input
                    type="text"
                    value={productForm.fabric}
                    onChange={(e) => setProductForm({ ...productForm, fabric: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
