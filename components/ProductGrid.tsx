import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { COLORS } from '../constants';

interface ProductGridProps {
  title?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
  WatermarkedImage: React.ComponentType<any>;
  emptyMessage?: string;
  variant?: 'normal' | 'rotating';
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  title, 
  products, 
  onProductClick, 
  WatermarkedImage,
  emptyMessage = 'No products available',
  variant = 'normal'
}) => {
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize or update display products
  useEffect(() => {
    if (products.length === 0) {
      setDisplayProducts([]);
      return;
    }

    if (variant === 'rotating') {
      // For rotating variant, show 10 random products initially
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setDisplayProducts(shuffled.slice(0, 10));
    } else {
      // For normal variant, show all products
      setDisplayProducts(products);
    }
  }, [products, variant]);

  // Rotate products every 30 seconds for rotating variant
  useEffect(() => {
    if (variant !== 'rotating' || products.length === 0) return;

    const rotateInterval = setInterval(() => {
      setDisplayProducts(prev => {
        // Get 10 new random products
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const newProducts = shuffled.slice(0, 10);
        
        // Update current index for animation
        setCurrentIndex(prev => prev + 1);
        
        return newProducts;
      });
    }, 30000); // Rotate every 30 seconds

    return () => clearInterval(rotateInterval);
  }, [products, variant]);

  if (displayProducts.length === 0) {
    return (
      <div className="px-4 py-8">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider">
              {title}
            </h2>
          </div>
        )}
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider">
              {title}
            </h2>
            {variant === 'rotating' && (
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold animate-pulse">
                ROTATING
              </span>
            )}
          </div>
          <button 
            onClick={() => {}} 
            className="text-xs font-black text-orange-600"
          >
            View All
          </button>
        </div>
      )}

      <div 
        key={currentIndex} // This triggers animation on rotation
        className="grid grid-cols-2 gap-3 animate-fadeIn"
      >
        {displayProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => onProductClick(product)}
            className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-50">
              <WatermarkedImage
                src={product.image || ''}
                alt={product.title || product.name}
                containerClass="w-full h-full"
                productId={product.id}
                isProduct={true}
              />
            </div>

            <h3 className="text-xs font-bold text-gray-800 mb-1 line-clamp-2">
              {product.title || product.name}
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-orange-600">
                TSh {product.price?.toLocaleString() || '0'}
              </span>
              {(product as any).discount ? (
                <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                  -{(product as any).discount}%
                </span>
              ) : null}
            </div>

            {/* Optional category tag */}
            {product.category && (
              <p className="text-[9px] text-gray-400 mt-1 truncate">
                {product.category}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* View all link for mobile */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {}}
          className="text-sm font-bold text-orange-600 bg-orange-50 px-6 py-2 rounded-full inline-block"
        >
          Browse All Products
        </button>
      </div>
    </div>
  );
};

export default ProductGrid;
