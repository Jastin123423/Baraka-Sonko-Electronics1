import React, { useState, useEffect, useMemo, useRef } from 'react';
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

/** Advanced Watermarked Media Component with Multi-layer Protection */
const ProtectedMedia: React.FC<{
  src: string;
  alt?: string;
  isVideo?: boolean;
  containerClass?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  productId?: string;
}> = ({ src, alt = '', isVideo = false, containerClass = '', onClick, fullWidth = false, productId = '' }) => {
  const logoUrl = "https://media.barakasonko.store/download__82_-removebg-preview.png";
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate unique watermark pattern based on product ID
  const getWatermarkPattern = () => {
    const patterns = [
      { positions: ['center', 'bottom-right', 'top-left'], opacities: [0.15, 0.6, 0.4] },
      { positions: ['top-right', 'bottom-left', 'center'], opacities: [0.5, 0.5, 0.2] },
      { positions: ['diagonal-1', 'diagonal-2', 'diagonal-3'], opacities: [0.3, 0.3, 0.3] },
    ];
    const patternIndex = productId ? parseInt(productId, 36) % patterns.length : 0;
    return patterns[patternIndex];
  };

  const pattern = getWatermarkPattern();

  const renderWatermark = (position: string, opacity: number) => {
    const baseSize = 40;
    const positions: Record<string, React.CSSProperties> = {
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: baseSize * 1.5, height: baseSize * 1.5 },
      'bottom-right': { bottom: '10px', right: '10px', width: baseSize, height: baseSize },
      'top-left': { top: '10px', left: '10px', width: baseSize * 0.8, height: baseSize * 0.8 },
      'top-right': { top: '10px', right: '10px', width: baseSize, height: baseSize },
      'bottom-left': { bottom: '10px', left: '10px', width: baseSize, height: baseSize },
      'diagonal-1': { top: '20%', left: '20%', width: baseSize * 0.7, height: baseSize * 0.7 },
      'diagonal-2': { top: '60%', left: '70%', width: baseSize * 0.9, height: baseSize * 0.9 },
      'diagonal-3': { top: '70%', left: '20%', width: baseSize * 0.6, height: baseSize * 0.6 },
    };

    return (
      <div
        key={position}
        className="absolute pointer-events-none"
        style={{
          ...positions[position],
          opacity,
          filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
          zIndex: 10,
        }}
      >
        <img
          src={logoUrl}
          alt="Watermark"
          className="w-full h-full object-contain"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-gray-100 ${containerClass}`}
      onClick={onClick}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
        position: 'relative',
        // Anti-screenshot measures
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
      onCopy={(e) => {
        e.preventDefault();
        return false;
      }}
      onCut={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Anti-screenshot overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.02) 50%, transparent 51%)',
          backgroundSize: '10px 10px',
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Main Image or Video */}
      {isVideo ? (
        <div className="relative w-full h-full">
          <video
            src={src}
            className="w-full h-full object-cover"
            controls
            controlsList="nodownload noremoteplayback noplaybackrate"
            disablePictureInPicture
            style={{ pointerEvents: 'auto' }}
            onContextMenu={(e) => e.preventDefault()}
            onLoadedData={() => setIsLoaded(true)}
          >
            <track kind="captions" />
          </video>
          
          {/* Video watermarks */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {pattern.positions.map((pos, idx) => 
              renderWatermark(pos, pattern.opacities[idx])
            )}
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover transition-opacity duration-300"
            draggable="false"
            loading="lazy"
            style={{
              pointerEvents: 'auto',
              opacity: isLoaded ? 1 : 0,
            }}
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              console.error('Failed to load image:', src);
              (e.target as HTMLImageElement).style.opacity = '1';
            }}
          />
          
          {/* Loading skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
          )}
          
          {/* Image watermarks */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {pattern.positions.map((pos, idx) => 
              renderWatermark(pos, pattern.opacities[idx])
            )}
            
            {/* Text watermark overlay */}
            <div
              className="absolute bottom-2 left-2 px-2 py-1 rounded"
              style={{
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                opacity: 0.8,
              }}
            >
              © BarakaSonko.store
            </div>
          </div>
          
          {/* Protection overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              mixBlendMode: 'hard-light',
            }}
          />
        </div>
      )}
    </div>
  );
};

/** Enhanced ErrorBoundary with screenshot protection */
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
    ...cat
  };
};

// Banner data
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

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

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
  const [protectionActive, setProtectionActive] = useState(true);

  // Advanced protection against screenshots and copying
  useEffect(() => {
    if (!protectionActive) return;

    const protectionStyles = `
      * {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      img, video {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
      
      /* Prevent text selection */
      ::selection {
        background: transparent !important;
        color: inherit !important;
      }
      ::-moz-selection {
        background: transparent !important;
        color: inherit !important;
      }
      
      /* Anti-screenshot pattern */
      .anti-screenshot {
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255,255,255,0.02) 10px,
          rgba(255,255,255,0.02) 20px
        ) !important;
      }
    `;

    // Add protection styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = protectionStyles;
    document.head.appendChild(styleSheet);

    // Prevent DevTools opening
    const preventDevTools = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || // Ctrl+Shift+I/J/C
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent right-click
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent drag and drop
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent print screen
    const preventPrintScreen = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        // Show warning
        alert('Screenshots and printing are disabled for copyright protection.');
        return false;
      }
    };

    // Detect screen recording attempts (limited capability in browser)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User might be switching to screenshot tool
        console.warn('Tab visibility changed - possible screenshot attempt');
      }
    };

    // Add event listeners
    document.addEventListener('keydown', preventDevTools);
    document.addEventListener('keydown', preventPrintScreen);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('dragstart', preventDragDrop);
    document.addEventListener('drop', preventDragDrop);
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('cut', (e) => e.preventDefault());
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add blur event to detect window switching
    window.addEventListener('blur', () => {
      console.warn('Window lost focus - possible screenshot attempt');
    });

    // Add beforeunload to warn users
    window.addEventListener('beforeunload', (e) => {
      // Optional: Add cleanup or warning
    });

    return () => {
      // Cleanup
      document.head.removeChild(styleSheet);
      document.removeEventListener('keydown', preventDevTools);
      document.removeEventListener('keydown', preventPrintScreen);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
      document.removeEventListener('selectstart', (e) => e.preventDefault());
      document.removeEventListener('copy', (e) => e.preventDefault());
      document.removeEventListener('cut', (e) => e.preventDefault());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', () => {});
      window.removeEventListener('beforeunload', () => {});
    };
  }, [protectionActive]);

  // Banner rotation effect
  useEffect(() => {
    if (view !== 'home' || banners.length <= 1) return;
    
    const currentBanner = banners[activeBannerIndex];
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, currentBanner.duration);

    return () => clearInterval(interval);
  }, [activeBannerIndex, view]);

  // Transform backend product data
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

        const prodData = await prodRes.json().catch(() => ({
          success: false,
          error: 'Invalid JSON from products API'
        }));
        
        const catData = await catRes.json().catch(() => ({
          success: false,
          error: 'Invalid JSON from categories API'
        }));

        // First process categories
        let normalizedCats: Category[] = [];
        if (catData?.success) {
          const rawCats = Array.isArray(catData.data) ? catData.data : [];
          normalizedCats = rawCats.map(normalizeCategory);
          setCategories(normalizedCats);
        } else {
          setFetchError(prev => prev ? `${prev}; Categories: ${catData?.error}` : `Categories: ${catData?.error || 'Unknown error'}`);
        }

        // Then process products with the normalized categories
        if (prodData?.success) {
          const raw = Array.isArray(prodData.data) ? prodData.data : [];
          const normalized = raw.map(p => normalizeProduct(p, normalizedCats));
          setProducts(normalized);
        } else {
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

  const handleBannerClick = () => {
    setView('all-products');
  };

  const goToNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

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
    <div 
      className="relative min-h-screen bg-white anti-screenshot"
      style={{
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      {/* Protection Warning Banner */}
      {protectionActive && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white text-xs font-black py-1 px-4 text-center z-50">
          ⚠️ Copyright Protected - Screenshots & Copying Disabled
        </div>
      )}

      {/* Product Detail View */}
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={products}
          onBack={() => setView('home')}
          onProductClick={handleProductClick}
          ProtectedMedia={ProtectedMedia}
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

      <main className="w-full max-w-[600px] mx-auto pb-24 pt-6">
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
                    <ProtectedMedia
                      src={banner.src}
                      onClick={handleBannerClick}
                      containerClass="h-[350px]"
                      fullWidth={true}
                      alt={banner.alt}
                    />
                  </div>
                ))}
              </div>

              {/* Banner Navigation */}
              {banners.length > 1 && (
                <>
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

            <QuickActions onActionSelect={() => setView('all-products')} />

            <CategorySection
              categories={categories}
              onCategorySelect={handleCategorySelect}
              onMore={() => setView('categories')}
            />

            <FlashSale
              products={products.slice(0, 5)}
              onProductClick={handleProductClick}
              onSeeAll={() => setView('all-products')}
              ProtectedMedia={ProtectedMedia}
            />

            <div className="p-4">
              <ProtectedMedia
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
              ProtectedMedia={ProtectedMedia}
            />
          </>
        ) : view === 'all-products' ? (
          <AllProductsView
            products={products}
            onProductClick={handleProductClick}
            onLoadMore={() => {}}
            isLoading={false}
            ProtectedMedia={ProtectedMedia}
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
              ProtectedMedia={ProtectedMedia}
            />
          </div>
        ) : view === 'search-results' ? (
          <div className="animate-fadeIn p-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : 'Search'}
            </h2>

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
              ProtectedMedia={ProtectedMedia}
            />
          </div>
        ) : view === 'categories' ? (
          <CategoriesView
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onShowAllProducts={() => setView('all-products')}
            suggestedProducts={products}
            onProductClick={handleProductClick}
            ProtectedMedia={ProtectedMedia}
          />
        ) : view === 'admin' ? (
          <ErrorBoundary title="Admin screen crashed">
            <AdminView
              products={products}
              categories={categories}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
              ProtectedMedia={ProtectedMedia}
              onToggleProtection={() => setProtectionActive(!protectionActive)}
              protectionActive={protectionActive}
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

      {/* Copyright Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white text-center py-2 text-xs z-40">
        © {new Date().getFullYear()} BarakaSonko.store - All media protected by digital watermarking
      </div>
    </div>
  );
};

export default App;
