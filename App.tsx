import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import QuickActions from './components/QuickActions';
import CategorySection from './components/CategorySection';
import FlashSale from './components/FlashSale';
import AdBanner from './components/AdBanner';
import ProductGrid from './components/ProductGrid';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import ProductDetailView from './components/ProductDetailView';
import CategoriesView from './components/CategoriesView';
import AllProductsView from './components/AllProductsView';
import { Product, User, Category } from './types';

/** Watermarked Media Component - Prevents easy image copying */
const WatermarkedMedia: React.FC<{
  src: string;
  alt?: string;
  isVideo?: boolean;
  containerClass?: string;
  onClick?: () => void;
  fullWidth?: boolean;
}> = ({ src, alt = '', isVideo = false, containerClass = '', onClick, fullWidth = false }) => {
  const logoUrl = "https://media.barakasonko.store/download__82_-removebg-preview.png";
  
  return (
    <div 
      className={`relative overflow-hidden rounded-xl ${containerClass}`}
      onClick={onClick}
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
        position: 'relative'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Main Image or Video */}
      {isVideo ? (
        <div className="relative w-full h-full">
          <video 
            src={src} 
            className="w-full h-full object-cover"
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            style={{ pointerEvents: 'auto' }}
            onContextMenu={(e) => e.preventDefault()}
          />
          {/* Watermark Overlay for Video */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-2 right-2 w-16 h-16 opacity-70">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
                draggable="false"
              />
            </div>
            <div className="absolute top-2 left-2 w-12 h-12 opacity-50">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
                draggable="false"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
            draggable="false"
            loading="lazy"
            style={{ pointerEvents: 'auto' }}
          />
          {/* Diagonal Watermark Pattern */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Center Watermark */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 opacity-20">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
                draggable="false"
              />
            </div>
            {/* Bottom Right Watermark */}
            <div className="absolute bottom-3 right-3 w-14 h-14 opacity-70">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
                draggable="false"
              />
            </div>
            {/* Top Left Watermark */}
            <div className="absolute top-3 left-3 w-10 h-10 opacity-50">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
                draggable="false"
              />
            </div>
            {/* Transparent Overlay to prevent color picking */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5"></div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Small inline ErrorBoundary so AdminView crashes don't blank the whole app */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; title?: string },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('UI crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-black text-red-700">
              {this.props.title || 'This screen crashed.'}
            </p>
            <p className="text-xs text-red-700 mt-2">
              Open console to see full error. Most likely a bad product field (price/id/image) from backend.
            </p>
            <pre className="text-[11px] mt-3 whitespace-pre-wrap text-red-600">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper function to get default icon for category
const getDefaultCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('phone') || name.includes('simu')) return '📱';
  if (name.includes('tv') || name.includes('television')) return '📺';
  if (name.includes('sound') || name.includes('sauti')) return '🔊';
  if (name.includes('camera') || name.includes('kamera')) return '📷';
  if (name.includes('laptop') || name.includes('kompyuta')) return '💻';
  if (name.includes('game') || name.includes('mchezo')) return '🎮';
  if (name.includes('watch') || name.includes('saa')) return '⌚';
  if (name.includes('home') || name.includes('nyumba')) return '🏠';
  if (name.includes('kitchen') || name.includes('jikoni')) return '🍳';
  if (name.includes('car') || name.includes('gari')) return '🚗';
  if (name.includes('health') || name.includes('afya')) return '❤️';
  if (name.includes('book') || name.includes('kitabu')) return '📚';
  if (name.includes('fashion') || name.includes('mitindo')) return '👕';
  if (name.includes('all') || name.includes('zote')) return '🛒';
  if (name.includes('electronics') || name.includes('umeme')) return '🔌';
  if (name.includes('accessories') || name.includes('vifaa')) return '🛍️';
  
  return '🛒';
};

// Transform backend category data to ensure proper format
const normalizeCategory = (cat: any): Category => {
  const backendIcon = cat.icon || cat.icon_name || cat.icon_emoji || cat.icon_url;
  
  return {
    id: String(cat.id || cat._id || `cat_${Date.now()}_${Math.random()}`),
    name: String(cat.name || cat.category_name || cat.title || 'Unnamed Category'),
    icon: backendIcon || getDefaultCategoryIcon(cat.name || ''),
    // Include any other fields backend might provide
    ...cat
  };
};

// Banner data - Updated with your new banner
const banners = [
  {
    id: 1,
    src: "https://media.barakasonko.store/Jipatie%20kwa%20bei%20poa.gif",
    alt: "Get products at affordable prices",
    duration: 5000,
  },
  {
    id: 2,
    src: "https://media.barakasonko.store/uploads/Yellow%20And%20Red%20Unboxing%20And%20Review%20YouTube%20Thumbnail.gif",
    alt: "Product unboxing and review",
    duration: 5000,
  },
  {
    id: 3,
    src: "https://media.barakasonko.store/Untitled%20design.gif",
    alt: "Special promotions banner",
    duration: 5000,
  },
  {
    id: 4,
    src: "https://media.barakasonko.store/Yellow%20And%20Red%20Unboxing%20And%20Review%20YouTube%20Thumbnail%20(1).gif",
    alt: "Product boxing and review",
    duration: 5000,
  }
];

// Additional banners for QuickActions section
const quickActionBanners = [
  {
    id: 'wishlist',
    title: 'Wishlist',
    src: "https://media.barakasonko.store/Untitled%20design.gif",
    alt: "Wishlist promotions",
  },
  {
    id: 'wholesale',
    title: 'Wholesale',
    src: "https://media.barakasonko.store/Untitled%20design.gif",
    alt: "Wholesale offers",
  },
  {
    id: 'bargain',
    title: 'Bargain Zone',
    src: "https://media.barakasonko.store/Untitled%20design.gif",
    alt: "Bargain zone deals",
  },
  {
    id: 'more',
    title: 'More Deals',
    src: "https://media.barakasonko.store/Untitled%20design.gif",
    alt: "More exciting deals",
  }
];

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [activeQuickActionBanner, setActiveQuickActionBanner] = useState(0);

  const [view, setView] = useState<
    | 'home'
    | 'admin'
    | 'product-detail'
    | 'category-results'
    | 'categories'
    | 'search-results'
    | 'all-products'
  >('home');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Prevent right-click and image downloading globally
  useEffect(() => {
    const preventDefaults = (e: Event) => {
      e.preventDefault();
    };

    // Disable right-click context menu
    document.addEventListener('contextmenu', preventDefaults);
    
    // Disable drag and drop
    document.addEventListener('dragstart', preventDefaults);
    document.addEventListener('drop', preventDefaults);
    
    // Disable text selection on images
    const disableSelection = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        e.preventDefault();
      }
    };
    document.addEventListener('selectstart', disableSelection);

    // Disable keyboard shortcuts for saving
    const disableSaveShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', disableSaveShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventDefaults);
      document.removeEventListener('dragstart', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
      document.removeEventListener('selectstart', disableSelection);
      document.removeEventListener('keydown', disableSaveShortcuts);
    };
  }, []);

  // Banner rotation effect
  useEffect(() => {
    if (view !== 'home' || banners.length <= 1) return;
    
    const currentBanner = banners[activeBannerIndex];
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, currentBanner.duration);

    return () => clearInterval(interval);
  }, [activeBannerIndex, view]);

  // QuickAction banner rotation
  useEffect(() => {
    if (view !== 'home' || quickActionBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveQuickActionBanner((prev) => (prev + 1) % quickActionBanners.length);
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [activeQuickActionBanner, view]);

  // Transform backend product data to ensure proper format
  const normalizeProduct = (p: any, categoriesList: Category[]): Product => {
    const id = String(p?.id ?? '');
    const price = Number(p?.price ?? 0);
    const discount = p?.discount == null ? 0 : Number(p.discount);

    let categoryId = String(p?.category_id ?? p?.categoryId ?? '').trim();
    let categoryName = '';
    let categoryIcon = '';

    if (typeof p?.category === 'object' && p.category) {
      categoryId = String(p.category.id ?? categoryId).trim();
      categoryName = String(p.category.name ?? p.category.category_name ?? '').trim();
      categoryIcon = String(
        p.category.icon ?? p.category.icon_name ?? p.category.icon_emoji ?? ''
      ).trim();
    } else {
      categoryName = String(
        p?.category_name ??
          p?.categoryName ??
          p?.category ??
          ''
      ).trim();

      const maybe = String(p?.category ?? '').trim();
      if (!categoryId && /^\d+$/.test(maybe)) categoryId = maybe;
    }

    if ((!categoryName || categoryName === '0') && categoryId) {
      const found = categoriesList.find(c => String(c.id) === String(categoryId));
      if (found) {
        categoryName = found.name;
        categoryIcon = categoryIcon || found.icon || '';
      }
    }

    const category = categoryName;

    const getProductCategoryIcon = () => {
      if (categoryIcon) return categoryIcon;
      
      const matchingCat = categoriesList.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase() ||
        c.name.toLowerCase() === category.toLowerCase()
      );
      
      return matchingCat?.icon || getDefaultCategoryIcon(categoryName);
    };

    return {
      ...p,
      id,
      price: Number.isFinite(price) ? price : 0,
      discount: Number.isFinite(discount) ? discount : 0,
      category,
      categoryName,
      categoryId: categoryId || undefined,
      category_id: categoryId || undefined,
      category_name: categoryName,
      categoryIcon: getProductCategoryIcon(),
      image: p?.image || p?.image_url || (Array.isArray(p?.images) ? p.images[0] : '') || '',
      images: Array.isArray(p?.images)
        ? p.images
        : Array.isArray(p?.image_urls)
        ? p.image_urls
        : Array.isArray(p?.image_urls_json)
        ? p.image_urls_json
        : [],
      descriptionImages: Array.isArray(p?.descriptionImages)
        ? p.descriptionImages
        : Array.isArray(p?.description_images)
        ? p.description_images
        : [],
      videoUrl: String(p?.videoUrl ?? p?.video_url ?? ''),
    } as any;
  };

  // Fetch initial data
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        
        console.log('📡 App: Fetching initial data...');
        
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        console.log('📡 App: Products response status:', prodRes.status);
        console.log('📡 App: Categories response status:', catRes.status);

        const prodData = await prodRes.json().catch(() => {
          console.error('❌ App: Failed to parse products JSON');
          return { success: false, error: 'Invalid JSON from products API' };
        });
        
        const catData = await catRes.json().catch(() => {
          console.error('❌ App: Failed to parse categories JSON');
          return { success: false, error: 'Invalid JSON from categories API' };
        });

        // First process categories
        let normalizedCats: Category[] = [];
        if (catData?.success) {
          const rawCats = Array.isArray(catData.data) ? catData.data : [];
          normalizedCats = rawCats.map(normalizeCategory);
          setCategories(normalizedCats);
        } else {
          console.error('❌ App: Categories API returned error:', catData?.error);
          setFetchError(prev => prev ? `${prev}; Categories: ${catData?.error}` : `Categories: ${catData?.error || 'Unknown error'}`);
        }

        // Then process products with the normalized categories
        if (prodData?.success) {
          const raw = Array.isArray(prodData.data) ? prodData.data : [];
          const normalized = raw.map(p => normalizeProduct(p, normalizedCats));
          setProducts(normalized);
        } else {
          console.error('❌ App: Products API returned error:', prodData?.error);
          setFetchError(prev => prev ? `${prev}; Products: ${prodData?.error}` : `Products: ${prodData?.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('❌ App: Failed to initialize app', error);
        setFetchError(error.message || 'Network or server error');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Search Logic
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter((p) => {
      const categoryField = (p.category || (p as any).categoryName || '').toLowerCase();
      return p.title?.toLowerCase().includes(q) || categoryField.includes(q);
    });
  }, [searchQuery, products]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery, categories]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setView('search-results');
  };

  const handleCategorySelect = (category: Category) => {
    if (category.name === 'Bidhaa Zote' || category.name.toLowerCase().includes('all')) {
      setView('all-products');
      setIsSidebarOpen(false);
      return;
    }
    setSelectedCategory(category);
    setView('category-results');
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  // Mock Admin session
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sonko_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showAuth, setShowAuth] = useState(false);

  const addProduct = async (newProduct: Product) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) return false;

      const savedRaw = result.data || result.product || result.item;
      if (savedRaw) {
        const saved = normalizeProduct(savedRaw, categories);
        setProducts((prev) => [saved, ...prev]);
        return true;
      }

      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json().catch(() => null);
      if (prodData?.success) {
        const normalized = (prodData.data || []).map(p => normalizeProduct(p, categories));
        setProducts(normalized);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (result?.success) {
        setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminAccess = () => {
    if (!user) setShowAuth(true);
    else setView('admin');
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sonko_user', JSON.stringify(newUser));
    setShowAuth(false);
    setView('admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sonko_user');
    setView('home');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('product-detail');
  };

  // Handle banner click
  const handleBannerClick = () => {
    setView('all-products');
  };

  // Handle quick action banner click
  const handleQuickActionBannerClick = (actionId: string) => {
    switch (actionId) {
      case 'wishlist':
        // Navigate to wishlist or show wishlist products
        setView('all-products');
        break;
      case 'wholesale':
        // Navigate to wholesale section
        setView('all-products');
        break;
      case 'bargain':
        // Navigate to bargain zone
        setView('all-products');
        break;
      case 'more':
        // Navigate to more deals
        setView('all-products');
        break;
      default:
        setView('all-products');
    }
  };

  // Manual banner navigation
  const goToNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Bottom nav mapping
  const navView =
    view === 'admin'
      ? 'admin'
      : view === 'categories'
      ? 'categories'
      : view === 'all-products'
      ? 'all-products'
      : view === 'search-results'
      ? 'search-results'
      : view === 'category-results'
      ? 'categories'
      : 'home';

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-4">
        <div className="text-3xl font-black italic text-orange-600 animate-pulse">SONKO</div>
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 mt-4">Loading store data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-4 p-8">
        <div className="text-3xl font-black italic text-orange-600">SONKO</div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-black text-red-700">Connection Error</h3>
              <p className="text-xs text-red-600">Failed to load store data</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-orange-600 text-white font-black py-3 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Retry Loading
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Check your internet connection and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white" style={{ 
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none'
    }}>
      {/* Product Detail View */}
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={products}
          onBack={() => setView('home')}
          onProductClick={handleProductClick}
          WatermarkedMedia={WatermarkedMedia}
        />
      )}

      {/* Auth View */}
      {showAuth && <AuthView onLogin={handleLogin} onBack={() => setShowAuth(false)} />}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCategorySelect={handleCategorySelect}
      />

      {/* Header */}
      {view !== 'product-detail' && (
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onSearch={handleSearch}
          initialValue={searchQuery}
        />
      )}

      <main className="w-full max-w-[600px] mx-auto pb-24">
        {view === 'home' ? (
          <>
            <HeroBanner onClick={() => setView('all-products')} />

            {/* Rotating Banner Carousel */}
            <div className="relative w-full overflow-hidden">
              <div className="relative h-[350px]">
                {banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                      index === activeBannerIndex
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-full'
                    }`}
                  >
                    <WatermarkedMedia
                      src={banner.src}
                      onClick={handleBannerClick}
                      containerClass="h-[350px]"
                      fullWidth={true}
                      alt={banner.alt}
                    />
                  </div>
                ))}
              </div>

              {/* Banner Navigation Dots */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveBannerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === activeBannerIndex
                          ? 'bg-orange-600 w-6'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to banner ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Banner Navigation Arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={goToPrevBanner}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                    aria-label="Previous banner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNextBanner}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                    aria-label="Next banner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Quick Actions with Rotating Banner */}
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-sm font-black text-gray-500 uppercase mb-2">Hot Deals</h2>
                <div className="relative h-[120px] rounded-2xl overflow-hidden">
                  <WatermarkedMedia
                    src={quickActionBanners[activeQuickActionBanner].src}
                    onClick={() => handleQuickActionBannerClick(quickActionBanners[activeQuickActionBanner].id)}
                    containerClass="h-[120px]"
                    alt={quickActionBanners[activeQuickActionBanner].alt}
                  />
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-orange-600 text-white text-xs font-black px-3 py-1 rounded-full">
                      {quickActionBanners[activeQuickActionBanner].title}
                    </span>
                  </div>
                  {quickActionBanners.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex space-x-1">
                      {quickActionBanners.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full ${
                            index === activeQuickActionBanner ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <QuickActions onActionSelect={() => setView('all-products')} />
            </div>

            <CategorySection
              categories={categories}
              onCategorySelect={handleCategorySelect}
              onMore={() => setView('categories')}
            />

            <FlashSale
              products={products.slice(0, 5)}
              onProductClick={handleProductClick}
              onSeeAll={() => setView('all-products')}
              WatermarkedMedia={WatermarkedMedia}
            />

            <div className="p-4">
              <WatermarkedMedia
                src="https://media.barakasonko.store/White%20Blue%20Professional%20Website%20Developer%20LinkedIn%20Banner.gif"
                onClick={() => setView('all-products')}
                containerClass="h-[110px]"
                alt="Special promotion banner"
              />
            </div>

            <ProductGrid
              title="Daily Discoveries"
              products={products.slice(0, 10)}
              onProductClick={handleProductClick}
              WatermarkedMedia={WatermarkedMedia}
            />
          </>
        ) : view === 'all-products' ? (
          <AllProductsView
            products={products}
            onProductClick={handleProductClick}
            onLoadMore={() => {}}
            isLoading={false}
            WatermarkedMedia={WatermarkedMedia}
          />
        ) : view === 'category-results' ? (
          <div className="animate-fadeIn p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedCategory?.icon && (
                  <span className="text-xl">{selectedCategory.icon}</span>
                )}
                <h2 className="text-sm font-bold text-gray-500 uppercase">
                  {selectedCategory ? selectedCategory.name : 'Category'}
                </h2>
              </div>
              <button
                className="text-xs font-black text-orange-600"
                onClick={() => setView('all-products')}
              >
                View All
              </button>
            </div>

            <ProductGrid
              products={products.filter((p) => {
                const cat = String((p as any).category ?? (p as any).categoryName ?? '').toLowerCase();
                const target = String(selectedCategory?.name ?? '').toLowerCase();
                return target ? cat === target : true;
              })}
              onProductClick={handleProductClick}
              WatermarkedMedia={WatermarkedMedia}
            />
          </div>
        ) : view === 'search-results' ? (
          <div className="animate-fadeIn p-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : 'Search'}
            </h2>

            {/* Show matching categories */}
            {filteredCategories.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-black text-gray-400 uppercase mb-2">Matching Categories</p>
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      className="px-3 py-2 rounded-full bg-gray-100 text-xs font-black text-gray-700 flex items-center space-x-2 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                      onClick={() => handleCategorySelect(c)}
                    >
                      {c.icon && <span>{c.icon}</span>}
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ProductGrid 
              products={filteredProducts} 
              onProductClick={handleProductClick}
              WatermarkedMedia={WatermarkedMedia}
            />
          </div>
        ) : view === 'categories' ? (
          <CategoriesView
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onShowAllProducts={() => setView('all-products')}
            suggestedProducts={products}
            onProductClick={handleProductClick}
            WatermarkedMedia={WatermarkedMedia}
          />
        ) : view === 'admin' ? (
          <ErrorBoundary title="Admin screen crashed">
            <AdminView
              products={products}
              categories={categories}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
              WatermarkedMedia={WatermarkedMedia}
            />
          </ErrorBoundary>
        ) : null}
      </main>

      {/* Bottom Nav */}
      {view !== 'product-detail' && (
        <BottomNav
          currentView={navView as any}
          onViewChange={(v: any) => {
            if (v === 'admin') handleAdminAccess();
            else setView(v);
          }}
        />
      )}
    </div>
  );
};

export default App;
