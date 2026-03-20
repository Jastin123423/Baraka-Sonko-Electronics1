// App.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
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
import { Product, User, Category, Comment } from './types';

// ============ CACHE HELPERS ============

const PRODUCTS_CACHE_KEY = 'barakasonko_products_cache_v2';
const CATEGORIES_CACHE_KEY = 'barakasonko_categories_cache_v2';
const CACHE_META_KEY = 'barakasonko_cache_meta_v2';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

type CachePayload<T> = {
  timestamp: number;
  data: T;
};

const saveToCache = <T,>(key: string, data: T) => {
  try {
    const payload: CachePayload<T> = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.error(`Failed to save cache for ${key}`, error);
  }
};

const loadFromCache = <T,>(key: string, maxAge = CACHE_MAX_AGE): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: CachePayload<T> = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== 'number') return null;

    const expired = Date.now() - parsed.timestamp > maxAge;
    if (expired) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(`Failed to load cache for ${key}`, error);
    return null;
  }
};

const saveCacheMeta = (meta: Record<string, any>) => {
  try {
    localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
  } catch (error) {
    console.error('Failed to save cache meta', error);
  }
};

const loadCacheMeta = (): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(CACHE_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearStoreCache = () => {
  localStorage.removeItem(PRODUCTS_CACHE_KEY);
  localStorage.removeItem(CATEGORIES_CACHE_KEY);
  localStorage.removeItem(CACHE_META_KEY);
};

// ============ UTILITY FUNCTIONS ============

const getInitialViewFromPath = (pathname: string) => {
  if (pathname.startsWith('/product/')) return 'product-detail';
  if (pathname.startsWith('/category/')) return 'category-results';
  if (pathname === '/categories') return 'categories';
  if (pathname === '/all-products') return 'all-products';
  if (pathname === '/admin') return 'admin';
  return 'home';
};

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

const normalizeCategory = (cat: any): Category => {
  const backendIcon = cat.icon || cat.icon_name || cat.icon_emoji || cat.icon_url;

  return {
    id: String(cat.id || cat._id || `cat_${Date.now()}_${Math.random()}`),
    name: String(cat.name || cat.category_name || cat.title || 'Unnamed Category'),
    icon: backendIcon || getDefaultCategoryIcon(cat.name || ''),
    ...cat
  };
};

// ============ COMPONENTS ============

const WatermarkedImage: React.FC<{
  src: string;
  alt?: string;
  containerClass?: string;
  onClick?: () => void;
  productId?: string;
  isProduct?: boolean;
}> = ({
  src,
  alt = '',
  containerClass = '',
  onClick,
  productId = '',
  isProduct = true
}) => {
  const logoUrl = "https://media.barakasonko.store/download__82_-removebg-preview.png";
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const shouldWatermark = isProduct;

  const getWatermarkPattern = () => {
    if (!shouldWatermark) return { positions: [], opacities: [], sizes: [] };

    const patterns = [
      { positions: ['bottom-right', 'top-left'], opacities: [0.6, 0.4], sizes: [30, 25] },
      { positions: ['bottom-left', 'top-right'], opacities: [0.5, 0.5], sizes: [28, 28] },
      { positions: ['center', 'bottom-right'], opacities: [0.4, 0.3], sizes: [35, 22] },
    ];

    const patternIndex = productId
      ? Math.abs(productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % patterns.length
      : 0;

    return patterns[patternIndex];
  };

  const pattern = getWatermarkPattern();

  const renderWatermark = (position: string, opacity: number, size: number) => {
    const positions: Record<string, React.CSSProperties> = {
      'bottom-right': { bottom: '10px', right: '10px', width: `${size}px`, height: `${size}px` },
      'top-left': { top: '10px', left: '10px', width: `${size}px`, height: `${size}px` },
      'top-right': { top: '10px', right: '10px', width: `${size}px`, height: `${size}px` },
      'bottom-left': { bottom: '10px', left: '10px', width: `${size}px`, height: `${size}px` },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: `${size * 1.5}px`, height: `${size * 1.5}px` },
      'right-middle': { top: '50%', right: '10px', transform: 'translateY(-50%)', width: `${size}px`, height: `${size}px` },
    };

    if (!positions[position]) return null;

    return (
      <div
        key={position}
        className="absolute pointer-events-none"
        style={{
          ...positions[position],
          opacity,
          filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
          zIndex: 20,
        }}
      >
        <img
          src={logoUrl}
          alt=""
          className="w-full h-full object-contain"
          draggable="false"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl product-image-container ${containerClass}`}
      onClick={onClick}
      style={{
        userSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
      }}
      onContextMenu={(e) => {
        if (shouldWatermark) e.preventDefault();
      }}
    >
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
        onError={() => {
          console.error('❌ Failed to load image:', src);
          setHasError(true);
        }}
      />

      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" style={{ zIndex: 1 }} />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100" style={{ zIndex: 2 }}>
          <div className="text-center p-4">
            <div className="text-gray-400 text-3xl mb-2">🖼️</div>
            <p className="text-xs text-gray-500">Image not available</p>
          </div>
        </div>
      )}

      {shouldWatermark && !hasError && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {pattern.positions.map((pos, idx) =>
            renderWatermark(pos, pattern.opacities[idx], pattern.sizes[idx])
          )}

          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '9px',
              fontWeight: 'bold',
              opacity: 0.8,
              zIndex: 21,
            }}
          >
            ©barakasonko
          </div>
        </div>
      )}
    </div>
  );
};

const VideoPlayer: React.FC<{
  src: string;
  containerClass?: string;
  onClick?: () => void;
  playInline?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}> = ({
  src,
  containerClass = '',
  onClick,
  playInline = true,
  autoPlay = false,
  muted = true,
  loop = true,
  controls = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${containerClass}`}
      onClick={onClick}
      style={{
        userSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline={playInline}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        preload="metadata"
        onLoadedData={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onError={() => {
          console.error('Failed to load video:', src);
          setHasError(true);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
          <div className="text-center text-white p-4">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-sm">Video failed to load</p>
          </div>
        </div>
      )}

      {!controls && isLoaded && !hasError && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          className="absolute bottom-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <span className="text-white text-sm">
            {isPlaying ? '⏸️' : '▶️'}
          </span>
        </button>
      )}
    </div>
  );
};

const Banner: React.FC<{
  src: string;
  alt?: string;
  containerClass?: string;
  onClick?: () => void;
  isGif?: boolean;
}> = ({
  src,
  alt = '',
  containerClass = '',
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isGifFile = src.toLowerCase().endsWith('.gif');

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${containerClass}`}
      onClick={onClick}
      style={{
        userSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
      }}
    >
      {isGifFile ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          draggable="false"
          loading="lazy"
          decoding="async"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            console.error('Failed to load GIF:', src);
            setHasError(true);
          }}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          draggable="false"
          loading="lazy"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            console.error('Failed to load banner:', src);
            setHasError(true);
          }}
        />
      )}

      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-gray-400 text-3xl mb-2">🎬</div>
            <p className="text-xs text-gray-500">Banner not available</p>
          </div>
        </div>
      )}
    </div>
  );
};

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
              Open console to see full error.
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

class CommentsService {
  private static API_BASE = '/api/comments';

  static async fetchComments(productId: string): Promise<Comment[]> {
    try {
      const response = await fetch(`${this.API_BASE}?productId=${encodeURIComponent(productId)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map((comment: any) => ({
          id: String(comment.id || comment._id),
          productId: String(comment.productId),
          userId: String(comment.userId || comment.user_id || 'anonymous'),
          userName: String(comment.userName || comment.user_name || 'Anonymous'),
          userInitials: comment.userInitials || comment.user_initials || 'AN',
          userColor: comment.userColor || comment.user_color || 'bg-blue-100',
          textColor: comment.textColor || comment.text_color || 'text-blue-600',
          content: String(comment.content || comment.comment || ''),
          timestamp: comment.timestamp || comment.created_at || new Date().toISOString(),
          likes: Number(comment.likes || comment.likes_count || 0),
          isLiked: Boolean(comment.isLiked || comment.liked || false),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }

  static async addComment(comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'isLiked'>): Promise<Comment | null> {
    try {
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: comment.productId,
          content: comment.content,
          userId: comment.userId,
          userName: comment.userName,
          userInitials: comment.userInitials,
          userColor: comment.userColor,
          textColor: comment.textColor,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.success && data.data) {
        return {
          id: String(data.data.id || data.data._id),
          productId: String(data.data.productId),
          userId: String(data.data.userId || 'anonymous'),
          userName: String(data.data.userName || 'Anonymous'),
          userInitials: data.data.userInitials || 'AN',
          userColor: data.data.userColor || 'bg-blue-100',
          textColor: data.data.textColor || 'text-blue-600',
          content: String(data.data.content || ''),
          timestamp: data.data.timestamp || data.data.created_at || new Date().toISOString(),
          likes: 0,
          isLiked: false,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to add comment:', error);
      return null;
    }
  }

  static async likeComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Failed to like comment:', error);
      return false;
    }
  }

  static async deleteComment(commentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      return false;
    }
  }
}

class ViewsService {
  private static API_BASE = '/api/views';

  static async getViews(productId: string): Promise<number> {
    try {
      const res = await fetch(`${this.API_BASE}?productId=${encodeURIComponent(productId)}`);
      if (!res.ok) return 0;
      const data = await res.json().catch(() => null);
      return data?.success ? Number(data.data?.views ?? 0) : 0;
    } catch {
      return 0;
    }
  }

  static async recordView(productId: string, viewerKey: string): Promise<number> {
    try {
      const res = await fetch(this.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, viewerKey }),
      });
      if (!res.ok) return 0;
      const data = await res.json().catch(() => null);
      return data?.success ? Number(data.data?.views ?? 0) : 0;
    } catch {
      return 0;
    }
  }
}

const banners = [
  {
    id: 1,
    src: "https://media.barakasonko.store/Jipatie%20kwa%20bei%20poa.gif",
    alt: "Get products at affordable prices",
    duration: 5000,
    isGif: true
  },
  {
    id: 2,
    src: "https://media.barakasonko.store/uploads/Yellow%20And%20Red%20Unboxing%20And%20Review%20YouTube%20Thumbnail.gif",
    alt: "Product unboxing and review",
    duration: 5000,
    isGif: true
  },
  {
    id: 3,
    src: "https://media.barakasonko.store/Untitled%20design.gif",
    alt: "Special promotions banner",
    duration: 5000,
    isGif: true
  },
  {
    id: 4,
    src: "https://media.barakasonko.store/Yellow%20And%20Red%20Unboxing%20And%20Review%20YouTube%20Thumbnail%20(1).gif",
    alt: "Product boxing and review",
    duration: 5000,
    isGif: true
  }
];

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId, categoryId } = useParams<{ productId: string; categoryId: string }>();

  const isDirectProductRoute = location.pathname.startsWith('/product/');

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
  >(() => getInitialViewFromPath(window.location.pathname) as any);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [categoryProductMap, setCategoryProductMap] = useState<Record<string, Product[]>>({});

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [productComments, setProductComments] = useState<Record<string, Comment[]>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});

  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [isRecordingView, setIsRecordingView] = useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isProductImage = target.closest('.product-image-container') !== null;
      if (isProductImage) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    if (view !== 'home' || banners.length <= 1) return;

    const currentBanner = banners[activeBannerIndex];
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, currentBanner.duration);

    return () => clearInterval(interval);
  }, [activeBannerIndex, view]);

  const normalizeProduct = (p: any, categoriesList: Category[]): Product => {
    const id = String(p?.id ?? p?._id ?? '');
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

  const buildCategoryProductMap = useCallback((productList: Product[], categoryList: Category[]) => {
    const map: Record<string, Product[]> = {};

    categoryList.forEach(cat => {
      map[cat.id] = [];
    });

    if (!map["14"]) {
      map["14"] = [];
    }

    productList.forEach(product => {
      const productData = product as any;
      let matchedCategoryId: string | null = null;

      if (productData.category_id) {
        const catId = String(productData.category_id).trim();
        if (map[catId]) matchedCategoryId = catId;
      }

      if (!matchedCategoryId && productData.categoryId) {
        const catId = String(productData.categoryId).trim();
        if (map[catId]) matchedCategoryId = catId;
      }

      if (!matchedCategoryId) {
        const productCatName = (
          productData.category_name ||
          productData.categoryName ||
          productData.category ||
          ''
        ).toLowerCase().trim();

        const matchingCat = categoryList.find(cat =>
          cat.name.toLowerCase().trim() === productCatName
        );

        if (matchingCat) matchedCategoryId = matchingCat.id;
      }

      if (!matchedCategoryId) {
        const title = (productData.title || '').toLowerCase();

        if (title.includes('mic') || title.includes('microphone')) {
          if (!title.includes('cable') && !title.includes('wire') &&
              !title.includes('stand') && !title.includes('stendi')) {
            matchedCategoryId = "3";
          }
        } else if (title.includes('spika') || title.includes('speaker') || title.includes('sound')) {
          matchedCategoryId = "2";
        } else if (title.includes('tv') || title.includes('television')) {
          matchedCategoryId = "6";
        } else if (title.includes('charger') || title.includes('adapter') ||
                 title.includes('cable') || title.includes('wire')) {
          matchedCategoryId = "7";
        } else if (title.includes('tv stand') || title.includes('tv bracket') ||
                 title.includes('tv stendi')) {
          matchedCategoryId = "8";
        } else if (title.includes('gitaa') || title.includes('guitar')) {
          matchedCategoryId = "9";
        } else if (title.includes('tumba') || title.includes('drum') ||
                 title.includes('manyanga') || title.includes('dufu')) {
          matchedCategoryId = "11";
        } else if (title.includes('mixer') || title.includes('mixing')) {
          matchedCategoryId = "12";
        } else if (title.includes('battery') || title.includes('betri') ||
                 title.includes('jack') || title.includes('spare')) {
          matchedCategoryId = "13";
        }
      }

      if (matchedCategoryId && map[matchedCategoryId]) {
        map[matchedCategoryId].push(product);
      } else if (map["14"]) {
        map["14"].push(product);
      }
    });

    Object.keys(map).forEach(catId => {
      const seen = new Set();
      map[catId] = map[catId].filter(p => {
        const duplicate = seen.has(p.id);
        seen.add(p.id);
        return !duplicate;
      });
    });

    return map;
  }, []);

  useEffect(() => {
    if (products.length > 0 && categories.length > 0) {
      const map = buildCategoryProductMap(products, categories);
      setCategoryProductMap(map);
      console.log('✅ Category product map built');
    }
  }, [products, categories, buildCategoryProductMap]);

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        const cachedProducts = loadFromCache<Product[]>(PRODUCTS_CACHE_KEY);
        const cachedCategories = loadFromCache<Category[]>(CATEGORIES_CACHE_KEY);

        if (cachedCategories && cachedProducts) {
          setCategories(cachedCategories);
          setProducts(cachedProducts);

          const initialCounts: Record<string, number> = {};
          const initialViewCounts: Record<string, number> = {};

          cachedProducts.forEach(product => {
            initialCounts[product.id] = 0;
            initialViewCounts[product.id] = 0;
          });

          setCommentCounts(initialCounts);
          setViewCounts(initialViewCounts);
          setCategoryProductMap(buildCategoryProductMap(cachedProducts, cachedCategories));
          setIsLoading(false);

          void fetchFreshData();
          return;
        }

        await fetchFreshData();
      } catch (error: any) {
        console.error('❌ App: Failed to initialize app', error);
        setFetchError(error.message || 'Network or server error');
        setIsLoading(false);
      }
    };

    const fetchFreshData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products', {
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
          }),
          fetch('/api/categories', {
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
          }),
        ]);

        const prodData = await prodRes.json().catch(() => ({
          success: false,
          error: 'Invalid JSON from products API'
        }));

        const catData = await catRes.json().catch(() => ({
          success: false,
          error: 'Invalid JSON from categories API'
        }));

        let normalizedCats: Category[] = categories;

        if (catData?.success) {
          const rawCats = Array.isArray(catData.data) ? catData.data : [];
          normalizedCats = rawCats.map(normalizeCategory);
          setCategories(normalizedCats);
          saveToCache(CATEGORIES_CACHE_KEY, normalizedCats);
        } else {
          setFetchError(prev => prev ? `${prev}; Categories: ${catData?.error}` : `Categories: ${catData?.error || 'Unknown error'}`);
        }

        if (prodData?.success) {
          const raw = Array.isArray(prodData.data) ? prodData.data : [];
          const normalized = raw.map((p: any) => normalizeProduct(p, normalizedCats));

          setProducts(normalized);
          saveToCache(PRODUCTS_CACHE_KEY, normalized);
          saveCacheMeta({
            lastFetchAt: Date.now(),
            productCount: normalized.length,
            categoryCount: normalizedCats.length
          });

          const initialCounts: Record<string, number> = {};
          const initialViewCounts: Record<string, number> = {};

          normalized.forEach((product: Product) => {
            initialCounts[product.id] = 0;
            initialViewCounts[product.id] = 0;
          });

          setCommentCounts(initialCounts);
          setViewCounts(initialViewCounts);
          setCategoryProductMap(buildCategoryProductMap(normalized, normalizedCats));
        } else {
          setFetchError(prev => prev ? `${prev}; Products: ${prodData?.error}` : `Products: ${prodData?.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('❌ App: Failed to refresh data', error);
        if (!products.length) {
          setFetchError(error.message || 'Network or server error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initApp();
  }, [buildCategoryProductMap]);

  useEffect(() => {
    if (isLoading) return;

    const pathView = getInitialViewFromPath(location.pathname) as any;

    if (location.pathname === '/') {
      setSelectedProduct(null);
      setView(searchQuery ? 'search-results' : 'home');
      return;
    }

    if (location.pathname.startsWith('/all-products')) {
      setView('all-products');
      return;
    }

    if (location.pathname.startsWith('/categories')) {
      setView('categories');
      return;
    }

    if (location.pathname.startsWith('/admin')) {
      setView('admin');
      return;
    }

    if (location.pathname.startsWith('/product/')) {
      if (!productId) {
        navigate('/', { replace: true });
        return;
      }

      const product = products.find(p => String(p.id) === String(productId));

      if (product) {
        setSelectedProduct(product);
        setView('product-detail');

        void fetchCommentsForProduct(product.id);

        void (async () => {
          const viewerKey = getOrCreateUserId();
          const newCount = await ViewsService.recordView(product.id, viewerKey);
          setViewCounts(prev => ({ ...prev, [product.id]: newCount }));
        })();
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    if (location.pathname.startsWith('/category/')) {
      if (!categoryId) {
        navigate('/', { replace: true });
        return;
      }

      const foundCategory = categories.find(c => String(c.id) === String(categoryId));
      if (foundCategory) {
        const productsForCategory = categoryProductMap[foundCategory.id] || [];
        setSelectedCategory(foundCategory);
        setCategoryProducts(productsForCategory);
        setView('category-results');
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    setView(pathView);
  }, [isLoading, location.pathname, productId, categoryId, products, categories, categoryProductMap, navigate, searchQuery]);

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
    navigate('/');
  };

  const handleCategorySelect = (category: Category) => {
    setIsSidebarOpen(false);

    if (category.id === '14' || category.name === 'Bidhaa Zote') {
      setView('all-products');
      navigate('/all-products');
      window.scrollTo(0, 0);
      return;
    }

    const productsForCategory = categoryProductMap[category.id] || [];

    console.log(`📌 Category "${category.name}" has ${productsForCategory.length} products`);

    setCategoryProducts(productsForCategory);
    setSelectedCategory(category);
    setView('category-results');
    navigate(`/category/${category.id}`);
    window.scrollTo(0, 0);
  };

  const getOrCreateUserId = (): string => {
    let userId = localStorage.getItem('sonko_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sonko_user_id', userId);
    }
    return userId;
  };

  const generateAnonymousUser = () => {
    const userId = getOrCreateUserId();

    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600' },
      { bg: 'bg-green-100', text: 'text-green-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-orange-100', text: 'text-orange-600' },
      { bg: 'bg-pink-100', text: 'text-pink-600' },
      { bg: 'bg-teal-100', text: 'text-teal-600' },
      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    ];

    const seed = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const idx = seed % colors.length;

    return {
      id: userId,
      name: 'Mteja',
      initials: 'MT',
      color: colors[idx].bg,
      textColor: colors[idx].text,
    };
  };

  const fetchCommentsForProduct = async (productId: string) => {
    if (isLoadingComments[productId]) return;

    setIsLoadingComments(prev => ({ ...prev, [productId]: true }));

    try {
      const comments = await CommentsService.fetchComments(productId);
      setProductComments(prev => ({ ...prev, [productId]: comments }));
      setCommentCounts(prev => ({ ...prev, [productId]: comments.length }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(prev => ({ ...prev, [productId]: false }));
    }
  };

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sonko_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleAddComment = async (productId: string, content: string) => {
    try {
      const isLoggedIn = !!user;

      const displayName = isLoggedIn ? 'Baraka Sonko Electronics' : 'Mteja';
      const initials = isLoggedIn ? 'BS' : 'MT';

      const anon = generateAnonymousUser();
      const userId = isLoggedIn ? String(user?.id || 'admin') : anon.id;

      const newComment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'isLiked'> = {
        productId,
        content,
        userId,
        userName: displayName,
        userInitials: initials,
        userColor: isLoggedIn ? 'bg-orange-100' : anon.color,
        textColor: isLoggedIn ? 'text-orange-700' : anon.textColor,
      };

      const savedComment = await CommentsService.addComment(newComment);

      if (savedComment) {
        setProductComments(prev => ({
          ...prev,
          [productId]: [savedComment, ...(prev[productId] || [])],
        }));

        setCommentCounts(prev => ({
          ...prev,
          [productId]: (prev[productId] || 0) + 1,
        }));

        return savedComment;
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
    return null;
  };

  const handleLikeComment = async (commentId: string, productId: string) => {
    try {
      const userId = getOrCreateUserId();
      const success = await CommentsService.likeComment(commentId, userId);

      if (success) {
        setProductComments(prev => ({
          ...prev,
          [productId]: (prev[productId] || []).map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likes: comment.likes + 1,
                isLiked: true
              };
            }
            return comment;
          })
        }));
        return true;
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
    return false;
  };

  const handleDeleteComment = async (commentId: string, productId: string) => {
    try {
      const success = await CommentsService.deleteComment(commentId);

      if (success) {
        setProductComments(prev => ({
          ...prev,
          [productId]: (prev[productId] || []).filter(comment => comment.id !== commentId)
        }));

        setCommentCounts(prev => ({
          ...prev,
          [productId]: Math.max(0, (prev[productId] || 0) - 1)
        }));

        return true;
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
    return false;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('product-detail');
    navigate(`/product/${product.id}`);

    void fetchCommentsForProduct(product.id);

    void (async () => {
      const viewerKey = getOrCreateUserId();
      const newCount = await ViewsService.recordView(product.id, viewerKey);
      setViewCounts(prev => ({ ...prev, [product.id]: newCount }));
    })();
  };

  const fetchSelectedProductComments = useCallback(() => {
    if (!selectedProduct?.id) return;
    void fetchCommentsForProduct(selectedProduct.id);
  }, [selectedProduct?.id]);

  const addSelectedProductComment = useCallback((content: string) => {
    if (!selectedProduct?.id) return Promise.resolve(null);
    return handleAddComment(selectedProduct.id, content);
  }, [selectedProduct?.id, user]);

  const likeSelectedProductComment = useCallback((commentId: string) => {
    if (!selectedProduct?.id) return Promise.resolve(false);
    return handleLikeComment(commentId, selectedProduct.id);
  }, [selectedProduct?.id]);

  const deleteSelectedProductComment = useCallback((commentId: string) => {
    if (!selectedProduct?.id) return Promise.resolve(false);
    return handleDeleteComment(commentId, selectedProduct.id);
  }, [selectedProduct?.id]);

  const recordSelectedProductView = useCallback(async () => {
    if (!selectedProduct?.id) return;
    const pid = selectedProduct.id;
    if (isRecordingView[pid]) return;

    setIsRecordingView(prev => ({ ...prev, [pid]: true }));
    try {
      const viewerKey = getOrCreateUserId();
      const newCount = await ViewsService.recordView(pid, viewerKey);
      setViewCounts(prev => ({ ...prev, [pid]: newCount }));
    } finally {
      setIsRecordingView(prev => ({ ...prev, [pid]: false }));
    }
  }, [selectedProduct?.id, isRecordingView]);

  const handleBannerClick = () => {
    setView('all-products');
    navigate('/all-products');
  };

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

        setProducts((prev) => {
          const updated = [saved, ...prev];
          saveToCache(PRODUCTS_CACHE_KEY, updated);
          saveCacheMeta({
            lastFetchAt: Date.now(),
            productCount: updated.length,
            categoryCount: categories.length,
            invalidatedByPost: true
          });
          return updated;
        });

        setCommentCounts(prev => ({
          ...prev,
          [saved.id]: 0
        }));

        setViewCounts(prev => ({
          ...prev,
          [saved.id]: 0
        }));

        return true;
      }

      clearStoreCache();
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json().catch(() => null);
      if (prodData?.success) {
        const normalized = (prodData.data || []).map((p: any) => normalizeProduct(p, categories));
        setProducts(normalized);
        saveToCache(PRODUCTS_CACHE_KEY, normalized);
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
        setProducts((prev) => {
          const updated = prev.filter((p) => String(p.id) !== String(id));
          saveToCache(PRODUCTS_CACHE_KEY, updated);
          saveCacheMeta({
            lastFetchAt: Date.now(),
            productCount: updated.length,
            categoryCount: categories.length,
            invalidatedByDelete: true
          });
          return updated;
        });

        setProductComments(prev => {
          const newComments = { ...prev };
          delete newComments[id];
          return newComments;
        });

        setCommentCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[id];
          return newCounts;
        });

        setViewCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[id];
          return newCounts;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminAccess = () => {
    if (!user) setShowAuth(true);
    else {
      setView('admin');
      navigate('/admin');
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sonko_user', JSON.stringify(newUser));
    setShowAuth(false);
    setView('admin');
    navigate('/admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sonko_user');
    setView('home');
    navigate('/');
  };

  const handleBackToHome = () => {
    setSelectedProduct(null);
    setView('home');
    navigate('/');
  };

  const handleRefreshCachedData = async () => {
    clearStoreCache();
    window.location.reload();
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

  if (isLoading && !isDirectProductRoute && view !== 'category-results') {
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

  if (isDirectProductRoute && (isLoading || (productId && !selectedProduct && !fetchError))) {
    return <div className="fixed inset-0 bg-white" />;
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
    <div className="relative min-h-screen bg-white">
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={products}
          onBack={handleBackToHome}
          onProductClick={handleProductClick}
          WatermarkedImage={WatermarkedImage}
          VideoPlayer={VideoPlayer}
          Banner={Banner}
          comments={productComments[selectedProduct.id] || []}
          commentCount={commentCounts[selectedProduct.id] || 0}
          onFetchComments={fetchSelectedProductComments}
          onAddComment={addSelectedProductComment}
          onLikeComment={likeSelectedProductComment}
          onDeleteComment={deleteSelectedProductComment}
          isLoadingComments={isLoadingComments[selectedProduct.id] || false}
          viewCount={viewCounts[selectedProduct.id] || 0}
          onRecordView={recordSelectedProductView}
        />
      )}

      {showAuth && <AuthView onLogin={handleLogin} onBack={() => setShowAuth(false)} />}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCategorySelect={handleCategorySelect}
      />

      {view !== 'product-detail' && (
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onSearch={handleSearch}
          initialValue={searchQuery}
          onProductSelect={handleProductClick}
        />
      )}

      <main className="w-full max-w-[600px] mx-auto pb-24">
        {view === 'home' ? (
          <>
            <QuickActions onActionSelect={() => {
              setView('all-products');
              navigate('/all-products');
            }} />

            <CategorySection
              categories={categories}
              onCategorySelect={handleCategorySelect}
              onMore={() => {
                setView('categories');
                navigate('/categories');
              }}
            />

            <FlashSale
              products={products}
              onProductClick={handleProductClick}
              onSeeAll={() => {
                setView('all-products');
                navigate('/all-products');
              }}
              WatermarkedImage={WatermarkedImage}
            />

            <div className="p-4">
              <Banner
                src="https://media.barakasonko.store/White%20Blue%20Professional%20Website%20Developer%20LinkedIn%20Banner.gif"
                onClick={handleBannerClick}
                containerClass="h-[110px]"
                alt="Special promotion banner"
                isGif={true}
              />
            </div>

            <ProductGrid
              title="Daily Discoveries"
              products={products}
              onProductClick={handleProductClick}
              WatermarkedImage={WatermarkedImage}
            />
          </>
        ) : view === 'all-products' ? (
          <AllProductsView
            products={products}
            onProductClick={handleProductClick}
            onLoadMore={() => {}}
            isLoading={false}
            WatermarkedImage={WatermarkedImage}
          />
        ) : view === 'category-results' && selectedCategory ? (
          <div className="animate-fadeIn p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedCategory.icon && (
                  <span className="text-2xl">{selectedCategory.icon}</span>
                )}
                <div>
                  <h2 className="text-sm font-bold text-gray-500 uppercase">
                    {selectedCategory.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {categoryProducts.length} products
                  </p>
                </div>
              </div>
              <button
                className="text-xs font-black text-orange-600"
                onClick={() => {
                  setView('all-products');
                  navigate('/all-products');
                }}
              >
                View All Products
              </button>
            </div>

            <ProductGrid
              products={categoryProducts}
              onProductClick={handleProductClick}
              WatermarkedImage={WatermarkedImage}
              emptyMessage={`No products found in ${selectedCategory.name} category`}
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
              WatermarkedImage={WatermarkedImage}
            />
          </div>
        ) : view === 'categories' ? (
          <CategoriesView
            onCategorySelect={handleCategorySelect}
            onShowAllProducts={() => {
              setView('all-products');
              navigate('/all-products');
            }}
            suggestedProducts={products}
            onProductClick={handleProductClick}
          />
        ) : view === 'admin' ? (
          <ErrorBoundary title="Admin screen crashed">
            <AdminView
              products={products}
              categories={categories}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
              WatermarkedImage={WatermarkedImage}
              VideoPlayer={VideoPlayer}
              Banner={Banner}
            />
          </ErrorBoundary>
        ) : null}
      </main>

      {view !== 'product-detail' && (
        <BottomNav
          currentView={navView as any}
          onViewChange={(v: any) => {
            if (v === 'admin') handleAdminAccess();
            else if (v === 'home') {
              setView('home');
              navigate('/');
            } else if (v === 'categories') {
              setView('categories');
              navigate('/categories');
            } else if (v === 'all-products') {
              setView('all-products');
              navigate('/all-products');
            }
          }}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-black text-white text-center py-2 text-xs z-40">
        ©barakasonko - Product images protected
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/product/:productId" element={<AppContent />} />
        <Route path="/category/:categoryId" element={<AppContent />} />
        <Route path="/categories" element={<AppContent />} />
        <Route path="/all-products" element={<AppContent />} />
        <Route path="/admin" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
