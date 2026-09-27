import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CartItem, CustomerDetails, Order, ShopSettings } from '../types';
import { syncOrderToGoogleSheets } from '../lib/googleSheetsService';
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
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI_QR'>('COD');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fixed unique Order ID generated when checkout modal opens
  const [currentOrderId] = useState(() => `BDH-2026-${Math.floor(10000 + Math.random() * 90000)}`);

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

  // UTR / UTS Transaction Reference Number state (for UPI)
  const [utrNumber, setUtrNumber] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
  const shippingFee = subtotal >= settings.minOrderForFreeShipping || subtotal === 0 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;

  // UPI payment deep link string
  const upiString = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.payeeName)}&am=${totalAmount}&cu=INR&tn=BDH-Suit-Order`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.fullName.trim() || !customer.phone.trim() || !customer.address.trim() || !customer.pincode.trim()) {
      setErrorMessage('ਕਿਰਪਾ ਕਰਕੇ ਪੂਰਾ ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ, ਪਤਾ ਅਤੇ ਪਿਨਕੋਡ ਦਰਜ ਕਰੋ।');
      return;
    }
    if (customer.phone.trim().length < 8) {
      setErrorMessage('ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।');
      return;
    }
    setErrorMessage('');
    setIsVerifyingAddress(true);

    const webhookUrl = settings.googleSheetWebhookUrl || "https://script.google.com/macros/s/AKfycbwJrtBmrcGAKu41hddYZNltiQiFFg_WNfLhluhTJSW1tkOU4aWKE1D0-11MRqekMjjj/exec";

    // Draft Order with Status "Wait" sent to Google Sheet
    const draftOrder: Order = {
      id: currentOrderId,
      utsNumber: 'AWAITING-PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer,
      items: cartItems,
      subtotal,
      discount: 0,
      shippingFee,
      totalAmount,
      payment: {
        method: paymentMethod,
        upiIdUsed: settings.upiId,
        utrNumber: '',
        paymentTimestamp: new Date().toISOString(),
        paymentStatus: 'Pending',
        verifiedByAdmin: false
      },
      status: 'Wait' as any
    };

    try {
      const res = await syncOrderToGoogleSheets(draftOrder, 'save_order', webhookUrl);
      if (res.success) {
        setStep('payment');
      } else {
        setErrorMessage('❌ ਗੂਗਲ ਸ਼ੀਟ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਇੰਟਰਨੈੱਟ ਚੈੱਕ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।');
      }
    } catch (err: any) {
      setErrorMessage('❌ ਨੈੱਟਵਰਕ ਐਰਰ: ਆਰਡਰ ਸ਼ੀਟ ਵਿੱਚ ਦਰਜ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।');
    } finally {
      setIsVerifyingAddress(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (submitting) return;

    if (paymentMethod === 'UPI_QR' && !utrNumber.trim()) {
      setErrorMessage('Please enter the UTR / UTS Transaction Reference Number from your UPI payment app.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const orderToSubmit: Order = {
      id: currentOrderId,
      utsNumber: utrNumber.trim() || `COD-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer,
      items: cartItems,
      subtotal,
      discount: 0,
      shippingFee,
      totalAmount,
      payment: {
        method: paymentMethod,
        upiIdUsed: paymentMethod === 'UPI_QR' ? settings.upiId : '',
        utrNumber: utrNumber.trim(),
        paymentTimestamp: new Date().toISOString(),
        paymentStatus: 'Pending',
        verifiedByAdmin: false
      },
      status: 'Pending'
    };

    const webhookUrl = settings.googleSheetWebhookUrl || "https://script.google.com/macros/s/AKfycbwJrtBmrcGAKu41hddYZNltiQiFFg_WNfLhluhTJSW1tkOU4aWKE1D0-11MRqekMjjj/exec";

    // 1. Direct mobile client-to-Google Sheets pipeline: Update Status from "Wait" to "Pending"
    try {
      await syncOrderToGoogleSheets(orderToSubmit, 'save_order', webhookUrl);
      console.log('Order successfully delivered to Google Sheet as Pending!');
    } catch (err) {
      console.warn('Direct client Google Sheets sync error:', err);
    }

    // 2. Post to central Express server (updates local json, SSE stream, and Telegram alerts)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderToSubmit)
      });

      if (response.ok) {
        const savedOrder: Order = await response.json().catch(() => orderToSubmit);
        onOrderPlacedSuccess(savedOrder || orderToSubmit);
      } else {
        onOrderPlacedSuccess(orderToSubmit);
      }
    } catch (err: any) {
      console.warn('Network issue saving order to server (client direct sync already triggered):', err);
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
                  src={item.product?.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
                  alt={item.product?.name || "Suit"}
                  className="w-9 h-9 rounded-lg object-cover border border-amber-300 shrink-0"
                />
                <div className="pr-1 text-[10px]">
                  <p className="font-bold text-gray-900 truncate max-w-[120px]">{item.product?.name || "Suit"}</p>
                  <p className="text-gray-500 font-mono">Qty: {item.quantity} • ₹{item.product?.price || 0}</p>
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
              disabled={isVerifyingAddress}
              className={`w-full bg-gradient-to-r from-red-800 to-amber-900 hover:from-red-900 hover:to-amber-950 active:scale-98 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 ${isVerifyingAddress ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
            >
              {isVerifyingAddress ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ਸ਼ੀਟ ਵਿੱਚ ਦਰਜ ਹੋ ਰਿਹਾ ਹੈ... (Verifying with Google Sheet)</span>
                </>
              ) : (
                <>
                  <span>PROCEED TO UPI PAYMENT</span>
                  <span className="text-amber-300">➔</span>
                </>
              )}
            </button>

          </form>
        )}

        {/* STEP 2: Payment Method Choice (COD Default / UPI QR) */}
        {step === 'payment' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            
            {/* Amount Banner */}
            <div className="bg-gradient-to-r from-[#32080E] via-[#4A0E17] to-[#200307] text-white p-4 rounded-2xl flex items-center justify-between shadow-md border border-amber-400/50">
              <div>
                <p className="text-[10px] text-amber-300 uppercase font-mono tracking-widest font-bold">Total Exact Amount</p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right text-xs text-amber-100">
                <p className="font-extrabold text-amber-200">{settings.payeeName}</p>
                <p className="text-[10px] text-amber-300/80 font-serif">{settings.shopName}</p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-stone-50 border-2 border-amber-300/80 rounded-2xl p-3.5 space-y-2.5">
              <p className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Select Payment Mode:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'COD'
                      ? 'border-amber-700 bg-amber-100/80 text-amber-950 font-black shadow-xs'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">💵 Cash on Delivery</span>
                    {paymentMethod === 'COD' && <Check className="w-4 h-4 text-emerald-700" />}
                  </div>
                  <span className="text-[10px] text-stone-500 font-normal mt-1">Pay when package arrives</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI_QR')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'UPI_QR'
                      ? 'border-amber-700 bg-amber-100/80 text-amber-950 font-black shadow-xs'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">📱 UPI / QR Code</span>
                    {paymentMethod === 'UPI_QR' && <Check className="w-4 h-4 text-emerald-700" />}
                  </div>
                  <span className="text-[10px] text-stone-500 font-normal mt-1">GPay, PhonePe, Paytm</span>
                </button>
              </div>
            </div>

            {/* If COD Selected */}
            {paymentMethod === 'COD' && (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl space-y-1.5 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>Cash on Delivery Confirmed</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Your order will be verified by Bhraava Di Hatti staff and dispatched via India Post Speed Post. You pay ₹{totalAmount.toLocaleString('en-IN')} upon delivery.
                </p>
              </div>
            )}

            {/* If UPI Selected: QR Code & Direct Apps Box */}
            {paymentMethod === 'UPI_QR' && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-amber-300/80 flex flex-col items-center text-center space-y-3">
                <p className="text-xs font-black text-amber-950">
                  Scan QR Code using GPay, PhonePe, Paytm, or BHIM:
                </p>

                {/* Dynamic QR SVG */}
                <div className="bg-white p-3 rounded-2xl border-2 border-amber-400 shadow-lg">
                  <QRCodeSVG
                    value={upiString}
                    size={155}
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

                {/* UTR / UTS NUMBER INPUT */}
                <div className="w-full bg-amber-50/90 border-2 border-amber-400 p-3.5 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-amber-950 uppercase tracking-wide">
                      Enter UTR / UTS / Reference No. <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[10px] text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md font-bold">
                      Required
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. 420819234812"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full bg-white border-2 border-amber-500 font-mono font-black text-gray-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-700 uppercase tracking-wider shadow-inner"
                  />
                </div>

              </div>
            )}

            {/* Submit Button with Duplicate Click Prevention */}
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting}
              className={`w-full bg-gradient-to-r from-red-800 via-amber-900 to-red-950 hover:from-red-900 hover:to-amber-950 active:scale-98 text-white font-black py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 text-sm cursor-pointer border border-amber-400/50 ${
                submitting ? 'opacity-70 cursor-wait pointer-events-none' : ''
              }`}
            >
              {submitting ? (
                <span>Saving Order to Central Database...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>
                    {paymentMethod === 'COD' ? 'CONFIRM & PLACE ORDER (COD)' : 'VERIFY PAYMENT & PLACE ORDER'}
                  </span>
                </>
              )}
            </button>


          </div>
        )}

      </div>
    </div>
  );
};
