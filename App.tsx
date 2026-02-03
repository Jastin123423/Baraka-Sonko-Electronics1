import React, { useState, useEffect, useMemo } from 'react';
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
import { Product, User, Category } from './types';

/** Small inline ErrorBoundary so AdminView crashes don't blank the whole app */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; title?: string },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('UI crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-black text-red-700">
              {this.props.title || 'This screen crashed.'}
            </p>
            <p className="text-xs text-red-700 mt-2">
              Open console to see full error. Most likely a bad product field (price/id/image) from backend.
            </p>
            <pre className="text-[11px] mt-3 whitespace-pre-wrap text-red-600">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper function to get default icon for category
const getDefaultCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('phone') || name.includes('simu')) return '📱';
  if (name.includes('tv') || name.includes('television')) return '📺';
  if (name.includes('sound') || name.includes('sauti')) return '🔊';
  if (name.includes('camera') || name.includes('kamera')) return '📷';
  if (name.includes('laptop') || name.includes('kompyuta')) return '💻';
  if (name.includes('game') || name.includes('mchezo')) return '🎮';
  if (name.includes('watch') || name.includes('saa')) return '⌚';
  if (name.includes('home') || name.includes('nyumba')) return '🏠';
  if (name.includes('kitchen') || name.includes('jikoni')) return '🍳';
  if (name.includes('car') || name.includes('gari')) return '🚗';
  if (name.includes('health') || name.includes('afya')) return '❤️';
  if (name.includes('book') || name.includes('kitabu')) return '📚';
  if (name.includes('fashion') || name.includes('mitindo')) return '👕';
  if (name.includes('all') || name.includes('zote')) return '🛒';
  if (name.includes('electronics') || name.includes('umeme')) return '🔌';
  if (name.includes('accessories') || name.includes('vifaa')) return '🛍️';
  
  return '🛒';
};

