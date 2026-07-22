import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Truck, 
  ShieldCheck, 
  QrCode, 
  Store, 
  Menu, 
  X, 
  Phone, 
  Sparkles,
  Home,
  SlidersHorizontal,
  ChevronDown,
  Tag,
  Check
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
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  pendingOrdersCount: number;
  activeView: 'shop' | 'admin';
  setActiveView: (view: 'shop' | 'admin') => void;
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
  cartCount,
  onOpenCart,
  onOpenTracker,
  onOpenAdmin,
  pendingOrdersCount,
  activeView,
  setActiveView
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [unlockToast, setUnlockToast] = useState(false);

  // 5-Click Secret Trigger on "Estd. 1986" Badge to open Admin App
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
    { id: 'all', label: 'All Prices', badge: 'Any Budget' },
    { id: 'under1500', label: 'Under ₹1,500', badge: 'Budget Suits' },
    { id: '1500to3000', label: '₹1,500 - ₹3,000', badge: 'Most Popular' },
    { id: '3000to5000', label: '₹3,000 - ₹5,000', badge: 'Premium Suits' },
    { id: 'above5000', label: 'Above ₹5,000', badge: 'Heavy Festive' },
  ];

  const getActivePriceLabel = () => {
    switch (priceFilter) {
      case 'under1500': return 'Under ₹1.5k';
      case '1500to3000': return '₹1.5k - ₹3k';
      case '3000to5000': return '₹3k - ₹5k';
      case 'above5000': return 'Above ₹5k';
      default: return 'Price Filter';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-amber-200/80">
      {/* Secret Unlock Toast Notification */}
      {unlockToast && (
        <div className="bg-[#32080E] text-amber-100 text-center py-2 px-4 font-extrabold text-xs shadow-md border-b border-amber-500 animate-bounce flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>🔓 Secret BDH Admin Unlocked! Managing Order Tickets & Post Shipments.</span>
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-[#32080E] via-red-950 to-amber-950 text-amber-50 px-3 py-1.5 text-xs font-medium border-b border-amber-800/60 shadow-inner">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider hidden sm:inline-flex items-center gap-1 shrink-0">
              <span>🇮🇳</span> India Post Delivery
            </span>
            <span className="truncate text-[11px] sm:text-xs font-semibold text-amber-100">{settings.noticeText}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-normal text-amber-200 shrink-0">
            <a href={`tel:${settings.phoneNumber}`} className="flex items-center gap-1 font-mono text-[11px] hover:text-amber-300 transition-colors bg-white/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              <Phone className="w-3 h-3 text-amber-300" />
              <span className="font-bold">{settings.phoneNumber}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Brand & Compact Controls Header */}
      <div className="container mx-auto px-3 sm:px-4 py-2.5">
        
        {/* ROW 1: Brand Name on Left, Cart, My Orders & Admin on Right */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Name */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative group text-left">
              <div className="block">
                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                  <button 
                    onClick={() => {
                      setActiveView('shop');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-stone-900 font-serif leading-none hover:text-amber-900 transition-colors cursor-pointer text-left"
                  >
                    {settings.shopName}
                  </button>
                  <button
                    onClick={handleEstdClick}
                    className="text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-800 to-red-900 active:scale-95 text-amber-100 font-black px-1.5 py-0.5 rounded-md border border-amber-400/80 shadow-2xs font-mono shrink-0 cursor-pointer select-none transition-transform"
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
                  className="text-[10px] sm:text-xs font-extrabold text-amber-900 flex items-center gap-0.5 mt-0.5 whitespace-nowrap cursor-pointer hover:text-amber-950"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                  <span>{settings.firmName}</span>
                </p>
              </div>
            </div>
            {logoClickCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full font-black animate-pulse shadow-sm border border-amber-600">
                {logoClickCount}/5
              </span>
            )}
          </div>

          {/* Header Action Buttons (Top Right: My Orders & Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* My Orders / Track Order Button */}
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black text-amber-950 bg-amber-100/90 hover:bg-amber-200 rounded-xl border border-amber-300 transition-colors shadow-2xs"
              title="Track Order Status"
            >
              <Truck className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden sm:inline">My Orders</span>
              <span className="sm:hidden text-[11px]">Orders</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#32080E] hover:bg-amber-950 text-amber-100 rounded-xl font-black text-xs transition-colors shadow-sm border border-amber-500/40"
              title="View Cart Bag"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* ROW 2: Search Bar with Price Filter Side-by-Side */}
        <div className="mt-2.5 flex items-center gap-2">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search Suits, Sarees, Kurtas, Fabrics..."
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

          {/* Price Filter Button Side-by-Side */}
          <div className="relative shrink-0">
            <button
              onClick={() => setPricePopoverOpen(!pricePopoverOpen)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                priceFilter !== 'all'
                  ? 'bg-[#32080E] text-amber-200 border-amber-600 shadow-sm'
                  : 'bg-amber-50/80 text-amber-950 border-amber-300 hover:bg-amber-100'
              }`}
              title="Filter by Price Range"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span className="whitespace-nowrap">{getActivePriceLabel()}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Price Filter Dropdown / Popover Modal */}
            {pricePopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-amber-300 p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    💰 Filter by Price:
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

        {/* Category Horizontal Bar */}
        {activeView === 'shop' && (
          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x touch-pan-x">
            <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-800" /> Fabric:
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
                  className={`snap-start px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#32080E] text-amber-200 shadow-xs border border-amber-500/60'
                      : 'bg-white text-stone-800 hover:bg-amber-50 border border-amber-200/80'
                  }`}
                >
                  {cat === 'All' && <span>🛍️</span>}
                  {cat === 'Punjabi Suits' && <span>🥻</span>}
                  {cat === 'Banarasi Sarees' && <span>✨</span>}
                  {cat === 'Lehengas' && <span>👑</span>}
                  {cat === 'Men Kurtas' && <span>👔</span>}
                  {cat === 'Dress Materials' && <span>🧵</span>}
                  {cat === 'Dupattas & Shawls' && <span>🧣</span>}
                  {cat === 'Festive Collection' && <span>🎆</span>}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Secret Admin Unlock Notification Toast */}
      {unlockToast && (
        <div className="fixed bottom-6 right-6 bg-amber-950 text-amber-100 border-2 border-amber-400 px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 animate-bounce">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-black text-amber-300">🔒 Secret Admin Unlocked!</p>
            <p className="text-[10px] text-amber-200">Opening Admin Security PIN Panel...</p>
          </div>
        </div>
      )}
    </header>
  );
};

