import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Phone, 
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Tag,
  Check,
  Heart,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { ProductCategory, ShopSettings } from '../types';
import { PriceFilterOption } from './CategoryAndPriceFilter';

interface NavbarProps {
  settings: ShopSettings;
  categories: ProductCategory[];
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  priceFilter: PriceFilterOption;
  onSelectPriceFilter: (p: PriceFilterOption) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAdmin: () => void;
  activeView: 'shop' | 'admin' | 'wishlist';
  setActiveView: (view: 'shop' | 'admin' | 'wishlist') => void;
  wishlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  categories,
  selectedCategory,
  onSelectCategory,
  priceFilter,
  onSelectPriceFilter,
  searchQuery,
  onSearchChange,
  onOpenAdmin,
  activeView,
  setActiveView,
  wishlistCount
}) => {
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [unlockToast, setUnlockToast] = useState(false);

  const cleanPhone = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const whatsappLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal ${settings.shopName}! I saw your suit catalog website and want to inquire about available designs.`
  )}`;

  // 5-Click Secret Trigger on "Estd. 1986" Badge to open Admin Panel
  const handleEstdClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (clickTimer) clearTimeout(clickTimer);

    if (newCount >= 5) {
      setLogoClickCount(0);
      setUnlockToast(true);
      setActiveView('admin');
      onOpenAdmin();
      setTimeout(() => setUnlockToast(false), 5000);
    } else {
      const timer = setTimeout(() => {
        setLogoClickCount(0);
      }, 2500);
      setClickTimer(timer);
    }
  };

  const priceOptions: { id: PriceFilterOption; label: string; badge: string }[] = [
    { id: 'all', label: 'All Price Ranges', badge: 'Full Catalog' },
    { id: 'under1500', label: 'Under ₹1,500', badge: 'Daily & Cotton' },
    { id: '1500to3000', label: '₹1,500 - ₹3,000', badge: 'Boutique Sets' },
    { id: '3000to5000', label: '₹3,000 - ₹5,000', badge: 'Partywear' },
    { id: 'above5000', label: 'Above ₹5,000', badge: 'Bridal & Heavy' },
  ];

  const getActivePriceLabel = () => {
    switch (priceFilter) {
      case 'under1500': return 'Under ₹1.5k';
      case '1500to3000': return '₹1.5k - ₹3k';
      case '3000to5000': return '₹3k - ₹5k';
      case 'above5000': return 'Above ₹5k';
      default: return 'Price Range';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-amber-200/80">
      {/* Top Showroom Notice Bar */}
      <div className="bg-gradient-to-r from-[#32080E] via-red-950 to-amber-950 text-amber-50 px-3 py-1.5 text-xs font-medium border-b border-amber-800/60">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-amber-300 font-semibold text-[11px] sm:text-xs shrink-0">
              Wholesale & Retail Showroom · {settings.city}
            </span>
            <span className="hidden md:inline text-amber-400/60">·</span>
            <span className="hidden md:inline truncate text-[11px] text-amber-100/90">
              Har design de limited 1–2 sets — WhatsApp te stock check karo ja dukan te visit karo
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-normal text-amber-200 shrink-0">
            <a
              href={`tel:${settings.phoneNumber}`}
              className="flex items-center gap-1 font-mono text-[11px] hover:text-amber-300 transition-colors bg-white/10 px-2.5 py-0.5 rounded-md border border-amber-400/20 whitespace-nowrap"
            >
              <Phone className="w-3 h-3 text-amber-300" />
              <span className="font-bold">{settings.phoneNumber}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Brand & Showroom Navigation */}
      <div className="container mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Name */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative group text-left">
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                <button 
                  onClick={() => {
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-stone-900 font-serif leading-none hover:text-amber-900 transition-colors cursor-pointer text-left whitespace-nowrap"
                >
                  {settings.shopName}
                </button>
                <button
                  onClick={handleEstdClick}
                  className="text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-800 to-red-900 active:scale-95 text-amber-100 font-black px-1.5 py-0.5 rounded-md border border-amber-400/80 shadow-2xs font-mono shrink-0 cursor-pointer select-none transition-transform whitespace-nowrap"
                  title="Estd. 1986 (Tap 5 times rapidly to open Admin)"
                >
                  Estd. 1986
                </button>
              </div>
              <p 
                onClick={() => {
                  setActiveView('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-extrabold text-amber-900 flex items-center gap-1 mt-0.5 whitespace-nowrap cursor-pointer hover:text-amber-950"
              >
                <span>{settings.firmName}</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-600 font-semibold">Wholesale & Retail</span>
              </p>
            </div>
            {logoClickCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full font-black font-mono">
                {logoClickCount}/5
              </span>
            )}
          </div>

          {/* Right Actions: Saved Designs, Showroom Location & WhatsApp Inquiry */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Saved Designs / Wishlist Button */}
            <button
              onClick={() => {
                setActiveView('wishlist');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black rounded-xl border transition-all shadow-2xs shrink-0 cursor-pointer whitespace-nowrap ${
                activeView === 'wishlist'
                  ? 'bg-red-950 text-amber-200 border-red-500 shadow-sm'
                  : 'text-stone-800 bg-white hover:bg-red-50 hover:text-red-700 border-amber-300/90'
              }`}
              title="View Saved Suit Designs"
            >
              <Heart className={`w-3.5 h-3.5 shrink-0 ${
                activeView === 'wishlist' || wishlistCount > 0 ? 'fill-red-600 text-red-600' : 'text-amber-800'
              }`} />
              <span className="hidden sm:inline">Saved Designs</span>
              <span className="sm:hidden text-[10px]">Saved</span>
              {wishlistCount > 0 && (
                <span className="bg-red-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Visit Showroom / Location Button */}
            <button
              onClick={() => {
                setActiveView('shop');
                setTimeout(() => {
                  const el = document.getElementById('showroom-visit-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black text-amber-950 bg-amber-100/90 hover:bg-amber-200 rounded-xl border border-amber-300 transition-colors shadow-2xs shrink-0 cursor-pointer whitespace-nowrap"
              title="Showroom Address & Timings"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span className="hidden sm:inline">Visit Shop</span>
              <span className="sm:hidden text-[10px]">Shop Info</span>
            </button>

            {/* Direct WhatsApp Inquiry CTA */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs transition-colors shadow-sm border border-emerald-500/40 shrink-0 whitespace-nowrap"
              title="Inquire on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="hidden sm:inline">WhatsApp Inquiry</span>
              <span className="sm:hidden text-[10px]">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* ROW 2: Search Bar with Price Filter Side-by-Side */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search Suit Design, Fabric, Cotton, Chinon Silk, Code (e.g. BDH-101)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-stone-50/90 border border-amber-300 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-amber-800 absolute left-2.5 top-2" />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')} 
                className="absolute right-2 top-1.5 text-xs text-stone-400 hover:text-stone-700 font-bold p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="relative shrink-0">
            <button
              onClick={() => setPricePopoverOpen(!pricePopoverOpen)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all whitespace-nowrap cursor-pointer ${
                priceFilter !== 'all'
                  ? 'bg-[#32080E] text-amber-200 border-amber-600 shadow-sm'
                  : 'bg-amber-50/80 text-amber-950 border-amber-300 hover:bg-amber-100'
              }`}
              title="Filter by Price Range"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>{getActivePriceLabel()}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {pricePopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-amber-300 p-3 z-50">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2">
                  <span className="text-xs font-black text-amber-950">
                    Filter by Price Range
                  </span>
                  <button
                    onClick={() => setPricePopoverOpen(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  {priceOptions.map((opt) => {
                    const isSelected = priceFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSelectPriceFilter(opt.id);
                          setPricePopoverOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#32080E] text-amber-200'
                            : 'hover:bg-amber-50 text-stone-800'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                        ) : (
                          <span className="text-[10px] text-amber-900/60 font-normal">{opt.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {priceFilter !== 'all' && (
                  <button
                    onClick={() => {
                      onSelectPriceFilter('all');
                      setPricePopoverOpen(false);
                    }}
                    className="w-full mt-2 pt-2 border-t border-amber-100 text-[11px] text-red-800 font-extrabold text-center hover:underline"
                  >
                    Reset Price Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Saved Designs Breadcrumb Strip */}
        {activeView === 'wishlist' && (
          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setActiveView('shop')}
              className="text-xs font-black text-amber-950 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>← Back to Suit Catalog</span>
            </button>
            <span className="text-xs font-bold text-red-950 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              <span>Saved Designs ({wishlistCount})</span>
            </span>
          </div>
        )}

        {/* Category Filter Bar */}
        {activeView === 'shop' && (
          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x touch-pan-x">
            <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider px-2 py-0.5 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-800" /> Variety:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    const el = document.getElementById('catalog-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`snap-start px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#32080E] text-amber-200 shadow-xs border border-amber-500/60'
                      : 'bg-white text-stone-800 hover:bg-amber-50 border border-amber-200/80'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Secret Admin Unlock Notification Toast */}
      {unlockToast && (
        <div className="fixed bottom-6 right-6 bg-amber-950 text-amber-100 border-2 border-amber-400 px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-black text-amber-300">Admin Panel Unlocked</p>
            <p className="text-[10px] text-amber-200">Opening Catalog Manager...</p>
          </div>
        </div>
      )}
    </header>
  );
};
