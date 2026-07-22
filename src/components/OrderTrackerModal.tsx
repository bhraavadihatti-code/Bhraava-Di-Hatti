import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { X, Search, Truck, Clock, CheckCircle2, PackageCheck, AlertTriangle, PhoneCall } from 'lucide-react';

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

  const fetchOrderTrack = async (searchStr: string) => {
    if (!searchStr.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(searchStr.trim())}`);
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
    if (initialQuery) {
      fetchOrderTrack(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderTrack(query);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_acceptance':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs">⏳ Payment Verification Pending</span>;
      case 'payment_verified':
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-xs">✨ Order Accepted & Packing</span>;
      case 'shipped':
        return <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold px-2.5 py-0.5 rounded-full text-xs">🚚 Shipped via Courier</span>;
      case 'delivered':
        return <span className="bg-green-100 text-green-800 border border-green-300 font-bold px-2.5 py-0.5 rounded-full text-xs">✅ Successfully Delivered</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 border border-red-300 font-bold px-2.5 py-0.5 rounded-full text-xs">❌ Order Declined</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-amber-200 my-auto flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-amber-900 p-4 text-amber-50 flex items-center justify-between border-b border-amber-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-300" />
            <h2 className="font-serif font-bold text-lg text-amber-100">
              Track Order Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-4 bg-amber-50/50 border-b border-amber-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Order ID (BDH-2026-1001) or UTS No. or Phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <Search className="w-4 h-4 text-amber-700 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Searching order record...</div>
          ) : searched && orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
              <p className="font-bold">No order found matching your query.</p>
              <p className="text-xs text-gray-400 mt-1">Please double check your Order ID or UTS Reference Number.</p>
            </div>
          ) : !searched ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Type your Order ID or UTS number above to track order shipment.
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
                
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-red-900">Order #{o.id}</span>
                    <p className="text-[10px] text-gray-500">UTS Ref: {o.utsNumber}</p>
                  </div>
                  <div>{getStatusBadge(o.status)}</div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                    <span className={o.status !== 'rejected' ? 'text-green-700 font-bold' : ''}>Order Placed</span>
                    <span className={['payment_verified', 'processing', 'shipped', 'delivered'].includes(o.status) ? 'text-green-700 font-bold' : ''}>Accepted</span>
                    <span className={['shipped', 'delivered'].includes(o.status) ? 'text-green-700 font-bold' : ''}>Shipped</span>
                    <span className={o.status === 'delivered' ? 'text-green-700 font-bold' : ''}>Delivered</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-green-600 h-full transition-all duration-500"
                      style={{
                        width: o.status === 'pending_acceptance' ? '25%' :
                               ['payment_verified', 'processing'].includes(o.status) ? '50%' :
                               o.status === 'shipped' ? '75%' :
                               o.status === 'delivered' ? '100%' : '10%'
                      }}
                    />
                  </div>
                </div>

                {/* Courier / Tracking Info */}
                {o.courierName && (
                  <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-xs text-indigo-900 flex justify-between items-center">
                    <div>
                      <p className="font-bold">Courier: {o.courierName}</p>
                      <p className="font-mono text-[11px]">Tracking No: {o.trackingNumber || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {/* Items & Amount */}
                <div className="text-xs text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">Items Ordered:</p>
                  <ul className="list-disc list-inside text-[11px] text-gray-600">
                    {o.items.map((item, i) => (
                      <li key={i}>{item.product.name} ({item.selectedSize}, {item.selectedColor}) x {item.quantity}</li>
                    ))}
                  </ul>
                  <p className="font-mono font-bold text-red-900 text-right pt-1">
                    Total Amount: ₹{o.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
