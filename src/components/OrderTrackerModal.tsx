import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { X, Search, Truck, ExternalLink, Copy, Check, AlertTriangle, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';

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

  // Fetch orders directly from central backend (backed by Google Sheets)
  const fetchOrders = async (searchStr: string) => {
    setLoading(true);
    setSearched(true);

    try {
      const endpoint = (!searchStr.trim() || searchStr.trim().toLowerCase() === 'all')
        ? `/api/orders?t=${Date.now()}`
        : `/api/orders/track/${encodeURIComponent(searchStr.trim())}?t=${Date.now()}`;
      
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (res.ok) {
        const data: Order[] = await res.json();
        if (Array.isArray(data)) {
          // Sort newest first
          const sorted = [...data].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setOrders(sorted);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn('Track API fetch error:', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
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
    const s = String(status || '').toLowerCase();
    if (s.includes('confirm')) {
      return (
        <span className="bg-blue-100 text-blue-900 border border-blue-300 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
          <span>Status: Confirmed</span>
        </span>
      );
    }
    if (s.includes('reject') || s.includes('cancel')) {
      return (
        <span className="bg-red-100 text-red-900 border border-red-300 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 text-red-700" />
          <span>Status: Rejected</span>
        </span>
      );
    }
    if (s.includes('ship') || s.includes('post')) {
      return (
        <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
          <Truck className="w-3.5 h-3.5 text-indigo-700" />
          <span>Status: Shipped</span>
        </span>
      );
    }
    if (s.includes('deliver')) {
      return (
        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
          <Package className="w-3.5 h-3.5 text-emerald-700" />
          <span>Status: Delivered</span>
        </span>
      );
    }
    // Default Pending
    return (
      <span className="bg-amber-100 text-amber-950 border border-amber-300 font-extrabold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-amber-700" />
        <span>Status: Pending</span>
      </span>
    );
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
                My Orders & Live Order Tracking
              </h2>
              <p className="text-[11px] text-amber-200/80">Central database order status across all devices</p>
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
                placeholder="Search by Order ID (e.g. BDH-2026-00001) or Phone..."
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
              <p>Fetching latest orders from central database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
              <p className="font-bold text-stone-800">No orders found.</p>
              <p className="text-xs text-stone-500 mt-1">Check your Order ID or phone number.</p>
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
              const isShipped = o.status === 'Shipped' || o.status === 'shipping_post_office' || Boolean(o.trackingNumber);

              return (
                <div key={o.id} className="bg-white border-2 border-amber-200/90 rounded-2xl p-4 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Card Header: Order / Ticket Number & Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <div>
                      <span className="text-xs text-stone-500 uppercase font-mono font-bold">Ticket / Order No:</span>
                      <p className="font-mono font-black text-red-950 text-sm sm:text-base leading-tight">
                        {o.id}
                      </p>
                      <span className="text-[11px] text-stone-400">
                        Placed on: {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(o.status)}
                    </div>
                  </div>

                  {/* Tracking Number Banner (When Shipped) */}
                  {isShipped && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 p-3 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold">
                          <Truck className="w-4 h-4 text-indigo-700 shrink-0" />
                          <span>Courier: {o.courierName || 'India Post (Speed Post)'}</span>
                        </div>
                        <p className="font-mono font-black text-indigo-950 text-xs sm:text-sm">
                          Tracking No: <span className="bg-white px-2 py-0.5 rounded border border-indigo-300">{o.trackingNumber || 'Available shortly'}</span>
                        </p>
                      </div>

                      {o.trackingNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(o.trackingNumber!, o.id)}
                          className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                        >
                          {copiedId === o.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === o.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Items Ordered */}
                  <div>
                    <h4 className="font-bold text-stone-800 text-xs mb-2">
                      🛍️ Items ({o.items?.length || 1}):
                    </h4>
                    <div className="space-y-2">
                      {(o.items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 text-xs text-stone-800">
                          <div>
                            <p className="font-extrabold text-stone-900 text-xs sm:text-sm">{item.product?.name || 'Punjabi Suit'}</p>
                            <p className="text-[11px] text-amber-950 font-medium mt-0.5">
                              Color: <b>{item.selectedColor || 'Standard'}</b> | Size: <b>{item.selectedSize || 'Unstitched'}</b> | Qty: <b>{item.quantity}</b>
                            </p>
                          </div>
                          <span className="font-mono font-black text-amber-950 text-xs sm:text-sm bg-white px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 ml-2">
                            ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-stone-900 block text-xs">📍 Delivery Details:</span>
                    <p className="text-xs text-stone-800 font-medium leading-relaxed">
                      <b>{o.customer.fullName}</b> ({o.customer.phone})<br />
                      {o.customer.address}, {o.customer.city}, {o.customer.state} - <b>{o.customer.pincode}</b>
                    </p>
                  </div>

                  {/* Total Amount & Payment Mode */}
                  <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border border-amber-300 p-3 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-stone-700">Payment: </span>
                      <span className="font-extrabold text-amber-950 font-mono">
                        {o.payment?.method === 'COD' ? '💵 Cash on Delivery' : '📱 UPI Transfer'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-600 text-xs mr-2">Total Amount:</span>
                      <span className="font-mono text-base sm:text-lg font-black text-red-950">
                        ₹{o.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
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
