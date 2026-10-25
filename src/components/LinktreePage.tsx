import React, { useState } from 'react';
import { ShopSettings } from '../types';
import { 
  Phone, 
  MapPin, 
  ShieldCheck, 
  ExternalLink, 
  Truck, 
  Package, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag,
  Send,
  Sparkles
} from 'lucide-react';

interface LinktreePageProps {
  settings: ShopSettings;
  onBackToShop?: () => void;
}

export const LinktreePage: React.FC<LinktreePageProps> = ({ settings, onBackToShop }) => {
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);

  const cleanPhone1 = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const cleanPhone2 = (settings.phoneNumber2 || '9915046357').replace(/[^0-9]/g, '');
  const whatsappNum = (settings.whatsappNumber || '919417124082').replace(/[^0-9]/g, '');

  const whatsappUrl = settings.whatsappGroupUrl || "https://chat.whatsapp.com/FaYpQ8dnw5bE4ks4gNkyy3?s=cl&p=a&mlu=4&ilr=4";
  const youtubeUrl = settings.youtubeUrl || "https://youtube.com/@bhraavadihatti?si=uFi3k3OvAQfrZCj4";
  const instagramUrl = settings.instagramUrl || "https://instagram.com/bhraava_di_hatti";
  const facebookUrl = (settings.facebookUrl && settings.facebookUrl !== "https://facebook.com/bhraavadihatti")
    ? settings.facebookUrl
    : "https://www.facebook.com/share/19VJ4a1jax/";
  const googleUrl = settings.googleReviewUrl || settings.mapsUrl || "https://maps.app.goo.gl/A2QC78d9DyRc3eRD6?g_st=ac";

  const orderWhatsappText = encodeURIComponent(
    `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਨੂੰ ਭਰਾਵਾਂ ਦੀ ਹੱਟੀ ਤੋਂ ਸੂਟ ਮੰਗਵਾਉਣਾ ਹੈ ਅਤੇ All India Speed Post Delivery ਬਾਰੇ ਜਾਣਕਾਰੀ ਚਾਹੀਦੀ ਹੈ।`
  );
  const directOrderWhatsappUrl = `https://wa.me/${whatsappNum}?text=${orderWhatsappText}`;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950 flex flex-col justify-between">
      
      {/* Main Content (Centered Mobile Card) */}
      <main className="w-full max-w-md mx-auto px-4 py-8 sm:py-10 space-y-4">

        {/* 1. WINE SHOWROOM HEADER CARD */}
        <div className="relative bg-gradient-to-b from-[#32080E] via-[#430B13] to-[#25050A] text-amber-50 rounded-3xl p-6 sm:p-7 text-center shadow-xl border-2 border-amber-500/40 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-radial from-amber-400/15 via-transparent to-transparent pointer-events-none rounded-full blur-xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-radial from-amber-600/15 via-transparent to-transparent pointer-events-none rounded-full blur-xl" />

          {/* Royal Seal Avatar */}
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-700 via-amber-400 to-amber-200 p-1 shadow-2xl mx-auto ring-4 ring-amber-500/30">
              <div className="w-full h-full rounded-full bg-[#200407] flex flex-col items-center justify-center text-center p-2 border-2 border-amber-300">
                <span className="text-xl font-serif font-black tracking-wider text-amber-300">
                  ਭਰਾਵਾਂ
                </span>
                <span className="text-[10px] font-bold text-amber-200/90 tracking-widest uppercase">
                  ਦੀ ਹੱਟੀ
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-[#32080E] p-1.5 rounded-full shadow-md border-2 border-[#200407]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Shop Name & Firm Name */}
          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white drop-shadow-sm">
            {settings.shopName}
          </h1>
          <p className="text-amber-300 font-bold text-sm sm:text-base mt-0.5 tracking-wide">
            {settings.firmName}
          </p>

          {/* Location & Estd Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-xs text-amber-200 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Maur Mandi, Punjab</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-400/40">
              <span>Estd. 1986</span>
            </span>
          </div>

          <p className="text-xs text-amber-100/80 mt-2.5 max-w-xs mx-auto leading-relaxed">
            Specialists in Unstitched Punjabi Suits, Farshi Salwar Suits & Pure Cotton Fabrics.
          </p>
        </div>

        {/* 2. ALL INDIA SPEED POST DELIVERY CARD (ਨਵੀਂ ਆਲ ਇੰਡੀਆ ਡਿਲੀਵਰੀ ਸੁਵਿਧਾ) */}
        <section 
          aria-label="All India Speed Post Delivery"
          className="relative bg-gradient-to-br from-[#1C2818] via-[#142010] to-[#0A1208] text-white rounded-3xl p-5 shadow-xl border-2 border-emerald-500/40 overflow-hidden"
        >
          {/* Subtle Green/Gold Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-emerald-500/20 via-transparent to-transparent pointer-events-none rounded-full blur-xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-radial from-amber-400/15 via-transparent to-transparent pointer-events-none rounded-full blur-xl" />

          {/* Top Banner Tag */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <Truck className="w-3.5 h-3.5 text-stone-950" />
              <span>All India Speed Post</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Safe Parcel</span>
            </span>
          </div>

          {/* Main Headline */}
          <div className="text-left">
            <h2 className="text-lg font-black font-serif text-amber-200 tracking-tight flex items-center gap-1.5">
              <span>ਆਲ ਇੰਡੀਆ ਸਪੀਡ ਡਿਲੀਵਰੀ ਉਪਲਬਧ</span>
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
              ਘਰ ਬੈਠੇ ਪੰਜਾਬੀ ਸੂਟ ਮੰਗਵਾਓ · ਪੰਜਾਬ ਤੋਂ ਲੈ ਕੇ ਪੂਰੇ ਭਾਰਤ ਦੇ ਹਰ ਪਿੰਡ ਤੇ ਸ਼ਹਿਰ ਤੱਕ
            </p>
          </div>

          {/* 3 Key Service Highlights */}
          <div className="grid grid-cols-1 gap-2 mt-3.5 pt-3 border-t border-emerald-500/20 text-xs">
            {/* Speed Timeline */}
            <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-emerald-500/20">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-300">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">ਡਿਲੀਵਰੀ ਸਮਾਂ: 2 ਤੋਂ 5 ਦਿਨ</p>
                <p className="text-[11px] text-emerald-200/80">ਪੰਜਾਬ/ਉੱਤਰੀ ਭਾਰਤ: 2-3 ਦਿਨ · ਬਾਕੀ ਭਾਰਤ: 3-5 ਦਿਨ</p>
              </div>
            </div>

            {/* Tracking Guarantee */}
            <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-emerald-500/20">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-300">
                <Package className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">ਲਾਈਵ ਟਰੈਕਿੰਗ (Live Tracking ID)</p>
                <p className="text-[11px] text-amber-200/80">ਡਿਸਪੈਚ ਹੁੰਦੇ ਹੀ Speed Post ਨੰਬਰ (ED...IN) WhatsApp ਤੇ ਮਿਲੇਗਾ</p>
              </div>
            </div>

            {/* Free Shipping Threshold */}
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500/20 to-transparent p-2.5 rounded-xl border border-amber-400/30">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-black">
                🎁
              </div>
              <div className="text-left">
                <p className="font-bold text-amber-300">₹{settings.minOrderForFreeShipping || 1999}+ ਦੇ ਆਰਡਰ 'ਤੇ ਮੁਫ਼ਤ ਡਿਲੀਵਰੀ</p>
                <p className="text-[11px] text-stone-300">ਛੋਟੇ ਆਰਡਰਾਂ 'ਤੇ ਸਿਰਫ਼ ਵਾਜਬ ਸਰਕਾਰੀ ਸਪੀਡ ਪੋਸਟ ਚਾਰਜ</p>
              </div>
            </div>
          </div>

          {/* Quick Action: Order Directly on WhatsApp */}
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={directOrderWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-sm rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:scale-98"
            >
              <Send className="w-4 h-4 text-stone-950" />
              <span>WhatsApp 'ਤੇ ਸੂਟ ਆਰਡਰ ਕਰੋ (Order via WhatsApp)</span>
            </a>

            {/* Toggle Full Details */}
            <button
              onClick={() => setShowDeliveryDetails(!showDeliveryDetails)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-300/90 hover:text-emerald-200 transition-colors cursor-pointer"
            >
              <span>{showDeliveryDetails ? 'ਘੱਟ ਜਾਣਕਾਰੀ ਦੇਖੋ' : 'ਡਿਲੀਵਰੀ ਪ੍ਰਕਿਰਿਆ ਅਤੇ FAQ ਦੇਖੋ (How It Works)'}</span>
              {showDeliveryDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expanded FAQ / How It Works Accordion */}
          {showDeliveryDetails && (
            <div className="mt-3 pt-3 border-t border-emerald-500/30 space-y-2.5 text-left text-xs bg-black/30 p-3.5 rounded-2xl animate-in fade-in duration-200">
              <p className="font-bold text-amber-300 uppercase tracking-wide text-[11px]">
                ਸੂਟ ਮੰਗਵਾਉਣ ਦਾ ਤਰੀਕਾ (Step-by-Step Order Guide):
              </p>

              <div className="space-y-2 text-stone-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">1. ਸੂਟ ਚੁਣੋ:</span> ਸਾਡੇ WhatsApp ਗਰੁੱਪ, ਯੂਟਿਊਬ ਜਾਂ ਵੈੱਬਸਾਈਟ ਤੋਂ ਆਪਣਾ ਪਸੰਦੀਦਾ ਸੂਟ ਦੇਖੋ।
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">2. ਸਕ੍ਰੀਨਸ਼ੌਟ ਭੇਜੋ:</span> ਸੂਟ ਦੀ ਫੋਟੋ ਸਾਡੇ WhatsApp (94171-24082) 'ਤੇ ਭੇਜ ਕੇ ਬੁੱਕ ਕਰੋ।
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">3. ਭੁਗਤਾਨ (UPI / Bank):</span> Google Pay, PhonePe, Paytm (boism-9417124082@boi) ਰਾਹੀਂ ਆਸਾਨ ਪੇਮੈਂਟ ਕਰੋ।
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">4. ਰਸੀਦ ਤੇ ਟਰੈਕਿੰਗ:</span> ਪਾਰਸਲ ਡਿਸਪੈਚ ਹੁੰਦੇ ਹੀ India Post Speed Post ਦੀ ਰਸੀਦ ਅਤੇ ਟਰੈਕਿੰਗ ਲਿੰਕ ਮਿਲੇਗਾ।
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-400/30 text-[11px] text-emerald-200 leading-relaxed mt-2">
                <strong>ਭਰੋਸੇਯੋਗ ਸੇਵਾ:</strong> ਜੈ ਦੁਰਗਾ ਕਲੋਥ ਐਂਪੋਰੀਅਮ (Estd. 1986). ਸਾਰੇ ਸੂਟ ਡਬਲ ਵਾਟਰਪਰੂਫ ਪੈਕਿੰਗ ਵਿੱਚ ਭੇਜੇ ਜਾਂਦੇ ਹਨ ਤਾਂ ਜੋ ਕੱਪੜਾ ਬਿਲਕੁਲ ਸੁਰੱਖਿਅਤ ਪਹੁੰਚੇ।
              </div>
            </div>
          )}
        </section>

        {/* 3. BROWSE CATALOG BUTTON (If customer wants to view products) */}
        {onBackToShop ? (
          <button
            onClick={onBackToShop}
            className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-amber-950 font-black text-sm rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer border border-amber-300"
          >
            <ShoppingBag className="w-4 h-4 text-amber-950" />
            <span>🛍️ ਸਾਰੇ ਸੂਟ ਆਨਲਾਈਨ ਦੇਖੋ (Browse Suit Catalog)</span>
          </button>
        ) : (
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-amber-950 font-black text-sm rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer border border-amber-300"
          >
            <ShoppingBag className="w-4 h-4 text-amber-950" />
            <span>🛍️ ਸਾਰੇ ਸੂਟ ਆਨਲਾਈਨ ਦੇਖੋ (Browse Suit Catalog)</span>
          </a>
        )}

        {/* 4. THE CORE SOCIAL & PLATFORM LINKS */}
        <div className="space-y-3 pt-1">

          {/* A. WHATSAPP */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-98 border border-emerald-400/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.474 1.332 4.988L2 22l5.168-1.356a9.927 9.927 0 0 0 4.863 1.268h.004c5.515 0 9.965-4.453 9.965-9.969 0-2.664-1.037-5.168-2.921-7.052A9.908 9.908 0 0 0 12.031 2zm5.822 14.273c-.246.693-1.425 1.326-1.979 1.409-.506.075-1.147.107-1.852-.116-.428-.135-.976-.317-1.678-.62-2.953-1.275-4.881-4.248-5.029-4.445-.148-.197-1.2-1.597-1.2-3.046 0-1.449.759-2.162 1.029-2.457.27-.295.59-.369.787-.369.197 0 .393.002.565.01.182.009.426-.069.666.508.246.59.836 2.04.909 2.187.074.148.123.32.025.516-.098.197-.148.32-.295.492-.148.172-.311.384-.443.516-.148.147-.302.307-.13.602.172.295.764 1.261 1.641 2.043 1.128 1.006 2.079 1.318 2.374 1.465.295.148.467.123.639-.074.172-.197.738-.86.934-1.155.197-.295.393-.246.664-.148.27.098 1.721.811 2.016.959.295.148.492.221.566.344.074.123.074.713-.172 1.406z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base tracking-wide">WhatsApp</span>
                  <span className="bg-emerald-900/60 text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Join Group</span>
                </div>
                <p className="text-xs text-emerald-100/90 mt-0.5">Join Official Group for Daily Suit Photos & Offers</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>

          {/* B. YOUTUBE */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-98 border border-red-400/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base tracking-wide">YouTube</span>
                  <span className="bg-red-950/60 text-red-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">@bhraavadihatti</span>
                </div>
                <p className="text-xs text-red-100/90 mt-0.5">Watch Latest Unstitched Suit Videos & Updates</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-red-200 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>

          {/* C. INSTAGRAM */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-98 border border-white/20"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base tracking-wide">Instagram</span>
                  <span className="bg-black/30 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">@bhraava_di_hatti</span>
                </div>
                <p className="text-xs text-white/90 mt-0.5">Follow for Daily Reels, New Arrivals & Suit Fabric</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>

          {/* D. FACEBOOK */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#1877F2] to-[#0D65D9] hover:from-[#166FE5] hover:to-[#0B5BC5] text-white rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-98 border border-blue-400/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base tracking-wide">Facebook</span>
                  <span className="bg-blue-950/60 text-blue-100 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Follow Page</span>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">Follow for Daily Punjabi Suit Videos & Updates</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>

          {/* E. GOOGLE (Location & 5★ Reviews) */}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-white hover:bg-amber-50 text-stone-900 rounded-2xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 active:scale-98 border border-amber-300/80"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {/* Official Google 'G' Logo SVG */}
                <svg viewBox="0 0 24 24" className="w-7 h-7">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base text-stone-900">Google Location & Reviews</span>
                  <span className="text-amber-500 text-xs">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">Directions on Google Maps & 5★ Customer Reviews</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-stone-400 group-hover:text-blue-600 transition-colors shrink-0" />
          </a>

        </div>

        {/* 3. PHONE NUMBERS CARD */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-800" />
            <span className="text-xs font-black uppercase text-amber-950 tracking-wider">
              ਦੁਕਾਨ ਤੇ ਫੋਨ ਕਰੋ (Direct Showroom Calling)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={`tel:+91${cleanPhone1}`}
              className="flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl font-black text-sm border border-amber-300 transition-all active:scale-95"
            >
              <span>📞 {settings.phoneNumber || '94171-24082'}</span>
              <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded text-amber-900 font-extrabold">Primary</span>
            </a>

            <a
              href={`tel:+91${cleanPhone2}`}
              className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-xl font-black text-sm border border-stone-300 transition-all active:scale-95"
            >
              <span>📞 {settings.phoneNumber2 || '99150-46357'}</span>
              <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded text-stone-700 font-extrabold">Store 2</span>
            </a>
          </div>

          <p className="text-[11px] text-stone-500 text-center font-medium pt-1">
            ਬੱਸ ਸਟੈਂਡ ਰੋਡ, ਮੌੜ ਮੰਡੀ (ਜ਼ਿਲ੍ਹਾ ਬਠਿੰਡਾ, ਪੰਜਾਬ - 151509)
          </p>
        </div>

      </main>

      {/* Clean Minimal Footer */}
      <footer className="py-4 text-center text-xs text-stone-400">
        <p className="font-semibold">{settings.shopName} · {settings.firmName}</p>
      </footer>

    </div>
  );
};
