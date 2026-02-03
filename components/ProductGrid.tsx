import React, { useEffect, useRef, useMemo } from 'react';
import { COLORS, ICONS } from '../constants';
import { Product } from '../types';

const ProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
  // Calculate original price if not provided
  const originalPrice = product.originalPrice || (product.discount ? Math.round(product.price * (1 + product.discount / 100)) : null);

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col mb-2.5 active:opacity-90 transition-all cursor-pointer border border-gray-50" 
      onClick={onClick}
    >
      <div className="relative w-full">
        {/* Variable height image container */}
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-auto object-cover block" 
        />
        
        {/* Kikuu Style Discount Badge - Top Left */}
        {product.discount && (
          <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] px-1.5 py-0.5 font-bold rounded-sm z-10 shadow-sm">
            -{product.discount}%
          </div>
        )}

        {/* Wishlist Icon */}
        <div className="absolute bottom-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400">
          <ICONS.Heart />
        </div>
      </div>
      
      <div className="p-2.5 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          {/* Title - Clean text */}
          <h3 className="text-[11px] text-gray-800 line-clamp-2 leading-tight font-medium h-8">
            {product.title}
          </h3>

          {/* Pricing Section */}
          <div className="flex flex-col pt-1">
            <div className="flex items-baseline">
              <span className="text-[14px] font-black text-black">
                TSh {product.price.toLocaleString()}
              </span>
            </div>
            {originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">
                TSh {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Rating only - Removed order count */}
          <div className="flex items-center mt-2">
            <div className="flex items-center space-x-0.5">
              <span className="text-[10px] text-orange-400">⭐</span>
              <span className="text-[10px] text-gray-500 font-bold">
                {typeof product.rating === 'number' ? product.rating.toFixed(1) : '5.0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  onLoadMore, 
  hasMore = false,
  isLoading = false 
}) => {
  const observerTarget = useRef(null);

  // Split products into two columns for masonry effect
  const [colLeft, colRight] = useMemo(() => {
    const left: Product[] = [];
    const right: Product[] = [];
    products.forEach((p, idx) => {
      if (idx % 2 === 0) left.push(p);
      else right.push(p);
    });
    return [left, right];
  }, [products]);

  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [onLoadMore, hasMore, isLoading, products.length]);

  return (
    <div className="px-2 mb-4">
      {title && (
        <div className="flex items-center justify-center py-6">
          <div className="h-px bg-gray-200 w-12 mr-3" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{title}</span>
          <div className="h-px bg-gray-200 w-12 ml-3" />
        </div>
      )}

      {/* Masonry Columns Wrapper */}
      <div className="flex space-x-2 items-start">
        {/* Left Column */}
        <div className="flex-1 flex flex-col">
          {colLeft.map((p, idx) => (
            <ProductCard key={`${p.id}-left-${idx}`} product={p} onClick={() => onProductClick(p)} />
          ))}
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col">
          {colRight.map((p, idx) => (
            <ProductCard key={`${p.id}-right-${idx}`} product={p} onClick={() => onProductClick(p)} />
          ))}
        </div>
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="h-24 flex items-center justify-center w-full">
        {(isLoading || hasMore) && (
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
