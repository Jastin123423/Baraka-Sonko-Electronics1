import React, { useState, useEffect } from 'react';
import { Category } from '../types';

interface CategorySectionProps {
  onCategorySelect: (category: Category) => void;
  onMore: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ onCategorySelect, onMore }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/categories?app=sound', {
          headers: { Accept: 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // Transform API data to match Category type
          const fetchedCategories = data.data.map((cat: any) => ({
            id: String(cat.id || cat._id),
            name: String(cat.name || cat.category_name || cat.title || ''),
            icon: cat.icon || cat.icon_name || cat.icon_emoji || getDefaultIcon(cat.name || ''),
          }));
          
          setCategories(fetchedCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Default icon helper (fallback if API doesn't provide icons)
  const getDefaultIcon = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('elect')) return '⚡';
    if (n.includes('phone')) return '📱';
    if (n.includes('tv')) return '📺';
    if (n.includes('sound') || n.includes('audio')) return '🔊';
    if (n.includes('access')) return '🎧';
    if (n.includes('home')) return '🏠';
    return '📦';
  };

  // Show first 10 categories for home section
  const displayCategories = categories.slice(0, 10);

  // Loading skeleton with Alibaba colors
  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 py-8 overflow-hidden">
        {/* Background sheds */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="px-4 mb-4">
            <div className="h-6 w-32 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full animate-pulse" />
          </div>
          <div className="flex overflow-x-auto no-scrollbar space-x-5 px-4 pb-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 w-[76px]">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100/50 to-amber-100/50 rounded-2xl animate-pulse shadow-sm" />
                <div className="mt-2 w-12 h-3 bg-orange-100/50 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no categories
  if (categories.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-br from-orange-50/20 via-white to-amber-50/20 py-8 border-b border-orange-100/20 overflow-hidden">
      {/* Alibaba-inspired background color sheds */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Warm orange shed - top right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/30 to-orange-300/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Golden amber shed - bottom left */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/30 to-yellow-200/20 rounded-full blur-3xl animate-pulse animation-delay-1000" />
        
        {/* Soft coral shed - center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-100/20 via-amber-100/20 to-yellow-100/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        
        {/* Additional accent sheds */}
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-orange-200/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-amber-200/20 rounded-full blur-2xl" />
        
        {/* Alibaba signature orange stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400" />
      </div>

      {/* Content - relative to appear above sheds */}
      <div className="relative z-10">
        {/* Section Header - Alibaba style */}
        <div className="px-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Alibaba-style decorative element */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-6 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
              <div className="w-1.5 h-4 bg-gradient-to-b from-amber-400 to-amber-500 rounded-full ml-0.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Shop by Category
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Find what you need
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-orange-100/50">
              {categories.length} categories
            </span>
            <button
              onClick={onMore}
              className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-orange-100/50 shadow-sm hover:shadow-md"
            >
              View All
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Categories Grid - Horizontal Scroll (Alibaba style) */}
        <div className="relative">
          {/* Gradient fade edges for scroll indication */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-x-auto no-scrollbar space-x-5 px-4 pb-2">
            {displayCategories.map((category, index) => (
              <div
                key={category.id}
                onClick={() => onCategorySelect(category)}
                className="flex flex-col items-center flex-shrink-0 w-[80px] group cursor-pointer"
              >
                {/* Icon Container - Modern card style with Alibaba colors */}
                <div className="relative w-[72px] h-[72px] bg-gradient-to-br from-white to-orange-50/50 rounded-2xl flex items-center justify-center mb-2.5 border border-orange-100/50 shadow-lg group-hover:shadow-xl group-hover:border-orange-200 transition-all duration-300 group-active:scale-95 backdrop-blur-sm">
                  {/* Background glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-amber-400/0 group-hover:from-orange-400/10 group-hover:to-amber-400/10 rounded-2xl transition-all duration-300" />
                  
                  {/* Icon */}
                  <span className="text-3xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 drop-shadow-sm">
                    {category.icon || '📦'}
                  </span>
                  
                  {/* Alibaba-style indicator for top categories */}
                  {index < 3 && (
                    <div className="absolute -top-2 -right-2">
                      <div className="relative">
                        <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          <span className="text-[8px] text-white font-black">TOP</span>
                        </div>
                        <div className="absolute inset-0 bg-orange-400 rounded-full blur-sm animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Animated dot for new categories */}
                  {index === 0 && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                      <div className="relative">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <span className="text-[11px] font-medium text-gray-600 text-center line-clamp-2 leading-tight px-1 group-hover:text-orange-500 transition-colors">
                  {category.name}
                </span>
              </div>
            ))}

            {/* More Button - Alibaba style */}
            <button
              onClick={onMore}
              className="flex flex-col items-center flex-shrink-0 w-[80px] group"
            >
              <div className="relative w-[72px] h-[72px] bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center mb-2.5 border-2 border-dashed border-orange-200/50 group-hover:border-orange-300 transition-all group-active:scale-95 backdrop-blur-sm">
                <div className="relative">
                  <span className="text-2xl font-black text-orange-400 group-hover:text-orange-500 transition-colors">
                    +
                  </span>
                  <span className="absolute -top-3 -right-3 min-w-[20px] h-5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center px-1 shadow-lg">
                    <span className="text-[8px] text-white font-black">
                      {Math.min(categories.length - 10, 99)}
                    </span>
                  </span>
                </div>

                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-orange-200/0 group-hover:border-orange-200/50 animate-pulse" />
              </div>
              <span className="text-[11px] font-medium text-gray-500 group-hover:text-orange-500 transition-colors">
                More
              </span>
            </button>
          </div>
        </div>

        {/* Quick Stats Row - Alibaba style with background sheds */}
        <div className="relative mt-6 px-4">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/20 via-amber-100/20 to-orange-100/20 rounded-2xl blur-xl" />
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-orange-100/30 shadow-sm">
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-medium text-gray-600">Fast Shipping</span>
              </div>
              <div className="w-px h-4 bg-orange-200/50" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse animation-delay-300" />
                <span className="text-[10px] font-medium text-gray-600">Official Store</span>
              </div>
              <div className="w-px h-4 bg-orange-200/50" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-600" />
                <span className="text-[10px] font-medium text-gray-600">Best Prices</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
      </div>
    </div>
  );
};

export default CategorySection;
