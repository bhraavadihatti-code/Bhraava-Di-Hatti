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
import { Footer } from './components/Footer';

export default function App() {
  // App view mode
  const [activeView, setActiveView] = useState<'shop' | 'admin'>('shop');

  // Core Data State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
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

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placedOrderSuccess, setPlacedOrderSuccess] = useState<Order | null>(null);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [trackerQuery, setTrackerQuery] = useState('');

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
        const data = await res.json();
        setProducts(data);
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

    // Poll for order status changes every 15s as fallback
    const interval = setInterval(() => {
      fetchOrders();
    }, 15000);

    return () => clearInterval(interval);
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

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
  };

  const handleQuickAdd = (product: Product) => {
    const defaultColor = product.colors[0] || 'Standard';
    const defaultSize = product.sizes[0] || 'Free Size';
    handleAddToCart(product, defaultColor, defaultSize, 1);
    setIsCartOpen(true);
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
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error('Add product error:', e);
    }
  };

  const handleUpdateProduct = async (id: string, updated: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error('Update product error:', e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error('Delete product error:', e);
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

  const pendingOrdersCount = orders.filter(o => o.status === 'pending_acceptance').length;
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col">
      
      {/* Navigation Header */}
      <Navbar
        settings={settings}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracker={() => setTrackerModalOpen(true)}
        onOpenAdmin={() => setActiveView('admin')}
        pendingOrdersCount={pendingOrdersCount}
        activeView={activeView}
        setActiveView={(v) => setActiveView(v)}
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

            {/* Catalog Section Header */}
            <div id="catalog-section" className="pt-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                  {selectedCategory === 'All' ? 'Our Exclusive Clothing Catalog' : selectedCategory}
                </h2>
                <p className="text-xs text-amber-800">
                  Showing {filteredProducts.length} premium Indian ethnic wear items
                </p>
              </div>

              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-semibold text-amber-800 hover:underline"
                >
                  View All Categories ➔
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
        onOpenAdmin={() => setActiveView('admin')}
      />

      {/* MODALS & DRAWERS */}
      
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
