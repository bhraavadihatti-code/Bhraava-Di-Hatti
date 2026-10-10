import React, { useState, useEffect, useRef } from 'react';
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
import { AdminPanel } from './components/AdminPanel';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { PriceFilterOption, SortOption } from './components/CategoryAndPriceFilter';
import { WishlistView } from './components/WishlistView';
import { Footer } from './components/Footer';
import { sendOrderTelegramNotification } from './utils/telegram';
import { syncProductToGoogleSheets, syncOrderToGoogleSheets, fetchGoogleSheetAll } from './lib/googleSheetsService';
import { formatImageUrl } from './lib/imageUtils';
import { Heart, MapPin, Phone, MessageCircle, Clock, Store, Navigation, Loader2 } from 'lucide-react';

const PRODUCTS_CACHE_KEY = 'bdh_products_cache_v2';
const INITIAL_VISIBLE_COUNT = 6;
const SCROLL_BATCH_SIZE = 4;

export default function App() {
  // App view mode
  const [activeView, setActiveView] = useState<'shop' | 'admin' | 'wishlist'>('shop');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  // Core Data State - Initialize from localStorage cache for 0ms instant open
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch {}
    return true;
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [searchQuery, setSearchQuery] = useState('');

  // Progressive / Infinite Scroll State (loads products smoothly on scroll like Myntra/Flipkart)
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const isLoadingMoreRef = useRef<boolean>(false);
  const loadMoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const lastProductSignatureRef = useRef<string>('');
  const recentlyModifiedProductIdsRef = useRef<Map<string, number>>(new Map());
  const deletedProductIdsRef = useRef<Set<string>>(new Set());

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

  // Persist products cache in localStorage for instant future opens
  useEffect(() => {
    if (products && products.length > 0) {
      try {
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
      } catch {
        // ignore quota errors
      }
    }
  }, [products]);

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

  // Normalize product list images before setting state and exclude deleted IDs
  const normalizeProductList = (list: Product[]): Product[] => {
    return list
      .filter((p) => {
        const cleanId = String(p.id || '').trim();
        return cleanId && !deletedProductIdsRef.current.has(cleanId) && !deletedProductIdsRef.current.has(cleanId.toUpperCase());
      })
      .map((p) => {
        const cleanMain = formatImageUrl(p.imageUrl || '');
        const cleanImgs = Array.isArray(p.images) && p.images.length > 0
          ? p.images.map((img) => formatImageUrl(img || '')).filter(Boolean)
          : [cleanMain].filter(Boolean);
        return {
          ...p,
          imageUrl: cleanMain,
          images: cleanImgs.length > 0 ? cleanImgs : [cleanMain]
        };
      });
  };

  // Fetch initial data from server with automatic Google Sheets direct fallback
  const fetchProducts = async () => {
    let loadedFromServer = false;
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const serverData: Product[] = await res.json();
        if (Array.isArray(serverData) && serverData.length > 0) {
          const normalized = normalizeProductList(serverData);
          const sig = normalized.map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`).join('|');
          if (sig !== lastProductSignatureRef.current) {
            lastProductSignatureRef.current = sig;
            setProducts(normalized);
          }
          loadedFromServer = true;
          setIsInitialLoading(false);
        }
      }
    } catch (err) {
      console.warn('Network fetching products from server:', err);
    }

    // Direct Google Sheets fallback (only if server had no products)
    if (!loadedFromServer) {
      const webhookUrl = settings.googleSheetWebhookUrl || DEFAULT_SHOP_SETTINGS.googleSheetWebhookUrl;
      if (webhookUrl) {
        try {
          const sheetResult = await fetchGoogleSheetAll(webhookUrl);
          if (sheetResult.success && sheetResult.products && sheetResult.products.length > 0) {
            const normalized = normalizeProductList(sheetResult.products);
            setProducts(normalized);
            loadedFromServer = true;
          }
        } catch (e) {
          console.warn('Google Sheet direct fetch fallback:', e);
        }
      }
      if (!loadedFromServer) {
        setProducts((prev) => (prev.length > 0 ? prev : INITIAL_PRODUCTS));
      }
      setIsInitialLoading(false);
    }
  };

  // Lightweight version check so we don't re-download large base64 payloads every few seconds
  const checkProductsVersion = async () => {
    try {
      const res = await fetch(`/api/products/version?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.signature && data.signature !== lastProductSignatureRef.current) {
          await fetchProducts();
        }
      }
    } catch {
      // ignore background poll error
    }
  };

  const fetchOrders = async () => {
    let loadedFromServer = false;
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const serverData: Order[] = await res.json();
        if (Array.isArray(serverData)) {
          const sorted = [...serverData].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setOrders(sorted);
          loadedFromServer = true;
        }
      }
    } catch (err) {
      console.warn('Network fetching orders from server:', err);
    }

    if (!loadedFromServer) {
      const webhookUrl = settings.googleSheetWebhookUrl || DEFAULT_SHOP_SETTINGS.googleSheetWebhookUrl;
      if (webhookUrl) {
        try {
          const sheetResult = await fetchGoogleSheetAll(webhookUrl);
          if (sheetResult.success && sheetResult.orders && sheetResult.orders.length > 0) {
            const sorted = [...sheetResult.orders].sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            setOrders(sorted);
          }
        } catch (e) {
          console.warn('Google Sheet direct orders fetch fallback:', e);
        }
      }
    }
  };

  // Full sync with Google Sheets (uses server-side smart merge first, with direct fallback)
  const syncWithGoogleSheet = async () => {
    const webhookUrl = settings.googleSheetWebhookUrl || DEFAULT_SHOP_SETTINGS.googleSheetWebhookUrl;
    if (!webhookUrl) return { success: false, error: 'Webhook URL not set' };
    try {
      // 1. Primary: Use server-side sync endpoint (which smartly merges local + sheet products without duplicate requests)
      try {
        const srvRes = await fetch('/api/googlesheet/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl })
        });
        if (srvRes.ok) {
          const srvData = await srvRes.json();
          if (Array.isArray(srvData.products) && srvData.products.length > 0) {
            const normalized = normalizeProductList(srvData.products);
            lastProductSignatureRef.current = normalized
              .map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`)
              .join('|');
            setProducts(normalized);
          }
          if (Array.isArray(srvData.orders) && srvData.orders.length > 0) {
            const sorted = [...srvData.orders].sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            setOrders(sorted);
          }
          return {
            success: true,
            productsCount: srvData.productsCount || srvData.products?.length || 0,
            ordersCount: srvData.ordersCount || srvData.orders?.length || 0
          };
        }
      } catch {
        // Fall through to direct browser fallback only if server route is unreachable
      }

      // 2. Fallback: Direct browser fetch if server endpoint failed
      const res = await fetchGoogleSheetAll(webhookUrl);
      if (res.success) {
        if (Array.isArray(res.products)) {
          const fallbackUnsplash = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
          setProducts((prev) => {
            const prevMap = new Map<string, Product>(prev.map((item) => [item.id, item]));
            const sheetIds = new Set<string>();
            const mergedFromSheet = res.products!
              .filter((sheetProd) => {
                const cleanId = String(sheetProd.id || '').trim();
                return cleanId && !deletedProductIdsRef.current.has(cleanId) && !deletedProductIdsRef.current.has(cleanId.toUpperCase());
              })
              .map((sheetProd) => {
                sheetIds.add(sheetProd.id);
                const localProd = prevMap.get(sheetProd.id);
                const cleanedSheetImg = formatImageUrl(sheetProd.imageUrl || '');
                if (!localProd) {
                  return {
                    ...sheetProd,
                    imageUrl: cleanedSheetImg,
                    images: [cleanedSheetImg]
                  };
                }
                const modifiedAt = recentlyModifiedProductIdsRef.current.get(sheetProd.id) || 0;
                if (Date.now() - modifiedAt < 60000) {
                  return localProd;
                }
                const cleanedLocalImg = formatImageUrl(localProd.imageUrl || '');
                const keepLocalHd =
                  (cleanedLocalImg.startsWith('data:image/') &&
                    cleanedSheetImg.startsWith('data:image/') &&
                    cleanedLocalImg.length >= cleanedSheetImg.length) ||
                  cleanedLocalImg.startsWith('/uploads/');

                const bestImageUrl = keepLocalHd
                  ? cleanedLocalImg
                  : cleanedSheetImg && cleanedSheetImg !== fallbackUnsplash
                  ? cleanedSheetImg
                  : cleanedLocalImg || cleanedSheetImg;
                const extraImages = (localProd.images || []).slice(1).map((i) => formatImageUrl(i));
                return {
                  ...localProd,
                  ...sheetProd,
                  imageUrl: bestImageUrl,
                  sheetImageUrl:
                    localProd.sheetImageUrl ||
                    (cleanedSheetImg.startsWith('data:image/') ? cleanedSheetImg : undefined),
                  images: [bestImageUrl, ...extraImages]
                };
              });

            // Preserve any recently uploaded local products not yet in sheet (within 45s)
            const localOnly = prev.filter((item) => {
              const cleanId = String(item.id || '').trim();
              if (!cleanId || deletedProductIdsRef.current.has(cleanId) || deletedProductIdsRef.current.has(cleanId.toUpperCase())) return false;
              if (sheetIds.has(cleanId)) return false;
              const modifiedAt = recentlyModifiedProductIdsRef.current.get(cleanId) || 0;
              return Date.now() - modifiedAt < 45000;
            });

            const finalMerged = [...localOnly, ...mergedFromSheet];
            lastProductSignatureRef.current = finalMerged
              .map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`)
              .join('|');
            return finalMerged;
          });
        }
        if (Array.isArray(res.orders) && res.orders.length > 0) {
          const sorted = [...res.orders].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setOrders(sorted);
        }
        return { success: true, productsCount: res.products?.length || 0, ordersCount: res.orders?.length || 0 };
      }
      return { success: false, error: res.error };
    } catch (e: any) {
      return { success: false, error: e?.message };
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
    // Load products from fast local server cache immediately (< 30ms)
    fetchProducts();
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
              if (Array.isArray(data.products) && data.products.length > 0) {
                const normalized = normalizeProductList(data.products);
                lastProductSignatureRef.current = normalized
                  .map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`)
                  .join('|');
                setProducts(normalized);
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
          reconnectTimeout = setTimeout(connectSSE, 6000);
        };
      } catch (err) {
        console.warn('EventSource connect fail:', err);
      }
    };

    connectSSE();

    // Lightweight 50-byte version check every 12s (instead of downloading all images every 5s)
    const interval = setInterval(() => {
      checkProductsVersion();
    }, 12000);

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        checkProductsVersion();
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

  // Load orders only when entering Admin view
  useEffect(() => {
    if (activeView === 'admin') {
      fetchOrders();
    }
  }, [activeView]);

  // Category List
  const categories: ProductCategory[] = settings.categories && settings.categories.length > 0
    ? (settings.categories.includes('All') ? settings.categories : ['All', ...settings.categories])
    : DEFAULT_CATEGORIES;

  // Filtered & Sorted Products (with singular/plural category normalization)
  const filteredProducts = products
    .filter((p) => {
      const normProdCat = (p.category || '').trim().toLowerCase().replace(/s$/, '');
      const normSelectedCat = (selectedCategory || '').trim().toLowerCase().replace(/s$/, '');
      const matchesCategory =
        selectedCategory === 'All' ||
        p.category === selectedCategory ||
        (normProdCat && normProdCat === normSelectedCat);

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        (p.name || '').toLowerCase().includes(query) ||
        (p.fabric || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.id || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query);

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
      return 0;
    });

  const initialBatchCount = filteredProducts.length > 8 ? INITIAL_VISIBLE_COUNT : 4;

  // Reset progressive scroll batch count when filters/search change
  useEffect(() => {
    if (loadMoreTimerRef.current) {
      clearTimeout(loadMoreTimerRef.current);
      loadMoreTimerRef.current = null;
    }
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
    setVisibleCount(filteredProducts.length > 8 ? INITIAL_VISIBLE_COUNT : 4);
  }, [selectedCategory, priceFilter, sortBy, searchQuery, filteredProducts.length > 8]);

  const hasMoreProducts = visibleCount < filteredProducts.length;
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  // Smooth Big-App Infinite Scroll (Myntra / Flipkart style - never cancels its own timer)
  useEffect(() => {
    if (activeView !== 'shop' || !hasMoreProducts) return;

    const triggerNextBatch = () => {
      if (isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);

      if (loadMoreTimerRef.current) clearTimeout(loadMoreTimerRef.current);
      loadMoreTimerRef.current = setTimeout(() => {
        setVisibleCount((prev) => Math.min(filteredProducts.length, prev + SCROLL_BATCH_SIZE));
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
        loadMoreTimerRef.current = null;
      }, 240);
    };

    const checkScrollPosition = () => {
      if (isLoadingMoreRef.current) return;
      const sentinel = loadMoreSentinelRef.current;
      if (!sentinel) return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 240) {
        triggerNextBatch();
      }
    };

    const sentinel = loadMoreSentinelRef.current;
    let observer: IntersectionObserver | null = null;

    if (sentinel && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (first && first.isIntersecting) {
            triggerNextBatch();
          }
        },
        {
          root: null,
          rootMargin: '240px',
          threshold: 0.01
        }
      );
      observer.observe(sentinel);
    }

    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [activeView, hasMoreProducts, visibleCount, filteredProducts.length]);

  useEffect(() => {
    return () => {
      if (loadMoreTimerRef.current) clearTimeout(loadMoreTimerRef.current);
    };
  }, []);

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, payload: any) => {
    const existing = orders.find((o) => o.id === orderId);
    const updatedOrder = existing ? { ...existing, ...payload, updatedAt: new Date().toISOString() } : null;

    setOrders((prev) => {
      return prev.map((o) => (o.id === orderId ? { ...o, ...payload, updatedAt: new Date().toISOString() } : o));
    });

    const webhookUrl = settings.googleSheetWebhookUrl || DEFAULT_SHOP_SETTINGS.googleSheetWebhookUrl || '';
    if (webhookUrl && updatedOrder) {
      let action: any = 'update_order';
      const s = String(payload.status || '').toLowerCase();
      if (s.includes('confirm')) action = 'confirm_order';
      else if (s.includes('reject') || s.includes('cancel')) action = 'reject_order';
      else if (s.includes('ship') || payload.trackingNumber) action = 'ship_order';

      syncOrderToGoogleSheets(updatedOrder, action, webhookUrl).catch((err) => {
        console.warn('Direct client order status update to Google Sheets:', err);
      });
    }

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
    const cleanId = String(product.id || '').trim();
    if (cleanId) {
      deletedProductIdsRef.current.delete(cleanId);
      deletedProductIdsRef.current.delete(cleanId.toUpperCase());
    }
    const cleanProd = normalizeProductList([product])[0] || product;
    recentlyModifiedProductIdsRef.current.set(cleanProd.id, Date.now());

    // Optimistic update state immediately so new suit and its photo appear right away
    setProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== cleanProd.id);
      const next = [cleanProd, ...filtered];
      lastProductSignatureRef.current = next
        .map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`)
        .join('|');
      try {
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setVisibleCount((prev) => Math.max(prev + 1, INITIAL_VISIBLE_COUNT + 1));

    const webhookUrl = settings.googleSheetWebhookUrl || DEFAULT_SHOP_SETTINGS.googleSheetWebhookUrl || '';
    let syncedByServer = false;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanProd)
      });

      if (res.ok) {
        const serverSaved = await res.json();
        syncedByServer = Boolean(serverSaved?.sheetSynced);
        if (serverSaved && serverSaved.id) {
          recentlyModifiedProductIdsRef.current.set(serverSaved.id, Date.now());
          setProducts((prev) => {
            const updated = prev.map((p) =>
              p.id === serverSaved.id
                ? {
                    ...serverSaved,
                    imageUrl: cleanProd.imageUrl || serverSaved.imageUrl,
                    images: cleanProd.images?.length ? cleanProd.images : serverSaved.images
                  }
                : p
            );
            lastProductSignatureRef.current = updated
              .map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`)
              .join('|');
            try {
              localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    } catch {}

    if (!syncedByServer && webhookUrl) {
      try {
        await syncProductToGoogleSheets(cleanProd, 'save_product', webhookUrl);
      } catch {}
    }
  };

  const handleUpdateProduct = async (id: string, updated: Partial<Product>) => {
    const cleanId = String(id || '').trim();
    if (cleanId) {
      deletedProductIdsRef.current.delete(cleanId);
      deletedProductIdsRef.current.delete(cleanId.toUpperCase());
    }
    recentlyModifiedProductIdsRef.current.set(cleanId, Date.now());
    const existing = products.find((p) => p.id === cleanId);
    const mergedProduct = existing ? { ...existing, ...updated } : ({ id: cleanId, ...updated } as Product);

    setProducts((prev) => {
      const next = prev.map((p) => (p.id === cleanId ? { ...p, ...updated } : p));
      lastProductSignatureRef.current = next
        .map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`)
        .join('|');
      try {
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    const webhookUrl = settings.googleSheetWebhookUrl || DEFAULT_SHOP_SETTINGS.googleSheetWebhookUrl || '';
    let syncedByServer = false;

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(cleanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        syncedByServer = Boolean(data?.sheetSynced);
      }
    } catch {}

    if (!syncedByServer && webhookUrl && mergedProduct.id) {
      try {
        await syncProductToGoogleSheets(mergedProduct as Product, 'update_product', webhookUrl);
      } catch {}
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const cleanId = String(id || '').trim();
    if (!cleanId) return;

    const targetProd = products.find((p) => String(p.id).trim().toLowerCase() === cleanId.toLowerCase()) || ({
      id: cleanId,
      name: cleanId,
      price: 0
    } as Product);

    deletedProductIdsRef.current.add(cleanId);
    deletedProductIdsRef.current.add(cleanId.toUpperCase());
    recentlyModifiedProductIdsRef.current.delete(cleanId);

    setProducts((prev) => {
      const next = prev.filter((p) => String(p.id).trim().toLowerCase() !== cleanId.toLowerCase());
      lastProductSignatureRef.current = next
        .map((p) => `${p.id}:${p.price}:${p.inStock}:${(p.imageUrl || '').length}`)
        .join('|');
      try {
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    const webhookUrl = settings.googleSheetWebhookUrl || DEFAULT_SHOP_SETTINGS.googleSheetWebhookUrl || '';
    let syncedByServer = false;

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(cleanId)}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        syncedByServer = Boolean(data?.sheetSynced);
      }
    } catch {}

    if (!syncedByServer && webhookUrl) {
      try {
        await syncProductToGoogleSheets(targetProd, 'delete_product', webhookUrl);
      } catch {}
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

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));
  const cleanPhone = (settings.phoneNumber || '9417124082').replace(/[^0-9]/g, '');
  const generalWhatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Sat Sri Akal ${settings.shopName}! Main aap di website vekhi hai, mainu suits bare jankari chahidi hai.`
  )}`;
  const mapsUrl = "https://maps.app.goo.gl/A2QC78d9DyRc3eRD6?g_st=ac";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF7F2] text-stone-900 font-sans flex flex-col">
      
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
        onOpenAdmin={handleRequestAdmin}
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
      <main className="flex-1 container mx-auto px-2.5 sm:px-4 max-w-full">
        
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
            onSyncWithSheet={syncWithGoogleSheet}
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
            onViewDetails={(p) => setSelectedProduct(p)}
            onClearWishlist={handleClearWishlist}
            shopPhone={settings.phoneNumber}
          />
        ) : (
          <div className="space-y-8">
            
            {/* Hero Showcase Banner */}
            <HeroBanner
              settings={settings}
              onExploreCatalog={() => {
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Catalog Section Anchor */}
            <div id="catalog-section" className="pt-2 flex items-center justify-between border-b border-amber-200 pb-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold font-serif text-stone-900">
                  {selectedCategory === 'All' ? 'Latest Showroom Suit Catalog' : selectedCategory}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Showing {visibleProducts.length} of {filteredProducts.length} designs · Tap any suit to view details or ask on WhatsApp
                </p>
              </div>

              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-extrabold text-amber-900 hover:text-red-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Show All Designs ➔
                </button>
              )}
            </div>

            {/* Product Grid (Myntra / Flipkart Style Shimmer + Smooth Infinite Scroll) */}
            {isInitialLoading && products.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl border border-amber-200/60 overflow-hidden flex flex-col shadow-2xs"
                  >
                    <div className="aspect-[3/4] shimmer-wave" />
                    <div className="p-3 sm:p-4 space-y-2.5">
                      <div className="h-2.5 shimmer-wave rounded-md w-1/2" />
                      <div className="h-4 shimmer-wave rounded-md w-4/5" />
                      <div className="h-2.5 shimmer-wave rounded-md w-2/3" />
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <div className="h-5 shimmer-wave rounded-md w-1/3" />
                        <div className="h-7 shimmer-wave rounded-xl w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {visibleProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={index < 4}
                      onViewDetails={(p) => setSelectedProduct(p)}
                      isWishlisted={isWishlisted(product.id)}
                      onToggleWishlist={toggleWishlist}
                      shopPhone={settings.phoneNumber}
                    />
                  ))}

                  {/* Shimmer Skeleton Cards while next scroll batch is revealing */}
                  {isLoadingMore &&
                    Array.from({
                      length: Math.min(SCROLL_BATCH_SIZE, Math.max(1, filteredProducts.length - visibleProducts.length))
                    }).map((_, skeletonIdx) => (
                      <div
                        key={`loading-skeleton-${skeletonIdx}`}
                        className="bg-white rounded-2xl border border-amber-200/60 overflow-hidden flex flex-col shadow-2xs"
                      >
                        <div className="aspect-[3/4] shimmer-wave" />
                        <div className="p-3 sm:p-4 space-y-2.5">
                          <div className="h-2.5 shimmer-wave rounded-md w-1/2" />
                          <div className="h-4 shimmer-wave rounded-md w-4/5" />
                          <div className="h-2.5 shimmer-wave rounded-md w-2/3" />
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                            <div className="h-5 shimmer-wave rounded-md w-1/3" />
                            <div className="h-7 shimmer-wave rounded-xl w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Minimal Big-App Infinite Scroll Sentinel */}
                {hasMoreProducts && (
                  <div
                    ref={loadMoreSentinelRef}
                    className="py-6 flex items-center justify-center"
                  >
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 border border-amber-200/80 shadow-2xs text-stone-700">
                      <span className="w-4 h-4 rounded-full border-2 border-amber-700 border-t-transparent animate-spin shrink-0" />
                      <span className="text-xs font-semibold tracking-wide text-stone-700">
                        Loading more designs...
                      </span>
                    </div>
                  </div>
                )}

                {!hasMoreProducts && filteredProducts.length > 0 && (
                  <div className="py-4 text-center">
                    <p className="text-xs font-medium text-stone-500">
                      ✓ All {filteredProducts.length} showroom designs loaded
                    </p>
                  </div>
                )}
              </>
            )}

            {filteredProducts.length === 0 && !isInitialLoading && (
              <div className="bg-white rounded-2xl border border-amber-200 p-12 text-center text-stone-500 my-8">
                No suit designs found matching "{searchQuery}".
              </div>
            )}

            {/* Showroom Information & How Wholesale/Retail Works Section */}
            <section id="showroom-visit-section" className="pt-6 pb-4">
              <div className="bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  
                  {/* Left 7 Cols: How Our Showroom Works */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Wholesale & Retail Showroom · Since 1986
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900" style={{ textWrap: 'balance' }}>
                        Visit {settings.shopName} ({settings.firmName})
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                        ਸਾਡੀ ਦੁਕਾਨ 'ਤੇ ਹਰ ਰੋਜ਼ ਨਵਾਂ ਮਾਲ ਆਉਂਦਾ ਹੈ ਅਤੇ ਹਰ ਡਿਜ਼ਾਈਨ ਦੇ ਸਿਰਫ਼ <strong>1 ਜਾਂ 2 ਸੈੱਟ</strong> ਹੀ ਹੁੰਦੇ ਹਨ। ਇਸ ਲਈ ਅਸੀਂ ਵੈੱਬਸਾਈਟ 'ਤੇ ਸਿੱਧੀ ਆਨਲਾਈਨ ਪੇਮੈਂਟ ਨਹੀਂ ਲੈਂਦੇ — ਪਹਿਲਾਂ ਆਪਣੀ ਪਸੰਦ ਦਾ ਸੂਟ WhatsApp 'ਤੇ ਭੇਜ ਕੇ ਪਤਾ ਕਰੋ ਜਾਂ ਸਿੱਧਾ ਦੁਕਾਨ 'ਤੇ ਵਿਜ਼ਿਟ ਕਰੋ।
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl space-y-1">
                        <p className="font-bold text-stone-900">01. Select Design</p>
                        <p className="text-stone-600 leading-relaxed">
                          Browse our latest suits on the website and save your favorite designs.
                        </p>
                      </div>
                      <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl space-y-1">
                        <p className="font-bold text-stone-900">02. Ask on WhatsApp</p>
                        <p className="text-stone-600 leading-relaxed">
                          Tap the WhatsApp button on any suit to confirm if that set is in stock at the shop.
                        </p>
                      </div>
                      <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl space-y-1">
                        <p className="font-bold text-stone-900">03. Visit or Book</p>
                        <p className="text-stone-600 leading-relaxed">
                          Visit our Maur Mandi showroom directly or reserve your suit on WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right 5 Cols: Store Address, Hours & Direct Contact */}
                  <div className="lg:col-span-5 bg-[#32080E] text-amber-50 rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-amber-500/40">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                        <Store className="w-4 h-4" />
                        <span>Showroom Address & Timings</span>
                      </div>

                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2.5 text-amber-100 hover:text-amber-300 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                          <span className="underline decoration-amber-400/50 underline-offset-2">{settings.address}, {settings.city} ({settings.pincode})</span>
                        </a>
                        <p className="flex items-center gap-2.5 text-amber-100 font-mono">
                          <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{settings.phoneNumber} {settings.phoneNumber2 ? `/ ${settings.phoneNumber2}` : ''}</span>
                        </p>
                        <p className="flex items-center gap-2.5 text-amber-100">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Open All 7 Days: 9:00 AM – 8:30 PM</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <a
                        href={generalWhatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-100 shrink-0" />
                        <span>Chat on WhatsApp</span>
                      </a>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-950 shrink-0" />
                        <span>Open in Google Maps</span>
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={handleRequestAdmin}
      />

      {/* Saved Design Toast Notification */}
      {wishlistToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#2A050B] text-amber-100 px-4 py-3 rounded-2xl shadow-2xl border border-amber-400/80 flex items-center gap-3 max-w-[92vw] sm:max-w-md w-full font-sans">
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
              className="text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-amber-950 px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer whitespace-nowrap"
            >
              View Saved
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
      
      {/* Product Detail & WhatsApp Inquiry Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? isWishlisted(selectedProduct.id) : false}
        onToggleWishlist={toggleWishlist}
        shopPhone={settings.phoneNumber}
      />

    </div>
  );
}
