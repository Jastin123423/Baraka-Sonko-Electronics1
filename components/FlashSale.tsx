import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { Product } from '../types';

interface FlashSaleProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onSeeAll: () => void;
}

const FlashSale: React.FC<FlashSaleProps> = ({ products, onProductClick, onSeeAll }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 45, s: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else if (m > 0) { m--; s = 59; }
        else if (h > 0) { h--; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (num: number) => num.toString().padStart(2, '0');

  // Helper function to get original price (with fallback)
  const getOriginalPrice = (product: Product) => {
    // Check if originalPrice exists directly on product
    if ((product as any).originalPrice) {
      return Number((product as any).originalPrice);
    }
    // Calculate from discount if available
    if (product.discount && product.discount > 0) {
      return Math.round(Number(product.price) * (1 + Number(product.discount) / 100));
    }
    // Fallback to same as price (no discount)
    return Number(product.price);
  };

  return (
    <div className="bg-white mb-2 py-3 px-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-900 text-sm">Flash Sale</span>
          <div className="flex items-center space-x-1">
            <span className="bg-black text-white text-[10px] px-1 rounded font-medium">{format(timeLeft.h)}</span>
            <span className="text-black text-xs font-bold">:</span>
            <span className="bg-black text-white text-[10px] px-1 rounded font-medium">{format(timeLeft.m)}</span>
            <span className="text-black text-xs font-bold">:</span>
            <span className="bg-black text-white text-[10px] px-1 rounded font-medium">{format(timeLeft.s)}</span>
          </div>
        </div>
        <button 
          onClick={onSeeAll}
          className="text-[11px] font-medium" 
          style={{ color: COLORS.primary }}
        >
          See All ›
        </button>
      </div>

      <div className="flex overflow-x-auto no-scrollbar space-x-3">
        {products.map((p) => {
          // Safely get values with defaults
          const discount = p.discount && p.discount > 0 ? p.discount : 0;
          const sellingPrice = Number(p.price) || 0;
          const originalPrice = getOriginalPrice(p);
          
          return (
            <div key={p.id} className="flex-shrink-0 w-24 active:opacity-70 transition-opacity" onClick={() => onProductClick(p)}>
              <div className="relative aspect-square rounded overflow-hidden mb-1 border border-gray-100">
                <img 
                  src={p.image} 
                  alt={p.title || 'Product'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image';
                  }}
                />
                {discount > 0 && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1 font-bold">
                    -{discount}%
                  </div>
                )}
              </div>
              
              {/* Price display - Original first (with strikethrough), then selling price */}
              <div className="flex flex-col items-start">
                {originalPrice > sellingPrice && (
                  <span className="text-[9px] text-gray-400 line-through">
                    TSh {originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-[11px] font-bold text-gray-900 truncate">
                  TSh {sellingPrice.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlashSale;
