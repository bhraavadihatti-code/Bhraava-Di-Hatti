import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { X, Search, Truck, ExternalLink, Copy, Check, AlertTriangle, Package } from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialQuery = ''
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = async (searchStr: string) => {
    setLoading(true);
    setSearched(true);
    
    // 1. Read locally saved orders first
    let localOrders: Order[] = [];
    try {
      const savedBdh = localStorage.getItem('bdh_orders');
      if (savedBdh) {
        const parsed = JSON.parse(savedBdh);
        if (Array.isArray(parsed)) localOrders.push(...parsed);
      }
      const savedCust = localStorage.getItem('bdh_customer_orders');
      if (savedCust) {
        const parsed = JSON.parse(savedCust);
        if (Array.isArray(parsed)) localOrders.push(...parsed);
      }
    } catch (e) {
      console.warn('Local orders load warning:', e);
    }

    // 2. Fetch server orders
    let serverOrders: Order[] = [];
    try {
      const endpoint = (!searchStr.trim() || searchStr.trim().toLowerCase() === 'all')
        ? '/api/orders'
        : `/api/orders/track/${encodeURIComponent(searchStr.trim())}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) serverOrders = data;
      }
    } catch (e) {
      console.warn('Track API fetch error:', e);
    }

    // 3. Merge server and local orders (deduplicate by ID)
    const map = new Map<string, Order>();
    serverOrders.forEach(o => map.set(o.id, o));
    localOrders.forEach(o => {
      if (!map.has(o.id)) {
        map.set(o.id, o);
      } else {
        // If local version is newer or has status, keep best
        const existing = map.get(o.id)!;
        map.set(o.id, { ...existing, ...o });
      }
    });

    let combined = Array.from(map.values());

    // 4. Filter according to search string if provided
    const s = searchStr.trim().toLowerCase();
    if (s && s !== 'all') {
      const cleanNum = s.replace(/[^0-9]/g, '');
      combined = combined.filter(o => 
        o.id.toLowerCase().includes(s) ||
        (o.utsNumber && o.utsNumber.toLowerCase().includes(s)) ||
        (o.customer?.phone && cleanNum && o.customer.phone.replace(/[^0-9]/g, '').includes(cleanNum)) ||
        (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(s)) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(s))
      );
    }

    setOrders(combined);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders(initialQuery || 'all');
    }
  }, [isOpen, initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(query);
  };

  const handleCopyTracking = (trackingNo: string, orderId: string) => {
    if (!trackingNo) return;
    navigator.clipboard.writeText(trackingNo);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_acceptance':
        return <span className="bg-amber-100 text-amber-950 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs">⏳ 1. Pending Payment Check</span>;
      case 'order_confirmed':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-xs">✅ 2. Payment Confirmed & Packing Suit</span>;
      case 'shipping_post_office':
        return <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold px-2.5 py-0.5 rounded-full text-xs">📮 3. Dispatched via India Post</span>;
      case 'out_for_delivery':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-2.5 py-0.5 rounded-full text-xs">🚚 4. Out For Delivery (Postman)</span>;
      case 'delivered':
        return <span className="bg-green-100 text-green-900 border border-green-300 font-bold px-2.5 py-0.5 rounded-full text-xs">🏁 5. Successfully Delivered</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-900 border border-red-300 font-bold px-2.5 py-0.5 rounded-full text-xs">❌ Order Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-amber-300 my-auto flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-[#32080E] to-amber-950 p-4 text-amber-50 flex items-center justify-between border-b border-amber-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-400/30">
              <Package className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-amber-100">
                My Orders
              </h2>
              <p className="text-[11px] text-amber-200/80">View your purchased suits and delivery details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-3.5 bg-amber-50/60 border-b border-amber-200 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by Phone number or Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
              />
              <Search className="w-4 h-4 text-amber-700 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors shrink-0"
            >
              Search
            </button>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  fetchOrders('all');
                }}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0"
              >
                Show All
              </button>
            )}
          </form>
        </div>

        {/* Results List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-stone-50/50">
          {loading ? (
            <div className="text-center py-12 text-stone-500 text-sm font-medium">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-amber-800 border-t-transparent mb-2"></div>
              <p>Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
              <p className="font-bold text-stone-800">No orders found.</p>
              <p className="text-xs text-stone-500 mt-1">Check your phone number or search query.</p>
              <button
                onClick={() => {
                  setQuery('');
                  fetchOrders('all');
                }}
                className="mt-3 bg-amber-800 text-white font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-amber-900"
              >
                View All Orders
              </button>
            </div>
          ) : (
            orders.map((o) => {
              return (
                <div key={o.id} className="bg-white border-2 border-amber-200/80 rounded-2xl p-4 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* 1. Items Ordered */}
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm mb-2 font-serif flex items-center justify-between border-b border-amber-100 pb-1.5">
                      <span>🛍️ Items Ordered</span>
                      <span className="text-[11px] font-sans font-normal text-stone-500">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 text-xs text-stone-800">
                          <div>
                            <p className="font-extrabold text-stone-900 text-xs sm:text-sm">{item.product.name}</p>
                            <p className="text-[11px] text-amber-950 font-medium mt-0.5">
                              Color: <b>{item.selectedColor}</b> | Size: <b>{item.selectedSize}</b> | Qty: <b>{item.quantity}</b>
                            </p>
                          </div>
                          <span className="font-mono font-black text-amber-950 text-xs sm:text-sm bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Delivery Address */}
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-stone-900 block text-xs">📍 Delivery Address:</span>
                    <p className="text-xs text-stone-800 font-medium leading-relaxed">
                      <b>{o.customer.fullName}</b> ({o.customer.phone})<br />
                      {o.customer.address}, {o.customer.city}, {o.customer.state} - <b>{o.customer.pincode}</b>
                      {o.customer.notes && (
                        <span className="block text-[11px] text-stone-500 mt-1 italic">Note: {o.customer.notes}</span>
                      )}
                    </p>
                  </div>

                  {/* 3. Total Amount */}
                  <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border border-amber-300 p-3 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-extrabold text-stone-800 text-xs sm:text-sm">Total Amount:</span>
                    <span className="font-mono text-base sm:text-lg font-black text-red-950">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

