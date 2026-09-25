export type ProductCategory = string;

export interface Product {
  id: string; // ProductID e.g. BDH-101
  name: string; // Title
  firmName?: string; // "Jai Durga Cloth Emporium"
  shopName?: string; // "Bhraava Di Hatti"
  category: ProductCategory;
  tags?: string[]; // e.g. ["Punjabi Suits", "Cotton Suits", "3-Piece Suit"]
  price: number; // BDH Price
  originalPrice?: number; // MRP Price
  description: string;
  fabric?: string;
  workType?: string;
  colors: string[];
  sizes: string[];
  imageUrl: string; // Clean ImageURL
  images?: string[]; // Multiple photos (4-5 images per product)
  inStock: boolean; // Stock
  status?: string; // 'Active' | 'Draft' | 'Published'
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  rating?: number;
  createdAt?: string;
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
  | 'Pending'
  | 'Confirmed'
  | 'Rejected'
  | 'Shipped'
  | 'Delivered'
  | 'pending_acceptance'
  | 'order_confirmed'
  | 'shipping_post_office'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface PaymentDetails {
  method: 'COD' | 'UPI_QR' | string;
  upiIdUsed?: string;
  utrNumber?: string; // UTS / UTR / Transaction reference number from customer
  screenshotUrl?: string;
  paymentTimestamp?: string;
  verifiedByAdmin?: boolean;
  paymentStatus?: 'Pending' | 'Verified' | 'Failed' | string;
}

export interface Order {
  id: string; // OrderID e.g. BDH-2026-00001
  utsNumber?: string; // UTR / UTS reference number e.g. 420819234812
  createdAt: string;
  updatedAt?: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  payment: PaymentDetails;
  status: OrderStatus;
  courierName?: string; // India Post / Speed Post / BlueDart
  trackingNumber?: string; // India Post Tracking Number (e.g. ED123456789IN)
  adminNotes?: string;
  rejectionReason?: string;
}

export interface ShopSettings {
  shopName: string; // "Bhraava Di Hatti"
  firmName: string; // "Jai Durga Cloth Emporium"
  upiId: string;    // e.g. "bhraavadihatti@upi"
  payeeName: string; // "Jai Durga Cloth Emporium"
  phoneNumber: string; // "94171-24082"
  phoneNumber2: string; // "99150-46357"
  whatsappNumber: string; // "919417124082"
  address: string;
  city: string;
  pincode: string;
  gstNumber?: string;
  minOrderForFreeShipping: number;
  noticeText: string;
  adminPin?: string; // Default 'BDH-1986'
  categories?: string[];
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramEnabled?: boolean;
  googleSheetWebhookUrl?: string;
  googleSheetSpreadsheetId?: string;
  googleSheetLastSync?: string;
  nextSheetSerialNo?: number;
}
