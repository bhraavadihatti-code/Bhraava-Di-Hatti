import React from 'react';
import { Phone, MapPin, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Product, ProductCategory, ShopSettings } from '../types';
import heroBannerImg from '../assets/images/hero_cloth_banner_1784686263964.jpg';
import punjabiSuitImg from '../assets/images/punjabi_suit_red_1784686277398.jpg';
import farshiSuitImg from '../assets/images/ruaab_farshi_suit_1784952010247.jpg';
import ruaabSuitColorsImg from '../assets/images/ruaab_suit_colors_1784952025641.jpg';
import { formatImageUrl } from '../lib/imageUtils';

interface HeroBannerProps {
  settings: ShopSettings;
  onExploreCatalog: () => void;
  selectedCategory?: ProductCategory;
  onSelectCategory?: (category: ProductCategory) => void;
  products?: Product[];
}

interface CollectionTile {
  id: string;
  category: string;
  title: string;
  punjabiTitle: string;
  subtitle: string;
  fallbackImage: string;
  matchKeywords: string[];
}

const COLLECTION_TILES: CollectionTile[] = [
  {
    id: 'punjabi',
    category: 'Punjabi Suit',
    title: 'Punjabi & Partywear',
    punjabiTitle: 'ਪੰਜਾਬੀ ਅਤੇ ਪਾਰਟੀਵੀਅਰ ਸੂਟ',
    subtitle: 'Heavy Zari, Handwork & Boutique Sets',
    fallbackImage: punjabiSuitImg,
    matchKeywords: ['punjabi suit', 'partywear', 'bridal']
  },
  {
    id: 'farshi',
    category: 'Farshi Suit',
    title: 'Farshi Salwar Suits',
    punjabiTitle: 'ਫਰਸ਼ੀ ਸਲਵਾਰ ਸੂਟ',
    subtitle: 'Trending Digital Print & Heavy Borders',
    fallbackImage: farshiSuitImg,
    matchKeywords: ['farshi suit', 'farshi']
  },
  {
    id: 'cotton',
    category: 'Cotton Suit',
    title: 'Pure Cotton & All-Over',
    punjabiTitle: 'ਪਿਓਰ ਕਾਟਨ ਅਤੇ 5m ਆਲ-ਓਵਰ',
    subtitle: '5m All-Over, 3.5m & Summer Varieties',
    fallbackImage: ruaabSuitColorsImg,
    matchKeywords: ['cotton suit', 'cotton', 'ak tax', 'shiva']
  },
  {
    id: 'dupatta',
    category: 'Dupatta Suit',
    title: 'Dupatta & Branded Sets',
    punjabiTitle: 'ਦੁਪੱਟਾ ਸੂਟ ਅਤੇ ਬ੍ਰਾਂਡਡ ਵੈਰਾਇਟੀ',
    subtitle: '2.25m Pure Dupatta, AK Tax & Om Creation',
    fallbackImage: heroBannerImg,
    matchKeywords: ['dupatta suit', 'om creation', 'trousers']
  }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  onExploreCatalog,
  selectedCategory = 'All',
  onSelectCategory,
  products = []
}) => {
  const cleanPhone = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal ${settings.shopName}! I am browsing your online catalog and want to check suit availability.`
  )}`;
  const mapsUrl = settings.mapsUrl || 'https://maps.app.goo.gl/A2QC78d9DyRc3eRD6?g_st=ac';

  // Pick a live showroom product image for a tile if one matches and has a valid photo, otherwise use crisp fallback
  const getTileImage = (tile: CollectionTile): string => {
    const matched = products.find((p) => {
      if (!p.imageUrl) return false;
      const hay = `${p.category || ''} ${(p.tags || []).join(' ')} ${p.name || ''}`.toLowerCase();
      return tile.matchKeywords.some((kw) => hay.includes(kw));
    });
    if (matched && matched.imageUrl) {
      return formatImageUrl(matched.imageUrl);
    }
    return tile.fallbackImage;
  };

  const handleTileClick = (category: string) => {
    if (onSelectCategory) {
      if (selectedCategory.toLowerCase() === category.toLowerCase()) {
        onSelectCategory('All');
      } else {
        onSelectCategory(category);
      }
    }
    onExploreCatalog();
  };

  return (
    <section className="my-2.5 sm:my-4 space-y-3">
      {/* Slim Royal Showroom Info & Quick Action Bar */}
      <div className="bg-gradient-to-r from-[#2B040B] via-[#460914] to-[#2B040B] text-amber-50 rounded-2xl border border-amber-400/50 shadow-md px-3.5 py-2.5 sm:px-5 sm:py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-amber-300 font-semibold">
              <span>{settings.firmName}</span>
              <span aria-hidden="true">·</span>
              <span>Estd. 1986</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-200">{settings.address}, Maur Mandi</span>
            </div>
            <h1 className="text-sm sm:text-lg font-bold font-serif text-amber-100 truncate mt-0.5">
              {settings.shopName} — Unstitched Suits & Boutique Collection
            </h1>
          </div>
        </div>

        {/* Direct Showroom Quick Buttons */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 shrink-0">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-950 shrink-0" />
            <span>Shop Map</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
            <span>WhatsApp</span>
          </a>

          <a
            href={`tel:${settings.phoneNumber}`}
            className="bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-400/35 font-bold px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Call Shop</span>
          </a>
        </div>
      </div>

      {/* Stylish Visual Category Tiles (Boutique Photo Cards) */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span className="text-xs sm:text-sm font-bold font-serif text-stone-800">
              Shop by Suit Variety (ਵੈਰਾਇਟੀ ਚੁਣੋ)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('All');
              onExploreCatalog();
            }}
            className="text-[11px] sm:text-xs font-bold text-amber-900 hover:text-red-900 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{selectedCategory !== 'All' ? 'Show All Suits' : 'View Full Catalog'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {COLLECTION_TILES.map((tile) => {
            const isSelected = selectedCategory.trim().toLowerCase() === tile.category.toLowerCase();
            const imgSrc = getTileImage(tile);

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(tile.category)}
                className={`group relative text-left rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer aspect-[4/3] sm:aspect-[16/11] flex flex-col justify-end shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'border-amber-600 ring-2 ring-amber-500/70 scale-[0.99]'
                    : 'border-amber-200/90 hover:border-amber-400'
                }`}
              >
                {/* Clear Bright Suit Photo */}
                <img
                  src={imgSrc}
                  alt={tile.title}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = tile.fallbackImage;
                  }}
                />

                {/* Smooth Bottom Gradient for Crisp Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Selected Active Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                    Selected ✓
                  </div>
                )}

                {/* Tile Caption */}
                <div className="relative z-10 p-2.5 sm:p-3.5 w-full">
                  <p className="text-[10px] sm:text-[11px] font-medium text-amber-300 leading-tight truncate">
                    {tile.punjabiTitle}
                  </p>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <h3 className="text-xs sm:text-base font-bold font-serif text-white leading-snug truncate">
                      {tile.title}
                    </h3>
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400/95 text-amber-950 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                  </div>
                  <p className="hidden sm:block text-[11px] text-amber-100/85 truncate mt-0.5">
                    {tile.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
