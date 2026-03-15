import React, { useState, useEffect, useRef } from 'react';
import { ICONS, COLORS } from '../constants';
import { Product } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onSearch: (query: string) => void;
  initialValue?: string;
  onProductSelect?: (product: Product) => void;
}

interface SearchSuggestion {
  id: string;
  name: string;
  type: 'product' | 'category';
  image?: string;
  price?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onSearch, 
  initialValue = '',
  onProductSelect 
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Ignore abort errors
        }
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
    const val = e.target.value;
    setQuery(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    
    if (suggestion.type === 'product' && onProductSelect) {
      // Navigate to product
      onProductSelect({ id: suggestion.id, name: suggestion.name } as Product);
    } else {
      // Search for category
      onSearch(suggestion.name);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      {/* Search bar section */}
      <div className="px-3 py-3 flex items-center space-x-3">
        <button 
          onClick={onMenuClick} 
          className="p-1 text-gray-600 active:bg-gray-100 rounded transition-colors"
          aria-label="Menu"
        >
          <ICONS.Menu />
        </button>
        
        <div className="relative flex-grow" ref={searchRef}>
          <div className="flex items-center bg-gray-100 rounded-full overflow-hidden border border-gray-200 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
            <button 
              className="pl-3 text-gray-400 hover:text-orange-500 transition-colors"
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
              placeholder="Search phones, speakers, electronics..."
              className="w-full bg-transparent border-none py-2.5 px-2 text-sm outline-none placeholder-gray-400 font-medium"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
              aria-label="Search products"
              autoComplete="off"
            />
            
            {query && (
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
              <div className="pr-3">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50 animate-fadeIn">
              <div className="py-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    {suggestion.type === 'product' ? (
                      <>
                        {suggestion.image ? (
                          <img 
                            src={suggestion.image} 
                            alt={suggestion.name} 
                            className="w-10 h-10 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <ICONS.Product className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{suggestion.name}</p>
                          {suggestion.price && (
                            <p className="text-sm text-orange-600 font-bold">
                              KSh {suggestion.price.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">Product</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
                          <ICONS.Category className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{suggestion.name}</p>
                          <p className="text-xs text-orange-500">Category</p>
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              
              {/* View all results */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => {
                    onSearch(query);
                    setShowSuggestions(false);
                  }}
                  className="w-full py-2 text-center text-sm font-medium text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                >
                  View all results for "{query}"
                </button>
              </div>
            </div>
          )}

          {/* No results state */}
          {showSuggestions && query.trim().length >= 2 && !isLoading && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-fadeIn">
              <div className="px-4 py-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ICONS.Search className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-700 font-medium mb-1">No products found</p>
                <p className="text-sm text-gray-400">Try different keywords</p>
              </div>
            </div>
          )}
        </div>

        {/* Country flag */}
        <div className="flex-shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 shadow-sm">
            <img 
              src="https://flagcdn.com/w40/tz.png" 
              alt="Tanzania" 
              className="w-full h-full object-cover scale-150"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
