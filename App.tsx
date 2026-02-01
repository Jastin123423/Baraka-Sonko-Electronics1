
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import QuickActions from './components/QuickActions';
import CategorySection from './components/CategorySection';
import FlashSale from './components/FlashSale';
import ProductGrid from './components/ProductGrid';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import ProductDetailView from './components/ProductDetailView';
import CategoriesView from './components/CategoriesView';
import AllProductsView from './components/AllProductsView';
import { Product, User, Category } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<'home' | 'admin' | 'product-detail' | 'category-results' | 'categories' | 'search-results' | 'all-products'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  // Fetch initial data
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);
        
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        
        if (prodData.success) setProducts(prodData.data);
        if (catData.success) setCategories(catData.data);
      } catch (error) {
        console.error("Failed to initialize app", error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Search Logic
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.category?.toLowerCase().includes(q)
    );
  }, [searchQuery, products]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [searchQuery, categories]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setView('search-results');
  };

  const handleCategorySelect = (category: Category) => {
    if (category.name === 'Bidhaa Zote') {
      setView('all-products');
      setIsSidebarOpen(false);
      return;
    }
    setSelectedCategory(category);
    setView('category-results');
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  // Mock Admin session (in real app, use JWT/Session Cookie)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sonko_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [showAuth, setShowAuth] = useState(false);

  const addProduct = async (newProduct: Product) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const result = await response.json();
      if (result.success) {
        setProducts([result.data, ...products]);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminAccess = () => {
    if (!user) {
      setShowAuth(true);
    } else {
      setView('admin');
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sonko_user', JSON.stringify(newUser));
    setShowAuth(false);
    setView('admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sonko_user');
    setView('home');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('product-detail');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-4">
        <div className="text-3xl font-black italic text-orange-600 animate-pulse">SONKO</div>
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView 
          product={selectedProduct} 
          allProducts={products}
          onBack={() => setView('home')} 
          onProductClick={handleProductClick}
        />
      )}

      {showAuth && (
        <AuthView onLogin={handleLogin} onBack={() => setShowAuth(false)} />
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onCategorySelect={handleCategorySelect}
      />

      {view !== 'product-detail' && (
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onSearch={handleSearch}
          initialValue={searchQuery}
        />
      )}

      <main className="w-full max-w-[600px] mx-auto pb-24">
        {view === 'home' ? (
          <>
            <HeroBanner />
            <QuickActions onActionSelect={() => setView('all-products')} />
            <CategorySection onCategorySelect={handleCategorySelect} onMore={() => setView('categories')} />
            <FlashSale 
              products={products.slice(0, 5)} 
              onProductClick={handleProductClick} 
              onSeeAll={() => setView('all-products')}
            />
            <ProductGrid 
              title="Daily Discoveries" 
              products={products.slice(0, 10)} 
              onProductClick={handleProductClick} 
            />
          </>
        ) : view === 'all-products' ? (
          <AllProductsView 
            products={products} 
            onProductClick={handleProductClick}
            onLoadMore={() => {}}
            isLoading={false}
          />
        ) : view === 'search-results' ? (
          <div className="animate-fadeIn p-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : "Search"}
            </h2>
            <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
          </div>
        ) : view === 'categories' ? (
          <CategoriesView 
            onCategorySelect={handleCategorySelect} 
            suggestedProducts={products} 
            onProductClick={handleProductClick}
          />
        ) : view === 'admin' ? (
          <AdminView 
            products={products} 
            onAddProduct={addProduct} 
            onDeleteProduct={deleteProduct} 
          />
        ) : null}
      </main>

      {view !== 'product-detail' && (
        <BottomNav 
          currentView={view === 'admin' ? 'admin' : (view === 'categories' ? 'categories' : (view === 'search-results' ? 'search-results' : (view === 'all-products' ? 'all-products' : 'home')))} 
          onViewChange={(v) => {
            if (v === 'admin') handleAdminAccess();
            else setView(v);
          }} 
        />
      )}
    </div>
  );
};

export default App;
