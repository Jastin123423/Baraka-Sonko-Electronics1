
import React from 'react';
import ProductGrid from './ProductGrid';
import { Product } from '../types';

interface AllProductsViewProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onLoadMore: () => void;
  isLoading: boolean;
}

const AllProductsView: React.FC<AllProductsViewProps> = ({ products, onProductClick, onLoadMore, isLoading }) => {
  return (
    <div className="animate-fadeIn min-h-screen pb-20">
      <div className="bg-white px-5 pt-8 pb-6 border-b border-gray-50 mb-2">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Bidhaa Zote</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">
          Infinite Collection • Randomized for You
        </p>
      </div>

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
