import React from 'react';
import { ShopSettings } from '../types';
import { QrCode, Phone, MapPin, ShieldCheck, Sparkles, Heart, Clock, MessageSquare, ExternalLink, Navigation } from 'lucide-react';

interface FooterProps {
  settings: ShopSettings;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenTracker, onOpenAdmin }) => {
  const whatsappUrl = `https://wa.me/91${settings.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${settings.shopName}, I want to inquire about unstitched suits collection.`)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.shopName}, ${settings.address}, ${settings.city}`)}`;

  return (
    <footer className="bg-gradient-to-br from-[#1F0206] via-[#32080E] to-[#140104] text-amber-100 border-t-2 border-amber-500/40 mt-12 pb-24 sm:pb-12 shadow-2xl relative">
      
      {/* Top Gold Accent Bar */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] h-1.5 w-full shadow-md"></div>

      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info & Heritage */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-serif font-black text-2xl flex items-center justify-center border-2 border-amber-200 shadow-lg shrink-0">
                भ
              </div>
              <div>
                <h3 className="font-cinzel font-black text-xl text-amber-100 flex items-center gap-2">
                  {settings.shopName}
                  <span className="text-[10px] bg-amber-500/30 text-amber-300 font-mono font-extrabold px-2 py-0.5 rounded-md border border-amber-400/40">
                    ESTD. 1986
                  </span>
                </h3>
                <p className="text-xs text-amber-300 font-extrabold font-serif">{settings.firmName}</p>
              </div>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed font-light">
              Punjab's trusted legacy destination for unstitched pure cotton suits, Chinon silk dupattas, Gotta Patti embroidery & designer salwar material.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 border border-emerald-400/40"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-200" /> WhatsApp Support
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-900/80 hover:bg-amber-900 text-amber-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 border border-amber-500/40"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-400" /> Get Directions
              </a>
            </div>
          </div>

          {/* Shop Location & Contact Details */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-widest text-xs font-serif mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" /> Store Details
            </h4>
            <p className="flex items-start gap-2 text-amber-100 leading-snug">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{settings.address}, {settings.city} ({settings.pincode})</span>
            </p>
            <p className="flex items-center gap-2 text-amber-100">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-200">{settings.phoneNumber} / {settings.phoneNumber2}</span>
            </p>
            <p className="flex items-center gap-2 text-amber-100">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Store Open: 9:00 AM - 8:30 PM (All 7 Days)</span>
            </p>
            <p className="flex items-center gap-2 text-amber-100 pt-1">
              <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Official UPI ID: <strong className="font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">{settings.upiId}</strong></span>
            </p>
          </div>

          {/* Customer Services & Direct Tracking */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-widest text-xs font-serif mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Customer Assistance
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={onOpenTracker}
                  className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs shadow-xs"
                >
                  📮 Track Order & Speed Post Parcel Status ➔
                </button>
              </li>
              <li className="text-amber-200/90 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% Instant Payment via GPay, PhonePe, Paytm</span>
              </li>
              <li className="text-amber-200/90 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified Manual Order Processing & Billing</span>
              </li>
              <li className="text-amber-200/90 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>All-India Doorstep Delivery via Speed Post</span>
              </li>
            </ul>
          </div>

          {/* Pure Material Guarantee Banner */}
          <div className="space-y-3 bg-gradient-to-b from-[#4A0E17]/80 to-[#250509]/80 border border-amber-500/40 p-4 rounded-2xl backdrop-blur-md text-xs shadow-lg">
            <h4 className="font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5 font-serif">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> 100% Quality Assurance
            </h4>
            <p className="text-amber-300/90 text-[11px] leading-relaxed">
              Every suit piece is personally checked for authentic thread count, pure dye quality, and unstitched fabric length before sealing.
            </p>
            <div className="text-[10px] text-amber-200 font-mono bg-black/60 p-2 rounded-xl border border-amber-500/30 flex items-center justify-between">
              <span>📍 Direct Shop Dispatch</span>
              <span className="font-bold text-amber-400">{settings.city}</span>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-amber-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-300/80 gap-3">
          <p>© {new Date().getFullYear()} {settings.shopName} ({settings.firmName}). All rights reserved.</p>
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1">
              Handcrafted for Bhraava Di Hatti <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
