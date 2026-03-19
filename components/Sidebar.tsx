import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { Category } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: Category) => void;
}

type SidebarPage = 'menu' | 'about' | 'privacy' | 'terms';

// Default icons fallback
const getDefaultIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();

  if (name.includes('phone') || name.includes('simu')) return '◉';
  if (name.includes('tv') || name.includes('television')) return '▣';
  if (name.includes('sound') || name.includes('sauti')) return '◌';
  if (name.includes('camera') || name.includes('kamera')) return '◍';
  if (name.includes('laptop') || name.includes('kompyuta')) return '▤';
  if (name.includes('game') || name.includes('mchezo')) return '✦';
  if (name.includes('watch') || name.includes('saa')) return '◐';
  if (name.includes('home') || name.includes('nyumba')) return '⌂';
  if (name.includes('kitchen') || name.includes('jikoni')) return '◈';
  if (name.includes('car') || name.includes('gari')) return '▭';
  if (name.includes('health') || name.includes('afya')) return '✚';
  if (name.includes('book') || name.includes('kitabu')) return '▥';
  if (name.includes('fashion') || name.includes('mitindo')) return '◇';
  if (name.includes('all') || name.includes('zote')) return '◎';
  if (name.includes('electronics') || name.includes('umeme')) return '⎓';
  if (name.includes('accessories') || name.includes('vifaa')) return '◔';

  return '◎';
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onCategorySelect
}) => {
  const [currentPage, setCurrentPage] = useState<SidebarPage>('menu');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from API with ?app=electronics
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen || categories.length > 0) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/categories?app=electronics', {
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data?.success) {
          const fetchedCategories = data.data || [];

          const transformedCategories = fetchedCategories.map((cat: any) => {
            const backendIcon = cat.icon || cat.icon_name || cat.icon_emoji;

            return {
              id: String(cat.id || cat._id || ''),
              name: String(cat.name || cat.category_name || 'Unnamed'),
              icon: backendIcon || getDefaultIcon(cat.name || ''),
              ...cat
            } as Category;
          });

          setCategories(transformedCategories);
        } else {
          throw new Error(data?.error || 'Invalid response format from backend');
        }
      } catch (error: any) {
        console.error('Sidebar error:', error);
        setError(error.message || 'Failed to load categories from server');
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [isOpen, categories.length]);

  const handlePageChange = (page: SidebarPage) => {
    setCurrentPage(page);
  };

  const closeSidebar = () => {
    setCurrentPage('menu');
    onClose();
  };

  const renderMenu = () => (
    <div className="animate-fadeIn relative">
      {/* Background color sheds for menu */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-amber-200/30 to-yellow-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-orange-100/20 via-amber-100/20 to-orange-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Category section with Alibaba-style header */}
        <div className="px-5 pt-5 pb-3">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Background sheds for header */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl" />
            
            <div className="relative p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-orange-100">
                Baraka Sonko Menu
              </p>
              <h3 className="text-lg font-extrabold text-white mt-1">Browse Categories</h3>
              <p className="text-xs text-orange-100 mt-1">
                Electronics, home appliances and featured collections
              </p>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/5 rounded-full" />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
          Shop Categories
          <span className="text-[10px] font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full ml-auto">
            {categories.length}
          </span>
        </div>

        {isLoading ? (
          <div className="px-4 py-12 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-amber-50/30 rounded-full blur-3xl" />
            <div className="relative w-12 h-12 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-semibold text-gray-500">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-orange-50/30 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <p className="text-xs font-bold text-gray-700 mb-2">Failed to load categories</p>
              <p className="text-xs text-gray-400">{error}</p>
              <button
                onClick={() => {
                  setCategories([]);
                  setError(null);
                }}
                className="mt-4 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
              >
                Retry
              </button>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-8 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-100/30 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 text-xl">
                ○
              </div>
              <p className="text-xs font-bold text-gray-700">No categories available</p>
              <p className="text-xs text-gray-400 mt-1">Please check backend connection</p>
            </div>
          </div>
        ) : (
          <div className="px-4 grid grid-cols-3 gap-3 mb-8 relative">
            {/* Background glow for grid */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-amber-100/20 rounded-3xl blur-2xl" />
            
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat)}
                className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-orange-100/50 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 group hover:border-orange-300 overflow-hidden"
              >
                {/* Background shed for each category card */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-amber-50/0 group-hover:from-orange-50/60 group-hover:to-amber-50/60 transition-all duration-500" />
                
                {/* Top category indicator */}
                {index < 3 && (
                  <div className="absolute -top-1 -right-1">
                    <div className="relative">
                      <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-[8px] text-white font-black">#{index + 1}</span>
                      </div>
                      <div className="absolute inset-0 bg-orange-400 rounded-full blur-sm animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Icon container */}
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200/50 flex items-center justify-center text-orange-600 text-lg font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                  <span className="relative z-10">{cat.icon || getDefaultIcon(cat.name)}</span>
                  
                  {/* Icon glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Category name */}
                <span className="relative text-[10px] font-semibold text-gray-700 text-center leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors z-10">
                  {cat.name}
                </span>

                {/* Hover shine effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000" />
              </button>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] border-t border-orange-100/50 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          Information
        </div>

        <ul className="px-4 space-y-3 pb-6 relative">
          {/* Background sheds for info section */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-50/30 to-transparent pointer-events-none" />
          
          <li
            onClick={() => handlePageChange('about')}
            className="relative flex items-center gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-orange-100/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            {/* Background shed */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-50/0 to-amber-50/0 group-hover:from-orange-50/60 group-hover:to-amber-50/60 transition-all duration-500" />
            
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div className="relative">
              <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">About Baraka Sonko</p>
              <p className="text-xs text-gray-400">Store profile and brand details</p>
            </div>
            
            {/* Arrow indicator */}
            <div className="absolute right-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>

          <li
            onClick={() => handlePageChange('privacy')}
            className="relative flex items-center gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-orange-100/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-50/0 to-amber-50/0 group-hover:from-orange-50/60 group-hover:to-amber-50/60 transition-all duration-500" />
            
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="relative">
              <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">Privacy Policy</p>
              <p className="text-xs text-gray-400">How customer information is handled</p>
            </div>
            
            <div className="absolute right-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>

          <li
            onClick={() => handlePageChange('terms')}
            className="relative flex items-center gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-orange-100/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-50/0 to-amber-50/0 group-hover:from-orange-50/60 group-hover:to-amber-50/60 transition-all duration-500" />
            
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="relative">
              <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">Terms of Service</p>
              <p className="text-xs text-gray-400">Rules for orders, payments and returns</p>
            </div>
            
            <div className="absolute right-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="relative animate-fadeIn p-6 min-h-full">
      {/* Background sheds for about page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-amber-200/30 to-yellow-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-amber-500 rounded-full" />
          <h3 className="text-xl font-black text-gray-900">About Baraka Sonko</h3>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p className="font-medium bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-orange-100/50">
            Welcome to <span className="text-orange-600 font-bold">Baraka Sonko Electronics</span>. We focus on electronics,
            home appliances, and reliable products for customers in Tanzania and beyond.
          </p>
          
          <p className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-orange-100/50">
            Our goal is to provide quality devices with a modern shopping experience, professional presentation,
            and trusted service.
          </p>
          
          <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl" />
            
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-100 mb-2">
                Store Focus
              </p>
              <p className="text-sm font-semibold text-white">
                Electronics, home appliances, gadgets and featured collections
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="relative animate-fadeIn p-6 min-h-full">
      {/* Background sheds for privacy page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
          <h3 className="text-xl font-black text-gray-900">Privacy Policy</h3>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-blue-100/50">
            At Baraka Sonko Electronics, we value your privacy and handle customer information with care.
          </p>
          
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-blue-100/50">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              1. Data Collection
            </h4>
            <p>We collect only the information needed for orders, delivery, and communication.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-blue-100/50">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              2. Information Usage
            </h4>
            <p>Your information is used to process purchases, provide updates, and improve customer experience.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-blue-100/50">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              3. Data Protection
            </h4>
            <p>We apply reasonable security measures to protect personal and order-related information.</p>
          </div>
          
          <p className="text-[10px] text-gray-400 italic pt-2">Last updated: May 2025</p>
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="relative animate-fadeIn p-6 min-h-full">
      {/* Background sheds for terms page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-yellow-200/20 to-amber-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          <h3 className="text-xl font-black text-gray-900">Terms of Service</h3>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-amber-100/50">
            By using Baraka Sonko Electronics, you agree to the terms and conditions below.
          </p>
          
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-amber-100/50">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              1. Ordering
            </h4>
            <p>All orders are subject to product availability and confirmation.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-amber-100/50">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              2. Payment
            </h4>
            <p>Orders are processed after payment is confirmed through the available payment methods.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-amber-100/50">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              3. Delivery
            </h4>
            <p>Delivery timelines are estimates and may vary depending on location and logistics.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-amber-100/50">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              4. Returns
            </h4>
            <p>Customers should report defective or incorrect items within the allowed return period.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[330px] bg-gradient-to-br from-white to-orange-50/30 z-[70] transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Background sheds for entire sidebar */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/20 to-yellow-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-orange-100/10 via-amber-100/10 to-orange-100/10 rounded-full blur-3xl" />
        </div>

        {/* Sidebar header */}
        <div className="relative px-5 pt-5 pb-4 bg-white/80 backdrop-blur-sm border-b border-orange-100/50 z-10">
          {currentPage !== 'menu' && (
            <button
              onClick={() => handlePageChange('menu')}
              className="mb-4 w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 text-orange-600 active:scale-95 transition-transform shadow-lg hover:shadow-xl"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
                  {/* Logo glow */}
                  <div className="absolute inset-0 bg-orange-500 rounded-2xl blur-md opacity-50" />
                  <svg className="relative z-10" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                    <path d="M5 9v6" />
                    <path d="M9 7v10" />
                    <path d="M13 10v4" />
                    <path d="M17 6v12" />
                  </svg>
                </div>

                <div>
                  <div className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {currentPage === 'menu' ? 'BARAKA SONKO' : 'SONKO INFO'}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 block">
                    {currentPage === 'menu' ? `${categories.length} Categories` : 'Details'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={closeSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-orange-100/50 text-gray-400 text-2xl font-light active:scale-95 transition-transform shadow-lg hover:shadow-xl hover:text-orange-500"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="relative flex-grow overflow-y-auto no-scrollbar z-10">
          {currentPage === 'menu' && renderMenu()}
          {currentPage === 'about' && renderAbout()}
          {currentPage === 'privacy' && renderPrivacy()}
          {currentPage === 'terms' && renderTerms()}
        </div>

        {/* Footer */}
        <div className="relative px-6 py-5 border-t border-orange-100/50 bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Baraka Sonko
            </p>
            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-semibold">
              Electronics and home appliance store
            </p>
            <p className="text-[9px] text-gray-400 mt-4 uppercase font-bold tracking-tight">
              © 2025 Baraka Sonko Electronics
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
