// Home.tsx or App.tsx
import React, { useState, useEffect } from 'react';
import Header from './Header';
import SearchResults from './SearchResults';
import CategoriesView from './CategoriesView';
import { Product, Category } from '../types';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showCategories, setShowCategories] = useState(true);

  // Fetch all products once (for searching)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://barakasonko.store/api/products');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setAllProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    
    fetchProducts();
  }, []);

  // Real search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowCategories(false); // Hide categories when searching
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowCategories(true); // Show categories when search is cleared
      return;
    }

    setIsSearching(true);
    
    // Filter products based on search query
    const filtered = allProducts.filter(product => {
      const searchTerm = query.toLowerCase().trim();
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.category?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm)
      );
    });
    
    setSearchResults(filtered);
    setIsSearching(false);
  };

  const handleProductClick = (product: Product) => {
    // Handle product click - navigate to product detail
    console.log('Product clicked:', product);
  };

  const handleCategorySelect = (category: Category) => {
    // Filter products by category
    const categoryProducts = allProducts.filter(
      product => product.category?.toLowerCase() === category.name.toLowerCase()
    );
    setSearchResults(categoryProducts);
    setSearchQuery(category.name);
    setShowCategories(false);
  };

  const handleMenuClick = () => {
    // Handle menu/sidebar toggle
    console.log('Menu clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={handleMenuClick}
        onSearch={handleSearch}
        initialValue={searchQuery}
      />
      
      <main className="container mx-auto px-4 py-4">
        {showCategories ? (
          <CategoriesView 
            onCategorySelect={handleCategorySelect}
            onShowAllProducts={() => handleSearch('')}
            suggestedProducts={allProducts.slice(0, 10)}
            onProductClick={handleProductClick}
          />
        ) : (
          <SearchResults 
            searchQuery={searchQuery}
            products={searchResults}
            onProductClick={handleProductClick}
            isLoading={isSearching}
          />
        )}
      </main>
    </div>
  );
};

export default Home;