// Transform backend category data to ensure proper format
const normalizeCategory = (cat: any): Category => {
  const backendIcon = cat.icon || cat.icon_name || cat.icon_emoji || cat.icon_url;
  
  return {
    id: String(cat.id || cat._id || `cat_${Date.now()}_${Math.random()}`),
    name: String(cat.name || cat.category_name || cat.title || 'Unnamed Category'),
    icon: backendIcon || getDefaultCategoryIcon(cat.name || ''),
    // Include any other fields backend might provide
    ...cat
  };
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Transform backend product data to ensure proper format - NOW INSIDE COMPONENT
  const normalizeProduct = (p: any, categoriesList: Category[]): Product => {
    const id = String(p?.id ?? '');
    const price = Number(p?.price ?? 0);
    const discount = p?.discount == null ? 0 : Number(p.discount);

    // Handle category - extract from backend response
    let categoryName = '';
    let categoryIcon = '';
    
    if (typeof p?.category === 'object' && p.category !== null) {
      // If category is an object, extract name and icon
      categoryName = String(p.category.name || p.category.category_name || '');
      categoryIcon = String(p.category.icon || p.category.icon_name || '');
    } else {
      // If category is string or mixed format
      categoryName = String(p?.categoryName ?? p?.category ?? '');
    }

    const category = String(p?.category ?? p?.categoryName ?? '');

    // Get icon for product's category from categories list
    const getProductCategoryIcon = () => {
      if (categoryIcon) return categoryIcon;
      
      // Try to find matching category in categories state
      const matchingCat = categoriesList.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase() ||
        c.name.toLowerCase() === category.toLowerCase()
      );
      
      return matchingCat?.icon || getDefaultCategoryIcon(categoryName);
    };

    return {
      ...p,
      id,
      price: Number.isFinite(price) ? price : 0,
      discount: Number.isFinite(discount) ? discount : 0,
      category,
      categoryName,
      categoryIcon: getProductCategoryIcon(),
      image: p?.image || p?.image_url || (Array.isArray(p?.images) ? p.images[0] : '') || '',
      // 🔥 Improved array handling for snake_case/camelCase
      images: Array.isArray(p?.images)
        ? p.images
        : Array.isArray(p?.image_urls)
        ? p.image_urls
        : Array.isArray(p?.image_urls_json)
        ? p.image_urls_json
        : [],
      descriptionImages: Array.isArray(p?.descriptionImages)
        ? p.descriptionImages
        : Array.isArray(p?.description_images)
        ? p.description_images
        : [],
      videoUrl: String(p?.videoUrl ?? p?.video_url ?? ''),
    } as any;
  };

  // Fetch initial data
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        
        console.log('📡 App: Fetching initial data...');
        
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        console.log('📡 App: Products response status:', prodRes.status);
        console.log('📡 App: Categories response status:', catRes.status);

        const prodData = await prodRes.json().catch(() => {
          console.error('❌ App: Failed to parse products JSON');
          return { success: false, error: 'Invalid JSON from products API' };
        });
        
        const catData = await catRes.json().catch(() => {
          console.error('❌ App: Failed to parse categories JSON');
          return { success: false, error: 'Invalid JSON from categories API' };
        });

        console.log('📡 App: Products data:', prodData);
        console.log('📡 App: Categories data:', catData);

        // First process categories
        let normalizedCats: Category[] = [];
        if (catData?.success) {
          const rawCats = Array.isArray(catData.data) ? catData.data : [];
          console.log('📡 App: Raw categories count:', rawCats.length);
          console.log('📡 App: Raw categories:', rawCats);
          
          normalizedCats = rawCats.map(normalizeCategory);
          console.log('📡 App: Normalized categories:', normalizedCats.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon
          })));
          
          setCategories(normalizedCats);
        } else {
          console.error('❌ App: Categories API returned error:', catData?.error);
          setFetchError(prev => prev ? `${prev}; Categories: ${catData?.error}` : `Categories: ${catData?.error || 'Unknown error'}`);
        }

        // Then process products with the normalized categories
        if (prodData?.success) {
          const raw = Array.isArray(prodData.data) ? prodData.data : [];
          console.log('📡 App: Raw products count:', raw.length);
          
          const normalized = raw.map(p => normalizeProduct(p, normalizedCats));
          console.log('📡 App: Normalized products:', normalized.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            categoryName: p.categoryName
          })));
          
          setProducts(normalized);
        } else {
          console.error('❌ App: Products API returned error:', prodData?.error);
          setFetchError(prev => prev ? `${prev}; Products: ${prodData?.error}` : `Products: ${prodData?.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('❌ App: Failed to initialize app', error);
        setFetchError(error.message || 'Network or server error');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Search Logic (supports both category + categoryName)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter((p) => {
      const categoryField = (p.category || (p as any).categoryName || '').toLowerCase();
      return p.title?.toLowerCase().includes(q) || categoryField.includes(q);
    });
  }, [searchQuery, products]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery, categories]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setView('search-results');
  };

  const handleCategorySelect = (category: Category) => {
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
        body: JSON.stringify(newProduct),
      });

      const result = await response.json().catch(() => null);

      console.log('POST /api/products status:', response.status);
      console.log('POST /api/products result:', result);

      if (!response.ok || !result?.success) return false;

      const savedRaw = result.data || result.product || result.item;
      if (savedRaw) {
        const saved = normalizeProduct(savedRaw, categories);
        setProducts((prev) => [saved, ...prev]);
        return true;
      }

      // fallback: refetch if backend doesn't return item
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

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (result?.success) {
        setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminAccess = () => {
    if (!user) setShowAuth(true);
    else setView('admin');
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

  // Bottom nav mapping (fix highlight + category-results)
  const navView =
    view === 'admin'
      ? 'admin'
      : view === 'categories'
      ? 'categories'
      : view === 'all-products'
      ? 'all-products'
      : view === 'search-results'
      ? 'search-results'
      : view === 'category-results'
      ? 'categories'
      : 'home';

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-4">
        <div className="text-3xl font-black italic text-orange-600 animate-pulse">SONKO</div>
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 mt-4">Loading store data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-4 p-8">
        <div className="text-3xl font-black italic text-orange-600">SONKO</div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-black text-red-700">Connection Error</h3>
              <p className="text-xs text-red-600">Failed to load store data</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-orange-600 text-white font-black py-3 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Retry Loading
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Check your internet connection and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Product Detail View */}
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={products}
          onBack={() => setView('home')}
          onProductClick={handleProductClick}
        />
      )}

      {/* Auth View */}
      {showAuth && <AuthView onLogin={handleLogin} onBack={() => setShowAuth(false)} />}

      {/* Sidebar - Now fetches its own categories from backend */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCategorySelect={handleCategorySelect}
      />

      {/* Header */}
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
            <HeroBanner onClick={() => setView('all-products')} />

            <AdBanner
              src="https://media.barakasonko.store/Jipatie%20kwa%20bei%20poa.gif"
              onClick={() => setView('all-products')}
              containerClass="h-[310px]"
              fullWidth={true}
            />

            <QuickActions onActionSelect={() => setView('all-products')} />

            <CategorySection
              categories={categories}
              onCategorySelect={handleCategorySelect}
              onMore={() => setView('categories')}
            />

            <FlashSale
              products={products.slice(0, 5)}
              onProductClick={handleProductClick}
              onSeeAll={() => setView('all-products')}
            />

            <AdBanner
              src="https://media.barakasonko.store/White%20Blue%20Professional%20Website%20Developer%20LinkedIn%20Banner.gif"
              onClick={() => setView('all-products')}
              containerClass="h-[110px]"
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
        ) : view === 'category-results' ? (
          <div className="animate-fadeIn p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedCategory?.icon && (
                  <span className="text-xl">{selectedCategory.icon}</span>
                )}
                <h2 className="text-sm font-bold text-gray-500 uppercase">
                  {selectedCategory ? selectedCategory.name : 'Category'}
                </h2>
              </div>
              <button
                className="text-xs font-black text-orange-600"
                onClick={() => setView('all-products')}
              >
                View All
              </button>
            </div>

            <ProductGrid
              products={products.filter((p) => {
                const cat = String((p as any).category ?? (p as any).categoryName ?? '').toLowerCase();
                const target = String(selectedCategory?.name ?? '').toLowerCase();
                return target ? cat === target : true;
              })}
              onProductClick={handleProductClick}
            />
          </div>
        ) : view === 'search-results' ? (
          <div className="animate-fadeIn p-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : 'Search'}
            </h2>

            {/* Show matching categories */}
            {filteredCategories.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-black text-gray-400 uppercase mb-2">Matching Categories</p>
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      className="px-3 py-2 rounded-full bg-gray-100 text-xs font-black text-gray-700 flex items-center space-x-2 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                      onClick={() => handleCategorySelect(c)}
                    >
                      {c.icon && <span>{c.icon}</span>}
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
          </div>
        ) : view === 'categories' ? (
          <CategoriesView
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onShowAllProducts={() => setView('all-products')}
            suggestedProducts={products}
            onProductClick={handleProductClick}
          />
        ) : view === 'admin' ? (
          <ErrorBoundary title="Admin screen crashed">
            <AdminView
              products={products}
              categories={categories}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
            />
          </ErrorBoundary>
        ) : null}
      </main>

      {/* Bottom Nav */}
      {view !== 'product-detail' && (
        <BottomNav
          currentView={navView as any}
          onViewChange={(v: any) => {
            if (v === 'admin') handleAdminAccess();
            else setView(v);
          }}
        />
      )}
    </div>
  );
};

export default App;
