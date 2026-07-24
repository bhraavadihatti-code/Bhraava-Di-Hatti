import React, { useState } from 'react';
import { Product } from '../types';
import { 
  X, 
  ShoppingBag, 
  ShieldCheck, 
  QrCode, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Layers,
  ArrowUpDown,
  ArrowLeft
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, color: string, size: string, quantity: number) => void;
  onBuyNow: (product: Product, color: string, size: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow
}) => {
  if (!product) return null;

  // Gather unique product photos (4-5 photos if available)
  const allImages = Array.from(
    new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))
  );

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Standard');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Free Size (Unstitched)');
  const [quantity, setQuantity] = useState(1);

  // Fullscreen Zoom Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [scrollMode, setScrollMode] = useState<'slide' | 'vertical'>('slide');

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const savingsAmount = product.originalPrice && product.originalPrice > product.price 
    ? product.originalPrice - product.price 
    : 0;

  const currentImageUrl = allImages[activeImgIdx] || product.imageUrl;

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
      {/* Main Product Detail Container - Full Page on Mobile (< sm), Centered Modal on Desktop (>= sm) */}
      <div className="fixed inset-0 z-50 bg-white sm:bg-black/75 sm:backdrop-blur-sm flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 overflow-y-auto">
        <div className="bg-white w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl overflow-y-auto sm:overflow-hidden border-0 sm:border-2 sm:border-amber-300 my-0 sm:my-auto flex flex-col md:flex-row">
          
          {/* Mobile Top Navigation Header Bar (Visible on phone < sm) */}
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
              <p className="text-[10px] font-mono text-amber-300/80 leading-none">ID: {product.id}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full bg-black/40 text-amber-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Left Side: Photo Gallery Box */}
          <div className="relative md:w-1/2 bg-stone-950 flex flex-col justify-between shrink-0">
            
            {/* Main Active Image Display */}
            <div 
              className="relative aspect-square sm:aspect-[4/5] md:h-full group cursor-zoom-in overflow-hidden flex items-center justify-center bg-stone-900"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img
                src={currentImageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
                alt={`${product.name} photo ${activeImgIdx + 1}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Close Modal (Desktop) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-3 right-3 bg-stone-900/80 hover:bg-black text-amber-200 p-2 rounded-full shadow-lg backdrop-blur-md transition-colors hidden sm:block border border-amber-500/40 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Zoom Lightbox Hint Badge */}
              <div className="absolute top-3 left-3 bg-black/60 text-amber-300 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-amber-400/40 flex items-center gap-1.5 shadow-md">
                <Maximize2 className="w-3 h-3 text-amber-400" />
                <span>Click to Zoom ({activeImgIdx + 1}/{allImages.length})</span>
              </div>

              {/* Slider Previous/Next Navigation Arrows */}
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

              {/* Bottom Firm Brand ID Tag */}
              <div className="absolute bottom-3 left-3 bg-[#32080E]/90 border border-amber-500/40 text-amber-200 text-[10px] sm:text-xs px-2.5 py-1 rounded-full backdrop-blur-md font-mono">
                {product.firmName} | {product.id}
              </div>
            </div>

            {/* Thumbnails Row (4-5 Photos) */}
            {allImages.length > 1 && (
              <div className="bg-stone-900 p-2 border-t border-stone-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest shrink-0 pl-1">
                  Photos ({allImages.length}):
                </span>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImgIdx === idx
                        ? 'border-amber-400 scale-105 shadow-md ring-2 ring-amber-500/50'
                        : 'border-stone-700 opacity-60 hover:opacity-100 hover:border-amber-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
                      }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] text-amber-200 px-1 font-mono">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Right Side: Specifications & Purchase Panel */}
          <div className="p-5 sm:p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
            
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-widest bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md">
                    {product.category}
                  </span>
                  <span className="text-xs font-mono font-black text-red-950 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                    ID: {product.id}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="hidden md:block text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-playfair text-stone-900 mt-2 leading-snug">
                {product.name}
              </h2>

              {/* Price Box with Savings */}
              <div className="mt-3 bg-amber-50/90 p-4 rounded-2xl border border-amber-300 shadow-2xs">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-red-950 font-mono">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-stone-400 line-through font-mono">
                      MRP ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="bg-green-800 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-md ml-auto font-mono">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                
                {savingsAmount > 0 && (
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-xs font-bold text-green-900">
                    <span>🎉 Special Savings:</span>
                    <span className="bg-green-700 text-white px-2 py-0.5 rounded-md font-mono">
                      YOU SAVE ₹{savingsAmount.toLocaleString('en-IN')}!
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mt-3 font-sans">
                {product.description}
              </p>

              {/* Unstitched Cloth Meter Specifications */}
              <div className="mt-3 bg-amber-50/70 border border-amber-200 p-2.5 rounded-2xl text-xs space-y-1">
                <span className="font-extrabold text-amber-950 block text-[11px] uppercase tracking-wider">
                  🧵 Unstitched Cloth Cut Specifications:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-medium text-stone-700">
                  <div className="bg-white p-1 rounded-lg border border-amber-200/60 shadow-2xs">
                    <span className="block font-bold text-stone-900">Top / Shirt</span>
                    <span className="text-[10px] text-amber-900 font-mono font-bold">2.50 Meters</span>
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-amber-200/60 shadow-2xs">
                    <span className="block font-bold text-stone-900">Bottom / Salwar</span>
                    <span className="text-[10px] text-amber-900 font-mono font-bold">2.50 - 3.00 M</span>
                  </div>
                  <div className="bg-white p-1 rounded-lg border border-amber-200/60 shadow-2xs">
                    <span className="block font-bold text-stone-900">Dupatta</span>
                    <span className="text-[10px] text-amber-900 font-mono font-bold">2.25 Meters</span>
                  </div>
                </div>
              </div>

              {/* Fabric Details */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <p className="text-stone-400 text-[10px] uppercase font-bold">Fabric Material</p>
                  <p className="font-extrabold text-stone-800">{product.fabric}</p>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <p className="text-stone-400 text-[10px] uppercase font-bold">Work / Design</p>
                  <p className="font-extrabold text-stone-800">{product.workType}</p>
                </div>
              </div>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                    <span>Color Variant: <span className="text-amber-900 font-extrabold">{selectedColor}</span></span>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Shows in Admin Order
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedColor === c
                            ? 'bg-[#32080E] text-amber-200 border-amber-900 shadow-md ring-2 ring-amber-300'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400'
                        }`}
                      >
                        🎨 {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Stitching Type: <span className="text-amber-900 font-bold">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedSize === s
                            ? 'bg-[#32080E] text-amber-200 border-amber-900 shadow-md ring-2 ring-amber-300'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mt-4 flex items-center gap-3">
                <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                  Quantity:
                </label>
                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 font-bold hover:bg-stone-200 transition-colors text-amber-950"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-sm font-bold font-mono text-stone-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 font-bold hover:bg-stone-200 transition-colors text-amber-950"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Action Buttons */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onAddToCart(product, selectedColor, selectedSize, quantity);
                    onClose();
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-black py-3.5 rounded-2xl border border-amber-300 transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-900" />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={() => {
                    onBuyNow(product, selectedColor, selectedSize, quantity);
                    onClose();
                  }}
                  className="bg-gradient-to-r from-red-900 via-amber-950 to-red-950 hover:scale-102 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95 border border-amber-500/30"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  <span>Buy via UPI</span>
                </button>
              </div>

              {/* Direct WhatsApp Order / Photo Request Button */}
              <a
                href={`https://wa.me/919417124082?text=${encodeURIComponent(
                  `Sat Sri Akal / Hello Bhraava Di Hatti! I am interested in ${product.name} (Serial ID: ${product.id}). Selected Color: ${selectedColor}. Price: ₹${product.price}. Please share more details / photos.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-md border border-emerald-500/40"
              >
                <span>💬 Ask / Send Photo Request on WhatsApp (94171-24082)</span>
              </a>

              <p className="text-[11px] text-stone-500 text-center flex items-center justify-center gap-1 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
                100% Guaranteed Quality Handloom Cloth by Bhraava Di Hatti
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX ZOOM & VERTICAL SCROLL GALLERY MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-in fade-in duration-200">
          
          {/* Lightbox Top Control Toolbar */}
          <div className="bg-stone-900/90 border-b border-stone-800 p-3 px-4 flex items-center justify-between text-white shrink-0 z-10">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-amber-300 text-xs sm:text-sm">
                {product.name}
              </span>
              <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono border border-amber-700">
                {activeImgIdx + 1} / {allImages.length}
              </span>
            </div>

            {/* View Mode & Zoom Controls */}
            <div className="flex items-center gap-2">
              {/* Toggle Scroll Mode: Slide vs Vertical All Photos Scroll */}
              <button
                onClick={() => setScrollMode(scrollMode === 'slide' ? 'vertical' : 'slide')}
                className="flex items-center gap-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-amber-500/40"
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

              {/* Zoom In */}
              <button
                onClick={() => setZoomScale((z) => Math.min(3, z + 0.4))}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded-lg border border-stone-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Zoom Out */}
              <button
                onClick={() => setZoomScale((z) => Math.max(1, z - 0.4))}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded-lg border border-stone-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Reset Zoom */}
              {zoomScale !== 1 && (
                <button
                  onClick={() => setZoomScale(1)}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded-lg border border-stone-700 text-xs font-bold flex items-center gap-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">1x</span>
                </button>
              )}

              {/* Close Lightbox */}
              <button
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomScale(1);
                }}
                className="p-1.5 bg-red-950 hover:bg-red-900 text-white rounded-xl border border-red-700/60 ml-2"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Content Body */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex flex-col items-center justify-center relative select-none">
            
            {scrollMode === 'slide' ? (
              /* SLIDE CAROUSEL MODE WITH PINCH / ZOOM */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={currentImageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
                  }}
                  onClick={toggleZoom}
                  style={{ transform: `scale(${zoomScale})` }}
                  className="max-w-full max-h-[82vh] object-contain transition-transform duration-200 cursor-zoom-in"
                />

                {/* Left/Right Slide Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-stone-900/90 hover:bg-black text-amber-300 p-3 rounded-full border border-amber-500/50 shadow-2xl transition-transform active:scale-90"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-stone-900/90 hover:bg-black text-amber-300 p-3 rounded-full border border-amber-500/50 shadow-2xl transition-transform active:scale-90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* VERTICAL CONTINUOUS SCROLL MODE ("srool kare to uper hota jai") */
              <div className="w-full max-w-2xl space-y-6 my-auto overflow-y-auto py-4">
                <div className="text-center text-xs text-amber-400/80 font-mono mb-2">
                  👆 Scroll up & down to view all {allImages.length} high-resolution photos
                </div>
                {allImages.map((imgUrl, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-black">
                    <img
                      src={imgUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
                      alt={`Full photo ${i + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
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

          {/* Lightbox Bottom Thumbnail Bar */}
          {allImages.length > 1 && scrollMode === 'slide' && (
            <div className="bg-stone-900/90 border-t border-stone-800 p-2 sm:p-3 flex items-center justify-center gap-2 overflow-x-auto shrink-0">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImgIdx(idx);
                    setZoomScale(1);
                  }}
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImgIdx === idx
                      ? 'border-amber-400 scale-110 shadow-lg ring-2 ring-amber-500/80'
                      : 'border-stone-700 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
                    alt={`Thumb ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
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
