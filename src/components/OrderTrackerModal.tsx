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
    try {
      const endpoint = (!searchStr.trim() || searchStr.trim().toLowerCase() === 'all')
        ? '/api/orders'
        : `/api/orders/track/${encodeURIComponent(searchStr.trim())}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Track error:', e);
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
                My Orders & Shipping Status
              </h2>
              <p className="text-[11px] text-amber-200/80">Track suits shipment & India Post consignment numbers</p>
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
                placeholder="Search by Order ID, Phone number, or UTS Ref..."
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
              <p className="text-xs text-stone-500 mt-1">Check your Order ID or phone number and try searching again.</p>
              <button
                onClick={() => {
                  setQuery('');
                  fetchOrders('all');
                }}
                className="mt-3 bg-amber-800 text-white font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-amber-900"
              >
                View All Shop Orders
              </button>
            </div>
          ) : (
            orders.map((o) => {
              const effectiveCourier = o.courierName || 'India Post (Speed Post)';
              const effectiveTrackingNo = o.trackingNumber || o.utsNumber;

              return (
                <div key={o.id} className="bg-white border-2 border-amber-200/80 rounded-2xl p-4 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-red-950 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          Order #{o.id}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">Payment UTR/UTS: <span className="font-bold text-stone-700">{o.utsNumber}</span></p>
                    </div>
                    <div>{getStatusBadge(o.status)}</div>
                  </div>

                  {/* Tracking Progress Ticket Pipeline Timeline */}
                  <div className="py-1">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-stone-600 mb-1.5">
                      <span className={o.status !== 'cancelled' ? 'text-amber-900' : ''}>1. Order Placed</span>
                      <span className={['order_confirmed', 'shipping_post_office', 'out_for_delivery', 'delivered'].includes(o.status) ? 'text-blue-900' : ''}>2. Confirmed</span>
                      <span className={['shipping_post_office', 'out_for_delivery', 'delivered'].includes(o.status) ? 'text-indigo-900' : ''}>3. India Post Dispatched</span>
                      <span className={['out_for_delivery', 'delivered'].includes(o.status) ? 'text-purple-900' : ''}>4. Out For Delivery</span>
                      <span className={o.status === 'delivered' ? 'text-green-900' : ''}>5. Delivered</span>
                    </div>

                    <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-amber-600 via-indigo-600 to-green-600 h-full transition-all duration-500"
                        style={{
                          width: o.status === 'pending_acceptance' ? '20%' :
                                 o.status === 'order_confirmed' ? '40%' :
                                 o.status === 'shipping_post_office' ? '60%' :
                                 o.status === 'out_for_delivery' ? '80%' :
                                 o.status === 'delivered' ? '100%' : '5%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Courier & Tracking Number Box (India Post Focus) */}
                  <div className="bg-gradient-to-br from-indigo-50/90 to-amber-50/80 border-2 border-indigo-200/90 p-3 rounded-2xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-black text-indigo-950 bg-indigo-200 px-2 py-0.5 rounded-full tracking-wider">
                          Shipping Company / Courier
                        </span>
                        <p className="text-xs sm:text-sm font-black text-indigo-950 mt-0.5 flex items-center gap-1.5">
                          <span>📮</span>
                          <span>{effectiveCourier}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full tracking-wider">
                          Tracking / Consignment No.
                        </span>
                        <p className="text-xs sm:text-sm font-mono font-black text-amber-950 mt-0.5">
                          {effectiveTrackingNo}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons: Copy Tracking & Track on India Post Portal */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-200/60">
                      
                      {/* Copy Tracking Number */}
                      <button
                        onClick={() => handleCopyTracking(effectiveTrackingNo, o.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          copiedId === o.id
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-indigo-950 border-indigo-300 hover:bg-indigo-100/60 shadow-2xs'
                        }`}
                      >
                        {copiedId === o.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Tracking No. Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-800" />
                            <span>Copy Tracking No.</span>
                          </>
                        )}
                      </button>

                      {/* Direct Track on India Post Website */}
                      <a
                        href="https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-red-900 hover:bg-red-950 text-amber-100 border border-red-800 shadow-sm transition-all"
                      >
                        <span>🇮🇳 Track on India Post Website</span>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                      </a>

                    </div>
                  </div>

                  {/* Customer Info & Order Items Summary */}
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-start text-stone-700">
                      <div>
                        <span className="font-bold text-stone-900">Delivery Address:</span>
                        <p className="text-[11px] text-stone-600 font-medium">
                          {o.customer.fullName} ({o.customer.phone}) - {o.customer.address}, {o.customer.city}, {o.customer.state} - {o.customer.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-stone-200 pt-2">
                      <p className="font-bold text-stone-900 mb-1">Items Ordered:</p>
                      <div className="space-y-1">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-[11px] text-stone-700">
                            <span>• {item.product.name} ({item.selectedColor}, {item.selectedSize}) × {item.quantity}</span>
                            <span className="font-mono font-bold">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-stone-200 pt-1.5 flex justify-between items-center text-xs">
                      <span className="text-stone-500 text-[11px]">Mode: UPI Payment Verified</span>
                      <span className="font-mono text-sm font-extrabold text-red-950">
                        Total Amount: ₹{o.totalAmount.toLocaleString('en-IN')}
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

