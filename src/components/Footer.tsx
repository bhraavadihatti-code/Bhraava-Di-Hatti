import React from 'react';
import { ShopSettings } from '../types';
import { Phone, MapPin, ShieldCheck, Heart, Clock, MessageSquare, Navigation, Store, QrCode } from 'lucide-react';

interface FooterProps {
  settings: ShopSettings;
  onOpenAdmin: () => void;
  onOpenLinks?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenLinks }) => {
  const cleanPhone = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal ${settings.shopName}, I want to inquire about your wholesale and retail suit collection.`
  )}`;
  const mapsUrl = "https://maps.app.goo.gl/A2QC78d9DyRc3eRD6?g_st=ac";

  return (
    <footer className="bg-gradient-to-br from-[#1F0206] via-[#32080E] to-[#140104] text-amber-100 border-t border-amber-500/40 mt-12 pb-16 sm:pb-12 shadow-2xl relative">
      {/* Top Gold Accent Bar */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] h-1 w-full"></div>

      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info & Heritage */}
          <div className="space-y-3 md:col-span-1">
            <div>
              <h3 className="font-cinzel font-black text-xl text-amber-100">
                {settings.shopName}
              </h3>
              <p className="text-xs text-amber-300 font-bold font-serif mt-0.5">
                {settings.firmName} · Estd. 1986
              </p>
            </div>
            <p className="text-xs text-amber-200/85 leading-relaxed">
              Maur Mandi's trusted wholesale and retail showroom for unstitched pure cotton suits, Chinon silk dupattas, Gotta Patti embroidery, Bridal sets & designer salwar fabrics.
            </p>
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors border border-emerald-400/40 whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
                <span>WhatsApp Us</span>
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-900/80 hover:bg-amber-900 text-amber-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors border border-amber-500/40 whitespace-nowrap"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Maps</span>
              </a>
              {onOpenLinks && (
                <button
                  type="button"
                  onClick={onOpenLinks}
                  className="bg-amber-500 hover:bg-amber-400 text-[#32080E] font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                  title="Open Store Linktree & Printable QR Sticker"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#32080E]" />
                  <span>QR Sticker & Links</span>
                </button>
              )}
            </div>
          </div>

          {/* Showroom Location & Contact Details */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs font-serif mb-3">
              Showroom Address
            </h4>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 text-amber-100 hover:text-amber-300 transition-colors leading-snug"
            >
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="underline decoration-amber-400/50 underline-offset-2">{settings.address}, {settings.city} ({settings.pincode})</span>
            </a>
            <p className="flex items-center gap-2 text-amber-100">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-200 font-mono">
                {settings.phoneNumber} {settings.phoneNumber2 ? `/ ${settings.phoneNumber2}` : ''}
              </span>
            </p>
            <p className="flex items-center gap-2 text-amber-100">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Open All 7 Days: 9:00 AM – 8:30 PM</span>
            </p>
          </div>

          {/* Showroom Specialties */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs font-serif mb-3">
              Our Varieties
            </h4>
            <ul className="space-y-2 text-amber-200/90">
              <li>01. Wholesale & Retail Punjabi Suits</li>
              <li>02. Bridal & Heavy Partywear Sets</li>
              <li>03. Pure Cotton & Daily Wear Suits</li>
              <li>04. Farshi Suits, Chinon Silk & Dupatta Sets</li>
            </ul>
          </div>

          {/* Showroom Visit & Inquiry Info */}
          <div className="space-y-3 bg-[#250509]/90 border border-amber-500/30 p-4 rounded-2xl text-xs">
            <h4 className="font-bold text-amber-200 flex items-center gap-1.5 font-serif">
              <Store className="w-4 h-4 text-amber-400" />
              <span>Visit Our Showroom</span>
            </h4>
            <p className="text-amber-300/90 text-[11px] leading-relaxed">
              ਸਾਡੀ ਦੁਕਾਨ 'ਤੇ ਹਰ ਰੋਜ਼ ਨਵੇਂ ਡਿਜ਼ਾਈਨ ਅਤੇ ਪਿਓਰ ਕੱਪੜੇ ਦੀ ਪੂਰੀ ਵਰਾਇਟੀ ਮਿਲਦੀ ਹੈ। ਕੋਈ ਵੀ ਸੂਟ ਪਸੰਦ ਆਉਣ 'ਤੇ WhatsApp ਰਾਹੀਂ ਪੁੱਛੋ ਜਾਂ ਸਿੱਧਾ ਦੁਕਾਨ 'ਤੇ ਵਿਜ਼ਿਟ ਕਰੋ।
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-amber-200 hover:bg-black/80 transition-colors font-mono bg-black/50 p-2 rounded-xl border border-amber-500/30 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Open Map Location</span>
              </span>
              <span className="font-bold text-amber-400">Maur Mandi ➔</span>
            </a>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-amber-800/50 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-300/80 gap-3">
          <p>© {new Date().getFullYear()} {settings.shopName} ({settings.firmName}). All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium text-amber-200">
            Designed & Developed with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> by{' '}
            <strong className="font-extrabold text-amber-300">Mr. Varun Goyal</strong> · Fluxaa Technologies
          </p>
        </div>
      </div>
    </footer>
  );
};
