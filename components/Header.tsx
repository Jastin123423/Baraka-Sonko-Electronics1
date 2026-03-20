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

    const isMicCategory = product.category_id === '3' || category.includes('mic');

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
      label: 'Sonko Sound',
      badge: 'Studio & Audio',
      type: 'sonko',
    },
    {
      id: 'baraka',
      label: 'Baraka Sonko',
      badge: 'Store & Deals',
      type: 'baraka',
    },
  ] as const;

  const handleInsideTabClick = (tabId: 'sonko' | 'baraka') => {
    setActiveInsideTab(tabId);

    if (tabId === 'baraka') {
      // Navigate to Baraka Sonko store
      if (onBarakasonkoClick) {
        onBarakasonkoClick();
      } else {
        window.location.href = 'https://barakasonko.store';
      }
    } else if (tabId === 'sonko') {
      if (onSonkoClick) {
        onSonkoClick();
      } else {
        // Navigate to Sonko Sound page (stay on current site but could also be external)
        window.location.href = 'https://sonkosound.barakasonko.store';
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <style>{`
        @keyframes soundPulse {
          0% { transform: scale(1); opacity: 0.65; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 0.65; }
        }

        @keyframes barDance {
          0% { transform: scaleY(0.45); }
          50% { transform: scaleY(1); }
          100% { transform: scaleY(0.45); }
        }

        @keyframes fadeInSoft {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes miniFloat {
          0% { transform: translateX(0px) translateY(0px) scale(1); }
          25% { transform: translateX(2px) translateY(-1px) scale(1.03); }
          50% { transform: translateX(4px) translateY(-2px) scale(1.06); }
          75% { transform: translateX(2px) translateY(-1px) scale(1.03); }
          100% { transform: translateX(0px) translateY(0px) scale(1); }
        }

        @keyframes miniGlow {
          0%, 100% {
            opacity: 0.92;
            filter: drop-shadow(0 0 0 rgba(249,115,22,0));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(249,115,22,0.3));
          }
        }

        .animate-sound-pulse {
          animation: soundPulse 1.6s ease-in-out infinite;
        }

        .eq-bar-1 { animation: barDance 0.85s ease-in-out infinite; transform-origin: bottom; }
        .eq-bar-2 { animation: barDance 1.05s ease-in-out infinite; transform-origin: bottom; }
        .eq-bar-3 { animation: barDance 0.95s ease-in-out infinite; transform-origin: bottom; }

        .animate-mini-icon {
          animation: miniFloat 2.6s ease-in-out infinite, miniGlow 2.6s ease-in-out infinite;
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

      {/* Top branding + search row */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 px-3 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 p-2 rounded-full bg-white/15 text-white hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Menu"
          >
            <ICONS.Menu />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-shrink-0 w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-white" />
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative flex items-end gap-[3px] h-5 mr-1">
                  <span className="eq-bar-1 w-[3px] h-3 rounded-full bg-orange-500" />
                  <span className="eq-bar-2 w-[3px] h-5 rounded-full bg-orange-600" />
                  <span className="eq-bar-3 w-[3px] h-4 rounded-full bg-orange-500" />
                </div>

                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-orange-500 shadow-sm" />
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-2 border-r-2 border-t-2 border-orange-400 rotate-45 rounded-sm animate-sound-pulse" />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-white font-extrabold text-[17px] leading-tight tracking-tight">
                Sonko Sound
              </p>
              <p className="text-orange-100 text-[11px] leading-tight font-medium truncate">
                Professional Audio & Smart Shopping
              </p>
            </div>
          </div>

          {/* Country flag */}
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

        {/* Search */}
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
              placeholder="Search Sonko Sound products..."
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

          {/* Suggestions */}
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

      {/* Main tabs like Alibaba */}
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

      {/* Ndani ya Sonko Sound / Ndani ya Baraka Sonko row - redesigned as buttons */}
      <div className="bg-[#fffaf5] border-b border-orange-100 px-3 py-3">
        <div className="flex items-center gap-2 justify-center">
          {insideTabs.map((tab) => {
            const isActive = activeInsideTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleInsideTabClick(tab.id)}
                className={`relative flex-1 max-w-[200px] px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white border-2 border-orange-200 shadow-lg'
                    : 'bg-white/80 border border-orange-100 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  {tab.type === 'sonko' ? (
                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 via-white to-orange-50 flex items-center justify-center overflow-hidden">
                      <div className="relative z-10 flex items-center justify-center animate-mini-icon">
                        <div className="relative flex items-end gap-[2px] h-3.5 mr-1">
                          <span className="eq-bar-1 w-[2px] h-2 rounded-full bg-orange-500" />
                          <span className="eq-bar-2 w-[2px] h-3.5 rounded-full bg-orange-600" />
                          <span className="eq-bar-3 w-[2px] h-2.5 rounded-full bg-orange-500" />
                        </div>
                        <div className="relative">
                          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
                          <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-r-2 border-t-2 border-orange-400 rotate-45 rounded-sm animate-sound-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 via-white to-orange-50 flex items-center justify-center overflow-hidden">
                      <div className="relative z-10 animate-mini-icon">
                        <span className="text-orange-600 font-black text-[20px] leading-none select-none">
                          B
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-left">
                    <p className={`text-sm font-extrabold tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {tab.label}
                    </p>
                    <p className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                      {tab.badge}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <span className="absolute left-4 right-4 -bottom-[6px] h-[3px] rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />
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
