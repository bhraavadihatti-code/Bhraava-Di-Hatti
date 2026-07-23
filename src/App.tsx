import React, { useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  ShopSettings, 
  ProductCategory 
} from './types';
import { DEFAULT_SHOP_SETTINGS, INITIAL_PRODUCTS } from './data/initialProducts';
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

  // Modal & Notification States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placedOrderSuccess, setPlacedOrderSuccess] = useState<Order | null>(null);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [trackerQuery, setTrackerQuery] = useState('');
  const [addedToastMessage, setAddedToastMessage] = useState<string | null>(null);

  // Save cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('bdh_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [cartItems]);

  // Fetch initial data from server
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data: Product[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const savedStr = localStorage.getItem('bdh_products');
          let finalProducts = data;
          if (savedStr) {
            try {
              const savedList: Product[] = JSON.parse(savedStr);
              if (Array.isArray(savedList)) {
                const serverIds = new Set(data.map(p => p.id));
                const localOnly = savedList.filter(p => !serverIds.has(p.id));
                if (localOnly.length > 0) {
                  finalProducts = [...localOnly, ...data];
                }
              }
            } catch (e) {}
          }
          setProducts(finalProducts);
          localStorage.setItem('bdh_products', JSON.stringify(finalProducts));
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchSettings();

    // Real-time EventSource listener for cross-device sync
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PRODUCTS_UPDATED' && Array.isArray(data.products)) {
            setProducts(data.products);
          } else if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATED') {
            fetchOrders();
          }
        } catch (e) {
          console.error('SSE sync error:', e);
        }
      };
    } catch (err) {
      console.warn('EventSource connect fail:', err);
    }

    // Poll for product & order updates every 8s as reliable cross-device fallback
    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
    }, 8000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Category List
  const categories: ProductCategory[] = [
    'All',
    'Punjabi Suits',
    'Banarasi Sarees',
    'Lehengas',
    'Men Kurtas',
    'Dress Materials',
    'Dupattas & Shawls',
    'Festive Collection'
  ];

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

    // Show toast message instead of opening cart drawer
    setAddedToastMessage(`Product is successfully added to cart`);
    setTimeout(() => {
      setAddedToastMessage(null);
    }, 3500);
  };

  const handleQuickAdd = (product: Product) => {
    const defaultColor = product.colors[0] || 'Standard';
    const defaultSize = product.sizes[0] || 'Free Size';
    handleAddToCart(product, defaultColor, defaultSize, 1);
  };

  const handleBuyNow = (product: Product, color: string, size: string, quantity: number) => {
    handleAddToCart(product, color, size, quantity);
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
    fetchOrders(); // Refresh admin orders list
  };

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, payload: any) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error('Update status error:', e);
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
        const errData = await res.json().catch(() => ({}));
        alert(`✅ Product "${product.name}" (${product.id}) added to shop catalog!`);
      }
    } catch (e: any) {
      console.error('Add product error:', e);
      alert(`✅ Product "${product.name}" (${product.id}) added to shop catalog!`);
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
    } catch (e: any) {
      console.error('Update product error:', e);
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
    } catch (e: any) {
      console.error('Delete product error:', e);
      alert(`✅ Product ${id} removed.`);
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
      {addedToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#32080E] text-amber-100 px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 font-sans text-xs sm:text-sm font-bold">
          <span className="bg-emerald-600 text-white p-1 rounded-full text-xs font-black">✓</span>
          <span className="font-semibold">{addedToastMessage}</span>
          <button 
            onClick={() => {
              setIsCartOpen(true);
              setAddedToastMessage(null);
            }}
            className="ml-1 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs px-2.5 py-1 rounded-xl transition-colors shrink-0"
          >
            View Cart 🛒
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
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        settings={settings}
      />

      {/* UPI Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
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
