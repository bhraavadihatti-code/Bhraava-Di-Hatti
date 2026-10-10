import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { 
  Heart, 
  ArrowLeft, 
  Trash2, 
  CheckCircle2,
  MessageCircle,
  Store
} from 'lucide-react';

interface WishlistViewProps {
  wishlistProducts: Product[];
  allProducts: Product[];
  onBackToShop: () => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  onViewDetails: (product: Product) => void;
  onClearWishlist: () => void;
  shopPhone?: string;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistProducts,
  allProducts,
  onBackToShop,
  onToggleWishlist,
  isWishlisted,
  onViewDetails,
  onClearWishlist,
  shopPhone = '9417124082'
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const recommendedSuits = allProducts
    .filter((p) => !wishlistProducts.some((wp) => wp.id === p.id))
    .slice(0, 4);

  const cleanPhone = shopPhone.replace(/[^0-9]/g, '') || '9417124082';
  const savedListText = wishlistProducts
    .map((p, idx) => `${idx + 1}. ${p.name} (Code: ${p.id}) - ₹${p.price}`)
    .join('\n');

  const whatsappAllUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal Bhraava Di Hatti! Main aap di website ton eh ${wishlistProducts.length} suit pasand kite han:\n\n${savedListText}\n\nKripa karke daso ehna vicho kehre-kehre suit dukan te available han ji?`
  )}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#32080E] via-amber-950 to-red-950 text-amber-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-amber-400/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <button
              onClick={onBackToShop}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-amber-300/30 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Suit Catalog</span>
            </button>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center text-white shadow-sm border border-amber-300/40">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
                  Saved Suit Designs ({wishlistProducts.length})
                </h1>
                <p className="text-xs text-amber-200/90 font-medium">
                  Send your shortlisted designs on WhatsApp to confirm availability at our Maur Mandi showroom.
                </p>
              </div>
            </div>
          </div>

          {wishlistProducts.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 md:pt-0">
              <a
                href={whatsappAllUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-colors shadow-md flex items-center gap-2 border border-emerald-400/40 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 text-emerald-100 shrink-0" />
                <span>Inquire All ({wishlistProducts.length}) on WhatsApp</span>
              </a>

              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-red-500/50">
                  <span className="text-[11px] text-red-200 font-bold px-2">Clear all?</span>
                  <button
                    onClick={() => {
                      onClearWishlist();
                      setShowClearConfirm(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="bg-stone-700 hover:bg-stone-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="bg-white/10 hover:bg-red-900/50 text-amber-200 hover:text-red-200 font-bold text-xs px-3 py-2.5 rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
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
          <div className="bg-white rounded-xl border border-amber-200 p-3 sm:p-4 flex items-center justify-between gap-4 shadow-2xs flex-wrap">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>You have shortlisted <strong>{wishlistProducts.length}</strong> suit designs</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold">
              <Store className="w-3.5 h-3.5 text-amber-700" />
              <span>Show this list at our shop or send on WhatsApp</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewDetails}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={onToggleWishlist}
                shopPhone={shopPhone}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-amber-300/80 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <Heart className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              No Saved Suit Designs Yet
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              Tap the heart icon on any suit design in our catalog to save it here. You can then send all your favorite designs together on WhatsApp or show them when you visit our shop.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToShop}
              className="bg-[#32080E] hover:bg-amber-950 text-amber-100 font-black text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md border border-amber-400/40 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Browse Suit Catalog</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* Suggested Designs */}
      {recommendedSuits.length > 0 && (
        <div className="pt-6 border-t border-amber-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold font-serif text-stone-900">
              More Designs from Our Showroom
            </h3>
            <button
              onClick={onBackToShop}
              className="text-xs font-bold text-amber-900 hover:text-red-900 hover:underline cursor-pointer"
            >
              View All Designs ➔
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {recommendedSuits.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewDetails}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={onToggleWishlist}
                shopPhone={shopPhone}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
