import React, { useState, useEffect } from 'react';
import { COLORS, CATEGORIES } from '../constants';
import { Category } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: Category) => void;
  categories?: Category[]; // Optional: if not provided, Sidebar will fetch its own
}

type SidebarPage = 'menu' | 'about' | 'privacy' | 'terms';

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onCategorySelect,
  categories: propCategories 
}) => {
  const [currentPage, setCurrentPage] = useState<SidebarPage>('menu');
  const [categories, setCategories] = useState<Category[]>(propCategories || []);
  const [isLoading, setIsLoading] = useState(!propCategories);

  // If categories are not passed as props, fetch them
  useEffect(() => {
    const fetchCategories = async () => {
      // If categories are already passed as props, use them
      if (propCategories && propCategories.length > 0) {
        setCategories(propCategories);
        return;
      }
      
      // Otherwise fetch from backend
      try {
        setIsLoading(true);
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (data?.success) {
          setCategories(data.data || []);
        } else {
          console.error('Failed to fetch categories:', data?.error);
          // Fallback to hardcoded categories if fetch fails
          setCategories(CATEGORIES);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to hardcoded categories
        setCategories(CATEGORIES);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [isOpen, propCategories]);

  const handlePageChange = (page: SidebarPage) => {
    setCurrentPage(page);
  };

  const closeSidebar = () => {
    setCurrentPage('menu');
    onClose();
  };

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string): string => {
    // Try to find matching icon from hardcoded CATEGORIES
    const hardcodedCat = CATEGORIES.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (hardcodedCat) return hardcodedCat.icon;
    
    // Default icons based on category name
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
    
    return '🛒'; // Default shopping icon
  };

  const renderMenu = () => (
    <div className="animate-fadeIn">
      {/* Categories Grid */}
      <div className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">
        Shop Categories
      </div>
      
      {isLoading ? (
        <div className="px-4 py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No categories found</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-3 gap-3 mb-8">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 border border-gray-100 active:scale-95 transition-all group cursor-pointer hover:border-orange-200 hover:bg-orange-50"
              onClick={() => onCategorySelect(cat)}
            >
              <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">
                {getCategoryIcon(cat.name)}
              </span>
              <span className="text-[10px] font-bold text-gray-700 text-center leading-tight group-hover:text-orange-700">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Info Sections */}
      <div className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] border-t border-gray-50">
        Company Information
      </div>
      <ul className="px-4 space-y-2">
        <li 
          onClick={() => handlePageChange('about')}
          className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer hover:border-blue-200"
        >
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <span className="text-sm font-bold text-gray-700">About Baraka Sonko</span>
        </li>
        <li 
          onClick={() => handlePageChange('privacy')}
          className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer hover:border-green-200"
        >
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span className="text-sm font-bold text-gray-700">Privacy Policy</span>
        </li>
        <li 
          onClick={() => handlePageChange('terms')}
          className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer hover:border-orange-200"
        >
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <span className="text-sm font-bold text-gray-700">Terms of Service</span>
        </li>
      </ul>
    </div>
  );

  const renderAbout = () => (
    <div className="animate-fadeIn p-6">
      <h3 className="text-xl font-black text-gray-900 mb-4">About Us</h3>
      <div className="prose prose-sm text-gray-600 space-y-4">
        <p className="font-medium leading-relaxed">
          Welcome to <span className="text-orange-600 font-bold">Baraka Sonko Electronics</span>. 
          We are a premier electronics retailer based in <span className="font-bold text-gray-800">Masika, Morogoro, Tanzania</span>.
        </p>
        <p className="leading-relaxed">
          Our mission is to bring high-quality, reliable, and affordable electronic solutions to our community and beyond. 
          From the latest mobile devices to professional sound equipment and home appliances, 
          we curate our catalog with a strict focus on durability and performance.
        </p>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Our Location</p>
          <p className="text-sm font-bold text-gray-800">Masika, Morogoro, Tanzania</p>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="animate-fadeIn p-6">
      <h3 className="text-xl font-black text-gray-900 mb-4">Privacy Policy</h3>
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>At Baraka Sonko Electronics, we value your privacy. This policy outlines how we handle your information.</p>
        <div>
          <h4 className="font-bold text-gray-800 mb-1">1. Data Collection</h4>
          <p>We collect information necessary for order fulfillment, including name, phone number, and delivery address.</p>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 mb-1">2. Information Usage</h4>
          <p>Your data is used solely to process transactions, communicate order updates, and improve our services.</p>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 mb-1">3. Data Protection</h4>
          <p>We implement robust security measures to ensure your personal information remains confidential and protected.</p>
        </div>
        <p className="text-[10px] text-gray-400 mt-6 italic">Last updated: May 2025</p>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="animate-fadeIn p-6">
      <h3 className="text-xl font-black text-gray-900 mb-4">Terms of Service</h3>
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>By using our website, you agree to the following terms and conditions.</p>
        <div>
          <h4 className="font-bold text-gray-800 mb-1">1. Ordering</h4>
          <p>All orders placed on barasonko.store are subject to availability and confirmation of price.</p>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 mb-1">2. Payment</h4>
          <p>We accept various payment methods. Goods will only be dispatched once payment is confirmed.</p>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 mb-1">3. Delivery</h4>
          <p>Delivery times are estimates. We strive to deliver within the promised timeframe but are not liable for external delays.</p>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 mb-1">4. Returns</h4>
          <p>Defective items must be reported within 24 hours of receipt for return processing.</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeSidebar}
      />
      
      <div 
        className={`fixed top-0 left-0 h-full w-[300px] bg-white z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Dynamic Header */}
        <div className="p-5 border-b border-gray-100 flex items-center bg-gray-50/50">
          {currentPage !== 'menu' && (
            <button 
              onClick={() => handlePageChange('menu')}
              className="mr-4 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-600 active:scale-90 transition-transform hover:bg-gray-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          <div className="flex flex-col flex-grow">
            <div className="text-xl font-black italic tracking-tighter leading-none" style={{ color: COLORS.primary }}>
              {currentPage === 'menu' ? 'BARAKA SONKO' : 'SONKO INFO'}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {currentPage === 'menu' ? `${categories.length} Categories` : 'Details'}
            </span>
          </div>
          <button 
            onClick={closeSidebar} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 text-2xl font-light shadow-sm active:scale-90 transition-transform hover:bg-gray-50"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto no-scrollbar">
          {currentPage === 'menu' && renderMenu()}
          {currentPage === 'about' && renderAbout()}
          {currentPage === 'privacy' && renderPrivacy()}
          {currentPage === 'terms' && renderTerms()}
        </div>

        {/* Persistent Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-black text-gray-800 tracking-wider uppercase">Official Store</span>
            <a 
              href="https://barasonko.store" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[15px] font-black text-orange-600 mt-1 hover:underline flex items-center"
            >
              barasonko.store
              <svg className="ml-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
            <p className="text-[9px] text-gray-400 mt-5 uppercase font-bold tracking-tighter">© 2025 BARAKA SONKO ELECTRONICS</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
