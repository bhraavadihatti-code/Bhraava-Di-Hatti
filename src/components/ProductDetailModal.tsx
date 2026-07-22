import React, { useState } from 'react';
import { Product } from '../types';
import { X, ShoppingBag, ShieldCheck, QrCode, Sparkles, Check, Star, Truck, Award } from 'lucide-react';

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
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Free Size (Unstitched)');
  const [quantity, setQuantity] = useState(1);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const savingsAmount = product.originalPrice && product.originalPrice > product.price 
    ? product.originalPrice - product.price 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-300 my-auto max-h-[92vh] flex flex-col md:flex-row">
        
        {/* Left Side: Product Image Box */}
        <div className="relative md:w-1/2 bg-stone-100 aspect-square md:aspect-auto">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-stone-900 p-2 rounded-full shadow-lg backdrop-blur-md transition-colors md:hidden border border-amber-200"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 bg-[#32080E]/90 border border-amber-500/40 text-amber-200 text-xs px-3 py-1 rounded-full backdrop-blur-md font-mono">
            {product.firmName} | {product.id}
          </div>
        </div>

        {/* Right Side: Specifications & Purchase Panel */}
        <div className="p-5 sm:p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
          
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 uppercase tracking-widest bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md">
                  {product.category}
                </span>
                <span className="text-xs font-mono font-black text-red-950 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                  ID: {product.id}
                </span>
              </div>
              <button
                onClick={onClose}
                className="hidden md:block text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-playfair text-stone-900 mt-2 leading-snug">
              {product.name}
            </h2>

            {/* Price Box with Savings */}
            <div className="mt-3 bg-amber-50/90 p-4 rounded-2xl border border-amber-300 shadow-2xs">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-red-950 font-mono">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-stone-400 line-through font-mono">
                    MRP ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-green-800 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-md ml-auto font-mono">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              
              {savingsAmount > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-xs font-bold text-green-900">
                  <span>🎉 Rakhi Sale Savings:</span>
                  <span className="bg-green-700 text-white px-2 py-0.5 rounded-md font-mono">
                    YOU SAVE ₹{savingsAmount.toLocaleString('en-IN')}!
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-stone-600 leading-relaxed mt-3 font-sans">
              {product.description}
            </p>

            {/* Unstitched Cloth Meter Specifications */}
            <div className="mt-3 bg-amber-50/70 border border-amber-200 p-2.5 rounded-2xl text-xs space-y-1">
              <span className="font-extrabold text-amber-950 block text-[11px] uppercase tracking-wider">
                🧵 Unstitched Cloth Cut Specifications:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-medium text-stone-700">
                <div className="bg-white p-1 rounded-lg border border-amber-200/60 shadow-2xs">
                  <span className="block font-bold text-stone-900">Top / Shirt</span>
                  <span className="text-[10px] text-amber-900 font-mono font-bold">2.50 Meters</span>
                </div>
                <div className="bg-white p-1 rounded-lg border border-amber-200/60 shadow-2xs">
                  <span className="block font-bold text-stone-900">Bottom / Salwar</span>
                  <span className="text-[10px] text-amber-900 font-mono font-bold">2.50 - 3.00 M</span>
                </div>
                <div className="bg-white p-1 rounded-lg border border-amber-200/60 shadow-2xs">
                  <span className="block font-bold text-stone-900">Dupatta</span>
                  <span className="text-[10px] text-amber-900 font-mono font-bold">2.25 Meters</span>
                </div>
              </div>
            </div>

            {/* Fabric Details */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <p className="text-stone-400 text-[10px] uppercase font-bold">Fabric Material</p>
                <p className="font-extrabold text-stone-800">{product.fabric}</p>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <p className="text-stone-400 text-[10px] uppercase font-bold">Work / Design</p>
                <p className="font-extrabold text-stone-800">{product.workType}</p>
              </div>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                  Color Option: <span className="text-amber-900 font-bold">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedColor === c
                          ? 'bg-[#32080E] text-amber-200 border-amber-900 shadow-md ring-2 ring-amber-300'
                          : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400'
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
                <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                  Stitching Type: <span className="text-amber-900 font-bold">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedSize === s
                          ? 'bg-[#32080E] text-amber-200 border-amber-900 shadow-md ring-2 ring-amber-300'
                          : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400'
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
              <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                Quantity:
              </label>
              <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 font-bold hover:bg-stone-200 transition-colors"
                >
                  -
                </button>
                <span className="px-3 py-1 text-sm font-bold font-mono text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 font-bold hover:bg-stone-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onAddToCart(product, selectedColor, selectedSize, quantity);
                  onClose();
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-black py-3.5 rounded-2xl border border-amber-300 transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-amber-900" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={() => {
                  onBuyNow(product, selectedColor, selectedSize, quantity);
                  onClose();
                }}
                className="bg-gradient-to-r from-red-900 via-amber-950 to-red-950 hover:scale-102 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95 border border-amber-500/30"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                <span>Buy via UPI</span>
              </button>
            </div>

            {/* Direct WhatsApp Order / Photo Request Button */}
            <a
              href={`https://wa.me/919417124082?text=${encodeURIComponent(
                `Sat Sri Akal / Hello Bhraava Di Hatti! I am interested in ${product.name} (Serial ID: ${product.id}). Price: ₹${product.price}. Please share more details / photos.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-md border border-emerald-500/40"
            >
              <span>💬 Ask / Send Photo Request on WhatsApp (94171-24082)</span>
            </a>

            <p className="text-[11px] text-stone-500 text-center flex items-center justify-center gap-1 font-medium pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
              100% Guaranteed Quality Handloom Cloth by Bhraava Di Hatti
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

