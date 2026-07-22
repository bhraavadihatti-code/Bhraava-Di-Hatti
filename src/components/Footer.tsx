import React from 'react';
import { ShopSettings } from '../types';
import { QrCode, Phone, MapPin, ShieldCheck, Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  settings: ShopSettings;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenTracker, onOpenAdmin }) => {
  return (
    <footer className="bg-gradient-to-br from-amber-950 via-red-950 to-amber-900 text-amber-100 border-t border-amber-800/50 mt-12 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-serif font-bold text-xl flex items-center justify-center border border-amber-400/30">
                भ
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl text-amber-100">{settings.shopName}</h3>
                <p className="text-xs text-amber-300 font-medium">{settings.firmName}</p>
              </div>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed font-light">
              Quality Traditional Punjabi Ethnic Wear, Pure Silks, Unstitched Suits & Designer Bridal Wear.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs font-serif mb-3">
              Shop Store Location
            </h4>
            <p className="flex items-start gap-2 text-amber-100">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{settings.address}, {settings.city} ({settings.pincode})</span>
            </p>
            <p className="flex items-center gap-2 text-amber-100">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.phoneNumber}</span>
            </p>
            <p className="flex items-center gap-2 text-amber-100">
              <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
              <span>UPI: <strong className="font-mono text-amber-300">{settings.upiId}</strong></span>
            </p>
          </div>

          {/* Customer Support & Quick Links */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs font-serif mb-3">
              Customer Services
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenTracker} className="hover:text-amber-300 transition-colors">
                  ➔ Track Order Status
                </button>
              </li>
              <li>
                <span className="text-amber-200/80">➔ 100% Online Payment via UPI & QR</span>
              </li>
              <li>
                <span className="text-amber-200/80">➔ Manual Payment Verification by Shop Owner</span>
              </li>
              <li>
                <span className="text-amber-200/80">➔ Direct Doorstep Courier Delivery</span>
              </li>
            </ul>
          </div>

          {/* Shop Owner Portal Quick Link */}
          <div className="space-y-3 bg-amber-900/40 border border-amber-700/50 p-4 rounded-2xl backdrop-blur-sm text-xs">
            <h4 className="font-bold text-amber-200 uppercase tracking-wider">
              Store Manager Access
            </h4>
            <p className="text-amber-300/80 text-[11px]">
              Access admin portal to view incoming orders with UTR numbers, accept orders, and manage stock.
            </p>
            <button
              onClick={onOpenAdmin}
              className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold py-2 rounded-xl text-xs shadow-md transition-colors"
            >
              Open Owner Admin Panel
            </button>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-amber-800/50 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-300/70 gap-3">
          <p>© {new Date().getFullYear()} {settings.shopName} ({settings.firmName}). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Handcrafted for Bhraava Di Hatti <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
