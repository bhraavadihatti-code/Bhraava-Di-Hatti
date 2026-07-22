import React from 'react';
import { QrCode, ShieldCheck, Sparkles, Truck, Award, Percent } from 'lucide-react';
import { ShopSettings } from '../types';

const heroBannerImg = '/src/assets/images/hero_cloth_banner_1784686263964.jpg';

interface HeroBannerProps {
  settings: ShopSettings;
  onExploreCatalog: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onExploreCatalog }) => {
  return (
    <div className="relative bg-gradient-to-br from-amber-950 via-red-950 to-amber-900 text-amber-50 rounded-2xl overflow-hidden shadow-xl border border-amber-800/40 my-4">
      {/* Background Hero Image with Blend overlay */}
      <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
        <img
          src={heroBannerImg}
          alt="Bhraava Di Hatti Shop"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Column: Headline and Store Identity */}
        <div className="max-w-2xl text-center lg:text-left space-y-4">
          
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Welcome to {settings.firmName}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif text-amber-100 leading-tight">
            {settings.shopName}
          </h2>

          <p className="text-amber-200/90 text-sm sm:text-base leading-relaxed font-light">
            Punjab's Premier House of Traditional Ethnic Wear & Fabrics. Exclusive collection of Heavy Designer Punjabi Salwar Suits, Handwoven Banarasi Silk Sarees, Men's Kurta Sets & Bridal Wear.
          </p>

          {/* Key Value Badges */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-black/30 border border-amber-700/30 p-2.5 rounded-xl backdrop-blur-sm">
              <QrCode className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-100">100% Online UPI</p>
                <p className="text-[10px] text-amber-300/80">QR & UTR Payment</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/30 border border-amber-700/30 p-2.5 rounded-xl backdrop-blur-sm">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-100">Guaranteed Quality</p>
                <p className="text-[10px] text-amber-300/80">Pure Silks & Cottons</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/30 border border-amber-700/30 p-2.5 rounded-xl backdrop-blur-sm col-span-2 sm:col-span-1">
              <Truck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-100">Direct Shipping</p>
                <p className="text-[10px] text-amber-300/80">All India Delivery</p>
              </div>
            </div>
          </div>

          {/* Action Callouts */}
          <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onExploreCatalog}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-950/50 hover:scale-105 transition-all text-sm"
            >
              Explore Clothing Collection
            </button>
            <div className="text-xs text-amber-300 flex items-center gap-1.5 font-medium">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>₹100 Off Auto Applied on UPI Checkout</span>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Feature Badge */}
        <div className="shrink-0 w-full lg:w-72 bg-gradient-to-b from-amber-900/60 to-red-900/60 border border-amber-500/30 rounded-2xl p-5 text-center shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-400/40">
            <QrCode className="w-8 h-8 text-amber-300" />
          </div>
          <h3 className="text-base font-bold text-amber-100">Only UPI & QR Pay</h3>
          <p className="text-xs text-amber-200/80 mt-1 mb-3">
            Pay safely via PhonePe, GPay, Paytm or BHIM with instant order tracking via UTR / UTS reference number.
          </p>
          <div className="bg-amber-950/80 border border-amber-700/50 rounded-xl p-2.5 text-[11px] text-amber-200 font-mono">
            UPI: <span className="font-bold text-amber-300">{settings.upiId}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
