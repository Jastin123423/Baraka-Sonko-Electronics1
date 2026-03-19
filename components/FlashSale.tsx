import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import { Product } from '../types';

interface FlashSaleProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onSeeAll: () => void;
}

const FlashSale: React.FC<FlashSaleProps> = ({ products, onProductClick, onSeeAll }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 45, s: 30 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;

        if (s > 0) s--;
        else if (m > 0) {
          m--;
          s = 59;
        } else if (h > 0) {
          h--;
          m = 59;
          s = 59;
        } else {
          h = 12;
          m = 45;
          s = 30;
        }

        return { h, m, s };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || products.length === 0) return;

    const startAutoScroll = () => {
      stopAutoScroll();

      autoScrollRef.current = window.setInterval(() => {
        if (!container || isPausedRef.current) return;

        container.scrollLeft += 1;

        const maxScroll = container.scrollWidth / 2;
        if (container.scrollLeft >= maxScroll) {
          container.scrollLeft = 0;
        }
      }, 18);
    };

    const stopAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };

    startAutoScroll();

    return () => stopAutoScroll();
  }, [products]);

  const format = (num: number) => num.toString().padStart(2, '0');

  const getOriginalPrice = (product: Product) => {
    if ((product as any).originalPrice) {
      return Number((product as any).originalPrice);
    }

    if (product.discount && product.discount > 0) {
      return Math.round(Number(product.price) * (1 + Number(product.discount) / 100));
    }

    return Number(product.price);
  };

  const displayProducts = products.length > 0 ? [...products, ...products] : [];

  return (
    <section className="mx-3 my-3 rounded-3xl overflow-hidden border border-orange-100 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-extrabold text-base leading-none">Hot Deals</p>
                <p className="text-orange-100 text-[11px] mt-1 font-medium">
                  Best picks moving fast
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onSeeAll}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white text-orange-600 text-[11px] font-bold shadow-sm hover:bg-orange-50 transition-colors"
          >
            See All
          </button>
        </div>

        {/* Timer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[11px] text-orange-100 font-semibold uppercase tracking-wide">
            Limited time offers
          </div>

          <div className="flex items-center gap-1">
            <span className="bg-white text-orange-600 text-[11px] px-2 py-1 rounded-md font-extrabold min-w-[30px] text-center">
              {format(timeLeft.h)}
            </span>
            <span className="text-white font-bold">:</span>
            <span className="bg-white text-orange-600 text-[11px] px-2 py-1 rounded-md font-extrabold min-w-[30px] text-center">
              {format(timeLeft.m)}
            </span>
            <span className="text-white font-bold">:</span>
            <span className="bg-white text-orange-600 text-[11px] px-2 py-1 rounded-md font-extrabold min-w-[30px] text-center">
              {format(timeLeft.s)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#fffaf5] px-3 py-4">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar space-x-3 scroll-smooth"
          onMouseEnter={() => {
            isPausedRef.current = true;
          }}
          onMouseLeave={() => {
            isPausedRef.current = false;
          }}
          onTouchStart={() => {
            isPausedRef.current = true;
          }}
          onTouchEnd={() => {
            setTimeout(() => {
              isPausedRef.current = false;
            }, 1500);
          }}
        >
          {displayProducts.map((p, index) => {
            const discount = p.discount && p.discount > 0 ? p.discount : 0;
            const sellingPrice = Number(p.price) || 0;
            const originalPrice = getOriginalPrice(p);

            return (
              <button
                key={`${p.id}-${index}`}
                onClick={() => onProductClick(p)}
                className="flex-shrink-0 w-32 text-left rounded-2xl bg-white border border-orange-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all overflow-hidden"
              >
                <div className="relative aspect-square bg-white">
                  <img
                    src={p.image}
                    alt={p.title || 'Product'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=No+Image';
                    }}
                  />

                  {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">
                      -{discount}%
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-gray-700 line-clamp-2 min-h-[32px]">
                    {p.title || p.name || 'Product'}
                  </p>

                  <div className="mt-2 flex flex-col items-start">
                    {originalPrice > sellingPrice && (
                      <span className="text-[10px] text-gray-400 line-through">
                        TSh {originalPrice.toLocaleString()}
                      </span>
                    )}

                    <span className="text-[13px] font-extrabold text-gray-900">
                      TSh {sellingPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(discount > 0 ? discount * 2 : 25, 100)}%`,
                          background: 'linear-gradient(90deg, #ff7a00, #ff5e00)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
