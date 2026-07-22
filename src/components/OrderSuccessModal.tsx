import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Order, ShopSettings } from '../types';
import { CheckCircle2, QrCode, Truck, PhoneCall, MessageSquare, Copy, Check } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  settings: ShopSettings;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  settings,
  onClose,
  onTrackOrder
}) => {
  if (!order) return null;

  useEffect(() => {
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn('Confetti fail silent:', e);
    }
  }, []);

  const whatsappMessage = `Hello *${settings.shopName}* (${settings.firmName}), I have placed Order *#${order.id}*.\n\n*UTS/UTR No:* ${order.utsNumber}\n*Amount Paid:* ₹${order.totalAmount}\n*Name:* ${order.customer.fullName}\n*Phone:* ${order.customer.phone}\n*Address:* ${order.customer.address}, ${order.customer.city}, ${order.customer.pincode}\n\nPlease accept and process my shipment. Thank you!`;

  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-amber-200 text-center p-6 space-y-4 my-auto">
        
        {/* Animated Check Icon */}
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Order Submitted & Pending Acceptance
          </span>
          <h2 className="text-2xl font-extrabold font-serif text-gray-900 mt-2">
            Thank You, {order.customer.fullName}!
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Your order has been sent to <strong className="text-gray-800">{settings.shopName}</strong> for payment verification & processing.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-500">Order Reference ID:</span>
            <span className="font-mono font-bold text-red-900">{order.id}</span>
          </div>

          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-500">Submitted UTR / UTS No:</span>
            <span className="font-mono font-bold text-gray-900">{order.utsNumber}</span>
          </div>

          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-500">Total Amount Paid:</span>
            <span className="font-mono font-extrabold text-green-700 text-sm">
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="pt-1 text-gray-600">
            <p className="font-semibold text-gray-800">Ship To:</p>
            <p>{order.customer.address}, {order.customer.city} ({order.customer.pincode})</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Send Order Receipt on WhatsApp</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onTrackOrder(order.id);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 rounded-xl border border-amber-300 transition-colors flex items-center justify-center gap-1.5 text-xs"
            >
              <Truck className="w-4 h-4 text-amber-800" />
              <span>Track Order</span>
            </button>

            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl border border-gray-300 transition-colors text-xs"
            >
              Continue Shopping
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
