import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Eye, Star, Sparkles, Tag, Check, Award } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickAdd,
  onViewDetails
}) => {
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const savingsAmount = product.originalPrice && product.originalPrice > product.price 
    ? product.originalPrice - product.price 
    : 0;

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-200/70 shadow-md hover:shadow-2xl hover:border-amber-400 transition-all duration-300 overflow-hidden flex flex-col group relative">
      
      {/* Product Image Box */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-[3/4] bg-stone-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          <span className="bg-[#32080E] text-amber-300 font-mono font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-lg border border-amber-500/50">
            {product.id}
          </span>
          {product.isBestSeller && (
            <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1 border border-amber-300/40">
              <Sparkles className="w-3 h-3 text-amber-200" /> Royal Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-red-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider">
              New Arrival
            </span>
          )}
        </div>

        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-green-800 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-md border border-green-400/40 font-mono">
            {discountPercent}% OFF
          </span>
        )}

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="bg-white/95 text-amber-950 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl hover:bg-amber-900 hover:text-white flex items-center gap-1.5 transition-all scale-95 group-hover:scale-100 font-sans border border-amber-200"
          >
            <Eye className="w-4 h-4 text-amber-700 group-hover:text-amber-200" /> View Fabric & Details
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-gradient-to-b from-white to-amber-50/20">
        <div>
          <div className="text-[11px] font-extrabold text-amber-900 uppercase tracking-widest mb-1 flex items-center justify-between">
            <span className="bg-amber-100/90 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px]">
              {product.category}
            </span>
            {product.rating && (
              <span className="flex items-center gap-1 text-amber-800 font-black bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px]">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {product.rating}
              </span>
            )}
          </div>

          <h3 
            onClick={() => onViewDetails(product)}
            className="font-serif font-bold text-stone-900 text-sm sm:text-base line-clamp-1 hover:text-amber-900 cursor-pointer transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-1 mt-1 font-sans">
            Fabric: <strong className="text-stone-800 font-semibold">{product.fabric}</strong>
          </p>

          {/* Color previews */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <span className="text-[10px] text-amber-900 font-bold">Colors:</span>
              {product.colors.slice(0, 3).map((c, i) => (
                <span key={i} className="text-[9px] font-bold bg-white border border-stone-300 text-stone-700 px-1.5 py-0.2 rounded-md">
                  {c}
                </span>
              ))}
              {product.colors.length > 3 && (
                <span className="text-[9px] text-stone-500 font-bold">+{product.colors.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Add Button Box */}
        <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-red-950 font-mono">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-stone-400 line-through font-mono">
                  MRP ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {savingsAmount > 0 ? (
              <p className="text-[10px] bg-green-100 text-green-950 font-black px-2 py-0.5 rounded-md inline-block mt-1 border border-green-300">
                🎉 YOU SAVE ₹{savingsAmount.toLocaleString('en-IN')}!
              </p>
            ) : (
              <p className="text-[10px] text-green-800 font-extrabold flex items-center gap-0.5 mt-0.5">
                <Check className="w-3 h-3 text-green-700" /> Fast Postal Dispatch
              </p>
            )}
          </div>

          <button
            onClick={() => onQuickAdd(product)}
            disabled={!product.inStock}
            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md ${
              product.inStock
                ? 'bg-[#32080E] hover:bg-amber-950 text-amber-200 border border-amber-500/40 active:scale-95 hover:shadow-lg'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
            title={product.inStock ? 'Add to Bag' : 'Out of Stock'}
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

      </div>
    </div>
  );
};

