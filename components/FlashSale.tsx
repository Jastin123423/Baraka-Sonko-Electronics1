
//
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

  // Calculate selling price from original price and discount
  const calculateSellingPrice = (originalPrice: number, discountPercent: number = 0) => {
    return Math.round(originalPrice * (1 - discountPercent / 100));
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
          // Calculate selling price from original price and discount
          const sellingPrice = p.discount ? calculateSellingPrice(p.originalPrice, p.discount) : p.originalPrice;
          
          return (
            <div key={p.id} className="flex-shrink-0 w-24 active:opacity-70 transition-opacity" onClick={() => onProductClick(p)}>
              <div className="relative aspect-square rounded overflow-hidden mb-1 border border-gray-100">
                <img src={p.image} alt="" className="w-full h-full object-cover" />
                {p.discount && p.discount > 0 && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1 font-bold">
                    -{p.discount}%
                  </div>
                )}
              </div>
              {/* Display selling price */}
              <div className="text-[11px] font-bold text-gray-900 truncate">
                TSh {sellingPrice.toLocaleString()}
              </div>
              {/* Display original price with strikethrough if discounted */}
              {p.discount && p.discount > 0 && (
                <div className="text-[9px] text-gray-400 line-through">
                  TSh {p.originalPrice.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlashSale;
