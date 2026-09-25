import React, { useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  ShopSettings, 
  ProductCategory 
} from './types';
import { DEFAULT_SHOP_SETTINGS, INITIAL_PRODUCTS, DEFAULT_CATEGORIES } from './data/initialProducts';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { CategoryAndPriceFilter, PriceFilterOption, SortOption } from './components/CategoryAndPriceFilter';
import { WishlistView } from './components/WishlistView';
import { Footer } from './components/Footer';
import { sendOrderTelegramNotification } from './utils/telegram';
import { Heart } from 'lucide-react';

export default function App() {
  // App view mode
  const [activeView, setActiveView] = useState<'shop' | 'admin' | 'wishlist'>('shop');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  // Core Data State - Google Sheets / Backend is Central Source of Truth
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bdh_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist State using localStorage
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bdh_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === 'string');
      }
    } catch (e) {
      console.warn('LocalStorage error reading wishlist:', e);
    }
    return [];
  });

  const [wishlistToast, setWishlistToast] = useState<{ message: string; type: 'added' | 'removed'; suitName?: string } | null>(null);

  // Modal & Notification States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [placedOrderSuccess, setPlacedOrderSuccess] = useState<Order | null>(null);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [trackerQuery, setTrackerQuery] = useState('');
  const [addedToastItem, setAddedToastItem] = useState<{ product: Product; selectedColor: string; selectedSize: string; quantity: number } | null>(null);

  // Save cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('bdh_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [cartItems]);

  // Save wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('bdh_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.warn('LocalStorage error writing wishlist:', e);
    }
  }, [wishlistIds]);

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const isAlreadySaved = prev.includes(productId);
      const updated = isAlreadySaved
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      const suit = products.find((p) => p.id === productId);
      const suitName = suit?.name || 'Suit';

      if (!isAlreadySaved) {
        setWishlistToast({
          message: 'Saved to your Wishlist! ❤️',
          type: 'added',
          suitName
        });
      } else {
        setWishlistToast({
          message: 'Removed from your Wishlist',
          type: 'removed',
          suitName
        });
      }

      setTimeout(() => {
        setWishlistToast(null);
      }, 3500);

      return updated;
    });
  };

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  const handleClearWishlist = () => {
    setWishlistIds([]);
    setWishlistToast({
      message: 'Wishlist cleared',
      type: 'removed'
    });
    setTimeout(() => setWishlistToast(null), 2500);
  };

  const handleAddAllWishlistToCart = (suitsToAdd: Product[]) => {
    let addedCount = 0;
    suitsToAdd.forEach((product) => {
      if (product.inStock) {
        const defaultColor = product.colors[0] || 'Standard';
        const defaultSize = product.sizes[0] || 'Free Size (Unstitched)';
        handleAddToCart(product, defaultColor, defaultSize, 1);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      setIsCartOpen(true);
    }
  };

  // Fetch initial data from server (central backend connected to Google Sheets)
  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const serverData: Product[] = await res.json();
        if (Array.isArray(serverData)) {
          setProducts(serverData);
        }
      }
    } catch (err) {
      console.warn('Network fetching products from central server:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const serverData: Order[] = await res.json();
        if (Array.isArray(serverData)) {
          // Sort orders newest first
          const sorted = [...serverData].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setOrders(sorted);
        }
      }
    } catch (err) {
      console.warn('Network fetching orders from central server:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.warn('Network fetching settings (using local fallback):', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchSettings();

    // Auto-reconnecting Real-time EventSource listener for cross-device sync
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        if (eventSource) eventSource.close();
        eventSource = new EventSource('/api/notifications/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PRODUCTS_UPDATED') {
              if (Array.isArray(data.products)) {
                setProducts(data.products);
              } else {
                fetchProducts();
              }
            } else if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATED') {
              fetchOrders();
            }
          } catch (e) {
            console.error('SSE sync error:', e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) eventSource.close();
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        console.warn('EventSource connect fail:', err);
      }
    };

    connectSSE();

    // Poll for product & order updates every 5s as reliable cross-device fallback
    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
    }, 5000);

    // Sync immediately when user switches back to tab or unlocks phone screen
    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        fetchProducts();
        fetchOrders();
        fetchSettings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Category List
  const categories: ProductCategory[] = settings.categories && settings.categories.length > 0
    ? (settings.categories.includes('All') ? settings.categories : ['All', ...settings.categories])
    : DEFAULT_CATEGORIES;

  // Filtered & Sorted Products
  const filteredProducts = products
    .filter((p) => {
      // Category Match
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

      // Search Query Match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.fabric.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);

      // Price Filter Match
      let matchesPrice = true;
      if (priceFilter === 'under1500') {
        matchesPrice = p.price < 1500;
      } else if (priceFilter === '1500to3000') {
        matchesPrice = p.price >= 1500 && p.price <= 3000;
      } else if (priceFilter === '3000to5000') {
        matchesPrice = p.price > 3000 && p.price <= 5000;
      } else if (priceFilter === 'above5000') {
        matchesPrice = p.price > 5000;
      }

      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') {
        return a.price - b.price;
      }
      if (sortBy === 'priceDesc') {
        return b.price - a.price;
      }
      if (sortBy === 'discount') {
        const discountA = a.originalPrice ? a.originalPrice - a.price : 0;
        const discountB = b.originalPrice ? b.originalPrice - b.price : 0;
        return discountB - discountA;
      }
      return 0; // 'featured' keeps original order
    });

  // Cart Helpers
  const handleAddToCart = (product: Product, selectedColor: string, selectedSize: string, quantity: number) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }

      return [...prev, { product, selectedColor, selectedSize, quantity }];
    });

    // Rich floating notification toast
    setAddedToastItem({ product, selectedColor, selectedSize, quantity });
    setTimeout(() => {
      setAddedToastItem(null);
    }, 4500);
  };

  const handleQuickAdd = (product: Product) => {
    const defaultColor = product.colors[0] || 'Standard';
    const defaultSize = product.sizes[0] || 'Free Size';
    handleAddToCart(product, defaultColor, defaultSize, 1);
  };

  const handleBuyNow = (product: Product, color: string, size: string, quantity: number) => {
    // Direct Product Buy strictly checks out ONLY this product without linking or polluting Cart Drawer
    setCheckoutItems([{ product, selectedColor: color, selectedSize: size, quantity }]);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Order Handlers
  const handleOrderPlacedSuccess = (order: Order) => {
    setCartItems([]);
    setIsCheckoutOpen(false);
    setPlacedOrderSuccess(order);
    
    // Trigger automated Telegram notification alert for admin
    sendOrderTelegramNotification(order, "🚨 NEW ORDER RECEIVED");

    setOrders((prev) => {
      const filtered = prev.filter(o => o.id !== order.id);
      return [order, ...filtered];
    });

    fetchOrders(); // Sync with central server list
  };

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, payload: any) => {
    // 1. Optimistic update state immediately
    setOrders((prev) => {
      return prev.map((o) => (o.id === orderId ? { ...o, ...payload, updatedAt: new Date().toISOString() } : o));
    });

    // 2. Central Server & Google Sheets API call
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.warn('Update status error:', e);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      // Optimistic update state immediately
      setProducts((prev) => {
        const filtered = prev.filter(p => p.id !== product.id);
        return [product, ...filtered];
      });

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });

      if (res.ok) {
        const serverSaved = await res.json();
        if (serverSaved && serverSaved.id) {
          setProducts((prev) => {
            return prev.map(p => p.id === serverSaved.id ? serverSaved : p);
          });
        }
      }
      fetchProducts();
    } catch (e: any) {
      console.error('Add product error:', e);
      fetchProducts();
    }
  };

  const handleUpdateProduct = async (id: string, updated: Partial<Product>) => {
    try {
      setProducts((prev) => {
        return prev.map(p => p.id === id ? { ...p, ...updated } : p);
      });

      await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      fetchProducts();
    } catch (e: any) {
      console.error('Update product error:', e);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      setProducts((prev) => {
        return prev.filter(p => p.id !== id);
      });

      await fetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
      fetchProducts();
    } catch (e: any) {
      console.error('Delete product error:', e);
      fetchProducts();
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ShopSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Update settings error:', e);
    }
  };

  const handleRequestAdmin = () => {
    if (isAdminAuthenticated) {
      setActiveView('admin');
    } else {
      setIsAdminPasswordModalOpen(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'pending_acceptance').length;
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans flex flex-col">
      
      {/* Navigation Header */}
      <Navbar
        settings={settings}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        priceFilter={priceFilter}
        onSelectPriceFilter={(p) => setPriceFilter(p)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracker={() => setTrackerModalOpen(true)}
        onOpenAdmin={handleRequestAdmin}
        pendingOrdersCount={pendingOrdersCount}
        activeView={activeView}
        setActiveView={(v) => {
          if (v === 'admin' && !isAdminAuthenticated) {
            handleRequestAdmin();
          } else {
            setActiveView(v);
          }
        }}
        wishlistCount={wishlistIds.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4">
        
        {activeView === 'admin' ? (
          <AdminPanel
            orders={orders}
            products={products}
            settings={settings}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateSettings={handleUpdateSettings}
            onLogout={handleAdminLogout}
            onSyncOrders={fetchOrders}
            onSyncProducts={fetchProducts}
          />
        ) : activeView === 'wishlist' ? (
          <WishlistView
            wishlistProducts={wishlistProducts}
            allProducts={products}
            onBackToShop={() => {
              setActiveView('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToggleWishlist={toggleWishlist}
            isWishlisted={isWishlisted}
            onQuickAdd={handleQuickAdd}
            onViewDetails={(p) => setSelectedProduct(p)}
            onAddAllToCart={handleAddAllWishlistToCart}
            onClearWishlist={handleClearWishlist}
          />
        ) : (
          <div className="space-y-6">
            
            {/* Hero Showcase Banner */}
            <HeroBanner
              settings={settings}
              onExploreCatalog={() => {
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Catalog Section Anchor */}
            <div id="catalog-section" className="pt-2 flex items-center justify-between border-b border-amber-200 pb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
                  <span>{selectedCategory === 'All' ? '👗 Exclusive Suit Catalog' : selectedCategory}</span>
                  <span className="text-xs font-sans text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md font-mono">
                    {filteredProducts.length} items
                  </span>
                </h2>
              </div>

              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-extrabold text-amber-900 hover:text-red-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-xl transition-colors"
                >
                  View All ➔
                </button>
              )}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 pb-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickAdd={handleQuickAdd}
                  onViewDetails={(p) => setSelectedProduct(p)}
                  isWishlisted={isWishlisted(product.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400 my-8">
                No clothing items found matching your search term "{searchQuery}".
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenTracker={() => setTrackerModalOpen(true)}
        onOpenAdmin={handleRequestAdmin}
      />

      {/* Product Added Success Toast Banner */}
      {addedToastItem && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#32080E] text-amber-100 p-3 sm:p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-[94vw] sm:max-w-md w-full font-sans">
          <img
            src={addedToastItem.product?.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"}
            alt={addedToastItem.product?.name || "Product"}
            className="w-12 h-12 rounded-xl object-cover border border-amber-400/50 shrink-0"
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-black">
              <span className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
              <span>Added to Shopping Bag!</span>
            </div>
            <p className="text-xs font-bold text-amber-100 truncate">{addedToastItem.product?.name || "Suit"}</p>
            <p className="text-[10px] text-amber-300/80 font-mono">
              ₹{addedToastItem.product?.price || 0} • {addedToastItem.selectedColor} ({addedToastItem.selectedSize})
            </p>
          </div>
          <button 
            onClick={() => {
              setIsCartOpen(true);
              setAddedToastItem(null);
            }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:brightness-110 text-amber-950 font-black text-xs px-3 py-2 rounded-xl transition-all shrink-0 border border-amber-200 active:scale-95 cursor-pointer shadow-md"
          >
            View Bag 🛒
          </button>
          <button
            onClick={() => setAddedToastItem(null)}
            className="text-amber-400 hover:text-white p-1 text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Wishlist Action Toast Notification */}
      {wishlistToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#2A050B] text-amber-100 px-4 py-3 rounded-2xl shadow-2xl border-2 border-amber-400/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[92vw] sm:max-w-md w-full font-sans">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            wishlistToast.type === 'added' ? 'bg-red-600 text-white shadow-md' : 'bg-stone-800 text-stone-300'
          }`}>
            <Heart className={`w-4 h-4 ${wishlistToast.type === 'added' ? 'fill-white' : ''}`} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-black text-amber-200">{wishlistToast.message}</p>
            {wishlistToast.suitName && (
              <p className="text-[11px] text-amber-100/85 truncate font-medium">{wishlistToast.suitName}</p>
            )}
          </div>
          {wishlistToast.type === 'added' && activeView !== 'wishlist' && (
            <button
              onClick={() => {
                setActiveView('wishlist');
                setWishlistToast(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[11px] font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              View List ❤️
            </button>
          )}
          <button
            onClick={() => setWishlistToast(null)}
            className="text-amber-300/80 hover:text-white p-1 text-xs shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MODALS & DRAWERS */}
      
      {/* Admin Password Lock Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setIsAdminPasswordModalOpen(false);
          setActiveView('admin');
        }}
        settings={settings}
      />
      
      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isWishlisted={selectedProduct ? isWishlisted(selectedProduct.id) : false}
        onToggleWishlist={toggleWishlist}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setCheckoutItems(cartItems);
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        settings={settings}
      />

      {/* UPI Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={checkoutItems.length > 0 ? checkoutItems : cartItems}
        settings={settings}
        onOrderPlacedSuccess={handleOrderPlacedSuccess}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        order={placedOrderSuccess}
        settings={settings}
        onClose={() => setPlacedOrderSuccess(null)}
        onTrackOrder={(orderId) => {
          setTrackerQuery(orderId);
          setTrackerModalOpen(true);
        }}
      />

      {/* Order Status Tracker Modal */}
      <OrderTrackerModal
        isOpen={trackerModalOpen}
        onClose={() => setTrackerModalOpen(false)}
        initialQuery={trackerQuery}
      />

    </div>
  );
}
