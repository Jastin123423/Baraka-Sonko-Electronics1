// App.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import Header from './components/Header';
import QuickActions from './components/QuickActions';
import CategorySection from './components/CategorySection';
import FlashSale from './components/FlashSale';
import AdBanner from './components/AdBanner';
import ProductGrid from './components/ProductGrid';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import ProductDetailView from './components/ProductDetailView';
import CategoriesView from './components/CategoriesView';
import AllProductsView from './components/AllProductsView';
import { Product, User, Category, Comment } from './types';

// ... (keep all your existing component definitions: WatermarkedImage, VideoPlayer, Banner, ErrorBoundary, helper functions, services exactly as they were)

// Banner data
const banners = [
  {
    id: 1,
    src: "https://media.barakasonko.store/Jipatie%20kwa%20bei%20poa.gif",
    alt: "Get products at affordable prices",
    duration: 5000,
    isGif: true
  },
  {
    id: 2,
    src: "https://media.barakasonko.store/uploads/Yellow%20And%20Red%20Unboxing%20And%20Review%20YouTube%20Thumbnail.gif",
    alt: "Product unboxing and review",
    duration: 5000,
    isGif: true
  },
  {
    id: 3,
    src: "https://media.barakasonko.store/Untitled%20design.gif",
    alt: "Special promotions banner",
    duration: 5000,
    isGif: true
  },
  {
    id: 4,
    src: "https://media.barakasonko.store/Yellow%20And%20Red%20Unboxing%20And%20Review%20YouTube%20Thumbnail%20(1).gif",
    alt: "Product boxing and review",
    duration: 5000,
    isGif: true
  }
];

