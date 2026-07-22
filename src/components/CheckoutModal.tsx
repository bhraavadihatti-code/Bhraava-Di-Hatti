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
  ArrowLeft
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
    city: settings.city || 'Amritsar',
    state: 'Punjab',
    pincode: '143001',
    notes: ''
  });

  // UTR / UTS Transaction Reference Number state
  const [utrNumber, setUtrNumber] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = subtotal > 0 ? 100 : 0; // UPI instant discount
  const shippingFee = subtotal >= settings.minOrderForFreeShipping ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - discount + shippingFee);

  // UPI payment deep link string
  const upiString = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.payeeName)}&am=${totalAmount}&cu=INR&tn=BDH-Cloth-Order`;

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

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: cartItems,
          subtotal,
          discount,
          shippingFee,
          totalAmount,
          payment: {
            method: 'UPI_QR',
            upiIdUsed: settings.upiId,
            utrNumber: utrNumber.trim()
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to place order.');
      }

      const newOrder: Order = await response.json();
      onOrderPlacedSuccess(newOrder);

    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing order. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-amber-200 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-amber-900 to-amber-950 p-4 text-amber-50 flex items-center justify-between border-b border-amber-800">
          <div className="flex items-center gap-2">
            {step === 'payment' && (
              <button 
                onClick={() => setStep('address')}
                className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <QrCode className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="font-serif font-bold text-base text-amber-100">
                {step === 'address' ? 'Delivery Address' : 'Online UPI & QR Payment'}
              </h2>
              <p className="text-[10px] text-amber-200/80">{settings.firmName} ({settings.shopName})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-amber-50/80 px-6 py-2 border-b border-amber-200 flex items-center justify-around text-xs font-semibold">
          <span className={`flex items-center gap-1.5 ${step === 'address' ? 'text-amber-900 font-bold' : 'text-green-700'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-800 text-white flex items-center justify-center text-[11px]">1</span>
            Address Details
          </span>
          <span className="text-amber-300">➔</span>
          <span className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-amber-900 font-bold' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'payment' ? 'bg-amber-800 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
            UPI Payment & UTR
          </span>
        </div>

        {errorMessage && (
          <div className="m-4 mb-0 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Address Details Form */}
        {step === 'address' && (
          <form onSubmit={handleNextToPayment} className="p-5 sm:p-6 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gurpreet Singh"
                  value={customer.fullName}
                  onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobile Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9814012345"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Delivery Street Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="House/Flat No., Street, Landmark, Colony..."
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={customer.state}
                  onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="143001"
                  value={customer.pincode}
                  onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            {/* Order Summary Line */}
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-gray-800">Total payable for {cartItems.length} item(s):</span>
                <p className="text-[11px] text-green-700 font-medium">Includes ₹100 UPI discount</p>
              </div>
              <span className="text-base font-extrabold font-mono text-red-900">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-800 to-amber-900 hover:from-red-900 hover:to-amber-950 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
            >
              Continue to UPI Payment ➔
            </button>

          </form>
        )}

        {/* STEP 2: UPI & QR Payment with UTR input */}
        {step === 'payment' && (
          <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Amount Banner */}
            <div className="bg-gradient-to-r from-amber-900 to-red-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-amber-200 uppercase font-semibold">Exact UPI Amount To Pay</p>
                <p className="text-2xl font-black font-mono text-amber-300">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right text-xs text-amber-100">
                <p className="font-bold">Payee: {settings.payeeName}</p>
                <p className="text-[10px] text-amber-300">{settings.shopName}</p>
              </div>
            </div>

            {/* QR Code & Direct Apps Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-amber-200/80 flex flex-col items-center text-center space-y-3">
              <p className="text-xs font-bold text-gray-800">
                Scan QR Code with GPay, PhonePe, Paytm, or BHIM:
              </p>

              {/* Dynamic QR SVG */}
              <div className="bg-white p-3 rounded-2xl border-2 border-amber-400 shadow-md">
                <QRCodeSVG
                  value={upiString}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Copyable UPI ID */}
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-gray-500 font-medium">UPI ID:</span>
                <span className="font-mono font-bold text-gray-900">{settings.upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 hover:bg-amber-50 rounded text-amber-800"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Mobile Deep Link UPI Apps */}
              <div className="w-full pt-1">
                <p className="text-[11px] text-gray-500 mb-1.5">Tap your app to pay directly on mobile:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" /> GPay
                  </a>
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" /> PhonePe
                  </a>
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-cyan-600" /> Paytm
                  </a>
                  <a
                    href={upiString}
                    className="bg-white hover:bg-amber-50 text-gray-800 border border-gray-300 rounded-xl py-2 px-1 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-orange-600" /> Any UPI
                  </a>
                </div>
              </div>

            </div>

            {/* MANDATORY UTR / UTS NUMBER INPUT */}
            <div className="bg-amber-50/90 border-2 border-amber-300 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                  Enter UTR / UTS / Txn Reference No. <span className="text-red-600">*</span>
                </label>
                <span className="text-[10px] text-amber-800 bg-amber-200 px-2 py-0.5 rounded font-bold">
                  Mandatory for Verification
                </span>
              </div>

              <p className="text-[11px] text-amber-900 leading-snug">
                After paying in GPay/PhonePe/Paytm, copy the 12-digit UTR/UTS Transaction Reference ID from payment receipt and paste below:
              </p>

              <input
                type="text"
                required
                placeholder="e.g. 420819234812"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full bg-white border-2 border-amber-500 font-mono font-bold text-gray-900 text-base rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-700 uppercase tracking-wider"
              />

              <div className="text-[10px] text-gray-500 flex items-center gap-1 pt-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Found in your payment app under "Transaction Details / UTR Number"</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className={`w-full bg-gradient-to-r from-red-800 to-amber-900 hover:from-red-900 hover:to-amber-950 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm ${
                submitting ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {submitting ? (
                <span>Submitting & Notifying Shop Owner...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span>Verify Payment & Place Order</span>
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
