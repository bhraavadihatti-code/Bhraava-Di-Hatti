import { Product, ShopSettings } from '../types';

export const DEFAULT_CATEGORIES: string[] = [
  'All',
  'Punjabi Suit',
  'Farshi Suit',
  'Cotton Suit',
  'Dupatta Suit',
  'Trousers Salwar Suits',
  'AK Tax',
  'Om Creation',
  'Shiva'
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: "Bhraava Di Hatti",
  firmName: "Jai Durga Cloth Emporium",
  upiId: "boism-9417124082@boi",
  payeeName: "Jai Durga Cloth Emporium",
  phoneNumber: "94171-24082",
  phoneNumber2: "99150-46357",
  whatsappNumber: "919417124082",
  address: "Bus Stand Road, Maur Mandi",
  city: "District Bathinda, Punjab",
  pincode: "151509",
  gstNumber: "03AABCU9603R1ZM",
  minOrderForFreeShipping: 1999,
  noticeText: "🎁 RAKHI SPECIAL MEGA SALE IS LIVE TILL 29 AUGUST! FLAT DISCOUNTS + INDIA POST DESPATCH",
  adminPin: "BDH-1986",
  categories: DEFAULT_CATEGORIES,
  telegramBotToken: "8752135508:AAF2X43YeNzGKFazG9cFzMUNzVgnMs3Vju0",
  telegramChatId: "",
  telegramEnabled: true,
  googleSheetWebhookUrl: "https://script.google.com/macros/s/AKfycbxoIXICrDxONN81CJHKqzGKzQVsNjVZeQUggeaefkQx_z27vTHk20LOZ8M1lFrrTsLd/exec"
};

/**
 * ====================================================================
 *  Bhraava Di Hatti — Product Catalog Code File
 * ====================================================================
 *  HOW TO ADD PRODUCTS IN CODE:
 *  1. Simply copy the template object below.
 *  2. Change name, price, category, colors, and image URL.
 *  3. In the Admin Panel, click "🔄 Sync Products from Code"!
 */

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "BDH-201",
    name: "Premium Digital Print Farshi Salwar Suit Material (Unstitched) - Ruaab Collection",
    firmName: "Jai Durga Cloth Emporium",
    shopName: "Bhraava Di Hatti",
    category: "Farshi Suit",
    price: 650,
    originalPrice: 899,
    description: "Step into elegance with our unstitched digital print Farshi Salwar fabric. Featuring classic, rich paisley and floral motifs, this versatile fabric is perfect for crafting a traditional Farshi Salwar, elegant kameez, or a custom ethnic ensemble.\n\nKey Features:\n• Intricate Digital Print: Beautifully detailed paisley patterns with a striking, heavy border design perfect for the hemline or dupatta.\n• Elegant Detailing: The main body of the fabric features a subtle tonal background with delicate, spaced-out teardrop motifs for a balanced look.\n• Versatile Styling: The coordinating dense all-over print allows for beautiful contrasting top-and-bottom combinations.\n• Multiple Colorways: Available in a stunning deep maroon/red, earthy brown, classic black, and vibrant teal.\n• Premium Quality: Sourced from the \"Ruaab\" brand collection, ensuring a high-quality finish for your custom tailoring.\n\n🚚 Free Delivery Included!",
    fabric: "Digital Print Farshi Fabric (Ruaab Collection)",
    workType: "Digital Print Paisley & Heavy Border",
    colors: [
      "Deep Maroon",
      "Deep Teal",
      "Classic Black",
      "Olive Brown"
    ],
    sizes: [
      "Unstitched Material (Suit Set)"
    ],
    imageUrl: "/src/assets/images/ruaab_farshi_suit_1784952010247.jpg",
    images: [
      "/src/assets/images/ruaab_farshi_suit_1784952010247.jpg",
      "/src/assets/images/ruaab_suit_colors_1784952025641.jpg"
    ],
    inStock: true,
    isBestSeller: true,
    isNewArrival: true,
    rating: 5.0,
    tags: [
      "Punjabi Suit",
      "Farshi Suit",
      "Salwar Suit",
      "Cotton Suit",
      "Ruaab Collection",
      "Free Delivery"
    ]
  }
];