// Main App Content with Router hooks
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const [view, setView] = useState<
    | 'home'
    | 'admin'
    | 'product-detail'
    | 'category-results'
    | 'categories'
    | 'search-results'
    | 'all-products'
  >('home');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  
  // Category-Product mapping for accurate filtering
  const [categoryProductMap, setCategoryProductMap] = useState<Record<string, Product[]>>({});

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Comments state
  const [productComments, setProductComments] = useState<Record<string, Comment[]>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});

  // Views state
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [isRecordingView, setIsRecordingView] = useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Simple right-click prevention for product images only
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element or its parent is a product image container
      const isProductImage = target.closest('.product-image-container') !== null;
      if (isProductImage) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Banner rotation effect
  useEffect(() => {
    if (view !== 'home' || banners.length <= 1) return;
    
    const currentBanner = banners[activeBannerIndex];
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, currentBanner.duration);

    return () => clearInterval(interval);
  }, [activeBannerIndex, view]);

  // Transform backend product data - ensure product IDs are preserved
  const normalizeProduct = (p: any, categoriesList: Category[]): Product => {
    const id = String(p?.id ?? p?._id ?? '');
    const price = Number(p?.price ?? 0);
    const discount = p?.discount == null ? 0 : Number(p.discount);

    let categoryId = String(p?.category_id ?? p?.categoryId ?? '').trim();
    let categoryName = '';
    let categoryIcon = '';

    if (typeof p?.category === 'object' && p.category) {
      categoryId = String(p.category.id ?? categoryId).trim();
      categoryName = String(p.category.name ?? p.category.category_name ?? '').trim();
      categoryIcon = String(
        p.category.icon ?? p.category.icon_name ?? p.category.icon_emoji ?? ''
      ).trim();
    } else {
      categoryName = String(
        p?.category_name ??
          p?.categoryName ??
          p?.category ??
          ''
      ).trim();

      const maybe = String(p?.category ?? '').trim();
      if (!categoryId && /^\d+$/.test(maybe)) categoryId = maybe;
    }

    if ((!categoryName || categoryName === '0') && categoryId) {
      const found = categoriesList.find(c => String(c.id) === String(categoryId));
      if (found) {
        categoryName = found.name;
        categoryIcon = categoryIcon || found.icon || '';
      }
    }

    const category = categoryName;

    const getProductCategoryIcon = () => {
      if (categoryIcon) return categoryIcon;
      
      const matchingCat = categoriesList.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase() ||
        c.name.toLowerCase() === category.toLowerCase()
      );
      
      return matchingCat?.icon || getDefaultCategoryIcon(categoryName);
    };

    return {
      ...p,
      id,
      price: Number.isFinite(price) ? price : 0,
      discount: Number.isFinite(discount) ? discount : 0,
      category,
      categoryName,
      categoryId: categoryId || undefined,
      category_id: categoryId || undefined,
      category_name: categoryName,
      categoryIcon: getProductCategoryIcon(),
      image: p?.image || p?.image_url || (Array.isArray(p?.images) ? p.images[0] : '') || '',
      images: Array.isArray(p?.images)
        ? p.images
        : Array.isArray(p?.image_urls)
        ? p.image_urls
        : Array.isArray(p?.image_urls_json)
        ? p.image_urls_json
        : [],
      descriptionImages: Array.isArray(p?.descriptionImages)
        ? p.descriptionImages
        : Array.isArray(p?.description_images)
        ? p.description_images
        : [],
      videoUrl: String(p?.videoUrl ?? p?.video_url ?? ''),
    } as any;
  };

  // Fetch initial data
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        const prodData = await prodRes.json().catch(() => ({
          success: false,
          error: 'Invalid JSON from products API'
        }));
        
        const catData = await catRes.json().catch(() => ({
          success: false,
          error: 'Invalid JSON from categories API'
        }));

        let normalizedCats: Category[] = [];
        if (catData?.success) {
          const rawCats = Array.isArray(catData.data) ? catData.data : [];
          normalizedCats = rawCats.map(normalizeCategory);
          setCategories(normalizedCats);
        } else {
          setFetchError(prev => prev ? `${prev}; Categories: ${catData?.error}` : `Categories: ${catData?.error || 'Unknown error'}`);
        }

        if (prodData?.success) {
          const raw = Array.isArray(prodData.data) ? prodData.data : [];
          const normalized = raw.map(p => normalizeProduct(p, normalizedCats));
          setProducts(normalized);
          
          // Initialize comment counts
          const initialCounts: Record<string, number> = {};
          normalized.forEach(product => {
            initialCounts[product.id] = 0;
          });
          setCommentCounts(initialCounts);
          
          // Initialize view counts
          const initialViewCounts: Record<string, number> = {};
          normalized.forEach(product => {
            initialViewCounts[product.id] = 0;
          });
          setViewCounts(initialViewCounts);
        } else {
          setFetchError(prev => prev ? `${prev}; Products: ${prodData?.error}` : `Products: ${prodData?.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('❌ App: Failed to initialize app', error);
        setFetchError(error.message || 'Network or server error');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Handle direct product URL access
  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setView('product-detail');
        
        // Fetch comments for this product
        fetchCommentsForProduct(product.id);
        
        // Record view
        (async () => {
          const viewerKey = getOrCreateUserId();
          const newCount = await ViewsService.recordView(product.id, viewerKey);
          setViewCounts(prev => ({ ...prev, [product.id]: newCount }));
        })();
      } else {
        // Product not found, redirect to home
        navigate('/', { replace: true });
      }
    }
  }, [productId, products, navigate]);

  // Build category-product map when data loads
  const buildCategoryProductMap = useCallback(() => {
    const map: Record<string, Product[]> = {};
    
    // Initialize empty arrays for all categories
    categories.forEach(cat => {
      map[cat.id] = [];
    });
    
    // Also ensure "Bidhaa Zote" (id: "14") exists
    if (!map["14"]) {
      map["14"] = [];
    }
    
    // Map each product to its category - preserve original product references
    products.forEach(product => {
      const productData = product as any;
      
      // Try multiple methods to find the correct category
      let matchedCategoryId: string | null = null;
      
      // Method 1: Check by category_id field
      if (productData.category_id) {
        const catId = String(productData.category_id).trim();
        if (map[catId]) {
          matchedCategoryId = catId;
        }
      }
      
      // Method 2: Check by categoryId field
      if (!matchedCategoryId && productData.categoryId) {
        const catId = String(productData.categoryId).trim();
        if (map[catId]) {
          matchedCategoryId = catId;
        }
      }
      
      // Method 3: Match by category name
      if (!matchedCategoryId) {
        const productCatName = (
          productData.category_name || 
          productData.categoryName || 
          productData.category || 
          ''
        ).toLowerCase().trim();
        
        const matchingCat = categories.find(cat => 
          cat.name.toLowerCase().trim() === productCatName
        );
        
        if (matchingCat) {
          matchedCategoryId = matchingCat.id;
        }
      }
      
      // Method 4: Manual matching based on title keywords
      if (!matchedCategoryId) {
        const title = (productData.title || '').toLowerCase();
        
        // Mic category (id: "3")
        if (title.includes('mic') || title.includes('microphone')) {
          // Exclude accessories
          if (!title.includes('cable') && !title.includes('wire') && 
              !title.includes('stand') && !title.includes('stendi')) {
            matchedCategoryId = "3";
          }
        }
        
        // Spika category (id: "2")
        else if (title.includes('spika') || title.includes('speaker') || title.includes('sound')) {
          matchedCategoryId = "2";
        }
        
        // TV category (id: "6")
        else if (title.includes('tv') || title.includes('television')) {
          matchedCategoryId = "6";
        }
        
        // Mobile accessories (id: "7")
        else if (title.includes('charger') || title.includes('adapter') || 
                 title.includes('cable') || title.includes('wire')) {
          matchedCategoryId = "7";
        }
        
        // TV accessories (id: "8")
        else if (title.includes('tv stand') || title.includes('tv bracket') || 
                 title.includes('tv stendi')) {
          matchedCategoryId = "8";
        }
        
        // Guitars (id: "9")
        else if (title.includes('gitaa') || title.includes('guitar')) {
          matchedCategoryId = "9";
        }
        
        // Drums (id: "11")
        else if (title.includes('tumba') || title.includes('drum') || 
                 title.includes('manyanga') || title.includes('dufu')) {
          matchedCategoryId = "11";
        }
        
        // Mixers (id: "12")
        else if (title.includes('mixer') || title.includes('mixing')) {
          matchedCategoryId = "12";
        }
        
        // Spares (id: "13")
        else if (title.includes('battery') || title.includes('betri') || 
                 title.includes('jack') || title.includes('spare')) {
          matchedCategoryId = "13";
        }
      }
      
      // Add product to its category map - use the original product reference
      if (matchedCategoryId && map[matchedCategoryId]) {
        map[matchedCategoryId].push(product);
      } else {
        // If no category found, put in "Bidhaa Zote"
        if (map["14"]) {
          map["14"].push(product);
        }
      }
    });
    
    // Remove duplicates while preserving original references
    Object.keys(map).forEach(catId => {
      const seen = new Set();
      map[catId] = map[catId].filter(p => {
        const duplicate = seen.has(p.id);
        seen.add(p.id);
        return !duplicate;
      });
    });
    
    setCategoryProductMap(map);
    console.log('✅ Category product map built');
  }, [products, categories]);

  // Build map when products and categories are loaded
  useEffect(() => {
    if (products.length > 0 && categories.length > 0) {
      buildCategoryProductMap();
    }
  }, [products, categories, buildCategoryProductMap]);

  // Search Logic
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter((p) => {
      const categoryField = (p.category || (p as any).categoryName || '').toLowerCase();
      return p.title?.toLowerCase().includes(q) || categoryField.includes(q);
    });
  }, [searchQuery, products]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery, categories]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setView('search-results');
    navigate('/');
  };

  // Use pre-built category map for accurate filtering
  const handleCategorySelect = (category: Category) => {
    setIsSidebarOpen(false);
    
    // Handle "Bidhaa Zote" - show all products
    if (category.id === '14' || category.name === 'Bidhaa Zote') {
      setView('all-products');
      navigate('/all-products');
      window.scrollTo(0, 0);
      return;
    }
    
    // Get products directly from the pre-built map - these are original product references
    const productsForCategory = categoryProductMap[category.id] || [];
    
    console.log(`📌 Category "${category.name}" has ${productsForCategory.length} products`);
    
    setCategoryProducts(productsForCategory);
    setSelectedCategory(category);
    setView('category-results');
    navigate(`/category/${category.id}`);
    window.scrollTo(0, 0);
  };

  // Helper functions for user management
  const getOrCreateUserId = (): string => {
    let userId = localStorage.getItem('sonko_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sonko_user_id', userId);
    }
    return userId;
  };

  // Generate anonymous user for logged-out users
  const generateAnonymousUser = () => {
    const userId = getOrCreateUserId();
    
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600' },
      { bg: 'bg-green-100', text: 'text-green-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-orange-100', text: 'text-orange-600' },
      { bg: 'bg-pink-100', text: 'text-pink-600' },
      { bg: 'bg-teal-100', text: 'text-teal-600' },
      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    ];
    
    const seed = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const idx = seed % colors.length;

    return {
      id: userId,
      name: 'Mteja',
      initials: 'MT',
      color: colors[idx].bg,
      textColor: colors[idx].text,
    };
  };

  // Comments API integration
  const fetchCommentsForProduct = async (productId: string) => {
    if (isLoadingComments[productId]) return;
    
    setIsLoadingComments(prev => ({ ...prev, [productId]: true }));
    
    try {
      const comments = await CommentsService.fetchComments(productId);
      setProductComments(prev => ({ ...prev, [productId]: comments }));
      
      setCommentCounts(prev => ({ ...prev, [productId]: comments.length }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddComment = async (productId: string, content: string) => {
    try {
      const isLoggedIn = !!user;

      const displayName = isLoggedIn ? 'Baraka Sonko Electronics' : 'Mteja';
      const initials = isLoggedIn ? 'BS' : 'MT';

      const anon = generateAnonymousUser();
      const userId = isLoggedIn ? String(user?.id || 'admin') : anon.id;

      const newComment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'isLiked'> = {
        productId,
        content,
        userId,
        userName: displayName,
        userInitials: initials,
        userColor: isLoggedIn ? 'bg-orange-100' : anon.color,
        textColor: isLoggedIn ? 'text-orange-700' : anon.textColor,
      };

      const savedComment = await CommentsService.addComment(newComment);

      if (savedComment) {
        setProductComments(prev => ({
          ...prev,
          [productId]: [savedComment, ...(prev[productId] || [])],
        }));

        setCommentCounts(prev => ({
          ...prev,
          [productId]: (prev[productId] || 0) + 1,
        }));

        return savedComment;
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
    return null;
  };

  const handleLikeComment = async (commentId: string, productId: string) => {
    try {
      const userId = getOrCreateUserId();
      const success = await CommentsService.likeComment(commentId, userId);
      
      if (success) {
        setProductComments(prev => ({
          ...prev,
          [productId]: (prev[productId] || []).map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likes: comment.likes + 1,
                isLiked: true
              };
            }
            return comment;
          })
        }));
        return true;
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
    return false;
  };

  const handleDeleteComment = async (commentId: string, productId: string) => {
    try {
      const success = await CommentsService.deleteComment(commentId);
      
      if (success) {
        setProductComments(prev => ({
          ...prev,
          [productId]: (prev[productId] || []).filter(comment => comment.id !== commentId)
        }));
        
        setCommentCounts(prev => ({
          ...prev,
          [productId]: Math.max(0, (prev[productId] || 0) - 1)
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
    return false;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('product-detail');
    
    // Update URL to product-specific path
    navigate(`/product/${product.id}`);

    fetchCommentsForProduct(product.id);

    (async () => {
      const viewerKey = getOrCreateUserId();
      const newCount = await ViewsService.recordView(product.id, viewerKey);
      setViewCounts(prev => ({ ...prev, [product.id]: newCount }));
    })();
  };

  const fetchSelectedProductComments = useCallback(() => {
    if (!selectedProduct?.id) return;
    fetchCommentsForProduct(selectedProduct.id);
  }, [selectedProduct?.id]);

  const addSelectedProductComment = useCallback((content: string) => {
    if (!selectedProduct?.id) return Promise.resolve(null);
    return handleAddComment(selectedProduct.id, content);
  }, [selectedProduct?.id]);

  const likeSelectedProductComment = useCallback((commentId: string) => {
    if (!selectedProduct?.id) return Promise.resolve(false);
    return handleLikeComment(commentId, selectedProduct.id);
  }, [selectedProduct?.id]);

  const deleteSelectedProductComment = useCallback((commentId: string) => {
    if (!selectedProduct?.id) return Promise.resolve(false);
    return handleDeleteComment(commentId, selectedProduct.id);
  }, [selectedProduct?.id]);

  const recordSelectedProductView = useCallback(async () => {
    if (!selectedProduct?.id) return;
    const pid = selectedProduct.id;
    if (isRecordingView[pid]) return;

    setIsRecordingView(prev => ({ ...prev, [pid]: true }));
    try {
      const viewerKey = getOrCreateUserId();
      const newCount = await ViewsService.recordView(pid, viewerKey);
      setViewCounts(prev => ({ ...prev, [pid]: newCount }));
    } finally {
      setIsRecordingView(prev => ({ ...prev, [pid]: false }));
    }
  }, [selectedProduct?.id, isRecordingView]);

  const handleBannerClick = () => {
    setView('all-products');
    navigate('/all-products');
  };

  const goToNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Admin session
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sonko_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showAuth, setShowAuth] = useState(false);

  const addProduct = async (newProduct: Product) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) return false;

      const savedRaw = result.data || result.product || result.item;
      if (savedRaw) {
        const saved = normalizeProduct(savedRaw, categories);
        setProducts((prev) => [saved, ...prev]);
        
        setCommentCounts(prev => ({
          ...prev,
          [saved.id]: 0
        }));
        
        setViewCounts(prev => ({
          ...prev,
          [saved.id]: 0
        }));
        
        return true;
      }

      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json().catch(() => null);
      if (prodData?.success) {
        const normalized = (prodData.data || []).map(p => normalizeProduct(p, categories));
        setProducts(normalized);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (result?.success) {
        setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
        
        setProductComments(prev => {
          const newComments = { ...prev };
          delete newComments[id];
          return newComments;
        });
        
        setCommentCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[id];
          return newCounts;
        });
        
        setViewCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[id];
          return newCounts;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminAccess = () => {
    if (!user) setShowAuth(true);
    else {
      setView('admin');
      navigate('/admin');
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sonko_user', JSON.stringify(newUser));
    setShowAuth(false);
    setView('admin');
    navigate('/admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sonko_user');
    setView('home');
    navigate('/');
  };

  const handleBackToHome = () => {
    setView('home');
    navigate('/');
  };

  const navView =
    view === 'admin'
      ? 'admin'
      : view === 'categories'
      ? 'categories'
      : view === 'all-products'
      ? 'all-products'
      : view === 'search-results'
      ? 'search-results'
      : view === 'category-results'
      ? 'categories'
      : 'home';

  if (isLoading && view !== 'category-results') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-4">
        <div className="text-3xl font-black italic text-orange-600 animate-pulse">SONKO</div>
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 mt-4">Loading store data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-4 p-8">
        <div className="text-3xl font-black italic text-orange-600">SONKO</div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-black text-red-700">Connection Error</h3>
              <p className="text-xs text-red-600">Failed to load store data</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-orange-600 text-white font-black py-3 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Retry Loading
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Check your internet connection and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Product Detail View */}
      {view === 'product-detail' && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={products}
          onBack={handleBackToHome}
          onProductClick={handleProductClick}
          WatermarkedImage={WatermarkedImage}
          VideoPlayer={VideoPlayer}
          Banner={Banner}
          comments={productComments[selectedProduct.id] || []}
          commentCount={commentCounts[selectedProduct.id] || 0}
          onFetchComments={fetchSelectedProductComments}
          onAddComment={addSelectedProductComment}
          onLikeComment={likeSelectedProductComment}
          onDeleteComment={deleteSelectedProductComment}
          isLoadingComments={isLoadingComments[selectedProduct.id] || false}
          viewCount={viewCounts[selectedProduct.id] || 0}
          onRecordView={recordSelectedProductView}
        />
      )}

      {/* Auth View */}
      {showAuth && <AuthView onLogin={handleLogin} onBack={() => setShowAuth(false)} />}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCategorySelect={handleCategorySelect}
      />

      {/* Header */}
      {view !== 'product-detail' && (
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onSearch={handleSearch}
          initialValue={searchQuery}
          onProductSelect={handleProductClick}
        />
      )}

      <main className="w-full max-w-[600px] mx-auto pb-24">
        {view === 'home' ? (
          <>
            <QuickActions onActionSelect={() => {
              setView('all-products');
              navigate('/all-products');
            }} />

            <CategorySection
              categories={categories}
              onCategorySelect={handleCategorySelect}
              onMore={() => {
                setView('categories');
                navigate('/categories');
              }}
            />

            {/* Flash Sale - with product images watermarked */}
            <FlashSale
              products={products}
              onProductClick={handleProductClick}
              onSeeAll={() => {
                setView('all-products');
                navigate('/all-products');
              }}
              WatermarkedImage={WatermarkedImage}
            />

            <div className="p-4">
              <Banner
                src="https://media.barakasonko.store/White%20Blue%20Professional%20Website%20Developer%20LinkedIn%20Banner.gif"
                onClick={handleBannerClick}
                containerClass="h-[110px]"
                alt="Special promotion banner"
                isGif={true}
              />
            </div>

            {/* Daily Discoveries - with product images watermarked */}
            <ProductGrid
              title="Daily Discoveries"
              products={products}
              onProductClick={handleProductClick}
              WatermarkedImage={WatermarkedImage}
            />
          </>
        ) : view === 'all-products' ? (
          <AllProductsView
            products={products}
            onProductClick={handleProductClick}
            onLoadMore={() => {}}
            isLoading={false}
            WatermarkedImage={WatermarkedImage}
          />
        ) : view === 'category-results' && selectedCategory ? (
          <div className="animate-fadeIn p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedCategory.icon && (
                  <span className="text-2xl">{selectedCategory.icon}</span>
                )}
                <div>
                  <h2 className="text-sm font-bold text-gray-500 uppercase">
                    {selectedCategory.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {categoryProducts.length} products
                  </p>
                </div>
              </div>
              <button
                className="text-xs font-black text-orange-600"
                onClick={() => {
                  setView('all-products');
                  navigate('/all-products');
                }}
              >
                View All Products
              </button>
            </div>

            <ProductGrid
              products={categoryProducts}
              onProductClick={handleProductClick}
              WatermarkedImage={WatermarkedImage}
              emptyMessage={`No products found in ${selectedCategory.name} category`}
            />
          </div>
        ) : view === 'search-results' ? (
          <div className="animate-fadeIn p-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : 'Search'}
            </h2>

            {filteredCategories.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-black text-gray-400 uppercase mb-2">Matching Categories</p>
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      className="px-3 py-2 rounded-full bg-gray-100 text-xs font-black text-gray-700 flex items-center space-x-2 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                      onClick={() => handleCategorySelect(c)}
                    >
                      {c.icon && <span>{c.icon}</span>}
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ProductGrid 
              products={filteredProducts} 
              onProductClick={handleProductClick}
              WatermarkedImage={WatermarkedImage}
            />
          </div>
        ) : view === 'categories' ? (
          <CategoriesView
            onCategorySelect={handleCategorySelect}
            onShowAllProducts={() => {
              setView('all-products');
              navigate('/all-products');
            }}
            suggestedProducts={products}
            onProductClick={handleProductClick}
          />
        ) : view === 'admin' ? (
          <ErrorBoundary title="Admin screen crashed">
            <AdminView
              products={products}
              categories={categories}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
              WatermarkedImage={WatermarkedImage}
              VideoPlayer={VideoPlayer}
              Banner={Banner}
            />
          </ErrorBoundary>
        ) : null}
      </main>

      {/* Bottom Nav */}
      {view !== 'product-detail' && (
        <BottomNav
          currentView={navView as any}
          onViewChange={(v: any) => {
            if (v === 'admin') handleAdminAccess();
            else if (v === 'home') {
              setView('home');
              navigate('/');
            } else if (v === 'categories') {
              setView('categories');
              navigate('/categories');
            } else if (v === 'all-products') {
              setView('all-products');
              navigate('/all-products');
            }
          }}
        />
      )}

      {/* Copyright Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white text-center py-2 text-xs z-40">
        ©barakasonko - Product images protected
      </div>
    </div>
  );
};

// Main App component with Router
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/product/:productId" element={<AppContent />} />
        <Route path="/category/:categoryId" element={<AppContent />} />
        <Route path="/categories" element={<AppContent />} />
        <Route path="/all-products" element={<AppContent />} />
        <Route path="/admin" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
