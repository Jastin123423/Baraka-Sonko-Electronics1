import React from 'react';
import { ICONS, COLORS } from '../constants';

interface BottomNavProps {
  currentView: 'home' | 'categories' | 'admin' | 'all-products' | 'search-results';
  onViewChange: (view: 'home' | 'categories' | 'admin' | 'all-products' | 'search-results') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {

  const navItems = [
    { id: 'home', label: 'Home', icon: <ICONS.Home /> },
    { id: 'categories', label: 'Categories', icon: <ICONS.List /> },
    { id: 'all-products', label: 'Products', icon: <ICONS.Products />, center: true },
    { id: 'search-results', label: 'Search', icon: <ICONS.Search /> },
    { id: 'admin', label: 'Account', icon: <ICONS.User /> },
  ] as const;

  return (
    <div className="fixed bottom-3 left-0 w-full z-50 flex justify-center px-3">
      {/* Floating container */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-orange-100 shadow-xl rounded-3xl px-2 py-2 flex justify-between items-center">

        {navItems.map((item) => {
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                isActive ? 'scale-105' : 'opacity-70'
              }`}
            >
              {/* Active background */}
              {isActive && !item.center && (
                <div className="absolute inset-0 bg-orange-50 rounded-2xl" />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 ${
                  item.center
                    ? 'w-12 h-12 rounded-2xl flex items-center justify-center shadow-md'
                    : 'mb-0.5'
                }`}
                style={
                  item.center
                    ? {
                        background: 'linear-gradient(135deg, #ff7a00, #ff5e00)',
                        color: 'white',
                      }
                    : { color: isActive ? COLORS.primary : '#9ca3af' }
                }
              >
                {item.icon}

                {/* Admin status dot */}
                {item.id === 'admin' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Label */}
              {!item.center && (
                <span
                  className={`text-[10px] font-semibold mt-0.5 ${
                    isActive ? 'text-orange-600' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              )}

              {/* Center label */}
              {item.center && (
                <span className="text-[10px] font-bold text-orange-600 mt-1">
                  Bidhaa
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
