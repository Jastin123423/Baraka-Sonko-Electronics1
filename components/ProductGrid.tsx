import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { COLORS } from '../constants';
import ProductCard from './ProductCard';

interface HomePageProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  WatermarkedImage: React.ComponentType<any>;
  Banner?: React.ComponentType<any>;
}

const HomePage: React.FC<HomePageProps> = ({
  products,
  onProductClick,
  WatermarkedImage,
  Banner,
}) => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => (p as any).category).filter(Boolean))];

  // Filter products based on category and search
  useEffect(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => (p as any).category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black" style={{ color: COLORS.primary }}>
              BARAKA SONKO
            </h1>
            <div className="flex items-center space-x-2">
              <button className="p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </button>
              <button className="p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ focusRingColor: COLORS.primary }}
            />
            <svg
              className="absolute left-3 top-3"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="gray"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Categories Scroll */}
        <div className="overflow-x-auto no-scrollbar px-4 pb-3">
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700'
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? COLORS.primary : undefined,
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner Component */}
      {Banner && <Banner />}

      {/* Products Grid */}
      <div className="p-4">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">
            {filteredProducts.length} products found
          </p>
          <select className="text-xs border rounded-lg px-2 py-1 bg-white">
            <option>Sort by: Latest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Popularity</option>
          </select>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
                WatermarkedImage={WatermarkedImage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg"
              style={{ backgroundColor: COLORS.primary, color: 'white' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around items-center">
        <button className="flex flex-col items-center p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" />
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] mt-1">Profile</span>
        </button>
        <button className="flex flex-col items-center p-2 relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">3</span>
          <span className="text-[10px] mt-1">Cart</span>
        </button>
        <button className="flex flex-col items-center p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 4h16v16H4z" />
            <polyline points="4 9 12 15 20 9" />
          </svg>
          <span className="text-[10px] mt-1">Inbox</span>
        </button>
      </div>

      {/* Bottom Padding for Navigation */}
      <div className="h-16" />
    </div>
  );
};

export default HomePage;
