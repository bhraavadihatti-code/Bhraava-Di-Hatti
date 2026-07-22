import React from 'react';
import { QrCode, Gift, Sparkles, Truck, Award, Percent, Calendar, ShieldCheck } from 'lucide-react';
import { ShopSettings } from '../types';
import heroBannerImg from '../assets/images/hero_cloth_banner_1784686263964.jpg';

interface HeroBannerProps {
  settings: ShopSettings;
  onExploreCatalog: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onExploreCatalog }) => {
  return (
    <div className="relative bg-[#32080E] text-amber-50 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 my-4">
      
      {/* Background Hero Image with Subtle Blend overlay */}
      <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
        <img
          src={heroBannerImg || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
          alt="Bhraava Di Hatti Shop"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800";
          }}
        />
      </div>

      {/* Royal Gold Festive Bar */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#FFF1B0] to-[#D4AF37] text-amber-950 py-2 px-4 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
        <Sparkles className="w-4 h-4 text-red-950 shrink-0 animate-pulse" />
        <span className="font-cinzel">🪔 RAKHI FESTIVE SALE — EXCLUSIVE HANDLOOM SUITS AT DIRECT BOUTIQUE PRICING 🪔</span>
        <Sparkles className="w-4 h-4 text-red-950 shrink-0 animate-pulse" />
      </div>

      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Column: Brand & Luxury Identity */}
        <div className="max-w-2xl text-center lg:text-left space-y-4">
          
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wide">ESTD. 1986 | PUNJAB HERITAGE</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-cinzel text-amber-100 leading-tight tracking-tight">
              {settings.shopName}
            </h1>
            <p className="text-lg sm:text-2xl font-serif font-black text-amber-300 mt-1 flex items-center justify-center lg:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 inline" />
              <span>{settings.firmName}</span>
            </p>
          </div>

          <p className="text-amber-200/90 text-sm sm:text-base leading-relaxed font-light font-sans max-w-xl">
            Punjab's Premier Destination for Unstitched Pure Cotton Suits, Chinon Silk Dupattas, Gotta Patti Embroidery & Designer Salwar Sets. 
          </p>

          {/* Key Heritage Badges */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
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

            <div className="flex items-center gap-2 bg-black/50 border border-amber-500/30 p-3 rounded-2xl backdrop-blur-md col-span-2 sm:col-span-1">
              <Truck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-extrabold text-amber-100">Speed Post Parcel</p>
                <p className="text-[10px] text-amber-300/80">Tracked All-India</p>
              </div>
            </div>
          </div>

          {/* Action Callout Button */}
          <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onExploreCatalog}
              className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] hover:scale-105 text-amber-950 font-extrabold font-sans px-8 py-4 rounded-2xl shadow-xl shadow-black/50 transition-all text-sm flex items-center gap-2.5 border border-amber-200"
            >
              <Sparkles className="w-5 h-5 text-amber-950" /> Explore Royal Collection ➔
            </button>
            
            <div className="text-xs text-amber-300 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Direct Factory Wholesale Rates + Serial Tracking</span>
            </div>
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
          <h3 className="text-lg font-bold font-playfair text-amber-100">Save Up To ₹1,000+</h3>
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

