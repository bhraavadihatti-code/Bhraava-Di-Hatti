import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Eye, Star, Sparkles, Check } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-2xl border border-amber-100/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group relative">
      
      {/* Product Image Box */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.isBestSeller && (
            <span className="bg-amber-600 text-amber-50 font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-red-800 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              New Arrival
            </span>
          )}
        </div>

        {discountPercent > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-green-700 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-sm">
            {discountPercent}% OFF
          </span>
        )}

        {/* Hover Quick Action */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="bg-white/90 text-gray-900 text-xs font-bold px-3 py-2 rounded-xl shadow hover:bg-white flex items-center gap-1.5 transition-transform scale-95 group-hover:scale-100"
          >
            <Eye className="w-4 h-4 text-amber-700" /> Quick View
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>{product.category}</span>
            {product.rating && (
              <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {product.rating}
              </span>
            )}
          </div>

          <h3 
            onClick={() => onViewDetails(product)}
            className="font-serif font-bold text-gray-900 text-sm sm:text-base line-clamp-1 hover:text-amber-800 cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            Fabric: <span className="font-medium text-gray-700">{product.fabric}</span>
          </p>
        </div>

        {/* Pricing & Add Button */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-red-900 font-mono">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through font-mono">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-green-700 font-medium">Free Delivery Eligible</p>
          </div>

          <button
            onClick={() => onQuickAdd(product)}
            disabled={!product.inStock}
            className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all shadow-sm ${
              product.inStock
                ? 'bg-amber-800 hover:bg-amber-900 text-white active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={product.inStock ? 'Add to Bag' : 'Out of Stock'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
