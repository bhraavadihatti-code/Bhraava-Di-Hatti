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
import { Footer } from './components/Footer';

export default function App() {
  // App view mode
  const [activeView, setActiveView] = useState<'shop' | 'admin'>('shop');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  // Core Data State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('bdh_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('bdh_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
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

  // Fetch initial data from server with cache-busting & no-store headers
  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data: Product[] = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
          try {
            localStorage.setItem('bdh_products', JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Network fetching products (using local fallback):', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const serverData: Order[] = await res.json();
        if (Array.isArray(serverData)) {
          // Sort orders newest first
          const sorted = [...serverData].sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setOrders(sorted);
          try {
            localStorage.setItem('bdh_orders', JSON.stringify(sorted));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Network fetching orders (using local fallback):', err);
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
                try {
                  localStorage.setItem('bdh_products', JSON.stringify(data.products));
                } catch (e) {}
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
    
    setOrders((prev) => {
      const filtered = prev.filter(o => o.id !== order.id);
      const updated = [order, ...filtered];
      try {
        localStorage.setItem('bdh_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const savedCust = localStorage.getItem('bdh_customer_orders');
      let custOrders: Order[] = savedCust ? JSON.parse(savedCust) : [];
      if (!Array.isArray(custOrders)) custOrders = [];
      custOrders = [order, ...custOrders.filter(o => o.id !== order.id)];
      localStorage.setItem('bdh_customer_orders', JSON.stringify(custOrders));
    } catch (e) {}

    fetchOrders(); // Sync with server list
  };

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, payload: any) => {
    // 1. Optimistic update state & localStorage immediately
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, ...payload } : o));
      try {
        localStorage.setItem('bdh_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const savedCust = localStorage.getItem('bdh_customer_orders');
      if (savedCust) {
        let custOrders: Order[] = JSON.parse(savedCust);
        if (Array.isArray(custOrders)) {
          const updatedCust = custOrders.map((o) => (o.id === orderId ? { ...o, ...payload } : o));
          localStorage.setItem('bdh_customer_orders', JSON.stringify(updatedCust));
        }
      }
    } catch (e) {}

    // 2. Server API call
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchOrders();
      } else if (res.status === 404) {
        // If order missing on server, push local order to server
        const savedBdh = localStorage.getItem('bdh_orders');
        if (savedBdh) {
          const list: Order[] = JSON.parse(savedBdh);
          const target = list.find(o => o.id === orderId);
          if (target) {
            await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...target, ...payload })
            });
            fetchOrders();
          }
        }
      }
    } catch (e) {
      console.warn('Update status error (saved locally):', e);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      // Optimistic update state and localStorage immediately
      setProducts((prev) => {
        const filtered = prev.filter(p => p.id !== product.id);
        const updated = [product, ...filtered];
        try {
          localStorage.setItem('bdh_products', JSON.stringify(updated));
        } catch (e) {}
        return updated;
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
            const list = prev.map(p => p.id === serverSaved.id ? serverSaved : p);
            try {
              localStorage.setItem('bdh_products', JSON.stringify(list));
            } catch (e) {}
            return list;
          });
        }
        alert(`✅ Product "${product.name}" (${product.id}) added and published live!`);
      } else {
        alert(`✅ Product "${product.name}" (${product.id}) added to shop catalog!`);
      }
      fetchProducts();
    } catch (e: any) {
      console.error('Add product error:', e);
      alert(`✅ Product "${product.name}" (${product.id}) added to shop catalog!`);
      fetchProducts();
    }
  };

  const handleUpdateProduct = async (id: string, updated: Partial<Product>) => {
    try {
      setProducts((prev) => {
        const list = prev.map(p => p.id === id ? { ...p, ...updated } : p);
        try {
          localStorage.setItem('bdh_products', JSON.stringify(list));
        } catch (e) {}
        return list;
      });

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        alert(`✅ Product updated successfully!`);
      }
      fetchProducts();
    } catch (e: any) {
      console.error('Update product error:', e);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      setProducts((prev) => {
        const list = prev.filter(p => p.id !== id);
        try {
          localStorage.setItem('bdh_products', JSON.stringify(list));
        } catch (e) {}
        return list;
      });

      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert(`🗑️ Product ${id} deleted successfully.`);
      } else {
        alert(`✅ Product ${id} removed from catalog.`);
      }
      fetchProducts();
    } catch (e: any) {
      console.error('Delete product error:', e);
      alert(`✅ Product ${id} removed.`);
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
            src={addedToastItem.product.imageUrl}
            alt={addedToastItem.product.name}
            className="w-12 h-12 rounded-xl object-cover border border-amber-400/50 shrink-0"
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-black">
              <span className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
              <span>Added to Shopping Bag!</span>
            </div>
            <p className="text-xs font-bold text-amber-100 truncate">{addedToastItem.product.name}</p>
            <p className="text-[10px] text-amber-300/80 font-mono">
              ₹{addedToastItem.product.price} • {addedToastItem.selectedColor} ({addedToastItem.selectedSize})
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
