import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { ICONS } from '../constants';
import { Product } from '../types';

/* ===============================
   PRODUCT CARD
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

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col mb-2.5 active:opacity-90 transition-all cursor-pointer border border-gray-50"
      onClick={onClick}
    >
      <div className="relative w-full">
        <img
          src={(product as any).image || (product as any).image_url || ''}
          alt={(product as any).title || 'Product'}
          className="w-full h-auto object-cover block"
          loading="lazy"
        />

        {showDiscount && (
          <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] px-1.5 py-0.5 font-bold rounded-sm z-10 shadow-sm">
            -{safeDiscount}%
          </div>
        )}

        <div className="absolute bottom-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400">
          <ICONS.Heart />
        </div>
      </div>

      <div className="p-2.5 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-[11px] text-gray-800 line-clamp-2 leading-tight font-medium h-8">
            {(product as any).title || 'Untitled'}
          </h3>

          <div className="flex items-center gap-1 pt-1">
            {showDiscount && originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">
                TSh {originalPrice.toLocaleString()}
              </span>
            )}

            <span className="text-[14px] font-black text-black">
              TSh {safePrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center mt-2">
            <div className="flex items-center space-x-0.5">
              <span className="text-[10px] text-orange-400">⭐</span>
              <span className="text-[10px] text-gray-500 font-bold">
                {typeof (product as any).rating === 'number'
                  ? (product as any).rating.toFixed(1)
                  : '5.0'}
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

const FIRST_BATCH = 10;
const PAGE_SIZE = 10;
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

const shuffleWithSeed = <T,>(array: T[], seed: number): T[] => {
  const result = [...array];
  let s = seed || 1;

  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
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
   CACHE
================================= */

let cachedProducts: Product[] = [];
let cachedPage = 1;
let cachedHasMore = true;
let activeFetchPromise: Promise<void> | null = null;

/* ===============================
   PRODUCT GRID
================================= */

interface ProductGridProps {
  title?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  title,
  products,
  onProductClick,
}) => {
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const fetchLockRef = useRef(false);
  const mountedRef = useRef(true);

  const [apiProducts, setApiProducts] = useState<Product[]>(() => cachedProducts);
  const [page, setPage] = useState<number>(() => cachedPage);
  const [hasMoreInternal, setHasMoreInternal] = useState<boolean>(() => cachedHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  // first professional view: only 10 visible
  const [visibleCount, setVisibleCount] = useState(FIRST_BATCH);

  // one order per visit
  const [sessionSeed] = useState(() => Date.now() + Math.floor(Math.random() * 100000));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const propProducts = useMemo(() => {
    return dedupeProducts((products || []).filter(Boolean).map(normalizeProduct));
  }, [products]);

  const mergedProducts = useMemo(() => {
    return dedupeProducts([...propProducts, ...apiProducts]);
  }, [propProducts, apiProducts]);

  const orderedProducts = useMemo(() => {
    return shuffleWithSeed(mergedProducts, sessionSeed);
  }, [mergedProducts, sessionSeed]);

  const visibleProducts = useMemo(() => {
    return orderedProducts.slice(0, visibleCount);
  }, [orderedProducts, visibleCount]);

  const [colLeft, colRight] = useMemo(() => {
    const left: Product[] = [];
    const right: Product[] = [];

    visibleProducts.forEach((p, idx) => {
      if (idx % 2 === 0) left.push(p);
      else right.push(p);
    });

    return [left, right];
  }, [visibleProducts]);

  const loadMoreFromApi = useCallback(async () => {
    if (fetchLockRef.current) return;
    if (!hasMoreInternal) return;

    fetchLockRef.current = true;
    setLoadingMore(true);

    try {
      if (!activeFetchPromise) {
        const nextPage = page;

        activeFetchPromise = (async () => {
          const res = await fetch(`${API_URL}?page=${nextPage}&limit=${PAGE_SIZE}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
              Accept: 'application/json',
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
              : incoming.length >= PAGE_SIZE;

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

  const handleRevealMore = useCallback(async () => {
    const currentTotal = orderedProducts.length;
    const nextVisible = visibleCount + PAGE_SIZE;

    // reveal already loaded products first
    if (nextVisible <= currentTotal) {
      setVisibleCount(nextVisible);
      return;
    }

    // try fetching more from API without clearing current items
    if (hasMoreInternal && !loadingMore) {
      await loadMoreFromApi();
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  }, [orderedProducts.length, visibleCount, hasMoreInternal, loadingMore, loadMoreFromApi]);

  // initial load only if not enough products to show first 10
  useEffect(() => {
    if (orderedProducts.length >= FIRST_BATCH) return;
    if (!hasMoreInternal) return;
    loadMoreFromApi();
  }, [orderedProducts.length, hasMoreInternal, loadMoreFromApi]);

  useEffect(() => {
    const current = observerTarget.current;
    if (!current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loadingMore) return;

        handleRevealMore();
      },
      {
        threshold: 0.01,
        rootMargin: '400px 0px',
      }
    );

    observer.observe(current);

    return () => observer.disconnect();
  }, [handleRevealMore, loadingMore]);

  const shouldShowLoader = loadingMore || hasMoreInternal || visibleCount < orderedProducts.length;

  return (
    <div className="px-2 mb-4">
      {title && (
        <div className="flex items-center justify-center py-6">
          <div className="h-px bg-gray-200 w-12 mr-3" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
            {title}
          </span>
          <div className="h-px bg-gray-200 w-12 ml-3" />
        </div>
      )}

      <div className="flex space-x-2 items-start">
        <div className="flex-1 flex flex-col min-w-0">
          {colLeft.map((p, idx) => (
            <ProductCard
              key={`${safeProductId(p, idx)}-left-${idx}`}
              product={p}
              onClick={() => onProductClick(p)}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {colRight.map((p, idx) => (
            <ProductCard
              key={`${safeProductId(p, idx)}-right-${idx}`}
              product={p}
              onClick={() => onProductClick(p)}
            />
          ))}
        </div>
      </div>

      <div
        ref={observerTarget}
        className="h-20 flex items-center justify-center w-full"
      >
        {shouldShowLoader && (
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: '120ms' }}
            />
            <div
              className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: '240ms' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
