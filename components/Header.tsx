
import React, { useState, useEffect } from 'react';
import { ICONS, COLORS } from '../constants';

interface HeaderProps {
  onMenuClick: () => void;
  onSearch: (query: string) => void;
  initialValue?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onSearch, initialValue = '' }) => {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    // Real-time search if needed, or just keep state
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      {/* Search bar section - Ali/Kikuu style */}
      <div className="px-3 py-3 flex items-center space-x-3">
        <button onClick={onMenuClick} className="p-1 text-gray-600 active:bg-gray-100 rounded transition-colors">
          <ICONS.Menu />
        </button>
        <div className="relative flex-grow flex items-center bg-gray-100 rounded-full overflow-hidden border border-gray-200 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
          <div 
            className="pl-3 text-gray-400 cursor-pointer active:scale-90 transition-transform"
            onClick={() => onSearch(query)}
          >
            <ICONS.Search />
          </div>
          <input 
            type="text" 
            placeholder="Search phones, speakers..."
            className="w-full bg-transparent border-none py-2 px-3 text-sm outline-none placeholder-gray-400 font-medium"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); onSearch(''); }}
              className="pr-3 text-gray-400 text-lg hover:text-gray-600"
            >
              &times;
            </button>
          )}
        </div>
        {/* Replaced cart button with circular country flag */}
        <div className="flex-shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 shadow-sm">
            <img 
              src="https://flagcdn.com/w40/tz.png" 
              alt="TZ" 
              className="w-full h-full object-cover scale-150"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
