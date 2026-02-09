// App.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { Product, User, Category, Comment } from './types';

/** Watermarked Image Component - For PRODUCT IMAGES only */
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

  // Only apply watermarks to product images, not banners
  const shouldWatermark = isProduct;

  // Generate unique watermark pattern for products
  const getWatermarkPattern = () => {
    if (!shouldWatermark) return { positions: [], opacities: [], sizes: [] };
    
    const patterns = [
      { positions: ['bottom-right', 'top-left'], opacities: [0.6, 0.4], sizes: [30, 25] },
      { positions: ['bottom-left', 'top-right'], opacities: [0.5, 0.5], sizes: [28, 28] },
      { positions: ['center-bottom', 'right-middle'], opacities: [0.4, 0.3], sizes: [35, 22] },
    ];
    const patternIndex = productId ? parseInt(productId, 36) % patterns.length : 0;
    return patterns[patternIndex];
  };

  const pattern = getWatermarkPattern();

  const renderWatermark = (position: string, opacity: number, size: number) => {
    const positions: Record<string, React.CSSProperties> = {
      'bottom-right': { 
        bottom: '8px', 
        right: '8px', 
        width: `${size}px`, 
        height: `${size}px`,
        zIndex: 10
      },
      'top-left': { 
        top: '8px', 
        left: '8px', 
        width: `${size}px`, 
        height: `${size}px`,
        zIndex: 10
      },
      'top-right': { 
        top: '8px', 
        right: '8px', 
        width: `${size}px`, 
        height: `${size}px`,
        zIndex: 10
      },
      'bottom-left': { 
        bottom: '8px', 
        left: '8px', 
        width: `${size}px`, 
        height: `${size}px`,
        zIndex: 10
      },
      'center-bottom': { 
        bottom: '15px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        width: `${size}px`, 
        height: `${size}px`,
        zIndex: 10
      },
      'right-middle': { 
        top: '50%', 
        right: '8px', 
        transform: 'translateY(-50%)',
        width: `${size}px`, 
        height: `${size}px`,
        zIndex: 10
      },
    };

    if (!positions[position]) return null;

    return (
      <div
        key={position}
        className="absolute pointer-events-none"
        style={{
          ...positions[position],
          opacity,
          filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))',
        }}
      >
        <img
          src={logoUrl}
          alt="Watermark"
          className="w-full h-full object-contain"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          style={{ pointerEvents: 'none' }}
        />
      </div>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${containerClass}`}
      onClick={onClick}
      style={{
        userSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
      }}
      onContextMenu={(e) => {
        if (shouldWatermark) {
          e.preventDefault();
        }
      }}
    >
      {/* Regular image for banners, watermarked for products */}
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
          console.error('Failed to load image:', src);
          setHasError(true);
        }}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-gray-400 text-3xl mb-2">🖼️</div>
            <p className="text-xs text-gray-500">Image not available</p>
          </div>
        </div>
      )}
      
      {/* Watermarks for PRODUCT images only */}
      {shouldWatermark && !hasError && isLoaded && (
        <div className="absolute inset-0 pointer-events-none">
          {pattern.positions.map((pos, idx) => 
            renderWatermark(pos, pattern.opacities[idx], pattern.sizes[idx])
          )}
          
          {/* Copyright text for product images */}
          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '9px',
              fontWeight: 'bold',
              opacity: 0.8,
            }}
          >
            ©barakasonko
          </div>
        </div>
      )}
    </div>
  );
};

/** Video Player Component - For VIDEOS only */
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
        videoRef.current.play().then(() => setIsPlaying(true));
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
      
      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
          <div className="text-center text-white p-4">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-sm">Video failed to load</p>
          </div>
        </div>
      )}
      
      {/* Custom controls for autoplay videos */}
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

/** Banner Component - For GIF banners (no watermark) */
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
  isGif = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if it's a GIF
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
        // GIF Banner - use img tag with decoding="async"
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
        // Regular image banner
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
      
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
      
      {/* Error state */}
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

/** Enhanced ErrorBoundary */
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

// Helper functions and banners remain the same...
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

// Comments API Service
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

// Views API Service
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

// Banner data - All GIF banners should work now
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
  
  // Comments state
  const [productComments, setProductComments] = useState<Record<string, Comment[]>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});

  // Views state
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [isRecordingView, setIsRecordingView] = useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Simple right-click prevention for product images only
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only prevent on product images (those with watermarks)
      if (target.classList.contains('product-image')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
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

        let normalizedCats: Category[] = [];
        if (catData?.success) {
          const rawCats = Array.isArray(catData.data) ? catData.data : [];
          normalizedCats = rawCats.map(normalizeCategory);
          setCategories(normalizedCats);
        } else {
          setFetchError(prev => prev ? `${prev}; Categories: ${catData?.error}` : `Categories: ${catData?.error || 'Unknown error'}`);
        }

        if (prodData?.success) {
          const raw = Array.isArray(prodData.data) ? prodData.data : [];
          const normalized = raw.map(p => normalizeProduct(p, normalizedCats));
          setProducts(normalized);
          
          // Initialize comment counts
          const initialCounts: Record<string, number> = {};
          normalized.forEach(product => {
            // Initialize with 0, will be fetched from backend
            initialCounts[product.id] = 0;
          });
          setCommentCounts(initialCounts);
          
          // Initialize view counts
          const initialViewCounts: Record<string, number> = {};
          normalized.forEach(product => {
            initialViewCounts[product.id] = 0;
          });
          setViewCounts(initialViewCounts);
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

  // Helper functions for user management
  const getOrCreateUserId = (): string => {
    let userId = localStorage.getItem('sonko_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sonko_user_id', userId);
    }
    return userId;
  };

  // Make guest commenters always "Mteja"
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

  // Comments API integration
  const fetchCommentsForProduct = async (productId: string) => {
    if (isLoadingComments[productId]) return;
    
    setIsLoadingComments(prev => ({ ...prev, [productId]: true }));
    
    try {
      const comments = await CommentsService.fetchComments(productId);
      setProductComments(prev => ({ ...prev, [productId]: comments }));
      
      // Update comment count
      setCommentCounts(prev => ({ ...prev, [productId]: comments.length }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddComment = async (productId: string, content: string) => {
    try {
      // Generate user info for anonymous commenting
      const userInfo = generateAnonymousUser();
      
      const newComment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'isLiked'> = {
        productId,
        content,
        userId: userInfo.id,
        userName: userInfo.name,
        userInitials: userInfo.initials,
        userColor: userInfo.color,
        textColor: userInfo.textColor,
      };
      
      const savedComment = await CommentsService.addComment(newComment);
      
      if (savedComment) {
        // Update comments for this product
        setProductComments(prev => ({
          ...prev,
          [productId]: [savedComment, ...(prev[productId] || [])]
        }));
        
        // Update comment count
        setCommentCounts(prev => ({
          ...prev,
          [productId]: (prev[productId] || 0) + 1
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
        // Update comment in state
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
        // Remove comment from state
        setProductComments(prev => ({
          ...prev,
          [productId]: (prev[productId] || []).filter(comment => comment.id !== commentId)
        }));
        
        // Update comment count
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

  // When opening product, fetch comments + views
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('product-detail');

    // Preload comments + views in background
    fetchCommentsForProduct(product.id);

    // Record view
    (async () => {
      const viewerKey = getOrCreateUserId();
      const newCount = await ViewsService.recordView(product.id, viewerKey);
      setViewCounts(prev => ({ ...prev, [product.id]: newCount }));
    })();
  };

  // Create stable callbacks for ProductDetailView
  const fetchSelectedProductComments = useCallback(() => {
    if (!selectedProduct?.id) return;
    fetchCommentsForProduct(selectedProduct.id);
  }, [selectedProduct?.id]);

  const addSelectedProductComment = useCallback((content: string) => {
    if (!selectedProduct?.id) return Promise.resolve(null);
    return handleAddComment(selectedProduct.id, content);
  }, [selectedProduct?.id]);

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
  };

  const goToNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
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
        
        // Initialize comment count for new product
        setCommentCounts(prev => ({
          ...prev,
          [saved.id]: 0
        }));
        
        // Initialize view count for new product
        setViewCounts(prev => ({
          ...prev,
          [saved.id]: 0
        }));
        
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
        
        // Remove comment data for deleted product
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
        
        // Remove view data for deleted product
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
    <div className="relative min-h-screen bg-white">
      {/* Product Detail View */}
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={products}
          onBack={() => setView('home')}
          onProductClick={handleProductClick}
          WatermarkedImage={WatermarkedImage}
          VideoPlayer={VideoPlayer}
          Banner={Banner}
          // comments
          comments={productComments[selectedProduct.id] || []}
          commentCount={commentCounts[selectedProduct.id] || 0}
          onFetchComments={fetchSelectedProductComments}
          onAddComment={addSelectedProductComment}
          onLikeComment={likeSelectedProductComment}
          onDeleteComment={deleteSelectedProductComment}
          isLoadingComments={isLoadingComments[selectedProduct.id] || false}
          // ✅ views
          viewCount={viewCounts[selectedProduct.id] || 0}
          onRecordView={recordSelectedProductView}
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

            {/* Rotating Banner Carousel - GIF banners work perfectly now */}
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
                    <Banner
                      src={banner.src}
                      onClick={handleBannerClick}
                      containerClass="h-[350px]"
                      alt={banner.alt}
                      isGif={true}
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
              WatermarkedImage={WatermarkedImage}
            />

            {/* Promotion Banner */}
            <div className="p-4">
              <Banner
                src="https://media.barakasonko.store/White%20Blue%20Professional%20Website%20Developer%20LinkedIn%20Banner.gif"
                onClick={() => setView('all-products')}
                containerClass="h-[110px]"
                alt="Special promotion banner"
                isGif={true}
              />
            </div>

            <ProductGrid
              title="Daily Discoveries"
              products={products.slice(0, 10)}
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
              WatermarkedImage={WatermarkedImage}
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
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onShowAllProducts={() => setView('all-products')}
            suggestedProducts={products}
            onProductClick={handleProductClick}
            WatermarkedImage={WatermarkedImage}
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
        ©barakasonko - Product images protected
      </div>
    </div>
  );
};

export default App;
