import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductGrid from './ProductGrid';
import { Product } from '../types';

interface AllProductsViewProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onLoadMore: () => void;
  isLoading: boolean;
}

/**
 * ==========================================================
 * ✅ Helper: pick an image url from different possible fields
 * ==========================================================
 */
const productImage = (p: any) =>
  String(
    p?.image_url ??
      p?.imageUrl ??
      p?.image ??
      p?.cover_url ??
      p?.coverUrl ??
      p?.thumbnail ??
      p?.thumbnail_url ??
      ''
  ).trim();

/**
 * ==========================================================
 * ✅ Rotating (non-scrollable) row
 * - NOT user scrollable
 * - Very slow auto-rotation
 * - Clickable cards
 * ==========================================================
 */
const RotatingRow: React.FC<{
  title: string;
  items: Product[];
  onClick: (p: Product) => void;
  intervalMs?: number; // very slow rotation
}> = ({ title, items, onClick, intervalMs = 12000 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState(0);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  // Measure container width (responsive)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);

    return () => ro.disconnect();
  }, []);

  // Layout constants
  const GAP = 10;
  const CARD_W = 128;

  const perView = useMemo(() => {
    if (!containerW) return 3;
    const n = Math.floor((containerW + GAP) / (CARD_W + GAP));
    return Math.max(1, Math.min(4, n));
  }, [containerW]);

  // Build a loopable list so it feels continuous
  const loopItems = useMemo(() => {
    const clean = (items || []).filter(Boolean);
    if (clean.length === 0) return [];
    // duplicate to allow sliding without empty space
    return [...clean, ...clean, ...clean];
  }, [items]);

  // Auto rotate very slowly
  useEffect(() => {
    if (!items || items.length <= perView) return;

    const t = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, intervalMs);

    return () => clearInterval(t);
  }, [items, perView, intervalMs]);

  // Reset index cleanly after passing one full set
  useEffect(() => {
    if (!items || items.length === 0) return;
    const baseLen = items.length;

    // when index passes baseLen*2, snap back near baseLen (middle copy) without animation
    if (index >= baseLen * 2) {
      setAnimate(false);
      setIndex(baseLen); // snap to middle copy
      // re-enable animation next tick
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }
  }, [index, items]);

  const canRotate = items && items.length > perView;
  const startIndex = items.length; // start from middle copy for smoothness

  useEffect(() => {
    if (!canRotate) return;
    // initialize at middle copy once
    setIndex(startIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRotate]);

  const translateX = -(index * (CARD_W + GAP));

  return (
    <div className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-black text-white">{title}</span>
          {canRotate && (
            <span className="text-[11px] font-black text-white/80">
              • Inajizungusha polepole
            </span>
          )}
        </div>
        <div className="text-[11px] font-black text-white/80">Upcoming</div>
      </div>

      <div ref={containerRef} className="px-3 pb-3">
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex"
            style={{
              gap: `${GAP}px`,
              transform: `translateX(${translateX}px)`,
              transition: animate ? 'transform 900ms ease-in-out' : 'none',
              willChange: 'transform',
              padding: '8px',
              // not scrollable by user
              touchAction: 'pan-y',
            }}
          >
            {loopItems.map((p, i) => {
              const img = productImage(p);
              const price =
                (p as any)?.price ??
                (p as any)?.amount ??
                (p as any)?.sale_price ??
                (p as any)?.salePrice;

              return (
                <button
                  key={`${(p as any)?.id ?? 'p'}-${i}`}
                  onClick={() => onClick(p)}
                  className="flex-shrink-0 bg-white rounded-2xl overflow-hidden text-left active:scale-[0.99] transition-transform"
                  style={{ width: CARD_W }}
                >
                  <div className="relative w-full h-[90px] bg-gray-100">
                    {img ? (
                      <img
                        src={img}
                        alt={(p as any)?.name ?? 'Product'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400 font-bold">
                        No image
                      </div>
                    )}

                    {/* Badge like "Low stocks" */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-black bg-[#7C3AED] text-white shadow">
                      Low stocks
                    </div>
                  </div>

                  <div className="px-2.5 py-2">
                    <div className="text-[11px] font-black text-gray-900 line-clamp-2 leading-tight">
                      {(p as any)?.name ?? (p as any)?.title ?? 'Bidhaa'}
                    </div>

                    <div className="mt-1 text-[12px] font-black text-gray-900">
                      {typeof price === 'number' || typeof price === 'string'
                        ? `TZS ${String(price)}`
                        : 'TZS —'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* subtle hint dots */}
        {canRotate && (
          <div className="mt-2 flex items-center justify-center gap-1.5 opacity-90">
            {Array.from({ length: Math.min(6, items.length) }).map((_, d) => (
              <div
                key={d}
                className="h-1.5 w-1.5 rounded-full bg-white/70"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AllProductsView: React.FC<AllProductsViewProps> = ({
  products,
  onProductClick,
  onLoadMore,
  isLoading,
}) => {
  // Use existing All Products items for the top “deals” sections
  const flashProducts = useMemo(() => products.slice(0, 10), [products]);
  const brandProducts = useMemo(() => products.slice(10, 20), [products]);

  return (
    <div className="animate-fadeIn min-h-screen pb-20 bg-[#F0F2F5]">
      {/* =========================
          ✅ TOP HERO + DEALS AREA
          ========================= */}
      <div className="bg-white border-b border-gray-100">
        {/* Sticky-like top strip */}
        <div className="px-5 pt-6 pb-3">
          <div className="text-[12px] font-black text-gray-400 uppercase tracking-widest">
            Baraka Sonko Electronics
          </div>
          <div className="mt-1 flex items-end gap-2">
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              Bidhaa Zote
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="px-4 pb-4">
          <div className="relative overflow-hidden rounded-3xl p-5"
               style={{
                 background:
                   'linear-gradient(135deg, rgba(231,212,255,1) 0%, rgba(178,124,255,1) 55%, rgba(117,70,255,1) 100%)',
               }}
          >
            <div className="relative z-10">
              <div className="text-[22px] sm:text-[24px] font-black text-white tracking-tight leading-none">
                Ofa Mpaka
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-[54px] font-black text-white leading-none">
                  80%
                </div>
                <div className="text-[28px] font-black text-white leading-none">
                  OFF
                </div>
              </div>

              <div className="mt-2 text-[12px] font-black text-white/85">
                Chagua bidhaa — bei kali, ubora wa Baraka Sonko.
              </div>
            </div>

            {/* Decorative bubbles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-[1px]" />
            <div className="absolute top-10 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Flash Deals (slow rotation, not scrollable) */}
        <div className="px-4 pb-3">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(231,212,255,1) 0%, rgba(178,124,255,1) 100%)',
            }}
          >
            <RotatingRow
              title="Flash Deals"
              items={flashProducts}
              onClick={onProductClick}
              intervalMs={14000} // very slow
            />
          </div>
        </div>

        {/* Brand Deals (slow rotation, not scrollable) */}
        <div className="px-4 pb-5">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(95,35,160,1) 0%, rgba(60,20,120,1) 100%)',
            }}
          >
            <RotatingRow
              title="Brand Deals"
              items={brandProducts}
              onClick={onProductClick}
              intervalMs={16000} // even slower
            />
          </div>
        </div>
      </div>

      {/* =========================
          ✅ EXISTING GRID
          ========================= */}
      <ProductGrid
        products={products}
        onProductClick={onProductClick}
        onLoadMore={onLoadMore}
        hasMore={true}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AllProductsView;
