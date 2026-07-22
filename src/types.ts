export type ProductCategory = 
  | 'All'
  | 'Punjabi Suits'
  | 'Banarasi Sarees'
  | 'Lehengas'
  | 'Men Kurtas'
  | 'Dress Materials'
  | 'Dupattas & Shawls'
  | 'Festive Collection';

export interface Product {
  id: string;
  name: string;
  firmName: string; // "Jai Durga Cloth Emporium"
  shopName: string; // "Bhraava Di Hatti"
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  description: string;
  fabric: string;
  workType: string;
  colors: string[];
  sizes: string[];
  imageUrl: string;
  inStock: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  rating?: number;
}

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
}

export type OrderStatus = 
  | 'pending_acceptance'
  | 'payment_verified'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'rejected';

export interface PaymentDetails {
  method: 'UPI_QR';
  upiIdUsed: string;
  utrNumber: string; // UTS / UTR / Transaction reference number from customer
  screenshotUrl?: string;
  paymentTimestamp: string;
  verifiedByAdmin?: boolean;
}

export interface Order {
  id: string; // e.g. BDH-2026-1001
  utsNumber: string; // UTR / UTS reference number e.g. 420819234812
  createdAt: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  payment: PaymentDetails;
  status: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface ShopSettings {
  shopName: string; // "Bhraava Di Hatti"
  firmName: string; // "Jai Durga Cloth Emporium"
  upiId: string;    // e.g. "bhraavadihatti@upi"
  payeeName: string; // "Jai Durga Cloth Emporium"
  phoneNumber: string; // e.g. "+91 98765 43210"
  whatsappNumber: string; // e.g. "919876543210"
  address: string;
  city: string;
  pincode: string;
  gstNumber?: string;
  minOrderForFreeShipping: number;
  noticeText: string;
}
