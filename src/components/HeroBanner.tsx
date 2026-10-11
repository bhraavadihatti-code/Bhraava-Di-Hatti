import React from 'react';
import { Sparkles, Phone, MapPin, Award, MessageCircle, Navigation } from 'lucide-react';
import { ShopSettings } from '../types';
import heroBannerImg from '../assets/images/hero_cloth_banner_1784686263964.jpg';

interface HeroBannerProps {
  settings: ShopSettings;
  onExploreCatalog: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onExploreCatalog }) => {
  const cleanPhone = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal ${settings.shopName}! I am browsing your online catalog and want to check suit availability.`
  )}`;
  const mapsUrl = settings.mapsUrl || 'https://maps.app.goo.gl/A2QC78d9DyRc3eRD6?g_st=ac';

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-amber-400/80 my-3 sm:my-4 bg-[#2B040B]">
      {/* Background Decorative Image */}
      <div className="absolute inset-0 opacity-25">
        <img
          src={heroBannerImg}
          alt="Bhraava Di Hatti Royal Collection"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2B040B] via-[#3A050E]/90 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 py-5 sm:px-8 sm:py-8 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-5">
        <div className="max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/50 text-amber-300 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-2.5">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{settings.firmName} • Maur Mandi</span>
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold font-serif text-amber-100 leading-tight">
            Royal Punjabi Unstitched Suits &amp; Bridal Collection
          </h2>
          
          <p className="text-amber-200/90 text-xs sm:text-sm md:text-base mt-2 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            ਪੰਜਾਬੀ ਸੂਟ, ਫਰਸ਼ੀ ਸਲਵਾਰ, ਪਿਓਰ ਕਾਟਨ ਅਤੇ ਦੁਪੱਟਾ ਸੂਟਾਂ ਦੀ ਸ਼ਾਨਦਾਰ ਵੈਰਾਇਟੀ — Direct showroom prices from <strong className="text-amber-300">{settings.shopName}</strong>, {settings.address}.
          </p>

          {/* Action Buttons */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
            <button
              onClick={onExploreCatalog}
              className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-red-950 font-extrabold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-red-900" />
              <span>View Latest Suits</span>
            </button>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-400/50 font-bold px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>Shop Map Location</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-700/90 hover:bg-emerald-600 text-white border border-emerald-400/40 font-bold px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
              <span>WhatsApp Inquiry</span>
            </a>
          </div>
        </div>

        {/* Showroom Contact Card on Right */}
        <div className="w-full lg:w-auto bg-black/35 backdrop-blur-xs border border-amber-400/30 rounded-xl p-3.5 sm:p-4 text-amber-100 flex flex-col sm:flex-row lg:flex-col justify-between gap-3 shrink-0">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">Showroom Address</p>
              <p className="font-semibold text-amber-100 mt-0.5">{settings.address}</p>
              <p className="text-amber-200/80 text-[11px]">{settings.city} - {settings.pincode}</p>
            </div>
          </div>

          <div className="h-px sm:h-auto sm:w-px lg:h-px lg:w-full bg-amber-400/20" />

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">Direct Showroom Call</p>
              <div className="flex flex-wrap gap-2 mt-0.5">
                <a href={`tel:${settings.phoneNumber}`} className="font-bold text-amber-100 hover:text-amber-300 underline">
                  +91 {settings.phoneNumber}
                </a>
                {settings.phoneNumber2 && (
                  <a href={`tel:${settings.phoneNumber2}`} className="font-bold text-amber-100 hover:text-amber-300 underline">
                    +91 {settings.phoneNumber2}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
