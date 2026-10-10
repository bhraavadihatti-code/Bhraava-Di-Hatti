import React from 'react';
import { Product } from '../types';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import fallbackSuitImg from '../assets/images/punjabi_suit_red_1784686277398.jpg';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  shopPhone?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  isWishlisted = false,
  onToggleWishlist,
  shopPhone = '9417124082'
}) => {
  const cleanPhone = shopPhone.replace(/[^0-9]/g, '') || '9417124082';
  const whatsappInquiryUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal Bhraava Di Hatti! Mainu eh suit pasand aaya hai:\n• Suit: ${product.name}\n• Code: ${product.id}\n• Fabric: ${product.fabric}\n• Rate: ₹${product.price}\nKripa karke daso eh suit dukan te available hai ji?`
  )}`;

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-lg hover:border-amber-400 transition-all duration-200 overflow-hidden flex flex-col group relative min-w-0">
      {/* Product Image Box */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-[3/4] bg-stone-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl || fallbackSuitImg}
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackSuitImg;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Save Design / Wishlist Heart Button (Top Right) */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-150 active:scale-90 shadow-sm cursor-pointer ${
              isWishlisted
                ? 'bg-white text-red-600 ring-1 ring-red-400'
                : 'bg-white/90 text-stone-700 hover:text-red-600 hover:bg-white border border-stone-200/70'
            }`}
            title={isWishlisted ? "Remove from Saved Designs" : "Save Design"}
            aria-label={isWishlisted ? "Remove from Saved Designs" : "Save Design"}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
          </button>
        )}

        {/* Sold Out Overlay if out of stock */}
        {!product.inStock && (
          <div className="absolute top-2 left-2 z-10 bg-stone-900/90 text-amber-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
            Sold Out
          </div>
        )}

        {/* Design Code Watermark Label (Bottom Left) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2 pt-5 flex items-end justify-between gap-1">
          <span className="text-amber-200 font-mono font-bold text-[10px] sm:text-xs tracking-wide truncate">
            {product.id}
          </span>
          {product.isNewArrival && product.inStock && (
            <span className="text-amber-300 text-[9px] sm:text-[10px] font-bold tracking-wide shrink-0">
              New
            </span>
          )}
        </div>

        {/* Hover Details Overlay (Desktop) */}
        <div className="hidden sm:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="bg-white/95 text-amber-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:bg-amber-950 hover:text-white flex items-center gap-1.5 transition-colors border border-amber-200 whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Full Details</span>
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 bg-white min-w-0">
        <div className="min-w-0">
          {/* Clean Unboxed Metadata */}
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-900/80 font-semibold truncate">
            <span className="truncate">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-500 truncate">{product.fabric}</span>
          </div>

          <h3 
            onClick={() => onViewDetails(product)}
            className="font-serif font-bold text-stone-900 text-xs sm:text-base line-clamp-1 hover:text-amber-900 cursor-pointer transition-colors mt-0.5"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Colors as clean inline text */}
          {product.colors && product.colors.length > 0 && (
            <p className="text-[10px] sm:text-[11px] text-stone-500 truncate mt-0.5">
              Colors: <span className="text-stone-700 font-medium">{product.colors.join(', ')}</span>
            </p>
          )}
        </div>

        {/* Showroom Rate & Direct WhatsApp Inquiry CTA (Stacked on mobile so it never overflows) */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
          <div className="flex items-baseline justify-between sm:block gap-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-lg font-black text-red-950 font-mono tabular-nums">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-[11px] text-stone-400 line-through font-mono tabular-nums">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[9px] sm:text-[10px] text-stone-500 font-medium shrink-0">
              {product.inStock ? '1–2 Sets' : 'Sold Out'}
            </p>
          </div>

          {product.inStock ? (
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs bg-emerald-700 hover:bg-emerald-800 text-white whitespace-nowrap shrink-0"
              title="Check availability on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs bg-stone-100 text-stone-500 whitespace-nowrap shrink-0 cursor-pointer text-center"
            >
              View Info
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
