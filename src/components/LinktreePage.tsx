import React from 'react';
import { ShopSettings } from '../types';
import { 
  Phone, 
  MapPin, 
  ShieldCheck, 
  ExternalLink,
  ShoppingBag,
  Navigation
} from 'lucide-react';

interface LinktreePageProps {
  settings: ShopSettings;
  onBackToShop?: () => void;
  onOpenAdmin?: () => void;
}

export const LinktreePage: React.FC<LinktreePageProps> = ({ 
  settings, 
  onBackToShop,
  onOpenAdmin 
}) => {
  const cleanPhone1 = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const cleanPhone2 = (settings.phoneNumber2 || '9915046357').replace(/[^0-9]/g, '');

  const whatsappUrl = settings.whatsappGroupUrl || "https://chat.whatsapp.com/FaYpQ8dnw5bE4ks4gNkyy3?s=cl&p=a&mlu=4&ilr=4";
  const youtubeUrl = settings.youtubeUrl || "https://youtube.com/@bhraavadihatti?si=uFi3k3OvAQfrZCj4";
  const instagramUrl = settings.instagramUrl || "https://instagram.com/bhraava_di_hatti";
  const facebookUrl = (settings.facebookUrl && settings.facebookUrl !== "https://facebook.com/bhraavadihatti")
    ? settings.facebookUrl
    : "https://www.facebook.com/share/19VJ4a1jax/";
  const googleUrl = settings.googleReviewUrl || settings.mapsUrl || "https://maps.app.goo.gl/A2QC78d9DyRc3eRD6?g_st=ac";

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#29251F] font-sans selection:bg-[#E5D9C5] selection:text-[#5B2630] flex flex-col justify-between antialiased">
      
      {/* Centered Mobile Card Layout */}
      <main className="w-full max-w-md mx-auto px-4 py-6 sm:py-8 space-y-3.5">

        {/* 1. BUSINESS PROFILE & BRAND HEADER CARD */}
        <section className="bg-[#FFFCF6] rounded-[22px] p-6 sm:p-7 text-center shadow-[0_2px_12px_rgba(41,37,31,0.05)] border-2 border-[#E5D9C5] relative overflow-hidden transition-all">
          
          {/* Subtle Champagne Top Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#8B641F]/8 rounded-full blur-2xl pointer-events-none" />

          {/* Circular Shop Logo with Gold Border */}
          <div className="relative inline-block mb-3.5">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#8B641F] via-[#D4AF37] to-[#8B641F] p-1 shadow-md mx-auto ring-4 ring-[#8B641F]/15">
              <div className="w-full h-full rounded-full bg-[#5B2630] flex flex-col items-center justify-center text-center p-2 border border-[#E5D9C5]">
                <span className="text-xl font-serif font-black tracking-wider text-[#FFFCF6]">
                  ਭਰਾਵਾਂ
                </span>
                <span className="text-[10px] font-bold text-[#E5D9C5] tracking-widest uppercase">
                  ਦੀ ਹੱਟੀ
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#8B641F] text-[#FFFCF6] p-1.5 rounded-full shadow-xs border-2 border-[#FFFCF6]" title="Verified Showroom">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Business Name (Refined Serif Heading in Deep Burgundy) */}
          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-[#5B2630]">
            {settings.shopName || "Bhraava Di Hatti"}
          </h1>

          {/* Registered / Trading Subtitle */}
          <p className="text-[#8B641F] font-bold text-sm sm:text-base mt-0.5 tracking-wide">
            {settings.firmName || "Jai Durga Cloth Emporium"}
          </p>

          {/* Badges: Maur Mandi, Punjab & Established 1986 */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 bg-[#F5F0E6] text-[#29251F] text-xs font-semibold px-3 py-1 rounded-full border border-[#E5D9C5]">
              <MapPin className="w-3.5 h-3.5 text-[#8B641F]" />
              <span>Maur Mandi, Punjab</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-[#5B2630]/8 text-[#5B2630] text-xs font-black px-3 py-1 rounded-full border border-[#5B2630]/20">
              <span>Estd. 1986</span>
            </span>
          </div>

          {/* Positioning Description */}
          <p className="text-xs sm:text-[13px] text-[#6E675D] mt-3 max-w-xs mx-auto leading-relaxed">
            Specialists in Unstitched Punjabi Suits, Farshi Salwar Suits & Pure Cotton Fabrics.
          </p>
        </section>

        {/* 2. SOCIAL AND BUSINESS LINK CARDS (Exact Order 1-6) */}
        <section className="space-y-3 pt-1">

          {/* 1. ONLINE SHOP / BROWSE CATALOGUE (Refined Orange-to-Gold Treatment) */}
          {onBackToShop ? (
            <button
              onClick={onBackToShop}
              className="w-full group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#B86B14] via-[#C97D1A] to-[#8B641F] hover:from-[#A55F10] hover:to-[#7A571A] text-white font-black rounded-[20px] shadow-[0_3px_10px_rgba(184,107,20,0.25)] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] border border-amber-300/40 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base tracking-wide text-white truncate">
                      ਆਨਲਾਈਨ ਸੂਟ ਕਲੈਕਸ਼ਨ ਦੇਖੋ
                    </span>
                    <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 border border-white/30">
                      LIVE SHOP
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium mt-0.5 truncate">
                    Browse Catalogue, Prices & Order Online
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
            </button>
          ) : (
            <a
              href="/"
              className="w-full group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#B86B14] via-[#C97D1A] to-[#8B641F] text-white font-black rounded-[20px] shadow-[0_3px_10px_rgba(184,107,20,0.25)] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] border border-amber-300/40"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base tracking-wide text-white truncate">
                      ਆਨਲਾਈਨ ਸੂਟ ਕਲੈਕਸ਼ਨ ਦੇਖੋ
                    </span>
                    <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                      LIVE SHOP
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium mt-0.5 truncate">
                    Browse Catalogue, Prices & Order Online
                  </p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
            </a>
          )}

          {/* 2. WHATSAPP GROUP (Recognizable Brand Green) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#25D366] to-[#1EBE5D] hover:from-[#20BA5A] hover:to-[#18A24F] text-white rounded-[20px] shadow-[0_3px_10px_rgba(37,211,102,0.2)] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] border border-white/20"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.474 1.332 4.988L2 22l5.168-1.356a9.927 9.927 0 0 0 4.863 1.268h.004c5.515 0 9.965-4.453 9.965-9.969 0-2.664-1.037-5.168-2.921-7.052A9.908 9.908 0 0 0 12.031 2zm5.822 14.273c-.246.693-1.425 1.326-1.979 1.409-.506.075-1.147.107-1.852-.116-.428-.135-.976-.317-1.678-.62-2.953-1.275-4.881-4.248-5.029-4.445-.148-.197-1.2-1.597-1.2-3.046 0-1.449.759-2.162 1.029-2.457.27-.295.59-.369.787-.369.197 0 .393.002.565.01.182.009.426-.069.666.508.246.59.836 2.04.909 2.187.074.148.123.32.025.516-.098.197-.148.32-.295.492-.148.172-.311.384-.443.516-.148.147-.302.307-.13.602.172.295.764 1.261 1.641 2.043 1.128 1.006 2.079 1.318 2.374 1.465.295.148.467.123.639-.074.172-.197.738-.86.934-1.155.197-.295.393-.246.664-.148.27.098 1.721.811 2.016.959.295.148.492.221.566.344.074.123.074.713-.172 1.406z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base tracking-wide truncate">
                    WhatsApp Group
                  </span>
                  <span className="bg-black/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                    JOIN GROUP
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5 truncate">
                  Daily Suit Photos, New Arrivals & Wholesale Rates
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </a>

          {/* 3. YOUTUBE (Recognizable Brand Red) */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#FF0000] to-[#D90000] hover:from-[#E60000] hover:to-[#B80000] text-white rounded-[20px] shadow-[0_3px_10px_rgba(255,0,0,0.2)] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] border border-white/20"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base tracking-wide truncate">
                    YouTube
                  </span>
                  <span className="bg-black/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                    @bhraavadihatti
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5 truncate">
                  Watch Suit Videos, Fabric Reviews & Shop Updates
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </a>

          {/* 4. INSTAGRAM (Recognizable Signature Sunset Gradient) */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white rounded-[20px] shadow-[0_3px_10px_rgba(253,29,29,0.2)] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] border border-white/20"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base tracking-wide truncate">
                    Instagram
                  </span>
                  <span className="bg-black/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                    @bhraava_di_hatti
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5 truncate">
                  Follow for Daily Reels, New Arrivals & Trending Suits
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </a>

          {/* 5. FACEBOOK (Recognizable Brand Blue) */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#1877F2] to-[#0D65D9] hover:from-[#166FE5] hover:to-[#0B5BC5] text-white rounded-[20px] shadow-[0_3px_10px_rgba(24,119,242,0.2)] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] border border-blue-400/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base tracking-wide truncate">
                    Facebook
                  </span>
                  <span className="bg-black/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                    FOLLOW PAGE
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5 truncate">
                  Follow for Daily Punjabi Suit Videos & Updates
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </a>

          {/* 6. GOOGLE LOCATION & REVIEWS (Light Neutral Card with Multicolour Logo) */}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 bg-[#FFFCF6] hover:bg-[#FAF5EC] text-[#29251F] rounded-[20px] shadow-[0_2px_8px_rgba(41,37,31,0.05)] hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] border-2 border-[#E5D9C5]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5D9C5] p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                {/* Official Google 'G' Logo SVG */}
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-sm sm:text-base text-[#29251F] truncate">
                    Google Location & Reviews
                  </span>
                  <span className="text-[#8B641F] text-xs font-bold shrink-0">
                    ⭐⭐⭐⭐⭐
                  </span>
                </div>
                <p className="text-xs text-[#6E675D] mt-0.5 truncate">
                  Directions on Google Maps & 5★ Customer Reviews
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-[#8B641F] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </a>

        </section>

        {/* 3. TELEPHONE AND CONTACT SECTION (Premium Light Contact Panel) */}
        <section className="bg-[#FFFCF6] rounded-[22px] p-5 sm:p-6 border-2 border-[#E5D9C5] shadow-[0_2px_10px_rgba(41,37,31,0.05)] space-y-3.5 transition-all">
          
          {/* Header Row: Punjabi Showroom-calling + Operating Hours Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#8B641F]" />
              <h2 className="text-xs sm:text-[13px] font-black uppercase text-[#5B2630] tracking-wider">
                ਦੁਕਾਨ ਤੇ ਫੋਨ ਕਰੋ (Direct Showroom Calling)
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#8B641F] bg-[#8B641F]/10 px-2.5 py-0.5 rounded-full border border-[#8B641F]/25 shrink-0">
              Open 9 AM - 9 PM
            </span>
          </div>

          {/* Distinguishable Clickable Phone Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Primary Phone Row */}
            <a
              href={`tel:+91${cleanPhone1}`}
              className="flex items-center justify-between p-3.5 bg-[#5B2630] hover:bg-[#461D24] text-[#FFFCF6] rounded-2xl font-black text-sm shadow-xs border border-[#5B2630] transition-all duration-150 transform active:scale-95 group"
            >
              <div className="flex items-center gap-2">
                <span className="group-hover:rotate-12 transition-transform">📞</span>
                <span>{settings.phoneNumber || '94171-24082'}</span>
              </div>
              <span className="text-[10px] bg-white/20 text-[#FFFCF6] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Primary
              </span>
            </a>

            {/* Secondary Phone Row */}
            <a
              href={`tel:+91${cleanPhone2}`}
              className="flex items-center justify-between p-3.5 bg-[#F5F0E6] hover:bg-[#EBE3D3] text-[#29251F] rounded-2xl font-black text-sm border-2 border-[#E5D9C5] transition-all duration-150 transform active:scale-95 group"
            >
              <div className="flex items-center gap-2">
                <span className="group-hover:rotate-12 transition-transform">📞</span>
                <span>{settings.phoneNumber2 || '99150-46357'}</span>
              </div>
              <span className="text-[10px] bg-[#E5D9C5] text-[#29251F] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Secondary
              </span>
            </a>
          </div>

          {/* Business Address & Heritage Tagline */}
          <div className="pt-2 border-t border-[#E5D9C5]/60 text-center space-y-1">
            <a 
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-[#29251F] hover:text-[#5B2630] font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-[#8B641F] shrink-0" />
              <span>ਬੱਸ ਸਟੈਂਡ ਰੋਡ, ਮੌੜ ਮੰਡੀ (ਜ਼ਿਲ੍ਹਾ ਬਠਿੰਡਾ, ਪੰਜਾਬ - 151509)</span>
            </a>
            <p className="text-[11px] text-[#6E675D] font-serif italic">
              40 ਸਾਲਾਂ ਤੋਂ ਪੰਜਾਬੀ ਸੂਟਾਂ ਦਾ ਭਰੋਸੇਮੰਦ ਸ਼ੋਰੂਮ (Serving Since 1986)
            </p>
          </div>
        </section>

      </main>

      {/* 4. BUSINESS ADDRESS AND FOOTER */}
      <footer className="py-6 px-4 text-center text-xs text-[#6E675D] space-y-1.5 border-t border-[#E5D9C5]/50 bg-[#F5F0E6]">
        <p className="font-bold text-[#5B2630] tracking-wide text-sm font-serif">
          {settings.shopName || "Bhraava Di Hatti"} · {settings.firmName || "Jai Durga Cloth Emporium"}
        </p>
        <p className="text-[11px] text-[#6E675D]">
          Bus Stand Road, Maur Mandi, District Bathinda, Punjab, India - 151509
        </p>

        {/* Subtle Store Admin Link */}
        {onOpenAdmin && (
          <div className="pt-2">
            <button
              onClick={onOpenAdmin}
              className="text-[11px] text-[#8B641F] hover:text-[#5B2630] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              ਸ਼ੋਰੂਮ ਐਡਮਿਨ ਪੈਨਲ (Store Owner Login)
            </button>
          </div>
        )}
      </footer>

    </div>
  );
};
