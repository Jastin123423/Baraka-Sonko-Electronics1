import React, { useMemo, useState, useEffect } from 'react';
import { Category, Product } from '../types';
import ProductGrid from './ProductGrid';
import AdBanner from './AdBanner';

interface CategoriesViewProps {
  onCategorySelect: (category: Category) => void;
  onShowAllProducts?: () => void;
  suggestedProducts?: Product[];
  onProductClick?: (product: Product) => void;
}

// Cache for categories to avoid multiple fetches
let categoriesCache: Category[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

const CategoriesView: React.FC<CategoriesViewProps> = ({
  onCategorySelect,
  onShowAllProducts,
  suggestedProducts = [],
  onProductClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Single source of truth for categories - ONLY from API with ?app=sound
  useEffect(() => {
    const fetchCategories = async () => {
      const now = Date.now();

      // Check memory cache first (1 hour TTL)
      if (categoriesCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
        console.log('📦 Using cached categories from memory');
        setCategories(categoriesCache);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🌐 Fetching categories from API: /api/categories?app=sound');
        
        // IMPORTANT: Always use the full URL with ?app=sound parameter
        const response = await fetch('https://sonkosound.barakasonko.store/api/categories?app=sound', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache', // Ensure we get fresh data
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        }

        const jsonResponse = await response.json();

        // Validate response structure
        if (!jsonResponse) {
          throw new Error('Empty response from server');
        }

        if (!jsonResponse.success) {
          throw new Error(jsonResponse.message || 'API returned unsuccessful response');
        }

        if (!Array.isArray(jsonResponse.data)) {
          console.warn('API response data is not an array:', jsonResponse.data);
          throw new Error('Invalid data format: expected array');
        }

        // Process and validate each category
        const fetchedCategories: Category[] = jsonResponse.data
          .filter((item: any) => item && (item.id || item._id)) // Ensure each item has an ID
          .map((item: any) => ({
            id: String(item.id || item._id || ''),
            name: String(item.name || item.category_name || item.title || 'Unnamed Category'),
            icon: item.icon || item.icon_name || item.icon_emoji || item.icon_url || getDefaultCategoryIcon(item.name || ''),
            ...item
          }));

        if (fetchedCategories.length === 0) {
          console.warn('API returned empty categories array');
        }

        // Update memory cache
        categoriesCache = fetchedCategories;
        cacheTimestamp = now;
        
        // Update state
        setCategories(fetchedCategories);
        setLastFetchTime(now);
        
        console.log(`✅ Loaded ${fetchedCategories.length} categories from API`);
      } catch (err) {
        console.error('❌ Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
        
        // If we have stale cache, show it as fallback
        if (categoriesCache) {
          console.log('📦 Using stale cache as fallback');
          setCategories(categoriesCache);
          setError(null); // Clear error since we have fallback data
        } else {
          setCategories([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []); // Empty deps array - only runs once on mount

  // Helper function for default icons (moved inside component to avoid external dependency)
  const getDefaultCategoryIcon = (categoryName: string): string => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('phone') || name.includes('simu')) return '📱';
    if (name.includes('tv') || name.includes('television')) return '📺';
    if (name.includes('sound') || name.includes('sauti')) return '🔊';
    if (name.includes('speaker') || name.includes('spika')) return '🔊';
    if (name.includes('microphone') || name.includes('mic')) return '🎤';
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
    if (name.includes('charger') || name.includes('chaja')) return '🔋';
    if (name.includes('cable') || name.includes('waya')) return '📟';
    if (name.includes('adapter') || name.includes('adaptor')) return '🔌';
    if (name.includes('battery') || name.includes('betri')) return '🔋';
    
    return '🛒';
  };

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;

    const term = searchTerm.toLowerCase().trim();
    return categories.filter(cat =>
      String(cat.name ?? '').toLowerCase().includes(term) ||
      String(cat.id ?? '').toLowerCase().includes(term)
    );
  }, [searchTerm, categories]);

  // Limit suggested products
  const displayProducts = useMemo(() => {
    return suggestedProducts.slice(0, 15);
  }, [suggestedProducts]);

  // Quick stats for UI
  const quickStats = useMemo(() => {
    return [
      { label: 'Categories', value: categories.length },
      { label: 'Suggested', value: displayProducts.length },
      { label: 'Search', value: searchTerm.trim() ? filteredCategories.length : 'All' },
    ];
  }, [categories.length, displayProducts.length, searchTerm, filteredCategories.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pb-12 bg-gradient-to-b from-[#fffaf5] via-white to-white animate-fadeIn">
        <div className="px-4 pt-5">
          <div className="rounded-[28px] bg-gradient-to-r from-orange-500 to-orange-600 p-5 shadow-sm">
            <div className="h-5 w-40 bg-white/20 rounded animate-pulse mb-3" />
            <div className="h-3 w-56 bg-white/20 rounded animate-pulse" />
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="h-14 bg-white border border-orange-100 rounded-2xl animate-pulse shadow-sm" />
        </div>

        <div className="px-4 mt-5 grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square rounded-[24px] bg-white border border-orange-100 shadow-sm p-4 animate-pulse">
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 mb-3" />
                <div className="w-14 h-3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state - only show if we have no categories AND there's an error
  if (error && categories.length === 0) {
    return (
      <div className="min-h-screen pb-12 bg-gradient-to-b from-[#fffaf5] via-white to-white animate-fadeIn">
        <div className="px-4 pt-5">
          <div className="rounded-[28px] bg-gradient-to-r from-orange-500 to-orange-600 p-5 shadow-sm text-white">
            <h2 className="text-2xl font-extrabold tracking-tight">Categories</h2>
            <p className="text-sm text-orange-100 mt-1">Browse products by section</p>
          </div>
        </div>

        <div className="mx-4 mt-6 rounded-[28px] bg-white border border-red-100 shadow-sm px-5 py-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to load categories</h3>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold shadow-sm active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen pb-12 bg-gradient-to-b from-[#fffaf5] via-white to-white animate-fadeIn">
      <div className="px-4 pt-5">
        <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 p-5 shadow-sm">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute right-8 bottom-0 w-20 h-20 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-orange-100">
                  Sonko Sound
                </p>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                  Explore Categories
                </h2>
                <p className="text-sm text-orange-100 mt-2 max-w-xs leading-relaxed">
                  Find audio gear, electronics, accessories and more in one modern collection.
                </p>
              </div>

              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center text-white">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h10" />
                </svg>
              </div>
            </div>

            {/* Last fetched indicator - optional, shows when data was loaded */}
            {lastFetchTime && (
              <div className="mt-3 text-[10px] text-orange-100/80">
                Updated: {new Date(lastFetchTime).toLocaleTimeString()}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-3">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/12 border border-white/10 px-3 py-2.5">
                  <p className="text-lg font-extrabold text-white leading-none">{item.value}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-orange-100 mt-1">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-[26px] bg-white border border-orange-100 shadow-sm p-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories like Speaker, TV, Microphone..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-[#fffaf5] border border-orange-100 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all"
              autoComplete="off"
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                aria-label="Clear search"
              >
                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            )}
          </div>

          {searchTerm.trim() && categories.length > 0 && (
            <div className="mt-3 px-1 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Found {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
              </p>
              <div className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[11px] font-bold">
                Search Active
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-5 mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">Popular Collections</h3>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-[0.16em] mt-1">
            Pick a category to continue
          </p>
        </div>

        {onShowAllProducts && (
          <button
            onClick={onShowAllProducts}
            className="px-3 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[11px] font-bold hover:bg-orange-100 transition-colors"
          >
            View All Products
          </button>
        )}
      </div>

      {filteredCategories.length > 0 ? (
        <div className="px-4 grid grid-cols-3 gap-4 mb-7">
          {filteredCategories.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat)}
              className="group relative aspect-square rounded-[26px] overflow-hidden bg-white border border-orange-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white via-[#fffaf8] to-orange-50/80" />
              <div className="absolute top-0 right-0 w-14 h-14 rounded-full bg-orange-100/60 blur-xl" />

              <div className="relative h-full flex flex-col items-center justify-center px-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform mb-3 text-2xl">
                  {cat.icon || '◉'}
                </div>

                <span className="text-[11px] font-extrabold text-gray-800 text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>

                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-orange-500">
                  Explore
                </div>
              </div>

              {index < 3 && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-white border border-orange-100 text-[9px] font-bold text-orange-500 shadow-sm">
                  Top
                </div>
              )}
            </button>
          ))}
        </div>
      ) : searchTerm.trim() ? (
        <div className="mx-4 mb-7 rounded-[28px] bg-white border border-orange-100 shadow-sm px-5 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No categories found</h3>
          <p className="text-sm text-gray-500 mb-5">
            We couldn't find any categories matching "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-6 py-3 bg-orange-500 text-white font-bold rounded-2xl text-sm shadow-sm active:scale-95 transition-all"
          >
            Clear Search
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="mx-4 mb-7 rounded-[28px] bg-white border border-orange-100 shadow-sm px-5 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M6 12h12M9 17h6" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No categories available</h3>
          <p className="text-sm text-gray-500">
            The API returned no categories for this app.
          </p>
        </div>
      ) : null}

      <div className="px-4">
        <div className="rounded-[28px] overflow-hidden border border-orange-100 shadow-sm bg-white">
          <AdBanner
            
            onClick={onShowAllProducts}
            containerClass="h-[120px]"
          />
        </div>
      </div>

      {displayProducts.length > 0 && onProductClick && (
        <div className="mt-8">
          <div className="px-4 mb-3">
            <div className="rounded-[24px] bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 text-white shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-orange-100 font-bold">
                Recommended
              </p>
              <h3 className="text-lg font-extrabold mt-1">Suggested For You</h3>
              <p className="text-sm text-orange-100 mt-1">
                Hand-picked products based on what shoppers explore most
              </p>
            </div>
          </div>

          <ProductGrid
            title=""
            products={displayProducts}
            onProductClick={onProductClick}
          />
        </div>
      )}

      <div className="px-4 mt-10">
        <div className="rounded-[28px] bg-white border border-orange-100 shadow-sm px-5 py-8 text-center">
          <div className="w-14 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mx-auto mb-4" />
          <h4 className="text-lg font-extrabold text-gray-900">Need something special?</h4>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
            Browse all products and discover new arrivals, featured items and daily offers.
          </p>

          {onShowAllProducts && (
            <button
              onClick={onShowAllProducts}
              className="mt-5 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              Explore All Products
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesView;
