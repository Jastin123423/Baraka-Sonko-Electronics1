import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { Product } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onSearch: (query: string) => void;
  initialValue?: string;
  onProductSelect?: (product: Product) => void;
  onBarakasonkoClick?: () => void;
  onSonkoClick?: () => void;
}

interface SearchSuggestion {
  id: string;
  title: string;
  name?: string;
  image?: string;
  price?: number;
  category_name?: string;
  category_id?: string;
  description?: string;
  sellingPrice?: number;
  original_price?: number;
  discount?: number;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onSearch,
  initialValue = '',
  onProductSelect,
  onBarakasonkoClick,
  onSonkoClick
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTopTab, setActiveTopTab] = useState<'ai' | 'products' | 'manufacturers'>('products');
  const [activeInsideTab, setActiveInsideTab] = useState<'sonko' | 'baraka'>('sonko');

  const searchRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMicrophone = (product: SearchSuggestion): boolean => {
    const title = (product.title || product.name || '').toLowerCase();
    const category = (product.category_name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();

    const micKeywords = ['mic', 'microphone', 'maikrofoni', 'wireless mic', 'shure', 'mic wireless'];
    const excludeKeywords = ['mic cable', 'mic stand', 'mic holder', 'wire', 'cable', 'stand', 'adapter'];

    const hasMicKeyword = micKeywords.some(keyword =>
      title.includes(keyword) || category.includes(keyword) || description.includes(keyword)
    );

    const shouldExclude = excludeKeywords.some(keyword =>
      title.includes(keyword) || category.includes(keyword) || description.includes(keyword)
    );

    const isMicCategory = product.category_id === "3" || category.includes('mic');

    return (hasMicKeyword && !shouldExclude) || isMicCategory;
  };

  const filterSuggestions = (products: SearchSuggestion[], searchQuery: string): SearchSuggestion[] => {
    const query_lower = searchQuery.toLowerCase();

    return products.filter(product => {
      const title = (product.title || product.name || '').toLowerCase();
      const category = (product.category_name || '').toLowerCase();

      if (query_lower === 'mic' || query_lower === 'microphone' || query_lower === 'maikrofoni') {
        return isMicrophone(product);
      }

      return title.includes(query_lower) || category.includes(query_lower);
    });
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);

        const response = await fetch(
          `https://barakasonko.store/api/products?search=${encodeURIComponent(trimmedQuery)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const filteredResults = filterSuggestions(data.data, trimmedQuery);
          setSuggestions(filteredResults);
        } else {
          setSuggestions([]);
        }

        setShowSuggestions(true);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title || suggestion.name || '');
    setShowSuggestions(false);

    if (onProductSelect) {
      const product: Product = {
        id: suggestion.id,
        name: suggestion.title || suggestion.name || 'Unknown Product',
        title: suggestion.title || suggestion.name,
        price: suggestion.price || suggestion.sellingPrice || 0,
        sellingPrice: suggestion.sellingPrice || suggestion.price,
        original_price: suggestion.original_price,
        discount: suggestion.discount,
        image: suggestion.image,
        category: suggestion.category_name || 'General',
        category_name: suggestion.category_name,
        description: suggestion.description,
        images: [suggestion.image].filter(Boolean),
      } as Product;

      onProductSelect(product);
    }
  };

  const topTabs = [
    { id: 'ai', label: 'AI Mode' },
    { id: 'products', label: 'Products' },
    { id: 'manufacturers', label: 'Manufacturers' },
  ] as const;

  const insideTabs = [
    {
      id: 'sonko',
      label: 'Ndani ya Baraka Sonko Electronics',
      badge: 'Studio & Audio',
    },
    {
      id: 'baraka',
      label: 'Ndani ya Baraka Sonko',
      badge: 'Store & Deals',
    },
  ] as const;

  const handleInsideTabClick = (tabId: 'sonko' | 'baraka') => {
    setActiveInsideTab(tabId);

    if (tabId === 'baraka' && onBarakasonkoClick) {
      onBarakasonkoClick();
    } else if (tabId === 'sonko' && onSonkoClick) {
      onSonkoClick();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <style>{`
        @keyframes brandFloatExplore {
          0% {
            transform: translateX(0px) translateY(0px) rotate(0deg) scale(1);
          }
          20% {
            transform: translateX(4px) translateY(-2px) rotate(3deg) scale(1.04);
          }
          45% {
            transform: translateX(10px) translateY(-5px) rotate(6deg) scale(1.08);
          }
          65% {
            transform: translateX(5px) translateY(-2px) rotate(2deg) scale(1.03);
          }
          100% {
            transform: translateX(0px) translateY(0px) rotate(0deg) scale(1);
          }
        }

        @keyframes brandGlow {
          0%, 100% {
            box-shadow: 0 0 0 rgba(255,255,255,0.0);
            opacity: 0.92;
          }
          50% {
            box-shadow: 0 0 22px rgba(255,255,255,0.35);
            opacity: 1;
          }
        }

        @keyframes orbitRing {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 0.45;
          }
          50% {
            transform: rotate(180deg) scale(1.06);
            opacity: 0.9;
          }
          100% {
            transform: rotate(360deg) scale(1);
            opacity: 0.45;
          }
        }

        @keyframes fadeInSoft {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-brand-b {
          animation: brandFloatExplore 2.8s ease-in-out infinite, brandGlow 2.8s ease-in-out infinite;
          transform-origin: center;
        }

        .animate-brand-ring {
          animation: orbitRing 3.6s linear infinite;
          transform-origin: center;
        }

        .animate-fadeIn {
          animation: fadeInSoft 0.2s ease-out;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 px-3 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 p-2 rounded-full bg-white/15 text-white hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Menu"
          >
            <ICONS.Menu />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-white to-orange-50" />

              <div className="absolute inset-[5px] rounded-[16px] border border-orange-200/70 animate-brand-ring" />
              <div className="absolute inset-[9px] rounded-[14px] border border-orange-300/60 animate-brand-ring" style={{ animationDelay: '-1.2s' }} />

              <div className="relative z-10 animate-brand-b">
                <span className="text-orange-600 font-black text-[28px] leading-none tracking-tight select-none">
                  B
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-white font-extrabold text-[17px] leading-tight tracking-tight truncate">
                Baraka Sonko Electronics
              </p>
              <p className="text-orange-100 text-[11px] leading-tight font-medium truncate">
                Professional Audio, Electronics & Smart Shopping App
              </p>
            </div>
          </div>

          <div className="ml-auto flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 shadow-md bg-white">
              <img
                src="https://flagcdn.com/w40/tz.png"
                alt="Tanzania"
                className="w-full h-full object-cover scale-150"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 relative" ref={searchRef}>
          <div className="flex items-center bg-white rounded-full overflow-hidden border border-orange-100 shadow-sm focus-within:ring-2 focus-within:ring-white/40">
            <button
              className="pl-4 pr-2 text-orange-500 hover:text-orange-600 transition-colors"
              onClick={() => {
                onSearch(query);
                setShowSuggestions(false);
              }}
              aria-label="Search"
            >
              <ICONS.Search />
            </button>

            <input
              type="text"
              placeholder="Search Baraka Sonko Electronics products..."
              className="w-full bg-transparent border-none py-3 px-1 text-sm outline-none placeholder-gray-400 font-medium text-gray-800"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
              aria-label="Search products"
              autoComplete="off"
            />

            {query && !isLoading && (
              <button
                onClick={() => {
                  setQuery('');
                  onSearch('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="pr-3 text-gray-400 text-lg hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}

            {isLoading && (
              <div className="pr-4">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50 animate-fadeIn">
              <div className="py-2">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50/60 transition-colors flex items-center gap-3"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title || product.name}
                        className="w-12 h-12 object-cover rounded-xl border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Product';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        <ICONS.Product className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 line-clamp-2 text-sm">
                        {product.title || product.name}
                      </p>

                      {product.price && (
                        <p className="text-sm text-orange-600 font-bold mt-1">
                          TSh {product.price.toLocaleString()}
                        </p>
                      )}

                      {product.category_name && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {product.category_name}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => {
                    onSearch(query);
                    setShowSuggestions(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                >
                  View all results for "{query}"
                </button>
              </div>
            </div>
          )}

          {showSuggestions && query.trim().length >= 2 && !isLoading && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fadeIn">
              <div className="px-4 py-8 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ICONS.Search className="w-6 h-6 text-orange-300" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">No products found</p>
                <p className="text-sm text-gray-400">Try different keywords</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-b border-gray-100">
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-7 px-4 min-w-max">
            {topTabs.map((tab) => {
              const isActive = activeTopTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTopTab(tab.id)}
                  className={`relative py-3 text-[15px] font-semibold transition-colors ${
                    isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute left-0 right-0 bottom-0 h-[3px] rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-[#fffaf5] border-b border-orange-100 px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {insideTabs.map((tab) => {
            const isActive = activeInsideTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleInsideTabClick(tab.id)}
                className={`relative min-w-max rounded-2xl px-4 py-2.5 text-left transition-all border ${
                  isActive
                    ? 'bg-white border-orange-200 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tab.id === 'sonko' ? 'bg-orange-500' : 'bg-gray-700'
                    }`}
                  />
                  <span className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {tab.label}
                  </span>
                </div>
                <p className={`mt-0.5 text-[11px] ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                  {tab.badge}
                </p>

                {isActive && (
                  <span className="absolute inset-x-4 -bottom-[6px] h-[3px] rounded-full bg-orange-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;
