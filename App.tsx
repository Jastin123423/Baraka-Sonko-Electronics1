import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import QuickActions from './components/QuickActions';
import CategorySection from './components/CategorySection';
import FlashSale from './components/FlashSale';
import AdBanner from './components/AdBanner';
import ProductGrid from './components/ProductGrid';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import ProductDetailView from './components/ProductDetailView';
import CategoriesView from './components/CategoriesView';
import AllProductsView from './components/AllProductsView';
import { Product, User, Category, GuestActivity } from './types';

// ... (Previous components remain the same: WatermarkedImage, VideoPlayer, Banner, ErrorBoundary, etc.)

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const [view, setView] = useState<
    | 'home'
    | 'admin'
    | 'product-detail'
    | 'category-results'
    | 'categories'
    | 'search-results'
    | 'all-products'
  >('home');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Guest User Management
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sonko_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [guestActivities, setGuestActivities] = useState<GuestActivity[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  // Initialize guest user if no user exists
  useEffect(() => {
    if (!user) {
      const guestUser: User = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: 'Guest',
        role: 'guest',
        createdAt: new Date().toISOString(),
      };
      setUser(guestUser);
      localStorage.setItem('sonko_user', JSON.stringify(guestUser));
    }
  }, []);

  // Track guest activities
  const trackGuestActivity = (activity: Omit<GuestActivity, 'timestamp'>) => {
    if (user?.role === 'guest') {
      const newActivity: GuestActivity = {
        ...activity,
        timestamp: new Date().toISOString(),
      };
      setGuestActivities(prev => [...prev.slice(-50), newActivity]); // Keep last 50 activities
      
      // Log to console for debugging
      console.log('Guest Activity:', newActivity);
    }
  };

  // ... (rest of your existing useEffect hooks remain the same)

  // Modified handleProductClick with guest tracking
  const handleProductClick = (product: Product) => {
    if (user?.role === 'guest') {
      trackGuestActivity({
        type: 'view_product',
        productId: product.id,
      });
    }
    setSelectedProduct(product);
    setView('product-detail');
  };

  // Modified handleCategorySelect with guest tracking
  const handleCategorySelect = (category: Category) => {
    if (user?.role === 'guest') {
      trackGuestActivity({
        type: 'view_category',
        categoryId: category.id,
      });
    }
    
    if (category.name === 'Bidhaa Zote' || category.name.toLowerCase().includes('all')) {
      setView('all-products');
      setIsSidebarOpen(false);
      return;
    }
    setSelectedCategory(category);
    setView('category-results');
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  // Modified handleSearch with guest tracking
  const handleSearch = (query: string) => {
    if (user?.role === 'guest') {
      trackGuestActivity({
        type: 'search',
        query: query,
      });
    }
    setSearchQuery(query);
    setView('search-results');
  };

  // Modified handleAdminAccess with guest restriction
  const handleAdminAccess = () => {
    if (!user || user.role === 'guest') {
      setShowGuestWarning(true);
      setShowAuth(true);
    } else if (user.role === 'user') {
      setView('admin');
    }
  };

  // Modified addProduct with guest restriction
  const addProduct = async (newProduct: Product) => {
    // Check if user is guest
    if (user?.role === 'guest') {
      alert('Guest users cannot add products. Please login or create an account.');
      setShowAuth(true);
      return false;
    }

    // Check if user is regular user (not admin)
    if (user?.role === 'user') {
      alert('Only admin users can add products. Please contact administrator.');
      return false;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify(newProduct),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) return false;

      const savedRaw = result.data || result.product || result.item;
      if (savedRaw) {
        const saved = normalizeProduct(savedRaw, categories);
        setProducts((prev) => [saved, ...prev]);
        return true;
      }

      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json().catch(() => null);
      if (prodData?.success) {
        const normalized = (prodData.data || []).map(p => normalizeProduct(p, categories));
        setProducts(normalized);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Modified deleteProduct with guest restriction
  const deleteProduct = async (id: string) => {
    // Check if user is guest or regular user
    if (user?.role === 'guest' || user?.role === 'user') {
      alert('Only admin users can delete products.');
      return;
    }

    try {
      const response = await fetch(`/api/products?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
        headers: {
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
      });
      const result = await response.json().catch(() => null);
      if (result?.success) {
        setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Modified handleLogin to set proper role
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sonko_user', JSON.stringify(newUser));
    setShowAuth(false);
    
    // If user is admin, go to admin view
    if (newUser.role === 'admin') {
      setView('admin');
    } else {
      setView('home');
    }
  };

  const handleLogout = () => {
    // Create new guest user after logout
    const guestUser: User = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: 'Guest',
      role: 'guest',
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
    localStorage.setItem('sonko_user', JSON.stringify(guestUser));
    setGuestActivities([]);
    setView('home');
  };

  // Add WhatsApp click tracking for guests
  const handleWhatsAppClick = (product: Product) => {
    if (user?.role === 'guest') {
      trackGuestActivity({
        type: 'click_whatsapp',
        productId: product.id,
      });
    }
    // WhatsApp URL will open normally
  };

  // Add call click tracking for guests
  const handleCallClick = (product: Product) => {
    if (user?.role === 'guest') {
      trackGuestActivity({
        type: 'click_call',
        productId: product.id,
      });
    }
    // Phone call will initiate normally
  };

  // ... (rest of your existing functions remain the same)

  return (
    <div className="relative min-h-screen bg-white">
      {/* Guest Warning Banner */}
      {showGuestWarning && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white text-xs font-black py-2 px-4 text-center z-50">
          ⚠️ Guest users have limited access. Login for full features.
          <button 
            onClick={() => setShowGuestWarning(false)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Product Detail View - Updated to pass tracking functions */}
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={products}
          onBack={() => setView('home')}
          onProductClick={handleProductClick}
          WatermarkedImage={WatermarkedImage}
          onWhatsAppClick={() => handleWhatsAppClick(selectedProduct)}
          onCallClick={() => handleCallClick(selectedProduct)}
        />
      )}

      {/* Auth View - Updated to show guest info */}
      {showAuth && (
        <AuthView 
          onLogin={handleLogin} 
          onBack={() => setShowAuth(false)}
          currentUser={user}
        />
      )}

      {/* ... (rest of your JSX remains similar, but update components to pass user info) */}

      <main className="w-full max-w-[600px] mx-auto pb-24">
        {view === 'home' ? (
          <>
            <HeroBanner onClick={() => {
              if (user?.role === 'guest') {
                trackGuestActivity({ type: 'view_category', categoryId: 'all' });
              }
              setView('all-products');
            }} />

            {/* ... (rest of home view components) */}

            {/* Show login prompt for guests in product grid */}
            {user?.role === 'guest' && (
              <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👤</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-800">Guest Mode</p>
                    <p className="text-[10px] text-blue-600">
                      Viewing only. <button 
                        onClick={() => setShowAuth(true)}
                        className="font-bold underline"
                      >
                        Login
                      </button> to save favorites and more.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ProductGrid
              title="Daily Discoveries"
              products={products.slice(0, 10)}
              onProductClick={handleProductClick}
              WatermarkedImage={WatermarkedImage}
              userRole={user?.role}
            />
          </>
        ) : view === 'all-products' ? (
          <AllProductsView
            products={products}
            onProductClick={handleProductClick}
            onLoadMore={() => {}}
            isLoading={false}
            WatermarkedImage={WatermarkedImage}
            userRole={user?.role}
          />
        ) : view === 'admin' ? (
          <ErrorBoundary title="Admin screen crashed">
            <AdminView
              products={products}
              categories={categories}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
              WatermarkedImage={WatermarkedImage}
              VideoPlayer={VideoPlayer}
              Banner={Banner}
              currentUser={user}
              onUnauthorized={() => {
                setShowAuth(true);
                setView('home');
              }}
            />
          </ErrorBoundary>
        ) : null}
      </main>

      {/* Bottom Nav - Updated to show user status */}
      {view !== 'product-detail' && (
        <BottomNav
          currentView={navView as any}
          onViewChange={(v: any) => {
            if (v === 'admin') handleAdminAccess();
            else setView(v);
          }}
          userRole={user?.role}
          onLoginClick={() => setShowAuth(true)}
          onLogoutClick={handleLogout}
        />
      )}

      {/* Guest Stats Footer (only visible in development) */}
      {process.env.NODE_ENV === 'development' && user?.role === 'guest' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white text-[10px] p-1 text-center">
          Guest Activities: {guestActivities.length} | Last: {guestActivities[guestActivities.length - 1]?.type || 'none'}
        </div>
      )}
    </div>
  );
};

export default App;
