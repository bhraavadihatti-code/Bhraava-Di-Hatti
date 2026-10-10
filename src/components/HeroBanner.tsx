import React, { useState, useEffect } from 'react';
import { Award, ChevronRight, ChevronLeft, Phone, MapPin, MessageCircle, Store } from 'lucide-react';
import { ShopSettings } from '../types';
import heroBannerImg from '../assets/images/hero_cloth_banner_1784686263964.jpg';
import punjabiSuitImg from '../assets/images/punjabi_suit_red_1784686277398.jpg';
import farshiSuitImg from '../assets/images/ruaab_farshi_suit_1784952010247.jpg';

interface HeroBannerProps {
  settings: ShopSettings;
  onExploreCatalog: () => void;
}

const BANNER_SLIDES = [
  {
    id: 1,
    kicker: "Wholesale & Retail Showroom · Estd. 1986",
    title: "Pure Handloom Punjabi Suits & Boutique Sets",
    subtitle: "Fresh designs arriving daily at Maur Mandi. Every design comes in limited 1 to 2 sets — check availability on WhatsApp or visit our showroom.",
    highlight: "Direct Wholesale Rates",
    image: heroBannerImg
  },
  {
    id: 2,
    kicker: "Bridal, Chinon Silk & Partywear Collection",
    title: "Royal Wedding & Festive Unstitched Suits",
    subtitle: "Authentic Zari work, Gotta Patti embroidery, Pure Dupattas and designer salwar fabrics curated for weddings and family occasions.",
    highlight: "100% Pure Fabric Guarantee",
    image: punjabiSuitImg
  },
  {
    id: 3,
    kicker: "Daily New Arrivals · Limited Sets",
    title: "Cotton, Farshi & Designer Suit Varieties",
    subtitle: "Browse our live digital catalog below. Send any suit code on WhatsApp to confirm if the set is available at the shop counter.",
    highlight: "New Stock Every Week",
    image: farshiSuitImg
  }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onExploreCatalog }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);

  const activeSlide = BANNER_SLIDES[currentSlide];
  const cleanPhone = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal ${settings.shopName}! I am browsing your online catalog and want to check suit availability.`
  )}`;

  return (
    <div className="relative bg-gradient-to-br from-[#2B040B] via-[#420812] to-[#1C0207] text-amber-50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-amber-400/60 my-3 sm:my-5">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay transition-opacity duration-700 ease-in-out">
        <img
          key={activeSlide.id}
          src={activeSlide.image}
          alt={activeSlide.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = heroBannerImg;
          }}
        />
      </div>

      {/* Top Showroom Strip */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] text-amber-950 py-1.5 px-3 text-center text-[11px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-2 relative z-10">
        <span>{settings.shopName} ({settings.firmName})</span>
        <span>·</span>
        <span>{activeSlide.highlight}</span>
      </div>

      {/* MOBILE HERO (< sm) */}
      <div className="block sm:hidden relative z-10 p-4 text-center space-y-3">
        <p className="text-[11px] font-semibold text-amber-300 tracking-wide">
          {activeSlide.kicker}
        </p>

        <div className="min-h-[96px] flex flex-col justify-center px-1">
          <h1 className="text-xl font-black font-cinzel text-amber-100 tracking-tight leading-snug">
            {activeSlide.title}
          </h1>
          <p className="text-xs text-amber-100/85 mt-1.5 leading-relaxed">
            {activeSlide.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-left text-[11px]">
          <div className="bg-black/45 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-100 truncate">Wholesale & Retail</span>
          </div>
          <div className="bg-black/45 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-amber-100 truncate">WhatsApp Check</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={prevSlide}
            className="p-2.5 rounded-xl bg-black/50 text-amber-300 border border-amber-500/30 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreCatalog}
            className="flex-1 bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#B8860B] active:scale-98 text-amber-950 font-black px-4 py-2.5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 border border-amber-200 whitespace-nowrap"
          >
            <span>View Suit Catalog</span>
            <ChevronRight className="w-4 h-4 text-amber-950 shrink-0" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="p-2.5 rounded-xl bg-black/50 text-amber-300 border border-amber-500/30 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DESKTOP & TABLET HERO (>= sm) */}
      <div className="hidden sm:flex relative z-10 p-8 lg:p-10 flex-col lg:flex-row items-stretch justify-between gap-8">
        {/* Left Column: Showroom Headline & Catalog CTA */}
        <div className="max-w-2xl text-center lg:text-left space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold text-amber-300 tracking-wide">
              {activeSlide.kicker}
            </p>

            <h1 className="text-3xl lg:text-5xl font-black font-cinzel text-amber-100 leading-tight tracking-tight" style={{ textWrap: 'balance' }}>
              {activeSlide.title}
            </h1>

            <p className="text-amber-100/90 text-sm lg:text-base leading-relaxed font-sans max-w-xl">
              {activeSlide.subtitle}
            </p>
          </div>

          {/* Key Showroom Highlights */}
          <div className="pt-2 grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2.5 bg-black/45 border border-amber-500/30 p-3 rounded-xl">
              <Store className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-100">Limited 1–2 Sets</p>
                <p className="text-[11px] text-amber-300/80">Exclusive Designs</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-black/45 border border-amber-500/30 p-3 rounded-xl">
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-100">WhatsApp Inquiry</p>
                <p className="text-[11px] text-amber-300/80">Confirm Live Stock</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-black/45 border border-amber-500/30 p-3 rounded-xl">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-100">Wholesale Rates</p>
                <p className="text-[11px] text-amber-300/80">100% Pure Fabrics</p>
              </div>
            </div>
          </div>

          {/* Primary Action & Slide Controls */}
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <button
              onClick={onExploreCatalog}
              className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] hover:brightness-105 text-amber-950 font-black font-sans px-6 py-3.5 rounded-xl shadow-lg transition-all text-sm flex items-center gap-2 border border-amber-200 cursor-pointer whitespace-nowrap"
            >
              <span>Browse Latest Suit Designs</span>
              <ChevronRight className="w-4 h-4 text-amber-950" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="p-3 rounded-xl bg-black/50 hover:bg-black/80 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="p-3 rounded-xl bg-black/50 hover:bg-black/80 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Showroom Visit & WhatsApp Card */}
        <div className="shrink-0 w-full lg:w-80 bg-gradient-to-b from-[#4A0E17]/95 to-[#250509]/95 border border-amber-400/50 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-2">
            <p className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
              Showroom & Direct Inquiry
            </p>
            <h3 className="text-lg font-bold font-serif text-amber-100">
              {settings.shopName}
            </h3>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              ਸਾਡੀ ਦੁਕਾਨ 'ਤੇ ਹਰ ਡਿਜ਼ਾਈਨ ਦੇ 1–2 ਸੈੱਟ ਹੀ ਆਉਂਦੇ ਹਨ। ਪਸੰਦ ਆਏ ਸੂਟ ਦਾ ਸਟਾਕ WhatsApp 'ਤੇ ਪੁੱਛੋ ਜਾਂ ਦੁਕਾਨ 'ਤੇ ਵਿਜ਼ਿਟ ਕਰੋ।
            </p>
          </div>

          <div className="bg-black/45 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 space-y-1.5">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{settings.address}, {settings.city}</span>
            </p>
            <p className="flex items-center gap-2 font-mono text-amber-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.phoneNumber}</span>
            </p>
          </div>

          <div className="space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-emerald-200" />
              <span>Ask on WhatsApp</span>
            </a>
            <a
              href={`tel:${settings.phoneNumber}`}
              className="w-full bg-white/10 hover:bg-white/20 text-amber-100 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-amber-400/30 transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>Call Showroom</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Slide Selector Tabs */}
      <div className="border-t border-amber-500/30 bg-black/40 px-3 py-2 flex items-center justify-between overflow-x-auto gap-2 scrollbar-none text-[11px]">
        <div className="flex items-center gap-2">
          {BANNER_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`shrink-0 px-3 py-1 rounded-lg font-bold transition-colors border cursor-pointer whitespace-nowrap ${
                currentSlide === idx
                  ? 'bg-amber-400 text-amber-950 border-amber-300 font-extrabold'
                  : 'bg-amber-950/60 text-amber-200 border-amber-500/30 hover:bg-amber-900/60'
              }`}
            >
              <span>0{idx + 1}. {slide.highlight}</span>
            </button>
          ))}
        </div>

        <div className="shrink-0 text-amber-200 text-[11px] font-medium px-2.5 py-1">
          Open All 7 Days · 9:00 AM – 8:30 PM
        </div>
      </div>
    </div>
  );
};
