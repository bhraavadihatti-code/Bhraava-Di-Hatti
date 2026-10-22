import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShopSettings } from '../types';
import { 
  Phone, 
  MapPin, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Star, 
  ShoppingBag, 
  MessageCircle, 
  Printer, 
  Download, 
  Store, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  UserPlus, 
  Instagram, 
  Facebook, 
  Info,
  QrCode
} from 'lucide-react';

interface LinktreePageProps {
  settings: ShopSettings;
}

export const LinktreePage: React.FC<LinktreePageProps> = ({ settings }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'sticker'>('links');
  const [stickerFormat, setStickerFormat] = useState<'counter' | 'wall' | 'compact'>('counter');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  // Determine current public URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bhraavadihatti.in';
  // Use /links as the canonical link
  const publicLink = `${origin}/links`;

  const cleanPhone1 = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const cleanPhone2 = (settings.phoneNumber2 || '9915046357').replace(/[^0-9]/g, '');
  const mapsUrl = settings.mapsUrl || "https://maps.app.goo.gl/A2QC78d9DyRc3eRD6?g_st=ac";
  const upiId = settings.upiId || "boism-9417124082@boi";
  const payeeName = settings.payeeName || "Jai Durga Cloth Emporium";
  
  const whatsappUrl = `https://wa.me/91${cleanPhone1}?text=${encodeURIComponent(
    `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! I scanned your shop QR sticker at Bhraava Di Hatti (Maur Mandi). I would like to see your latest unstitched suit designs & inquire about prices.`
  )}`;

  const instagramUrl = settings.instagramUrl || "https://instagram.com/bhraava_di_hatti";
  const facebookUrl = settings.facebookUrl || "https://facebook.com/bhraavadihatti";
  const googleReviewUrl = settings.googleReviewUrl || mapsUrl;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopiedLink(true);
      showToast("🔗 Public Link copied! You can share it on WhatsApp or send to sticker printer.");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showToast("Could not copy link automatically.");
    }
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      showToast(`💳 UPI ID (${upiId}) copied to clipboard!`);
      setTimeout(() => setCopiedUpi(false), 3000);
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${settings.shopName} - ${settings.firmName}, Maur Mandi`,
          text: `Explore Bhraava Di Hatti (Jai Durga Cloth Emporium, Maur Mandi) - Unstitched Punjabi Suits, Farshi Suits & Cotton Fabrics!`,
          url: publicLink,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Download VCF Contact Card
  const handleDownloadContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:Cloth Emporium;Jai Durga;;;
FN:Bhraava Di Hatti (Jai Durga Cloth Emporium)
ORG:Jai Durga Cloth Emporium
TITLE:Unstitched Punjabi & Cotton Suits Showroom
TEL;TYPE=CELL,VOICE:+91${cleanPhone1}
TEL;TYPE=WORK,VOICE:+91${cleanPhone2}
ADR;TYPE=WORK:;;${settings.address};Maur Mandi;Punjab;${settings.pincode || '151509'};India
URL:${publicLink}
NOTE:Specialist in Unstitched Punjabi Suits, Farshi Salwar Suits, Cotton Suits & Boutique Material. Bus Stand Road, Maur Mandi.
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bhraava_Di_Hatti_Maur_Mandi.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📇 Shop Contact Card downloaded! Tap to save in your phone contacts.");
  };

  // Print Sticker trigger
  const handlePrintSticker = () => {
    window.print();
  };

  // Download High-Res QR Sticker PNG
  const handleDownloadQrPng = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) {
        showToast("QR code not found for download.");
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 1200;
      canvas.height = 1200;
      
      img.onload = () => {
        if (ctx) {
          // White background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw QR in center
          ctx.drawImage(img, 100, 100, 1000, 1000);
          
          const a = document.createElement('a');
          a.download = `Bhraava_Di_Hatti_QR_Sticker_${Date.now()}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
          showToast("📥 High-Res QR Code downloaded (1200x1200px)!");
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      showToast("Download failed, please take a screenshot or use Print.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#32080E] text-amber-100 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-400 flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar for QR Page */}
      <nav className="sticky top-0 z-40 bg-[#32080E] text-amber-50 shadow-md border-b border-amber-900/60 no-print">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-serif font-black text-xs sm:text-sm text-amber-200 truncate">
              {settings.shopName} · Official Links
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="bg-amber-900/70 hover:bg-amber-800 text-amber-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-700/60 cursor-pointer active:scale-95 transition-all"
              title="Share Link"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-amber-500 hover:bg-amber-400 text-[#32080E] px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
              title="Copy Public Page Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-900" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* View Switcher: Customer Linktree Links vs Shopkeeper Printable Sticker */}
        <div className="bg-amber-100/80 p-1.5 rounded-2xl border border-amber-300 flex items-center gap-1.5 shadow-2xs no-print">
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'links'
                ? 'bg-[#32080E] text-amber-100 shadow-sm'
                : 'text-amber-950 hover:bg-amber-200/70'
            }`}
          >
            <span>🔗 All Store Links (ਲਿੰਕਟ੍ਰੀ ਪੇਜ)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sticker')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sticker'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-950 hover:bg-amber-200/70'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ Print QR Sticker (ਸਟਿੱਕਰ)</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: CUSTOMER LINKTREE BIO-LINKS PAGE (Mobile-First Card) */}
        {/* ============================================================== */}
        {activeTab === 'links' && (
          <div className="space-y-5 animate-fade-in no-print">

            {/* Profile Header Card */}
            <div className="relative bg-gradient-to-b from-[#32080E] via-[#430B13] to-[#25050A] text-amber-50 rounded-3xl p-6 sm:p-8 text-center shadow-xl border-2 border-amber-500/40 overflow-hidden">
              {/* Decorative Punjabi Phulkari / Mandala motif background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-radial from-amber-400/15 via-transparent to-transparent pointer-events-none rounded-full blur-xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-radial from-amber-600/15 via-transparent to-transparent pointer-events-none rounded-full blur-xl" />

              {/* Royal Seal Avatar */}
              <div className="relative inline-block mb-3.5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-700 via-amber-400 to-amber-200 p-1 shadow-2xl mx-auto ring-4 ring-amber-500/30">
                  <div className="w-full h-full rounded-full bg-[#200407] flex flex-col items-center justify-center text-center p-2 border-2 border-amber-300">
                    <span className="text-xl sm:text-2xl font-serif font-black tracking-wider text-amber-300">
                      ਭਰਾਵਾਂ
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-200/90 tracking-widest uppercase">
                      ਦੀ ਹੱਟੀ
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-[#32080E] p-1.5 rounded-full shadow-md border-2 border-[#200407]" title="Verified Showroom">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Store Title & Firm */}
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
                  <span>Estd. 1986 (39+ Years)</span>
                </span>
              </div>

              {/* Live Timing Beacon */}
              <div className="mt-3.5 inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs px-3.5 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Showroom Open: 9:30 AM – 8:30 PM (Daily)</span>
              </div>

              <p className="text-xs text-amber-100/80 mt-3 max-w-md mx-auto leading-relaxed">
                Specialists in Unstitched Punjabi Suits, Farshi Salwar Suits, Pure Cotton & Partywear Fabrics. All-India Courier Despatch via India Post!
              </p>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="space-y-3">

              {/* 1. WHATSAPP CHAT & ORDER (Primary Call to Action) */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-98 border border-emerald-400/40"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm sm:text-base tracking-wide">ਵਟਸਐਪ ਤੇ ਗੱਲਬਾਤ / ਆਰਡਰ</span>
                      <span className="bg-emerald-900/60 text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Fast Reply</span>
                    </div>
                    <p className="text-xs text-emerald-100/90 mt-0.5">Chat & Order Suits on WhatsApp (94171-24082)</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0" />
              </a>

              {/* 2. WHATSAPP SUIT PHOTOS & DESIGNS */}
              <a
                href={`https://wa.me/91${cleanPhone1}?text=${encodeURIComponent(
                  `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਨੂੰ ਭਰਾਵਾਂ ਦੀ ਹੱਟੀ (ਮੌੜ ਮੰਡੀ) ਦੇ ਨਵੇਂ ਪੰਜਾਬੀ ਸੂਟਾਂ ਦੀਆਂ ਫੋਟੋਆਂ ਅਤੇ ਰੇਟ ਵਟਸਐਪ 'ਤੇ ਭੇਜੋ ਜੀ।`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-[#32080E] via-[#480d16] to-[#32080E] hover:from-[#430B13] hover:to-[#55101b] text-amber-100 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-98 border border-amber-500/50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-6 h-6 text-amber-300" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-white tracking-wide">ਨਵੇਂ ਸੂਟਾਂ ਦੀਆਂ ਫੋਟੋਆਂ ਮੰਗਵਾਓ</span>
                      <span className="bg-amber-400 text-[#32080E] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Photos</span>
                    </div>
                    <p className="text-xs text-amber-200/80 mt-0.5">Get latest Punjabi, Farshi & Cotton Suit Photos on WhatsApp</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-amber-300 group-hover:translate-x-1 transition-transform shrink-0" />
              </a>

              {/* 3. GOOGLE MAPS NAVIGATION */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between p-4 bg-white hover:bg-amber-50 text-stone-900 rounded-2xl shadow-xs hover:shadow-md transition-all border border-amber-200/90 active:scale-98"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-sm sm:text-base text-stone-900 block">ਦੁਕਾਨ ਦੀ ਲੋਕੇਸ਼ਨ (Google Maps)</span>
                    <p className="text-xs text-stone-600 mt-0.5">Bus Stand Road, Maur Mandi, Distt. Bathinda, Punjab</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-stone-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </a>

              {/* 4. DIRECT CALL SHOWROOM (Double Action) */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-black uppercase text-amber-950 tracking-wider">ਦੁਕਾਨ ਤੇ ਸਿੱਧਾ ਫੋਨ ਕਰੋ (Direct Call)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`tel:+91${cleanPhone1}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl font-bold text-xs sm:text-sm border border-amber-300 transition-colors"
                  >
                    <span>📞 {settings.phoneNumber || '94171-24082'}</span>
                    <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-extrabold">Primary</span>
                  </a>
                  <a
                    href={`tel:+91${cleanPhone2}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-xl font-bold text-xs sm:text-sm border border-stone-300 transition-colors"
                  >
                    <span>📞 {settings.phoneNumber2 || '99150-46357'}</span>
                    <span className="text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-700 font-extrabold">Store 2</span>
                  </a>
                </div>
              </div>

              {/* 5. GOOGLE 5-STAR REVIEW */}
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-950 rounded-2xl shadow-xs transition-all border border-amber-300 active:scale-98"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Star className="w-6 h-6 fill-amber-950" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm sm:text-base text-amber-950">ਗੂਗਲ ਤੇ 5-ਸਟਾਰ ਰਿਵਿਊ ਦਿਓ</span>
                      <span className="text-xs">⭐⭐⭐⭐⭐</span>
                    </div>
                    <p className="text-xs text-amber-900/80 mt-0.5">Rate our suits & customer service on Google</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-amber-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>

              {/* 6. INSTAGRAM & FACEBOOK SOCIAL GRID */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-1.5 group active:scale-95"
                >
                  <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-extrabold text-xs sm:text-sm">Instagram</span>
                  <span className="text-[10px] text-white/90">@bhraava_di_hatti</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-1.5 group active:scale-95"
                >
                  <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-extrabold text-xs sm:text-sm">Facebook Page</span>
                  <span className="text-[10px] text-white/90">Bhraava Di Hatti</span>
                </a>
              </div>

              {/* 7. SAVE CONTACT (vCard) & SHOP UPI PAY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                {/* Save Contact to Phone */}
                <button
                  type="button"
                  onClick={handleDownloadContact}
                  className="p-3.5 bg-white hover:bg-amber-50 border border-amber-300 rounded-2xl shadow-2xs flex items-center justify-center gap-2.5 font-extrabold text-xs sm:text-sm text-stone-900 transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-amber-800" />
                  <span>ਫੋਨ ਵਿੱਚ ਸੰਪਰਕ ਸੇਵ ਕਰੋ (Save Contact)</span>
                </button>

                {/* Copy UPI ID */}
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-3.5 bg-white hover:bg-amber-50 border border-amber-300 rounded-2xl shadow-2xs flex items-center justify-center gap-2.5 font-extrabold text-xs sm:text-sm text-stone-900 transition-all cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>{copiedUpi ? '✓ UPI Copied!' : 'Pay via UPI (Copy ID)'}</span>
                </button>

              </div>

            </div>

            {/* Public Link Card for QR Sharing */}
            <div className="bg-amber-100/70 p-4 rounded-2xl border border-amber-300/80 text-center space-y-2">
              <span className="text-xs font-bold text-amber-950 block">ਇਸ ਪੇਜ ਦਾ ਪਬਲਿਕ ਲਿੰਕ (Public Shareable Link):</span>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-amber-300 max-w-md mx-auto">
                <input
                  type="text"
                  readOnly
                  value={publicLink}
                  className="flex-1 text-xs font-mono text-stone-700 bg-transparent select-all outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-amber-800 hover:bg-amber-900 text-amber-100 px-3 py-1 rounded-lg text-xs font-bold shrink-0 cursor-pointer active:scale-95"
                >
                  {copiedLink ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-amber-900/80">
                You can print this link on shop stickers or send it to your WhatsApp broadcast customers.
              </p>
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-4 pb-8 space-y-1 text-stone-500 text-xs">
              <p className="font-bold text-stone-700 font-serif">
                {settings.shopName} • {settings.firmName}
              </p>
              <p>Bus Stand Road, Maur Mandi, Bathinda, Punjab - 151509</p>
              <p className="text-[11px] text-stone-400">GST: 03AABCU9603R1ZM • Speed Post Despatch Across India</p>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: SHOPKEEPER PRINTABLE QR STICKER STUDIO (For Store Counters) */}
        {/* ============================================================== */}
        {activeTab === 'sticker' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Control Bar (Hidden when printing) */}
            <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-sm space-y-3 no-print">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-1.5">
                    <span>🖨️</span> Shop QR Sticker Generator (ਸਟਿੱਕਰ ਪ੍ਰਿੰਟਰ)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Print high-resolution QR stickers for your shop counters, front doors, or carry bags.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrPng}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-stone-300 cursor-pointer active:scale-95"
                    title="Download PNG image for flex / printing press"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintSticker}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Sticker Now</span>
                  </button>
                </div>
              </div>

              {/* Format Selector */}
              <div className="pt-2 border-t border-stone-200 flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-stone-700">Choose Sticker Size:</span>
                {[
                  { id: 'counter', label: '🪑 Counter / Table Standee (4" x 6")' },
                  { id: 'wall', label: '🚪 Wall / Door Poster (A4)' },
                  { id: 'compact', label: '🏷️ Compact Bag / Card (3" x 3")' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setStickerFormat(fmt.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                      stickerFormat === fmt.id
                        ? 'bg-[#32080E] text-amber-200 shadow-2xs'
                        : 'bg-amber-50 text-stone-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ========================================== */}
            {/* THE PRINTABLE STICKER CANVAS */}
            {/* ========================================== */}
            <div className="flex justify-center">
              
              {/* STICKER CONTAINER */}
              <div 
                ref={qrRef}
                className={`print-container bg-white text-stone-900 border-4 border-amber-600 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all text-center ${
                  stickerFormat === 'compact'
                    ? 'w-full max-w-xs'
                    : stickerFormat === 'wall'
                    ? 'w-full max-w-lg'
                    : 'w-full max-w-md'
                }`}
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)'
                }}
              >
                {/* Decorative Royal Corner Embellishments */}
                <div className="absolute top-2 left-2 text-amber-600 text-lg select-none">❖</div>
                <div className="absolute top-2 right-2 text-amber-600 text-lg select-none">❖</div>
                <div className="absolute bottom-2 left-2 text-amber-600 text-lg select-none">❖</div>
                <div className="absolute bottom-2 right-2 text-amber-600 text-lg select-none">❖</div>

                {/* Inner Border */}
                <div className="border-2 border-dashed border-amber-400/90 rounded-2xl p-4 sm:p-5 space-y-4">
                  
                  {/* Top Heading */}
                  <div className="space-y-1">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-3 py-0.5 rounded-full inline-block border border-amber-300">
                      ★ ESTD. 1986 • MAUR MANDI ★
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black font-serif text-[#32080E] tracking-tight">
                      {settings.shopName}
                    </h2>
                    <p className="text-xs sm:text-sm font-extrabold text-amber-800">
                      {settings.firmName}
                    </p>
                    <p className="text-[11px] text-stone-600 font-medium">
                      Bus Stand Road, Maur Mandi (Bathinda, Punjab)
                    </p>
                  </div>

                  {/* QR Code Wrapper with High Contrast */}
                  <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-stone-900 inline-block shadow-md mx-auto">
                    <QRCodeSVG
                      value={publicLink}
                      size={stickerFormat === 'wall' ? 240 : stickerFormat === 'compact' ? 160 : 190}
                      level="H"
                      includeMargin={false}
                      className="mx-auto"
                    />
                  </div>

                  {/* Scan Instructions */}
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#32080E] text-amber-200 px-3.5 py-1 rounded-full text-xs sm:text-sm font-black shadow-xs">
                      <span>📷</span>
                      <span>ਕੈਮਰੇ ਨਾਲ ਸਕੈਨ ਕਰੋ (SCAN WITH CAMERA)</span>
                    </div>

                    <p className="text-xs font-bold text-stone-800">
                      ✨ Suit Catalog • WhatsApp Order • Location • Reviews
                    </p>
                    <p className="text-[11px] text-stone-500 font-medium">
                      ਸਾਰੇ ਸੂਟਾਂ ਦੀ ਕੈਟਾਲਾਗ ਅਤੇ ਵਟਸਐਪ ਆਰਡਰ ਲਈ ਸਕੈਨ ਕਰੋ
                    </p>
                  </div>

                  {/* Phone & Contact Footer on Sticker */}
                  <div className="pt-2 border-t border-amber-300/80 flex items-center justify-center gap-3 text-xs font-black text-amber-950 flex-wrap">
                    <span>📞 {settings.phoneNumber || '94171-24082'}</span>
                    <span>•</span>
                    <span>📞 {settings.phoneNumber2 || '99150-46357'}</span>
                  </div>

                  <div className="text-[9px] text-stone-400 font-mono">
                    {publicLink}
                  </div>

                </div>

              </div>

            </div>

            {/* Sticker Printing Instructions for the Shopkeeper */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 text-xs text-amber-950 space-y-2 no-print">
              <h4 className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <Info className="w-4 h-4" />
                <span>ਦੁਕਾਨ ਤੇ ਸਟਿੱਕਰ ਲਗਾਉਣ ਲਈ ਨਿਰਦੇਸ਼ (Printing Guide):</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-amber-900/90 text-[11px]">
                <li>
                  <b>Self-Adhesive Sticker Paper:</b> You can print this directly onto glossy sticker sheets (A4 or 4x6 size) using any normal desk printer.
                </li>
                <li>
                  <b>Flex / Press Printing:</b> Click <b>"Download PNG"</b> above to save the high-resolution file and WhatsApp it to any local printing press in Maur Mandi for waterproof vinyl counter stickers or sunboard standees.
                </li>
                <li>
                  <b>Counter Placement:</b> Stick it near the billing counter, payment QR area, and front glass door so customers can easily scan while waiting.
                </li>
              </ul>
            </div>

          </div>
        )}

      </main>

      {/* Print-specific style tag */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            border: 2px solid #000 !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
};
