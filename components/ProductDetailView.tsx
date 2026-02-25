import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductGrid from './ProductGrid';
import { Product } from '../types';
import { COLORS } from '../constants';

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
 * ✅ Helper: safe price
 * ==========================================================
 */
const productPrice = (p: any) => {
  const v = p?.price ?? p?.amount ?? p?.sale_price ?? p?.salePrice ?? p?.cost ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * ==========================================================
 * ✅ Rotating (non-scrollable) row
 * - NOT user scrollable
 * - Very slow auto-rotation
 * - Clickable cards
 * - Full width (no side gaps)
 * ==========================================================
 */
const RotatingRow: React.FC<{
  title: string;
  items: Product[];
  onClick: (p: Product) => void;
  intervalMs?: number; // very slow rotation
}> = ({ title, items, onClick, intervalMs = 14000 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState(0);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  // Layout constants
  const GAP = 10;
  const CARD_W = 132;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);

    return () => ro.disconnect();
  }, []);

  const perView = useMemo(() => {
    if (!containerW) return 3;
    const n = Math.floor((containerW + GAP) / (CARD_W + GAP));
    return Math.max(1, Math.min(4, n));
  }, [containerW]);

  const cleanItems = useMemo(() => (items || []).filter(Boolean), [items]);

  const loopItems = useMemo(() => {
    if (cleanItems.length === 0) return [];
    return [...cleanItems, ...cleanItems, ...cleanItems];
  }, [cleanItems]);

  const canRotate = cleanItems.length > perView;

  // Start in the middle copy
  useEffect(() => {
    if (!canRotate) {
      setIndex(0);
      return;
    }
    setIndex(cleanItems.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRotate, cleanItems.length]);

  // Auto rotate slowly
  useEffect(() => {
    if (!canRotate) return;

    const t = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, intervalMs);

    return () => clearInterval(t);
  }, [canRotate, intervalMs]);

  // Snap back (seamless loop)
  useEffect(() => {
    if (!canRotate) return;
    const baseLen = cleanItems.length;

    if (index >= baseLen * 2) {
      setAnimate(false);
      setIndex(baseLen);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }
  }, [index, canRotate, cleanItems.length]);

  const translateX = -(index * (CARD_W + GAP));

  return (
    <div className="w-full overflow-hidden">
      {/* Row header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-black text-white">{title}</span>
          {canRotate && (
            <span className="text-[11px] font-black text-white/80">• Inajizungusha polepole</span>
          )}
        </div>
        <div className="text-[11px] font-black text-white/80">Upcoming</div>
      </div>

      {/* Cards (NOT scrollable) */}
      <div ref={containerRef} className="w-full px-4 pb-4">
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex"
            style={{
              gap: `${GAP}px`,
              transform: `translateX(${translateX}px)`,
              transition: animate ? 'transform 900ms ease-in-out' : 'none',
              willChange: 'transform',
              padding: '10px',
              touchAction: 'pan-y', // prevents horizontal swipe scroll
            }}
          >
            {loopItems.map((p: any, i) => {
              const img = productImage(p);
              const price = productPrice(p);
              const priceStr = price ? price.toLocaleString() : '—';

              return (
                <button
                  key={`${String(p?.id ?? 'p')}-${i}`}
                  onClick={() => onClick(p)}
                  className="flex-shrink-0 bg-white rounded-2xl overflow-hidden text-left active:scale-[0.99] transition-transform border border-white/40"
                  style={{ width: CARD_W }}
                >
                  <div className="relative w-full h-[92px] bg-gray-100">
                    {img ? (
                      <img
                        src={img}
                        alt={String(p?.title ?? p?.name ?? 'Product')}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400 font-bold">
                        No image
                      </div>
                    )}

                    {/* Badge */}
                    <div
                      className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-black text-white shadow"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      Low stocks
                    </div>
                  </div>

                  <div className="px-2.5 py-2">
                    <div className="text-[11px] font-black text-gray-900 line-clamp-2 leading-tight">
                      {String(p?.title ?? p?.name ?? 'Bidhaa')}
                    </div>

                    {/* ✅ PRICE uses Baraka primary color */}
                    <div className="mt-1 text-[12px] font-black" style={{ color: COLORS.primary }}>
                      TSh {priceStr}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {canRotate && (
          <div className="mt-2 flex items-center justify-center gap-1.5 opacity-90">
            {Array.from({ length: Math.min(6, cleanItems.length) }).map((_, d) => (
              <div key={d} className="h-1.5 w-1.5 rounded-full bg-white/70" />
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
  // Use All Products items for the top rotating rows
  const flashProducts = useMemo(() => (products || []).slice(0, 12), [products]);
  const brandProducts = useMemo(() => (products || []).slice(12, 24), [products]);

  return (
    <div className="animate-fadeIn min-h-screen pb-20 bg-[#F0F2F5]">
      {/* =========================
          ✅ FULL-WIDTH BARAKA SONKO HERO + DEALS (NO SIDE GAPS)
          ========================= */}
      <div className="bg-white border-b border-gray-100 w-full">
        {/* Header */}
        <div className="pt-6 pb-3 px-4">
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            Baraka Sonko Electronics
          </div>
          <div className="mt-1 text-2xl font-black text-gray-900 tracking-tight">Bidhaa Zote</div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">
            Infinite Collection • Randomized for You
          </p>
        </div>

        {/* HERO (edge-to-edge) */}
        <div
          className="relative overflow-hidden w-full px-4 py-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A58CA 55%, #063A8F 100%)`,
          }}
        >
          <div className="relative z-10">
            <div className="text-[22px] font-black text-white leading-none">Ofa Mpaka</div>
            <div className="mt-1 flex items-end gap-2">
              <div className="text-[64px] font-black text-white leading-none">80%</div>
              <div className="text-[28px] font-black text-white mb-2 leading-none">OFF</div>
            </div>
            <div className="mt-2 text-[12px] font-black text-white/80">
              Bei kali • Ubora wa Baraka Sonko Electronics
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 bg-white/10 rounded-full" />
        </div>

        {/* FLASH DEALS (full width, slow rotation) */}
        <div
          className="w-full"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A58CA 100%)`,
          }}
        >
          <RotatingRow
            title="Flash Deals"
            items={flashProducts}
            onClick={onProductClick}
            intervalMs={15000} // very slow
          />
        </div>

        {/* BRAND DEALS (full width, even slower rotation) */}
        <div
          className="w-full"
          style={{
            background: `linear-gradient(135deg, #0A58CA 0%, #063A8F 100%)`,
          }}
        >
          <RotatingRow
            title="Brand Deals"
            items={brandProducts}
            onClick={onProductClick}
            intervalMs={17000} // very slow
          />
        </div>
      </div>

      {/* =========================
          ✅ GRID (kept as-is)
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
