import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { 
  Heart, 
  ArrowLeft, 
  ShoppingBag, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  CheckCircle2,
  PackageOpen
} from 'lucide-react';

interface WishlistViewProps {
  wishlistProducts: Product[];
  allProducts: Product[];
  onBackToShop: () => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  onQuickAdd: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onAddAllToCart: (products: Product[]) => void;
  onClearWishlist: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistProducts,
  allProducts,
  onBackToShop,
  onToggleWishlist,
  isWishlisted,
  onQuickAdd,
  onViewDetails,
  onAddAllToCart,
  onClearWishlist
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Recommendations when empty or for inspiration
  const recommendedSuits = allProducts
    .filter((p) => !wishlistProducts.some((wp) => wp.id === p.id))
    .slice(0, 4);

  const inStockCount = wishlistProducts.filter((p) => p.inStock).length;
  const totalWishlistValue = wishlistProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Breadcrumb Bar */}
      <div className="bg-gradient-to-r from-[#32080E] via-amber-950 to-red-950 text-amber-50 rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-amber-400/40 relative overflow-hidden">
        {/* Background decorative pattern */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Heart className="w-48 h-48 text-amber-200" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <button
              onClick={onBackToShop}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-amber-300/30 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md border border-amber-300/50">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight flex items-center gap-2">
                  <span>My Saved Wishlist</span>
                  <span className="text-xs font-sans font-black bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full font-mono">
                    {wishlistProducts.length} {wishlistProducts.length === 1 ? 'Suit' : 'Suits'}
                  </span>
                </h1>
                <p className="text-xs text-amber-200/90 font-medium">
                  Your bookmarked suits are stored safely on your device for quick ordering anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons for Wishlist */}
          {wishlistProducts.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 md:pt-0">
              {inStockCount > 0 && (
                <button
                  onClick={() => onAddAllToCart(wishlistProducts.filter((p) => p.inStock))}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs px-3.5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 border border-amber-200 active:scale-95 cursor-pointer"
                  title="Add all in-stock suits to your shopping bag"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-950" />
                  <span>Add All In-Stock to Bag ({inStockCount})</span>
                </button>
              )}

              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-red-500/50">
                  <span className="text-[11px] text-red-200 font-bold px-2">Clear all?</span>
                  <button
                    onClick={() => {
                      onClearWishlist();
                      setShowClearConfirm(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-xl transition-all"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="bg-stone-700 hover:bg-stone-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-xl transition-all"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="bg-white/10 hover:bg-red-900/50 text-amber-200 hover:text-red-200 font-bold text-xs px-3 py-2.5 rounded-2xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  title="Clear all saved items"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear List</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Wishlist Products Section */}
      {wishlistProducts.length > 0 ? (
        <div className="space-y-6">
          {/* Wishlist Summary Bar */}
          <div className="bg-white rounded-2xl border border-amber-200 p-3 sm:p-4 flex items-center justify-between gap-4 shadow-xs flex-wrap">
            <div className="flex items-center gap-4 text-xs font-semibold text-stone-700">
              <span className="flex items-center gap-1.5 text-stone-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Showing <strong>{wishlistProducts.length}</strong> saved items</span>
              </span>
              <span className="hidden sm:inline text-stone-300">|</span>
              <span className="hidden sm:inline text-stone-600">
                Total Value: <strong className="font-mono text-red-950">₹{totalWishlistValue.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-amber-50 text-amber-900 font-bold px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                <Truck className="w-3 h-3 text-amber-700" /> Free Postal Shipping in India
              </span>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickAdd={onQuickAdd}
                onViewDetails={onViewDetails}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border-2 border-dashed border-amber-300/80 p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto text-amber-700 shadow-inner">
            <Heart className="w-10 h-10 text-amber-600 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              You haven't bookmarked any suits yet. Explore our Royal Punjabi Suits, Farshi Suits, Cotton Suits & Ruaab collections, then tap the <span className="inline-flex items-center text-red-600 font-bold gap-0.5"><Heart className="w-3.5 h-3.5 fill-red-600 inline" /> heart icon</span> on any suit to bookmark it here!
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToShop}
              className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 hover:scale-102 text-amber-100 font-black text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg border border-amber-400/40 inline-flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Explore Suits Catalog</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* Suggested & Popular Suits if Wishlist is empty or small */}
      {recommendedSuits.length > 0 && (
        <div className="pt-6 border-t border-amber-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold font-serif text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Recommended Suits for You</span>
            </h3>
            <button
              onClick={onBackToShop}
              className="text-xs font-bold text-amber-900 hover:text-red-900 hover:underline"
            >
              View Full Catalog ➔
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {recommendedSuits.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickAdd={onQuickAdd}
                onViewDetails={onViewDetails}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
