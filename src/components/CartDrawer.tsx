import React from 'react';
import { CartItem, ShopSettings } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: () => void;
  settings: ShopSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  settings
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= settings.minOrderForFreeShipping || subtotal === 0 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-red-950 to-amber-900 text-amber-50 flex items-center justify-between border-b border-amber-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <h2 className="font-serif font-bold text-lg text-amber-100">
              Shopping Bag ({cartItems.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-amber-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
              <ShoppingBag className="w-16 h-16 text-amber-200 mb-3" />
              <p className="font-bold text-gray-700 text-base">Your shopping bag is empty</p>
              <p className="text-xs text-gray-400 max-w-xs mt-1">
                Explore our Punjabi suits, Banarasi sarees, and Men's kurtas to add items.
              </p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}-${idx}`}
                className="bg-amber-50/40 p-3 rounded-2xl border border-amber-100 flex gap-3 items-center"
              >
                <img
                  src={item.product.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
                  }}
                  className="w-16 h-20 object-cover rounded-xl border border-amber-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                    {item.product.name}
                  </h4>

                  <div className="text-[11px] text-gray-500 mt-0.5 space-x-2">
                    <span>Color: <strong className="text-gray-700">{item.selectedColor}</strong></span>
                    <span>•</span>
                    <span>Size: <strong className="text-gray-700">{item.selectedSize}</strong></span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono font-bold text-red-900 text-sm">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg text-xs">
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                        className="px-2 py-0.5 font-bold hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-2 py-0.5 font-mono font-bold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                        className="px-2 py-0.5 font-bold hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(idx)}
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Summary */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-amber-200 space-y-3">
            
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping & Delivery</span>
                {shippingFee === 0 ? (
                  <span className="text-green-700 font-bold uppercase text-[10px]">FREE</span>
                ) : (
                  <span className="font-mono font-semibold">₹{shippingFee}</span>
                )}
              </div>

              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount to Pay</span>
                <span className="font-mono text-red-900 font-extrabold text-lg">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-2 text-[11px] text-amber-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-800 shrink-0" />
              <span>Only UPI / QR Code Payment accepted with UTR Number input.</span>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full bg-gradient-to-r from-red-800 to-amber-900 hover:from-red-900 hover:to-amber-950 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              <span>Proceed to UPI Checkout</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
