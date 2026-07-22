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
  CheckCircle2, 
  Sparkles,
  Home,
  Grid,
  ClipboardList
} from 'lucide-react';
import { ProductCategory, ShopSettings } from '../types';

interface NavbarProps {
  settings: ShopSettings;
  categories: ProductCategory[];
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-amber-100">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-700 via-red-800 to-amber-900 text-amber-50 px-4 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
              UPI Special
            </span>
            <span className="truncate">{settings.noticeText}</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-normal text-amber-200 shrink-0">
            <span className="flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-amber-300" /> UPI / QR Payments Only
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-300" /> {settings.phoneNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Main Brand & Controls Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => { setActiveView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="cursor-pointer group flex items-center gap-3 shrink-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-800 via-amber-700 to-amber-900 text-amber-100 flex items-center justify-center font-serif text-xl sm:text-2xl font-bold shadow-md shadow-amber-900/10 group-hover:scale-105 transition-transform border border-amber-400/30">
              भ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 font-serif leading-tight">
                  {settings.shopName}
                </h1>
                <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase hidden sm:inline-block">
                  Verified Shop
                </span>
              </div>
              <p className="text-xs font-medium text-amber-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600 inline" />
                {settings.firmName}
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search Punjabi Suits, Banarasi Sarees, Kurtas..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-amber-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-amber-700 absolute left-3.5 top-2.5" />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')} 
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Track Order Button */}
            <button
              onClick={onOpenTracker}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
              title="Track Order Status"
            >
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Track Order</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2 sm:px-3 sm:py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 sm:mr-1.5" />
              <span className="hidden sm:inline">Bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-red-950 font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Panel Button */}
            <button
              onClick={() => {
                setActiveView('admin');
                onOpenAdmin();
              }}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                activeView === 'admin'
                  ? 'bg-amber-900 text-amber-100 border-amber-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4 text-amber-600" />
              <span className="hidden lg:inline">Admin Panel</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-red-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingOrdersCount} new
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Punjabi Suits, Sarees, Kurtas..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-amber-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
            <Search className="w-4 h-4 text-amber-700 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Category Horizontal Scrolling Bar */}
        {activeView === 'shop' && (
          <div className="mt-3 pt-2 border-t border-amber-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-800 text-white font-semibold shadow-sm scale-105'
                      : 'bg-amber-50/70 text-gray-700 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-amber-950 text-amber-50 px-4 py-4 border-t border-amber-800 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Navigation Menu
          </div>
          <button
            onClick={() => {
              setActiveView('shop');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 py-2 text-sm font-medium hover:text-amber-300 border-b border-amber-900"
          >
            <Home className="w-4 h-4 text-amber-400" />
            Shop Catalog
          </button>
          <button
            onClick={() => {
              onOpenTracker();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 py-2 text-sm font-medium hover:text-amber-300 border-b border-amber-900"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            Track Order Status
          </button>
          <button
            onClick={() => {
              setActiveView('admin');
              onOpenAdmin();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between py-2 text-sm font-medium hover:text-amber-300 border-b border-amber-900"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              Admin Portal (Shop Owner)
            </div>
            {pendingOrdersCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingOrdersCount} New Orders
              </span>
            )}
          </button>
          
          <div className="pt-2 text-xs text-amber-300/80 space-y-1">
            <p>📍 {settings.address}, {settings.city}</p>
            <p>📞 UPI Payments Verified via Phone / UTR</p>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-amber-200 z-50 flex items-center justify-around py-2 shadow-lg">
        <button
          onClick={() => { setActiveView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 text-[11px] ${activeView === 'shop' ? 'text-amber-800 font-bold' : 'text-gray-500'}`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={onOpenTracker}
          className="flex flex-col items-center gap-1 text-[11px] text-gray-500 hover:text-amber-800"
        >
          <Truck className="w-5 h-5" />
          <span>Track</span>
        </button>

        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center gap-1 text-[11px] text-gray-500 hover:text-amber-800"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveView('admin'); onOpenAdmin(); }}
          className={`relative flex flex-col items-center gap-1 text-[11px] ${activeView === 'admin' ? 'text-amber-800 font-bold' : 'text-gray-500'}`}
        >
          <Store className="w-5 h-5" />
          <span>Admin</span>
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-1 right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
