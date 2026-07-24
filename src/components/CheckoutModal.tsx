import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CartItem, CustomerDetails, Order, ShopSettings } from '../types';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle,
  Truck,
  ArrowLeft,
  PackageCheck,
  Tag
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  settings: ShopSettings;
  onOrderPlacedSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  settings,
  onOrderPlacedSuccess
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Customer form state
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: settings.city || 'Bathinda, Punjab',
    state: 'Punjab',
    pincode: settings.pincode || '151509',
    notes: ''
  });

  // UTR / UTS Transaction Reference Number state
  const [utrNumber, setUtrNumber] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= settings.minOrderForFreeShipping || subtotal === 0 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;

  // UPI payment deep link string
  const upiString = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.payeeName)}&am=${totalAmount}&cu=INR&tn=BDH-Suit-Order`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.fullName.trim() || !customer.phone.trim() || !customer.address.trim() || !customer.pincode.trim()) {
      setErrorMessage('Please complete all required address fields.');
      return;
    }
    setErrorMessage('');
    setStep('payment');
  };

  const handleSubmitOrder = async () => {
    if (!utrNumber.trim()) {
      setErrorMessage('Please enter the 12-digit UTR / UTS Transaction Reference Number from your UPI payment app.');
      return;
    }

    if (utrNumber.trim().length < 6) {
      setErrorMessage('Please enter a valid UTR / UTS Reference Number (usually 12 digits).');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const newOrderId = `BDH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderToSubmit: Order = {
      id: newOrderId,
      utsNumber: utrNumber.trim(),
      createdAt: new Date().toISOString(),
      customer,
      items: cartItems,
      subtotal,
      discount: 0,
      shippingFee,
      totalAmount,
      payment: {
        method: 'UPI_QR',
        upiIdUsed: settings.upiId,
        utrNumber: utrNumber.trim(),
        paymentTimestamp: new Date().toISOString(),
        verifiedByAdmin: false
      },
      status: 'pending_acceptance'
    };

    // 1. Immediately persist in local customer orders store so order is never lost
    try {
      const saved = localStorage.getItem('bdh_customer_orders');
      const existing: Order[] = saved ? JSON.parse(saved) : [];
      const updated = [orderToSubmit, ...existing.filter(o => o.id !== orderToSubmit.id)];
      localStorage.setItem('bdh_customer_orders', JSON.stringify(updated));
    } catch (e) {}

    // 2. Post to central server
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderToSubmit)
      });

      if (response.ok) {
        const savedOrder: Order = await response.json();
        onOrderPlacedSuccess(savedOrder);
      } else {
        console.warn('Server responded with non-200 status when creating order, queued in local store');
        onOrderPlacedSuccess(orderToSubmit);
      }
    } catch (err: any) {
      console.warn('Network issue saving order to server, queued in local store:', err);
      onOrderPlacedSuccess(orderToSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-300 my-auto">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#32080E] via-[#4A0E17] to-[#200307] p-4 text-amber-50 flex items-center justify-between border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            {step === 'payment' && (
              <button 
                type="button"
                onClick={() => setStep('address')}
                className="p-1 rounded-xl text-amber-300 hover:text-white hover:bg-white/10 active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/40 shrink-0">
              <PackageCheck className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="font-cinzel font-black text-base text-amber-100 leading-tight">
                {step === 'address' ? '1. Delivery Address' : '2. Instant UPI & QR Payment'}
              </h2>
              <p className="text-[10px] text-amber-300/80 font-mono">{settings.shopName} ({settings.firmName})</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Bar */}
        <div className="bg-amber-50/90 px-6 py-2.5 border-b border-amber-200 flex items-center justify-around text-xs font-bold">
          <span className={`flex items-center gap-1.5 ${step === 'address' ? 'text-amber-950 font-black' : 'text-emerald-700'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'address' ? 'bg-amber-800 text-white' : 'bg-emerald-600 text-white'}`}>1</span>
            Shipping Address
          </span>
          <span className="text-amber-400">➔</span>
          <span className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-amber-950 font-black' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'payment' ? 'bg-amber-800 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
            Payment & UTR
          </span>
        </div>

        {/* Items Brief Summary Pill Box */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 p-3 px-4 border-b border-amber-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-extrabold text-amber-950 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-700" /> Order Items ({cartItems.length}):
            </span>
            <span className="font-mono font-black text-amber-900 text-sm">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white border border-amber-200 p-1.5 rounded-xl shrink-0 shadow-2xs">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-9 h-9 rounded-lg object-cover border border-amber-300 shrink-0"
                />
                <div className="pr-1 text-[10px]">
                  <p className="font-bold text-gray-900 truncate max-w-[120px]">{item.product.name}</p>
                  <p className="text-gray-500 font-mono">Qty: {item.quantity} • ₹{item.product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="m-4 mb-0 bg-red-50 border-2 border-red-200 text-red-900 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Address Details Form */}
        {step === 'address' && (
          <form onSubmit={handleNextToPayment} className="p-4 sm:p-6 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1">
                  Full Receiver Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gurpreet Kaur / Singh"
                  value={customer.fullName}
                  onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                  className="w-full bg-stone-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-amber-950 mb-1">
                  Mobile Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9814012345"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full bg-stone-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-amber-950 mb-1">
                Full Street Delivery Address <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="House No., Street Name, Colony / Village, Nearby Landmark..."
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                className="w-full bg-stone-50 border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-[11px] font-black text-amber-950 mb-1">City / Town <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  className="w-full bg-stone-50 border border-gray-300 rounded-xl px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-amber-950 mb-1">State <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  value={customer.state}
                  onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                  className="w-full bg-stone-50 border border-gray-300 rounded-xl px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-amber-950 mb-1">Pincode <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="151509"
                  value={customer.pincode}
                  onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                  className="w-full bg-stone-50 border border-gray-300 rounded-xl px-2.5 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white"
                />
              </div>
            </div>

            {/* Delivery Guarantee Pill */}
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-emerald-950">Speed Post Parcel Doorstep Delivery</span>
              </div>
              <span className="text-emerald-800 font-extrabold text-[11px]">
                {shippingFee === 0 ? 'FREE Shipping' : `+ ₹${shippingFee}`}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-800 to-amber-900 hover:from-red-900 hover:to-amber-950 active:scale-98 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PROCEED TO UPI PAYMENT</span>
              <span className="text-amber-300">➔</span>
            </button>

          </form>
        )}

        {/* STEP 2: UPI & QR Payment with UTR input */}
        {step === 'payment' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            
            {/* Amount Banner */}
            <div className="bg-gradient-to-r from-[#32080E] via-[#4A0E17] to-[#200307] text-white p-4 rounded-2xl flex items-center justify-between shadow-md border border-amber-400/50">
              <div>
                <p className="text-[10px] text-amber-300 uppercase font-mono tracking-widest font-bold">Total Exact Amount To Pay</p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right text-xs text-amber-100">
                <p className="font-extrabold text-amber-200">{settings.payeeName}</p>
                <p className="text-[10px] text-amber-300/80 font-serif">{settings.shopName}</p>
              </div>
            </div>

            {/* QR Code & Direct Apps Box */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-amber-300/80 flex flex-col items-center text-center space-y-3">
              <p className="text-xs font-black text-amber-950">
                Scan QR Code using GPay, PhonePe, Paytm, or BHIM:
              </p>

              {/* Dynamic QR SVG */}
              <div className="bg-white p-3 rounded-2xl border-2 border-amber-400 shadow-lg">
                <QRCodeSVG
                  value={upiString}
                  size={165}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Copyable UPI ID */}
              <div className="flex items-center gap-2 bg-white border-2 border-amber-300 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
                <span className="text-gray-500 font-bold">UPI ID:</span>
                <span className="font-mono font-black text-amber-950">{settings.upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 hover:bg-amber-100 rounded-lg text-amber-900 transition-colors"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Mobile Deep Link UPI Apps */}
              <div className="w-full pt-1">
                <p className="text-[11px] font-bold text-stone-600 mb-1.5">Tap your app to pay directly on phone:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" /> GPay
                  </a>
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" /> PhonePe
                  </a>
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-cyan-600" /> Paytm
                  </a>
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-orange-600" /> BHIM UPI
                  </a>
                </div>
              </div>

            </div>

            {/* UTR / UTS NUMBER INPUT */}
            <div className="bg-amber-50/90 border-2 border-amber-400 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-amber-950 uppercase tracking-wide">
                  Enter UTR / UTS / Reference No. <span className="text-red-600">*</span>
                </label>
                <span className="text-[10px] text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md font-bold">
                  Mandatory Verification
                </span>
              </div>

              <p className="text-[11px] text-amber-900 leading-snug">
                After completing payment in GPay/PhonePe/Paytm, copy the 12-digit UTR/UTS Transaction Reference Number from receipt and paste below:
              </p>

              <input
                type="text"
                required
                placeholder="e.g. 420819234812"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full bg-white border-2 border-amber-500 font-mono font-black text-gray-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-700 uppercase tracking-wider shadow-inner"
              />

              <div className="text-[10px] text-stone-600 flex items-center gap-1 pt-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Found under payment app receipt "UTR / Reference No."</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting}
              className={`w-full bg-gradient-to-r from-red-800 via-amber-900 to-red-950 hover:from-red-900 hover:to-amber-950 active:scale-98 text-white font-black py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 text-sm cursor-pointer border border-amber-400/50 ${
                submitting ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {submitting ? (
                <span>Submitting & Notifying Shop Owner...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>VERIFY PAYMENT & PLACE ORDER</span>
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
