import React from 'react';
import { ProductCategory } from '../types';
import { Filter, ArrowUpDown, X, Tag, Sparkles, Check, Search } from 'lucide-react';

export type PriceFilterOption = 'all' | 'under1500' | '1500to3000' | '3000to5000' | 'above5000';
export type SortOption = 'featured' | 'priceAsc' | 'priceDesc' | 'discount';

interface CategoryAndPriceFilterProps {
  categories: ProductCategory[];
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  priceFilter: PriceFilterOption;
  onSelectPriceFilter: (p: PriceFilterOption) => void;
  sortBy: SortOption;
  onSelectSortBy: (s: SortOption) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalResults: number;
}

export const CategoryAndPriceFilter: React.FC<CategoryAndPriceFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  priceFilter,
  onSelectPriceFilter,
  sortBy,
  onSelectSortBy,
  searchQuery,
  onSearchChange,
  totalResults
}) => {

  const priceOptions: { id: PriceFilterOption; label: string; rangeText: string }[] = [
    { id: 'all', label: 'All Prices', rangeText: 'Any Budget' },
    { id: 'under1500', label: 'Under ₹1,500', rangeText: 'Budget Friendly' },
    { id: '1500to3000', label: '₹1,500 - ₹3,000', rangeText: 'Most Popular' },
    { id: '3000to5000', label: '₹3,000 - ₹5,000', rangeText: 'Premium Collection' },
    { id: 'above5000', label: 'Above ₹5,000', rangeText: 'Heavy Festive Wear' },
  ];

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'featured', label: 'Featured / Popular' },
    { id: 'priceAsc', label: 'Price: Low to High (₹)' },
    { id: 'priceDesc', label: 'Price: High to Low (₹)' },
    { id: 'discount', label: 'Maximum Discount (% Save)' },
  ];

  const hasActiveFilters = selectedCategory !== 'All' || priceFilter !== 'all' || searchQuery.trim() !== '' || sortBy !== 'featured';

  const resetAllFilters = () => {
    onSelectCategory('All');
    onSelectPriceFilter('all');
    onSelectSortBy('featured');
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-200/80 p-4 sm:p-5 shadow-sm space-y-4">
      
      {/* Mobile Search Bar inside Filters for instant access */}
      <div className="relative md:hidden">
        <input
          type="text"
          placeholder="🔍 Search Punjabi suit, fabric, saree..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50 border border-amber-300 rounded-2xl pl-10 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-700 shadow-inner"
        />
        <Search className="w-4 h-4 text-amber-800 absolute left-3.5 top-3" />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* 1. Category Tabs Section (Horizontal Scrollable Pills for Mobile) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-800" />
            1. Select Clothing Category:
          </label>
          <span className="text-[11px] text-amber-900 font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
            {selectedCategory === 'All' ? 'All Items' : selectedCategory}
          </span>
        </div>

        {/* Scrollable Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x touch-pan-x">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`snap-start px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-amber-900 text-amber-5 border-2 border-amber-700 ring-2 ring-amber-300 scale-102 shadow-md'
                    : 'bg-amber-50/80 text-gray-800 hover:bg-amber-100 border border-amber-200'
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
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-300 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Price Range Filter Section (Mobile Friendly Chips) */}
      <div className="space-y-2 pt-2 border-t border-amber-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-800" />
            2. Price Range Filter (Budget):
          </label>
          {priceFilter !== 'all' && (
            <button
              onClick={() => onSelectPriceFilter('all')}
              className="text-[11px] font-bold text-red-700 hover:underline"
            >
              Reset Price
            </button>
          )}
        </div>

        {/* Scrollable Price Range Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x touch-pan-x">
          {priceOptions.map((opt) => {
            const isSelected = priceFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectPriceFilter(opt.id)}
                className={`snap-start px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex flex-col items-center ${
                  isSelected
                    ? 'bg-red-900 text-white border-red-950 ring-2 ring-amber-400 shadow-md'
                    : 'bg-slate-50 text-gray-700 hover:bg-amber-50 border-gray-300'
                }`}
              >
                <span className="font-mono">{opt.label}</span>
                <span className={`text-[9px] font-normal ${isSelected ? 'text-amber-200' : 'text-gray-500'}`}>
                  {opt.rangeText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sort Options & Active Summary */}
      <div className="pt-2 border-t border-amber-100 flex flex-wrap items-center justify-between gap-3">
        
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-amber-800 shrink-0" />
          <span className="text-xs font-bold text-gray-700 shrink-0">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => onSelectSortBy(e.target.value as SortOption)}
            className="flex-1 sm:w-56 bg-slate-50 border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-amber-700 shadow-2xs"
          >
            {sortOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Total Results & Clear Filters Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-xs text-amber-950 font-bold bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-xl">
            Found <strong className="font-mono text-red-900 text-sm">{totalResults}</strong> Items
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-red-700 hover:text-red-900 font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
