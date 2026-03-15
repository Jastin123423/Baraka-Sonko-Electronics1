import React from 'react';
import { Product } from '../types';

interface SearchResultsProps {
  results: Product[];
  onResultClick: (product: Product) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  onResultClick, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
      {results.length > 0 ? (
        <div className="py-2">
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onResultClick(product);
                onClose();
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              {product.image && (
                <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
              )}
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">KSh {product.price}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
};

export default SearchResults;
