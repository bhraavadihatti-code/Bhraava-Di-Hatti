import React, { useState, useEffect } from 'react';
import { QrCode, Gift, Sparkles, Truck, Award, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { ShopSettings } from '../types';
import heroBannerImg from '../assets/images/hero_cloth_banner_1784686263964.jpg';

interface HeroBannerProps {
  settings: ShopSettings;
  onExploreCatalog: () => void;
}

const BANNER_SLIDES = [
  {
    id: 1,
    tag: "🪔 RAKHI FESTIVE SALE",
    title: "Pure Handloom Punjabi Suits",
    subtitle: "Unstitched Cotton, Chinon Silk & Gotta Patti Suits at Direct Wholesale Rates",
    badge: "ESTD. 1986 • PUNJAB HERITAGE",
    highlight: "Save Up To ₹1,000+",
    image: heroBannerImg || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    tag: "👑 BANARASI & CHINON SILK",
    title: "Royal Wedding & Partywear Sets",
    subtitle: "Pure Dupattas, Zari Embroidery & Designer Salwar Material",
    badge: "100% PURE FABRIC GUARANTEE",
    highlight: "Free Shipping Available",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    tag: "📮 SPEED POST ALL-INDIA",
    title: "Direct Doorstep Speed Delivery",
    subtitle: "Tracked India Post Parcels Dispatched Directly from Maur Mandi, Punjab",
    badge: "FACTORY WHOLESALE PRICING",
    highlight: "Serial Parcel Tracking",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800"
  }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onExploreCatalog }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto slide every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);

  const activeSlide = BANNER_SLIDES[currentSlide];

  return (
    <div className="relative bg-gradient-to-br from-[#2B040B] via-[#420812] to-[#1C0207] text-amber-50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/70 my-3 sm:my-5">
      
      {/* Background Image Layer with Fade Animation */}
      <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay transition-opacity duration-700 ease-in-out">
        <img
          key={activeSlide.id}
          src={activeSlide.image}
          alt="Bhraava Di Hatti Banner"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
          }}
        />
      </div>

      {/* Royal Gold Top Festive Bar */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] text-amber-950 py-1.5 px-3 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md relative z-10">
        <Sparkles className="w-3.5 h-3.5 text-red-950 shrink-0 animate-pulse" />
        <span className="font-bold tracking-wide">{activeSlide.tag} — EXCLUSIVE BOUTIQUE PRICING</span>
        <Sparkles className="w-3.5 h-3.5 text-red-950 shrink-0 animate-pulse" />
      </div>

      {/* ========================================================= */}
      {/* MOBILE-ONLY COMPACT AUTO-SLIDING HERO (< sm) */}
      {/* ========================================================= */}
      <div className="block sm:hidden relative z-10 p-3.5 text-center space-y-2.5">
        
        {/* Mobile Badge */}
        <div className="inline-flex items-center gap-1 bg-black/60 text-amber-300 border border-amber-400/50 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold backdrop-blur-md">
          <Award className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{activeSlide.badge}</span>
        </div>

        {/* Mobile Slide Content */}
        <div className="min-h-[100px] flex flex-col justify-center px-2">
          <h1 className="text-xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 tracking-tight leading-tight">
            {activeSlide.title}
          </h1>
          <p className="text-[11px] font-medium text-amber-100/90 mt-1 leading-snug">
            {activeSlide.subtitle}
          </p>
        </div>

        {/* Mobile Quick Feature Pill Bar */}
        <div className="grid grid-cols-2 gap-1.5 text-left text-[10px]">
          <div className="bg-black/50 border border-amber-500/40 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 backdrop-blur-md">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-100 truncate">100% Pure Fabric</span>
          </div>

          <div className="bg-black/50 border border-amber-500/40 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 backdrop-blur-md">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-100 truncate">Speed Post Tracked</span>
          </div>
        </div>

        {/* Mobile Action Button & Controls */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={prevSlide}
            className="p-2 rounded-xl bg-black/60 text-amber-300 border border-amber-500/30 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreCatalog}
            className="flex-1 bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#B8860B] active:scale-98 text-amber-950 font-black px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-1.5 border border-amber-200 tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />
            <span>EXPLORE CATALOG</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-950 shrink-0" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="p-2 rounded-xl bg-black/60 text-amber-300 border border-amber-500/30 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {BANNER_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-6 bg-amber-400' : 'w-1.5 bg-amber-200/40'
              }`}
            />
          ))}
        </div>

      </div>

      {/* ========================================================= */}
      {/* DESKTOP & TABLET AUTO-SLIDING HERO (>= sm) */}
      {/* ========================================================= */}
      <div className="hidden sm:flex relative z-10 p-8 lg:p-12 flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Column: Brand & Slide Info */}
        <div className="max-w-2xl text-center lg:text-left space-y-4">
          
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wide">{activeSlide.badge}</span>
          </div>

          <div>
            <h1 className="text-4xl lg:text-6xl font-black font-cinzel text-amber-100 leading-tight tracking-tight min-h-[72px] sm:min-h-[110px]">
              {activeSlide.title}
            </h1>
            <p className="text-xl lg:text-2xl font-serif font-black text-amber-300 mt-1 flex items-center justify-center lg:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 inline" />
              <span>{settings.shopName} ({settings.firmName})</span>
            </p>
          </div>

          <p className="text-amber-200/90 text-sm lg:text-base leading-relaxed font-light font-sans max-w-xl">
            {activeSlide.subtitle}
          </p>

          {/* Key Heritage Badges */}
          <div className="pt-2 grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-black/50 border border-amber-500/30 p-3 rounded-2xl backdrop-blur-md">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-extrabold text-amber-100">100% Unstitched</p>
                <p className="text-[10px] text-amber-300/80">Guaranteed Fabric</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/50 border border-amber-500/30 p-3 rounded-2xl backdrop-blur-md">
              <QrCode className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-extrabold text-amber-100">Instant UPI Payment</p>
                <p className="text-[10px] text-amber-300/80">GPay, PhonePe, Paytm</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/50 border border-amber-500/30 p-3 rounded-2xl backdrop-blur-md">
              <Truck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-extrabold text-amber-100">Speed Post Parcel</p>
                <p className="text-[10px] text-amber-300/80">Tracked All-India</p>
              </div>
            </div>
          </div>

          {/* Action Callout & Slide Nav */}
          <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onExploreCatalog}
              className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] hover:scale-105 text-amber-950 font-extrabold font-sans px-8 py-4 rounded-2xl shadow-xl shadow-black/50 transition-all text-sm flex items-center gap-2.5 border border-amber-200 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-950" /> Explore Royal Collection ➔
            </button>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="p-3 rounded-2xl bg-black/50 hover:bg-black/80 text-amber-300 border border-amber-500/30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="p-3 rounded-2xl bg-black/50 hover:bg-black/80 text-amber-300 border border-amber-500/30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center justify-center lg:justify-start gap-2 pt-2">
            {BANNER_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2 bg-amber-200/40 hover:bg-amber-300'
                }`}
              />
            ))}
          </div>

        </div>

        {/* Right Column: Festive Sale Highlight Card */}
        <div className="shrink-0 w-full lg:w-80 bg-gradient-to-b from-[#4A0E17]/90 to-[#250509]/90 border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-2xl backdrop-blur-xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[11px] font-extrabold px-4 py-0.5 rounded-full uppercase tracking-widest shadow-md font-mono">
            Rakhi Offer Valid
          </div>
          <div className="w-16 h-16 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-amber-400/50 mt-1">
            <Gift className="w-8 h-8 text-amber-300 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold font-playfair text-amber-100">{activeSlide.highlight}</h3>
          <p className="text-xs text-amber-200/90 mt-1 mb-4 font-sans">
            Every product displays original MRP and discounted BDH price with exact savings!
          </p>
          <div className="bg-black/60 border border-amber-500/40 rounded-2xl p-3 text-xs text-amber-200 font-mono">
            Festive Period: <span className="font-bold text-amber-300">Till 29 August 2026</span>
          </div>
        </div>

      </div>
    </div>
  );
};
