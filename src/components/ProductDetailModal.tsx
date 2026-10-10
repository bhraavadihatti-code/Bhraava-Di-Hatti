import React, { useState } from 'react';
import { Product } from '../types';
import { 
  X, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Layers,
  ArrowUpDown,
  ArrowLeft,
  Heart,
  MessageCircle,
  Phone,
  Store
} from 'lucide-react';
import fallbackSuitImg from '../assets/images/punjabi_suit_red_1784686277398.jpg';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  shopPhone?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  isWishlisted = false,
  onToggleWishlist,
  shopPhone = '9417124082'
}) => {
  if (!product) return null;

  const allImages = Array.from(
    new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))
  );

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Standard');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Free Size (Unstitched)');

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [scrollMode, setScrollMode] = useState<'slide' | 'vertical'>('slide');

  const savingsAmount = product.originalPrice && product.originalPrice > product.price 
    ? product.originalPrice - product.price 
    : 0;

  const currentImageUrl = allImages[activeImgIdx] || product.imageUrl || fallbackSuitImg;
  const cleanPhone = shopPhone.replace(/[^0-9]/g, '') || '9417124082';

  const whatsappMessage = `Sat Sri Akal Bhraava Di Hatti (Maur Mandi)!\nMainu aap di website ton eh suit pasand aaya hai:\n\n• Suit Name: ${product.name}\n• Design Code: ${product.id}\n• Selected Color: ${selectedColor}\n• Fabric: ${product.fabric}\n• Rate: ₹${product.price}\n\nKripa karke check karke daso eh suit dukan te available hai ji?`;
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleNextImg = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIdx((prev) => (prev + 1) % allImages.length);
    setZoomScale(1);
  };

  const handlePrevImg = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
    setZoomScale(1);
  };

  const toggleZoom = () => {
    setZoomScale((prev) => (prev === 1 ? 1.8 : prev === 1.8 ? 2.5 : 1));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white sm:bg-black/75 sm:backdrop-blur-sm flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 overflow-y-auto">
        <div className="bg-white w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl overflow-y-auto sm:overflow-hidden border-0 sm:border sm:border-amber-300 my-0 sm:my-auto flex flex-col md:flex-row">
          
          {/* Mobile Top Header Bar (< sm) */}
          <div className="sticky top-0 z-30 bg-[#32080E] text-amber-100 px-3.5 py-3 flex items-center justify-between sm:hidden shadow-md border-b border-amber-500/30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-100 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
              <span>Back</span>
            </button>
            <div className="text-center truncate px-2 max-w-[180px]">
              <p className="text-xs font-black font-cinzel text-amber-100 truncate">{product.name}</p>
              <p className="text-[10px] font-mono text-amber-300/80 leading-none">Code: {product.id}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                    isWishlisted
                      ? 'bg-red-500 text-white'
                      : 'bg-black/40 text-amber-300 hover:text-white'
                  }`}
                  title={isWishlisted ? "Remove from Saved Designs" : "Save Design"}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full bg-black/40 text-amber-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Left Side: Photo Gallery Box */}
          <div className="relative md:w-1/2 bg-stone-950 flex flex-col justify-between shrink-0">
            <div 
              className="relative aspect-square sm:aspect-[4/5] md:h-full group cursor-zoom-in overflow-hidden flex items-center justify-center bg-stone-900"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img
                src={currentImageUrl}
                alt={`${product.name} photo ${activeImgIdx + 1}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackSuitImg;
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Close Modal (Desktop) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-3 right-3 bg-stone-900/80 hover:bg-black text-amber-200 p-2 rounded-full shadow-lg backdrop-blur-md transition-colors hidden sm:block border border-amber-500/40 z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Zoom Lightbox Hint */}
              <div className="absolute top-3 left-3 bg-black/65 text-amber-200 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border border-amber-400/30 flex items-center gap-1.5">
                <Maximize2 className="w-3 h-3 text-amber-400" />
                <span>Tap to Zoom ({activeImgIdx + 1}/{allImages.length})</span>
              </div>

              {/* Slider Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImg}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-amber-200 p-2 rounded-full backdrop-blur-md border border-amber-500/40 transition-transform active:scale-90"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-amber-200 p-2 rounded-full backdrop-blur-md border border-amber-500/40 transition-transform active:scale-90"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Bottom Firm Brand & Code */}
              <div className="absolute bottom-3 left-3 bg-[#32080E]/90 border border-amber-500/40 text-amber-200 text-[10px] sm:text-xs px-2.5 py-1 rounded-lg backdrop-blur-md font-mono">
                {product.firmName} · {product.id}
              </div>
            </div>

            {/* Thumbnails Row */}
            {allImages.length > 1 && (
              <div className="bg-stone-900 p-2 border-t border-stone-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest shrink-0 pl-1">
                  Photos ({allImages.length}):
                </span>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImgIdx === idx
                        ? 'border-amber-400 scale-105 shadow-md'
                        : 'border-stone-700 opacity-60 hover:opacity-100 hover:border-amber-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackSuitImg;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Suit Specifications & WhatsApp Stock Inquiry */}
          <div className="p-5 sm:p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
            <div>
              {/* Clean Unboxed Metadata */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                  <span>{product.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-stone-700">Code: {product.id}</span>
                  <span aria-hidden="true">·</span>
                  <span className={product.inStock ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                    {product.inStock ? 'Available at Shop' : 'Sold Out'}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="hidden md:block text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-2 leading-snug">
                {product.name}
              </h2>

              {/* Showroom Price Box */}
              <div className="mt-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-red-950 font-mono tabular-nums">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-stone-400 line-through font-mono tabular-nums">
                      MRP ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {savingsAmount > 0 && (
                    <span className="text-xs font-bold text-emerald-800 ml-auto font-mono">
                      Save ₹{savingsAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-1">
                  Direct Showroom Rate · Wholesale & Retail Set Available
                </p>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mt-3 font-sans">
                {product.description}
              </p>

              {/* Unstitched Cloth Meter Specifications */}
              <div className="mt-3 bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-stone-800 block text-[11px]">
                  Unstitched Suit Cut Specifications
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-stone-700">
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/80">
                    <span className="block font-semibold text-stone-900">Top / Shirt</span>
                    <span className="text-[10px] text-amber-900 font-mono font-bold">2.50 Meters</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/80">
                    <span className="block font-semibold text-stone-900">Bottom / Salwar</span>
                    <span className="text-[10px] text-amber-900 font-mono font-bold">2.50 - 3.00 M</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-stone-200/80">
                    <span className="block font-semibold text-stone-900">Dupatta</span>
                    <span className="text-[10px] text-amber-900 font-mono font-bold">2.25 Meters</span>
                  </div>
                </div>
              </div>

              {/* Fabric & Work Type */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <p className="text-stone-400 text-[10px] uppercase font-bold">Fabric Material</p>
                  <p className="font-bold text-stone-800">{product.fabric}</p>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <p className="text-stone-400 text-[10px] uppercase font-bold">Work / Design</p>
                  <p className="font-bold text-stone-800">{product.workType}</p>
                </div>
              </div>

              {/* Color Selection for Inquiry */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-1.5">
                    Select Color to Inquire: <span className="text-amber-900 font-extrabold">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedColor === c
                            ? 'bg-[#32080E] text-amber-200 border-amber-900 shadow-xs'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stitching / Size Type */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-3">
                  <label className="text-xs font-bold text-stone-800 block mb-1.5">
                    Suit Type: <span className="text-amber-900">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedSize === s
                            ? 'bg-[#32080E] text-amber-200 border-amber-900'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wholesale Limited Set Notice */}
              <div className="mt-4 bg-amber-50/90 border border-amber-200/90 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                <Store className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Limited Set Notice:</strong> ਸਾਡੀ ਦੁਕਾਨ 'ਤੇ ਹਰ ਡਿਜ਼ਾਈਨ ਦੇ ਸਿਰਫ਼ 1 ਜਾਂ 2 ਸੈੱਟ ਹੀ ਆਉਂਦੇ ਹਨ। ਹੇਠਾਂ WhatsApp ਬਟਨ ਦਬਾ ਕੇ ਪੁੱਛੋ ਕਿ ਇਹ ਸੂਟ ਦੁਕਾਨ 'ਤੇ ਮੌਜੂਦ ਹੈ ਜਾਂ ਨਹੀਂ।
                </p>
              </div>
            </div>

            {/* Bottom Inquiry & Save Actions */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md"
              >
                <MessageCircle className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Check Stock on WhatsApp ({shopPhone})</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${shopPhone}`}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2.5 px-3 rounded-xl border border-amber-300 transition-colors flex items-center justify-center gap-1.5 text-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-900" />
                  <span>Call Showroom</span>
                </a>

                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isWishlisted
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-600 text-red-600' : 'text-stone-600'}`} />
                    <span>{isWishlisted ? 'Saved Design' : 'Save Design'}</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-stone-500 text-center flex items-center justify-center gap-1 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>100% Pure Fabric Guarantee · Bhraava Di Hatti, Maur Mandi</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX ZOOM & VERTICAL SCROLL GALLERY MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
          <div className="bg-stone-900/90 border-b border-stone-800 p-3 px-4 flex items-center justify-between text-white shrink-0 z-10">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-amber-300 text-xs sm:text-sm">
                {product.name}
              </span>
              <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono border border-amber-700">
                {activeImgIdx + 1} / {allImages.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setScrollMode(scrollMode === 'slide' ? 'vertical' : 'slide')}
                className="flex items-center gap-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-amber-500/40 cursor-pointer"
                title="Toggle Vertical Scroll vs Slide Mode"
              >
                {scrollMode === 'slide' ? (
                  <>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Vertical Scroll View</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Slide Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setZoomScale((z) => Math.min(3, z + 0.4))}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded-lg border border-stone-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={() => setZoomScale((z) => Math.max(1, z - 0.4))}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded-lg border border-stone-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {zoomScale !== 1 && (
                <button
                  onClick={() => setZoomScale(1)}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded-lg border border-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">1x</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomScale(1);
                }}
                className="p-1.5 bg-red-950 hover:bg-red-900 text-white rounded-xl border border-red-700/60 ml-2 cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex flex-col items-center justify-center relative select-none">
            {scrollMode === 'slide' ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={currentImageUrl}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackSuitImg;
                  }}
                  onClick={toggleZoom}
                  style={{ transform: `scale(${zoomScale})` }}
                  className="max-w-full max-h-[82vh] object-contain transition-transform duration-200 cursor-zoom-in"
                />

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-stone-900/90 hover:bg-black text-amber-300 p-3 rounded-full border border-amber-500/50 shadow-2xl transition-transform active:scale-90 cursor-pointer"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-stone-900/90 hover:bg-black text-amber-300 p-3 rounded-full border border-amber-500/50 shadow-2xl transition-transform active:scale-90 cursor-pointer"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full max-w-2xl space-y-6 my-auto overflow-y-auto py-4">
                <div className="text-center text-xs text-amber-400/80 font-mono mb-2">
                  Scroll up & down to view all {allImages.length} high-resolution photos
                </div>
                {allImages.map((imgUrl, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-black">
                    <img
                      src={imgUrl || fallbackSuitImg}
                      alt={`Full photo ${i + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackSuitImg;
                      }}
                      className="w-full h-auto object-contain max-h-[85vh]"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 text-amber-300 text-xs px-2.5 py-1 rounded-full font-mono border border-amber-500/30">
                      Photo #{i + 1} of {allImages.length}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {allImages.length > 1 && scrollMode === 'slide' && (
            <div className="bg-stone-900/90 border-t border-stone-800 p-2 sm:p-3 flex items-center justify-center gap-2 overflow-x-auto shrink-0">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImgIdx(idx);
                    setZoomScale(1);
                  }}
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImgIdx === idx
                      ? 'border-amber-400 scale-110 shadow-lg'
                      : 'border-stone-700 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img || fallbackSuitImg}
                    alt={`Thumb ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackSuitImg;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
