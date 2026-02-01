
import React from 'react';
import { CATEGORIES } from '../constants';
import { Category } from '../types';

interface CategorySectionProps {
  onCategorySelect: (category: Category) => void;
  onMore: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ onCategorySelect, onMore }) => {
  // Show first 8 categories for the home section to keep it clean
  const displayCategories = CATEGORIES.slice(0, 8);

  return (
    <div className="bg-white py-4 mb-2">
      <div className="flex overflow-x-auto no-scrollbar space-x-6 px-4">
        {displayCategories.map((cat) => (
          <div 
            key={cat.id} 
            className="flex flex-col items-center flex-shrink-0 w-[72px] active:scale-95 transition-transform cursor-pointer"
            onClick={() => onCategorySelect(cat)}
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-1.5 border-2 border-white shadow-md text-3xl">
              {cat.icon}
            </div>
            <span className="text-[11px] font-black text-gray-800 text-center tracking-tight truncate w-full">
              {cat.name}
            </span>
          </div>
        ))}
        {CATEGORIES.length > 8 && (
          <div 
            className="flex flex-col items-center flex-shrink-0 w-[72px] active:scale-95 transition-transform cursor-pointer"
            onClick={onMore}
          >
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-1.5 border-2 border-orange-100 shadow-md text-xl font-black text-orange-600">
              ...
            </div>
            <span className="text-[11px] font-black text-gray-800 text-center tracking-tight">
              More
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
