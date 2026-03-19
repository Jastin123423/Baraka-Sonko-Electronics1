import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Product } from '../types';

/* ===============================
   SONKOSOUND ROUTING HELPERS
================================= */

const SOUND_CATEGORY_NAMES = [
  'Spika',
  'Mic',
  'Subwoofer',
  'TV',
  'Guitars',
  'Keyboards',
  'Hon Speaker',
  'Studio Accessories',
  'Mixers',
];

const isSoundProduct = (product: any) => {
  const explicitFlag =
    product?.is_sound_product === true ||
    product?.isSoundProduct === true ||
    product?.is_sound_product === 1 ||
    product?.isSoundProduct === 1;

  if (explicitFlag) return true;

  const categoryName = String(
    product?.category_name ??
    product?.categoryName ??
    product?.category ??
    ''
  ).trim();

  return SOUND_CATEGORY_NAMES.includes(categoryName);
};

const openProductSmart = (product: any, fallbackOpen: (product: Product) => void) => {
  const productId = String(product?.id ?? '').trim();
  if (!productId) {
    fallbackOpen(product);
    return;
  }

  if (isSoundProduct(product)) {
    window.location.href = `https://sonkosound.barakasonko.store/product/${productId}`;
    return;
  }

  fallbackOpen(product);
};

/* ===============================
   WATERMARKED PRODUCT IMAGE
================================= */

const WatermarkedGridImage: React.FC<{
  src: string;
  alt?: string;
  productId?: string;
}> = ({ src, alt = '', productId = '' }) => {
  const logoUrl = 'https://media.barakasonko.store/Screenshot_2026-03-18_221011-removebg-preview.png';
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const s = String(src || '').trim();
    if (!s) return;

    let cancelled = false;
    const test = new Image();
    test.src = s;

    if (test.complete) {
      setIsLoaded(true);
      return;
    }

    test.onload = () => {
      if (!cancelled) setIsLoaded(true);
    };
    test.onerror = () => {
      if (!cancelled) setIsLoaded(true);
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
      data-product-id={productId}
    >
      <img
        src={String(src || '').trim()}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-200"
        draggable="false"
        loading="lazy"
        decoding="async"
        style={{
          opacity: isLoaded ? 1 : 0.85,
        }}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          (e.target as HTMLImageElement).style.opacity = '1';
          setIsLoaded(true);
        }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {isLoaded && (
        <>
          {/* Small watermark logo in corner */}
          <div className="absolute bottom-1 right-1 w-6 h-6 opacity-60">
            <img
              src={logoUrl}
              alt=""
              className="w-full h-full object-contain"
              draggable="false"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3)) brightness(1.2)',
              }}
            />
          </div>
          
          {/* Copyright text */}
          <div className="absolute bottom-1 left-1 text-[6px] font-bold text-white bg-black/60 px-1 py-0.5 rounded-sm">
            ©SS
          </div>
        </>
      )}
    </div>
  );
};

/* ===============================
   PRODUCT CARD - SONKO SOUND STYLE
================================= */

const ProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
  const price = Number((product as any).price ?? 0);
  const discount = Number((product as any).discount ?? 0);

  const safePrice = Number.isFinite(price) ? price : 0;
  const safeDiscount = Number.isFinite(discount) ? discount : 0;

  const originalPrice =
    (product as any).originalPrice && Number.isFinite(Number((product as any).originalPrice))
      ? Number((product as any).originalPrice)
      : safeDiscount > 0
        ? Math.round(safePrice * (1 + safeDiscount / 100))
        : null;

  const showDiscount =
    safeDiscount > 0 &&
    originalPrice &&
    originalPrice > safePrice;

  const imageUrl = String(
    (product as any).image || 
    (product as any).image_url || 
    (product as any).imageUrl || 
    ''
  ).trim();

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col mb-3 active:scale-[0.98] transition-all cursor-pointer border border-gray-100 hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative w-full aspect-square bg-gray-50">
        <WatermarkedGridImage 
          src={imageUrl} 
          alt={(product as any).title || 'Product'} 
          productId={String((product as any).id)} 
        />

        {showDiscount && (
          <div className="absolute top-2 left-2 bg-[#FF6A00] text-white text-[10px] px-2 py-1 font-black rounded-lg z-10 shadow-md">
            -{safeDiscount}% OFF
          </div>
        )}

        <div className="absolute bottom-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6A00" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      </div>

      <div className="p-3 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <h3 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight min-h-[40px]">
            {(product as any).title || 'Untitled'}
          </h3>

          <div className="flex items-center flex-wrap gap-2">
            {showDiscount && originalPrice && (
              <span className="text-[11px] text-gray-400 line-through font-medium">
                TSh {originalPrice.toLocaleString()}
              </span>
            )}

            <span className="text-[16px] font-black text-[#FF6A00]">
              TSh {safePrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-1">
              <span className="text-[12px] text-[#FF6A00]">⭐</span>
              <span className="text-[11px] font-bold text-gray-700">
                {typeof (product as any).rating === 'number'
                  ? (product as any).rating.toFixed(1)
                  : '5.0'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 bg-orange-50 px-2 py-0.5 rounded-full">
              <span className="text-[9px] font-black text-[#FF6A00] uppercase tracking-tight">
                {Math.floor(Math.random() * 50) + 10} views
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===============================
   HELPERS
================================= */

const API_LIMIT = 2000;
const API_URL = '/api/products';

const safeProductId = (p: any, idx: number) =>
  String(p?.id ?? p?.product_id ?? p?.slug ?? `idx-${idx}`);

const normalizeProduct = (p: any): Product => {
  const image =
    String(
      p?.image ??
      p?.image_url ??
      p?.imageUrl ??
      p?.cover_url ??
      p?.coverUrl ??
      p?.thumbnail ??
      p?.thumbnail_url ??
      ''
    ).trim();

  return {
    ...p,
    image,
    title: String(p?.title ?? p?.name ?? 'Untitled').trim(),
    price: Number.isFinite(Number(p?.price)) ? Number(p?.price) : 0,
    discount: Number.isFinite(Number(p?.discount)) ? Number(p?.discount) : 0,
  } as Product;
};

const dedupeProducts = (items: Product[]): Product[] => {
  const seen = new Set<string>();
  const out: Product[] = [];

  items.forEach((item, idx) => {
    const key = safeProductId(item, idx);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });

  return out;
};

const extractProductsFromPayload = (payload: any): Product[] => {
  const raw =
    Array.isArray(payload) ? payload :
    Array.isArray(payload?.products) ? payload.products :
    Array.isArray(payload?.items) ? payload.items :
    Array.isArray(payload?.data) ? payload.data :
    [];

  return raw.map(normalizeProduct);
};

/* ===============================
   SIMPLE IN-MEMORY CACHE
================================= */

let cachedProducts: Product[] = [];
let cachedPage = 1;
let cachedHasMore = true;
let activeFetchPromise: Promise<void> | null = null;

/* ===============================
   PRODUCT GRID - SONKO SOUND STYLE
================================= */

interface ProductGridProps {
  title?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  title,
  products,
  onProductClick,
  emptyMessage = "No products found"
}) => {
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const fetchLockRef = useRef(false);
  const mountedRef = useRef(true);

  const [apiProducts, setApiProducts] = useState<Product[]>(() => cachedProducts);
  const [page, setPage] = useState<number>(() => cachedPage);
  const [hasMoreInternal, setHasMoreInternal] = useState<boolean>(() => cachedHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const normalizedProducts = useMemo(() => {
    return dedupeProducts((products || []).filter(Boolean).map(normalizeProduct));
  }, [products]);

  const displayProducts = useMemo(() => {
    if (normalizedProducts.length > 0) {
      return normalizedProducts;
    }
    return apiProducts;
  }, [normalizedProducts, apiProducts]);

  const [colLeft, colRight] = useMemo(() => {
    const left: Product[] = [];
    const right: Product[] = [];

    displayProducts.forEach((p, idx) => {
      if (idx % 2 === 0) left.push(p);
      else right.push(p);
    });

    return [left, right];
  }, [displayProducts]);

  const handleProductClick = useCallback((product: Product) => {
    openProductSmart(product, onProductClick);
  }, [onProductClick]);

  const loadMoreFromApi = useCallback(async () => {
    if (fetchLockRef.current) return;
    if (!hasMoreInternal) return;

    fetchLockRef.current = true;
    setLoadingMore(true);

    try {
      if (!activeFetchPromise) {
        const nextPage = page;

        activeFetchPromise = (async () => {
          const res = await fetch(`${API_URL}?page=${nextPage}&limit=${API_LIMIT}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (!res.ok) {
            throw new Error(`Failed to load products: ${res.status}`);
          }

          const payload = await res.json();
          const incoming = extractProductsFromPayload(payload);

          const merged = dedupeProducts([...cachedProducts, ...incoming]);

          const inferredHasMore =
            typeof payload?.hasMore === 'boolean'
              ? payload.hasMore
              : incoming.length >= API_LIMIT;

          cachedProducts = merged;
          cachedPage = nextPage + 1;
          cachedHasMore = inferredHasMore;

          if (!mountedRef.current) return;

          setApiProducts(merged);
          setPage(nextPage + 1);
          setHasMoreInternal(inferredHasMore);
        })();
      }

      await activeFetchPromise;
    } catch (err) {
      console.error('ProductGrid loadMoreFromApi error:', err);
    } finally {
      activeFetchPromise = null;
      fetchLockRef.current = false;
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [page, hasMoreInternal]);

  useEffect(() => {
    if (normalizedProducts.length > 0) return;

    const totalNow = apiProducts.length;

    if (totalNow >= API_LIMIT) return;
    if (!cachedHasMore) return;

    loadMoreFromApi();
  }, [normalizedProducts.length, apiProducts.length, loadMoreFromApi]);

  useEffect(() => {
    const current = observerTarget.current;
    if (!current) return;
    if (!hasMoreInternal) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loadingMore) return;
        loadMoreFromApi();
      },
      {
        threshold: 0.01,
        rootMargin: '500px 0px',
      }
    );

    observer.observe(current);

    return () => observer.disconnect();
  }, [loadMoreFromApi, loadingMore, hasMoreInternal]);

  if (displayProducts.length === 0) {
    return (
      <div className="px-2 mb-4">
        {title && (
          <div className="flex items-center justify-center py-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent w-12 mr-3" />
            <span className="text-xs font-black text-[#FF6A00] uppercase tracking-widest">
              {title}
            </span>
            <div className="h-px bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent w-12 ml-3" />
          </div>
        )}
        <div className="py-16 text-center bg-gradient-to-b from-white to-[#FFF4E8] rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4 opacity-50">🔊</div>
          <p className="text-sm font-medium text-gray-600 mb-2">{emptyMessage}</p>
          <p className="text-xs text-gray-400">Check back later for new arrivals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 mb-4">
      {title && (
        <div className="flex items-center justify-center py-4">
          <div className="h-px bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent w-12 mr-3" />
          <span className="text-xs font-black text-[#FF6A00] uppercase tracking-widest">
            {title}
          </span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent w-12 ml-3" />
        </div>
      )}

      <div className="flex space-x-3 items-start">
        <div className="flex-1 flex flex-col min-w-0">
          {colLeft.map((p, idx) => (
            <ProductCard
              key={`${safeProductId(p, idx)}-left-${idx}`}
              product={p}
              onClick={() => handleProductClick(p)}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {colRight.map((p, idx) => (
            <ProductCard
              key={`${safeProductId(p, idx)}-right-${idx}`}
              product={p}
              onClick={() => handleProductClick(p)}
            />
          ))}
        </div>
      </div>

      <div
        ref={observerTarget}
        className="h-24 flex items-center justify-center w-full"
      >
        {(loadingMore || hasMoreInternal) && displayProducts.length > 0 && (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <div
                className="w-2.5 h-2.5 bg-[#FF6A00] rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2.5 h-2.5 bg-[#FF8533] rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2.5 h-2.5 bg-[#FF6A00] rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Loading more products...
            </span>
          </div>
        )}
      </div>

      {/* Sonko Sound footer watermark */}
      <div className="mt-6 text-center pb-2">
        <span className="text-[9px] text-gray-300">©SonkoSound - Quality electronics</span>
      </div>
    </div>
  );
};

export default ProductGrid;
