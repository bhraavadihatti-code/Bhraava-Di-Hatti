import React, { useState } from 'react';
import { Product } from '../types';
import { X, ShoppingBag, ShieldCheck, QrCode, Sparkles, Check, Star, Truck } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, color: string, size: string, quantity: number) => void;
  onBuyNow: (product: Product, color: string, size: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow
}) => {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Standard');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Free Size');
  const [quantity, setQuantity] = useState(1);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-amber-200 my-auto max-h-[92vh] flex flex-col md:flex-row">
        
        {/* Left Side: Product Image Box */}
        <div className="relative md:w-1/2 bg-slate-100 aspect-square md:aspect-auto">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 bg-black/60 text-amber-200 text-xs px-3 py-1 rounded-full backdrop-blur-md">
            Firm: {product.firmName}
          </div>
        </div>

        {/* Right Side: Specifications & Purchase Panel */}
        <div className="p-5 sm:p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                {product.category}
              </span>
              <button
                onClick={onClose}
                className="hidden md:block text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 mt-2">
              {product.name}
            </h2>

            {/* Price Box */}
            <div className="mt-3 flex items-baseline gap-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60">
              <span className="text-2xl font-extrabold text-red-900 font-mono">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through font-mono">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="bg-green-700 text-white font-bold text-xs px-2 py-0.5 rounded-md ml-auto">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mt-3">
              {product.description}
            </p>

            {/* Fabric Details */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-200">
                <p className="text-gray-400 text-[10px] uppercase font-bold">Fabric</p>
                <p className="font-semibold text-gray-800">{product.fabric}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-200">
                <p className="text-gray-400 text-[10px] uppercase font-bold">Work / Design</p>
                <p className="font-semibold text-gray-800">{product.workType}</p>
              </div>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1.5">
                  Color Option: <span className="text-amber-800">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedColor === c
                          ? 'bg-amber-900 text-amber-50 border-amber-900 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-amber-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1.5">
                  Size / Stitching: <span className="text-amber-800">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedSize === s
                          ? 'bg-amber-900 text-amber-50 border-amber-900 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-amber-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Quantity:
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 font-bold hover:bg-gray-200"
                >
                  -
                </button>
                <span className="px-3 py-1 text-sm font-bold font-mono">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 font-bold hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onAddToCart(product, selectedColor, selectedSize, quantity);
                  onClose();
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-3 rounded-xl border border-amber-300 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
              >
                <ShoppingBag className="w-4 h-4 text-amber-800" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={() => {
                  onBuyNow(product, selectedColor, selectedSize, quantity);
                  onClose();
                }}
                className="bg-gradient-to-r from-red-800 to-amber-900 hover:from-red-900 hover:to-amber-950 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                <span>Buy via UPI</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              100% Genuine Quality Guarantee by Bhraava Di Hatti
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
