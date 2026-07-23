import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Order, ShopSettings } from '../types';
import { CheckCircle2, Truck, MessageSquare, Printer, ShieldCheck } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  settings: ShopSettings;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export function generateMeeshoStyleBillText(order: Order, settings: ShopSettings): string {
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
    : new Date().toLocaleString('en-IN');
  
  const itemsList = order.items.map((item, idx) => 
    `${idx + 1}. *${item.product.name}* (Code: ${item.product.id})\n   • Color: ${item.selectedColor || 'Standard'} | Size: ${item.selectedSize || 'Unstitched'}\n   • Qty: ${item.quantity} x ₹${item.product.price} = ₹${item.product.price * item.quantity}`
  ).join('\n\n');

  return `🧾 *BHRAAVA DI HATTI - TAX INVOICE & SHIPPING SLIP*
----------------------------------------
📌 *ORDER ID:* #${order.id}
📅 *DATE & TIME:* ${dateStr}
🏪 *SELLER:* ${settings.shopName || 'Bhraava Di Hatti'} (${settings.firmName || 'Jai Durga Cloth Emporium'})
📞 *CONTACT:* 94171-24082 / 99150-46357

----------------------------------------
👤 *CUSTOMER SHIPPING DETAILS (DELIVERY TO):*
• *Name:* ${order.customer.fullName}
• *Phone:* ${order.customer.phone}
• *Address:* ${order.customer.address}
• *City / District:* ${order.customer.city}
• *State:* ${order.customer.state || 'Punjab'}
• *Pincode:* ${order.customer.pincode}
${order.customer.notes ? `• *Note:* ${order.customer.notes}` : ''}

----------------------------------------
📦 *ORDERED SUITS & FABRICS:*
${itemsList}

----------------------------------------
💰 *BILL SUMMARY & PAYMENT:*
• Items Subtotal: ₹${order.subtotal}
• Shipping Fee: ${order.shippingFee === 0 ? 'FREE DELIVERY 🚚' : `₹${order.shippingFee}`}
• *GRAND TOTAL PAID:* ₹${order.totalAmount}
• *PAYMENT MODE:* Online UPI / QR
• *UTR / UTS REF NO:* ${order.utsNumber || order.payment.utrNumber}
• *PAYMENT STATUS:* ✅ VERIFIED & PAID

----------------------------------------
🚚 *READY FOR DISPATCH & PRINTING*
Bhraava Di Hatti, Bus Stand Road, Maur Mandi, Dist. Bathinda, Punjab - 151509`;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  settings,
  onClose,
  onTrackOrder
}) => {
  if (!order) return null;

  const targetWhatsappNumber = settings.whatsappNumber || "919417124082";
  const meeshoBillText = generateMeeshoStyleBillText(order, settings);
  const whatsappUrl = `https://wa.me/${targetWhatsappNumber}?text=${encodeURIComponent(meeshoBillText)}`;

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
  }, [order.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-400 text-center p-6 space-y-4 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Animated Check Icon */}
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-green-300">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Order Successfully Placed & Saved!
          </span>
          <h2 className="text-2xl font-extrabold font-serif text-gray-900 mt-2">
            Thank You, {order.customer.fullName}!
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Your order <strong className="text-red-900 font-mono">#{order.id}</strong> has been logged & sent to <strong className="text-amber-950">{settings.shopName}</strong> for shipping dispatch!
          </p>
        </div>

        {/* Meesho-Style Invoice Preview Box */}
        <div className="bg-stone-900 text-emerald-400 font-mono text-[11px] p-3.5 rounded-2xl border border-stone-700 text-left space-y-1.5 shadow-inner max-h-48 overflow-y-auto">
          <div className="flex justify-between items-center text-amber-300 font-bold border-b border-stone-800 pb-1 text-xs">
            <span>🧾 MEESHO INVOICE & SHIPPING SLIP</span>
            <span>#{order.id}</span>
          </div>
          <p><span className="text-stone-400">Recipient:</span> {order.customer.fullName} ({order.customer.phone})</p>
          <p><span className="text-stone-400">Address:</span> {order.customer.address}, {order.customer.city} - {order.customer.pincode}</p>
          <p><span className="text-stone-400">UTR / UTS:</span> {order.utsNumber}</p>
          <p><span className="text-stone-400">Total Paid:</span> ₹{order.totalAmount}</p>
          <p className="text-amber-200 text-[10px] pt-1">✅ Order details formatted & sent directly to 94171-24082 on WhatsApp!</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm border border-emerald-400 cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span>📲 Send Bill on WhatsApp to 94171-24082</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder(order.id);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold py-3 rounded-xl border border-amber-300 transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-800" />
              <span>Track Order Live</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold py-3 rounded-xl border border-stone-300 transition-colors text-xs cursor-pointer"
            >
              Continue Shopping 🛍️
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

