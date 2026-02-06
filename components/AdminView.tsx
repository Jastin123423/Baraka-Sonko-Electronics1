import React, { useState, useEffect } from 'react';
import { Product, Category, AdminStats } from '../types';

interface AdminViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<void> | void;
  WatermarkedImage: React.ComponentType<any>;
  VideoPlayer: React.ComponentType<any>;
  Banner: React.ComponentType<any>;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'withdraw';
type UploadType = 'image' | 'video' | 'desc_image';

const AdminView: React.FC<AdminViewProps> = ({ 
  products, 
  categories, 
  onAddProduct, 
  onDeleteProduct,
  WatermarkedImage,
  VideoPlayer,
  Banner
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  // Updated formData with categoryId instead of category
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: '', // Changed from 'price'
    sellingPrice: '', // New field
    categoryId: '', // CHANGED: Now stores ID, not name
    videoUrl: '',
    images: [] as string[],
    descriptionImages: [] as string[],
  });

  // Calculate discount percentage based on original price and selling price
  const calculateDiscountPercentage = () => {
    const originalPrice = parseFloat(formData.originalPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);
    
    if (!originalPrice || originalPrice <= 0 || !sellingPrice || sellingPrice <= 0) {
      return 0;
    }
    
    if (sellingPrice >= originalPrice) {
      return 0; // No discount if selling price is higher or equal
    }
    
    const discount = ((originalPrice - sellingPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  // Calculate discount amount in TSh
  const calculateDiscountAmount = () => {
    const originalPrice = parseFloat(formData.originalPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);
    
    if (!originalPrice || originalPrice <= 0 || !sellingPrice || sellingPrice <= 0) {
      return 0;
    }
    
    if (sellingPrice >= originalPrice) {
      return 0;
    }
    
    return originalPrice - sellingPrice;
  };

  // Track actual upload status
  const isActuallyUploading = uploadingCount > 0;

  // Add debug logging helper
  const addDebugLog = (message: string) => {
    console.log(`🔍 ${message}`);
    setDebugLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        if (data.success) setStats(data.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };

    fetchStats();
  }, []);

  /**
   * Upload single file using RAW binary mode with comprehensive debugging
   */
  const uploadSingleFile = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const uniqueFilename = `${timestamp}-${randomStr}-${safeFilename}`;
    
    // Create upload progress tracker
    const progressKey = `${uniqueFilename}-${timestamp}`;
    
    addDebugLog(`Starting upload: ${file.name} (type: "${file.type}", size: ${file.size} bytes)`);
    addDebugLog(`Generated filename: ${uniqueFilename}`);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Increment upload counter
      setUploadingCount(c => c + 1);
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [progressKey]: percentComplete }));
          if (percentComplete % 25 === 0) {
            addDebugLog(`Upload progress ${file.name}: ${percentComplete}%`);
          }
        }
      });

      const cleanup = () => {
        // Clean up progress tracking
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
        // Decrement upload counter
        setUploadingCount(c => Math.max(0, c - 1));
      };

      xhr.addEventListener('load', () => {
        cleanup();
        
        addDebugLog(`Upload response for ${file.name}: HTTP ${xhr.status}`);
        addDebugLog(`Response preview: ${xhr.responseText?.slice(0, 200)}`);
        
        // Parse response with robust error handling
        let response: any = null;
        try {
          response = JSON.parse(xhr.responseText);
          addDebugLog(`Parsed JSON response for ${file.name}: ${JSON.stringify(response).slice(0, 100)}`);
        } catch (parseError) {
          addDebugLog(`❌ JSON parse error for ${file.name}: ${xhr.responseText?.slice(0, 100)}`);
          return reject(
            new Error(`Upload failed: server returned non-JSON (HTTP ${xhr.status}). Check /api/upload endpoint.`)
          );
        }

        // Extract URL from response
        const url = Array.isArray(response?.data) 
          ? response.data[0] 
          : response?.data || response?.url;

        if (xhr.status >= 200 && xhr.status < 300 && response?.success !== false && url) {
          addDebugLog(`✅ Upload successful for ${file.name}: ${url}`);
          resolve(url);
        } else {
          const errorMsg = response?.error || `Upload failed (HTTP ${xhr.status})`;
          addDebugLog(`❌ Upload failed for ${file.name}: ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        cleanup();
        addDebugLog(`❌ Network error during upload of ${file.name}`);
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        cleanup();
        addDebugLog(`Upload cancelled for ${file.name}`);
        reject(new Error('Upload cancelled'));
      });

      // Use absolute URL to avoid path issues
      const endpoint = new URL('/api/upload', window.location.origin);
      endpoint.searchParams.set('filename', uniqueFilename);
      
      addDebugLog(`Making request to: ${endpoint.toString()}`);
      
      xhr.open('POST', endpoint.toString());
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  };

  /**
   * Handle file upload with comprehensive debugging
   */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: UploadType
  ) => {
    // Clear previous errors
    setUploadError('');
    
    // Step 1: Debug - Check if handler is firing
    console.log("🎯 handleFileUpload FIRED with type:", type);
    addDebugLog(`handleFileUpload triggered for ${type}`);
    
    // ✅ CRITICAL FIX: copy files first (FileList can be cleared when input value is reset)
    const files = e.currentTarget.files;
    const fileList: File[] = files ? Array.from(files) : [];
    
    console.log("📁 files selected:", fileList.length);
    console.log("📁 file details:", fileList.map(f => `${f.name} (type: "${f.type}") ${f.size} bytes`));
    
    if (fileList.length === 0) {
      addDebugLog('❌ No files selected or picker cancelled');
      return;
    }
    
    // ✅ Now safe to reset input
    e.currentTarget.value = '';
    
    setUploadProgress({});

    try {
      const uploadedUrls: string[] = [];

      addDebugLog(`Processing ${fileList.length} file(s) for ${type}`);

      // Validate file sizes and types
      for (const file of fileList) {
        const fileName = file.name.toLowerCase();
        
        if (type === 'image' || type === 'desc_image') {
          // Android-safe validation: check both MIME type and file extension
          const looksLikeImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName);
          
          if (!looksLikeImage) {
            throw new Error(`Invalid file type: ${file.name}. Please upload images only.`);
          }
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`Image too large: ${file.name}. Maximum size is 10MB.`);
          }
        } else if (type === 'video') {
          // Android-safe validation for videos
          const looksLikeVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv|flv|wmv)$/i.test(fileName);
          
          if (!looksLikeVideo) {
            throw new Error(`Invalid file type: ${file.name}. Please upload videos only.`);
          }
          if (file.size > 100 * 1024 * 1024) {
            throw new Error(`Video too large: ${file.name}. Maximum size is 100MB.`);
          }
        }
      }

      // Upload files sequentially
      for (const file of fileList) {
        try {
          addDebugLog(`Starting upload of: ${file.name}`);
          const url = await uploadSingleFile(file);
          uploadedUrls.push(url);
          addDebugLog(`Added URL to uploadedUrls: ${url}`);
        } catch (error: any) {
          addDebugLog(`❌ Upload failed for ${file.name}: ${error.message}`);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      // Update form data with uploaded URLs
      console.log("📊 upload complete. URLs received:", uploadedUrls);
      
      if (type === 'image') {
        setFormData(prev => {
          const newImages = [...prev.images, ...uploadedUrls].slice(0, 10);
          console.log("🔄 Setting new images array:", newImages);
          addDebugLog(`Setting ${newImages.length} images (${uploadedUrls.length} new)`);
          return {
            ...prev,
            images: newImages,
          };
        });
        
      } else if (type === 'desc_image') {
        setFormData(prev => {
          const newDescImages = [...prev.descriptionImages, ...uploadedUrls].slice(0, 20);
          console.log("🔄 Setting new descriptionImages:", newDescImages);
          return {
            ...prev,
            descriptionImages: newDescImages,
          };
        });
      } else if (type === 'video') {
        if (uploadedUrls.length > 0) {
          setFormData(prev => {
            console.log("🔄 Setting videoUrl:", uploadedUrls[0]);
            return { ...prev, videoUrl: uploadedUrls[0] };
          });
        }
      }

      addDebugLog(`✅ Successfully updated form state for ${type}`);

    } catch (err: any) {
      // Show error to user
      const errorMessage = err?.message || 'Upload failed. Please check your connection and try again.';
      console.error("🔥 handleFileUpload error:", err);
      addDebugLog(`❌ Error: ${errorMessage}`);
      setUploadError(errorMessage);
    } finally {
      setUploadProgress({});
      console.log("🏁 handleFileUpload completed");
    }
  };

  const removeImage = (index: number, type: 'gallery' | 'desc') => {
    if (type === 'gallery') {
      setFormData(prev => ({ 
        ...prev, 
        images: prev.images.filter((_, i) => i !== index) 
      }));
      addDebugLog(`Removed gallery image at index ${index}`);
    } else {
      setFormData(prev => ({
        ...prev,
        descriptionImages: prev.descriptionImages.filter((_, i) => i !== index),
      }));
      addDebugLog(`Removed description image at index ${index}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CRITICAL FIX: Prevent submit during upload
    if (isActuallyUploading) {
      alert('⏳ Please wait for all uploads to finish before publishing');
      return;
    }

    // DEBUG: Log everything before validation
    console.log("🚀 SUBMIT CALLED!");
    console.log("📋 SUBMIT images:", formData.images);
    console.log("📋 SUBMIT images.length:", formData.images.length);
    console.log("📋 SUBMIT uploadingCount:", uploadingCount);
    console.log("📋 SUBMIT isActuallyUploading:", isActuallyUploading);
    console.log("📋 SUBMIT uploadProgress keys:", Object.keys(uploadProgress));
    console.log("📋 FULL formData:", formData);

    // 🔥 REQUIRED CHANGE 1: Add main image guarantee
    const mainImage = formData.images[0] || formData.images.at(-1) || '';
    if (!mainImage) {
      alert('❌ At least one main image is required');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      alert('❌ Product title is required');
      return;
    }

    const originalPrice = parseFloat(formData.originalPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);
    
    if (!formData.originalPrice || isNaN(originalPrice) || originalPrice <= 0) {
      alert('❌ Please enter a valid original price');
      return;
    }

    if (!formData.sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0) {
      alert('❌ Please enter a valid selling price');
      return;
    }

    if (sellingPrice > originalPrice) {
      alert('❌ Selling price cannot be higher than original price');
      return;
    }

    if (formData.images.length === 0) {
      alert('❌ At least one main image is required');
      return;
    }

    // 🔥 REQUIRED CHANGE 2: Category validation using categoryId
    if (!formData.categoryId) {
      alert('❌ Please select a category');
      return;
    }

    // Find the selected category
    const selectedCat = categories.find(c => String(c.id) === String(formData.categoryId));
    if (!selectedCat) {
      alert('❌ Please select a valid category');
      return;
    }

    // Calculate discount
    const discountPercentage = calculateDiscountPercentage();
    const discountAmount = calculateDiscountAmount();

    try {
      // Build payload with all required fields including view count starting at 0
      const payload = {
        // Core fields
        title: formData.title.trim(),
        description: formData.description.trim(),
        
        // 🔥 REQUIRED CHANGE 3: Add main image fields
        image: mainImage,
        image_url: mainImage,
        images: formData.images,
        image_urls: formData.images,
        
        // Description images
        descriptionImages: formData.descriptionImages,
        description_images: formData.descriptionImages,
        
        // Video
        videoUrl: formData.videoUrl || '',
        video_url: formData.videoUrl || '',
        
        // Pricing - PROFESSIONAL: Original price and selling price
        price: sellingPrice, // This is the final selling price that customers pay
        originalPrice: originalPrice, // Original price before discount
        sellingPrice: sellingPrice, // Selling price (same as price field for consistency)
        
        // Discount information - calculated from original and selling price
        discountAmount: discountAmount, // Discount amount in TSh
        discount: discountPercentage, // Discount percentage (0 if no discount)
        
        // 🔥 REQUIRED CHANGE 4: Category - send BOTH ID and NAME
        category_id: String(selectedCat.id),
        categoryId: String(selectedCat.id),
        category_name: selectedCat.name,
        categoryName: selectedCat.name,
        
        // Keep these for compatibility with existing code
        category: selectedCat.name,
        
        // View count - starts at 0 when product is posted
        views: 0,
        viewCount: 0,
        
        // Metadata
        rating: 5.0,
        status: 'online',
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      console.log('📤 Sending payload to backend:', payload);

      const success = await onAddProduct(payload as any);

      if (success) {
        // Reset form on success
        setIsAdding(false);
        setFormData({
          title: '',
          description: '',
          originalPrice: '',
          sellingPrice: '',
          categoryId: '', // Reset to empty
          videoUrl: '',
          images: [],
          descriptionImages: [],
        });
        
        // Show success message
        alert('✅ Product published successfully!');
      } else {
        alert('❌ Failed to save product. Please try again.');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('❌ An unexpected error occurred. Please try again.');
    }
  };

  const getTotalUploadProgress = () => {
    const values = Object.values(uploadProgress);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-base font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200';
  const labelClass = 'block text-xs font-black text-gray-500 uppercase mb-2 ml-1 tracking-wide';

  // Safe check for dev mode to avoid import.meta issues
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      {/* Debug Panel - Can be toggled in development */}
      {isDev && debugLogs.length > 0 && (
        <div className="fixed top-20 right-4 w-80 max-h-96 bg-black/90 text-white text-xs p-3 rounded-lg overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Upload Debug Logs</h3>
            <button 
              onClick={() => setDebugLogs([])} 
              className="text-xs bg-red-600 px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
          {debugLogs.map((log, i) => (
            <div key={i} className="mb-1 border-b border-gray-700 pb-1">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Top Navigation Tabs */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 px-2 shadow-sm">
        <div className="flex space-x-6 py-4 px-2 overflow-x-auto no-scrollbar">
          {(['dashboard', 'products', 'orders', 'withdraw'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] font-black uppercase tracking-wider transition-all relative pb-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'text-orange-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-12 max-w-4xl mx-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h1 className="text-xl font-black text-gray-800 mb-4">Dashboard Overview</h1>
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Total Products</p>
                  <p className="text-2xl font-black">{stats.totalProducts?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Net Sales</p>
                  <p className="text-2xl font-black">TSh {stats.netSales?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Earnings</p>
                  <p className="text-2xl font-black text-orange-600">TSh {stats.earnings?.toLocaleString() || '0'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl text-center">
                <div className="inline-block w-8 h-8 border-3 border-gray-300 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading dashboard data...</p>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-black text-gray-800">Products Management</h1>
              <button
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black py-3 px-6 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              >
                + ADD NEW PRODUCT
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {products.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="font-bold">No products yet</p>
                  <p className="text-sm mt-1">Start by adding your first product</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {products.map(product => {
                    // Safe price handling
                    const priceNumber = Number((product as any).price ?? 0);
                    const originalPriceNumber = Number((product as any).originalPrice ?? priceNumber);
                    const displayPrice = Number.isFinite(priceNumber) ? priceNumber.toLocaleString() : '0';
                    const displayOriginalPrice = Number.isFinite(originalPriceNumber) ? originalPriceNumber.toLocaleString() : '0';
                    
                    // Calculate discount if available
                    const discount = product.discount || 
                      (originalPriceNumber > priceNumber 
                        ? Math.round(((originalPriceNumber - priceNumber) / originalPriceNumber) * 100) 
                        : 0);
                    
                    return (
                      <div
                        key={product.id}
                        className="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
                      >
                        {/* Use WatermarkedImage for product preview */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                          <WatermarkedImage
                            src={product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGM0YzRjMiLz48cGF0aCBkPSJNMzUgNDVINTVWNjVINzVMNTAgODBMNTUgNzVMMzUgNTVWNDVaIiBmaWxsPSIjQ0NDIi8+PC9zdmc+'}
                            alt={product.title}
                            containerClass="w-full h-full"
                            productId={product.id}
                            isProduct={true}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold truncate">{product.title}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            {/* Show selling price with original price if discounted */}
                            {discount > 0 ? (
                              <div className="flex items-center space-x-2">
                                <p className="text-xs font-black text-orange-600">
                                  TSh {displayPrice}
                                </p>
                                <p className="text-xs font-black text-gray-400 line-through">
                                  TSh {displayOriginalPrice}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs font-black text-orange-600">
                                TSh {displayPrice}
                              </p>
                            )}
                            
                            {discount > 0 && (
                              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                -{discount}%
                              </span>
                            )}
                            
                            {/* View Count with Eye Icon */}
                            <div className="flex items-center space-x-1 text-gray-500">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              <span className="text-xs font-bold">
                                {product.views?.toLocaleString() || product.viewCount?.toLocaleString() || '0'}
                              </span>
                            </div>
                            
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              product.status === 'online' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {product.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {/* 🔥 FIX: Display category_name if available, fall back to other fields */}
                            Category: {(product as any).category_name || product.categoryName || product.category || 'Uncategorized'}
                          </p>
                        </div>
                        <button 
                          onClick={() => onDeleteProduct(product.id)}
                          className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete product"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-bold">Orders Management</p>
            <p className="text-sm mt-1">Coming soon...</p>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="font-bold">Withdraw Earnings</p>
            <p className="text-sm mt-1">Coming soon...</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/75 z-[110] flex flex-col">
          <div className="bg-white w-full h-full p-4 md:p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h2 className="text-xl md:text-2xl font-black text-gray-800">Add New Product</h2>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-3xl font-light text-gray-400 hover:text-gray-700 transition-colors"
                disabled={isActuallyUploading}
              >
                &times;
              </button>
            </div>

            {/* Upload Error Display */}
            {uploadError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-black text-red-800">Upload Error</h3>
                    <div className="mt-1 text-sm text-red-700">{uploadError}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress Indicator */}
            {isActuallyUploading && Object.keys(uploadProgress).length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                    Uploading Files... ({uploadingCount} active)
                  </span>
                  <span className="text-xs font-black text-blue-700">
                    {getTotalUploadProgress()}%
                  </span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getTotalUploadProgress()}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Please wait for uploads to complete before publishing
                </p>
              </div>
            )}

            {/* Upload Summary Section */}
            {(formData.images.length > 0 || formData.videoUrl || formData.descriptionImages.length > 0) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 uppercase tracking-wide mb-3">
                  📸 Upload Summary
                </h4>
                <div className="flex flex-wrap gap-4">
                  {formData.images.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-black text-blue-600">{formData.images.length}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-700">
                        Gallery {formData.images.length > 1 ? 'Images' : 'Image'}
                      </span>
                    </div>
                  )}
                  {formData.videoUrl && (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="green">
                          <polygon points="23 7 16 12 23 17 23 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-green-700">Video Uploaded</span>
                    </div>
                  )}
                  {formData.descriptionImages.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-black text-purple-600">
                          {formData.descriptionImages.length}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-purple-700">
                        Description {formData.descriptionImages.length > 1 ? 'Images' : 'Image'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Price Preview Section - UPDATED */}
            {(formData.originalPrice || formData.sellingPrice) && (
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                <h4 className="text-sm font-black text-green-800 uppercase tracking-wide mb-3">
                  💰 Professional Price Preview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-500 mb-1">Original Price</p>
                    <p className="text-lg font-black text-gray-700">
                      TSh {parseFloat(formData.originalPrice || '0').toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-500 mb-1">Selling Price</p>
                    <p className="text-lg font-black text-orange-600">
                      TSh {parseFloat(formData.sellingPrice || '0').toLocaleString()}
                    </p>
                  </div>
                  {calculateDiscountPercentage() > 0 && (
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-500 mb-1">Discount Applied</p>
                      <p className="text-lg font-black text-red-600">
                        -{calculateDiscountPercentage()}%
                      </p>
                      <p className="text-xs font-bold text-green-600 mt-1">
                        Save TSh {calculateDiscountAmount().toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {calculateDiscountPercentage() > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-xs font-bold text-green-700 text-center">
                      💡 Discount calculated automatically: ({formData.originalPrice} - {formData.sellingPrice}) / {formData.originalPrice} × 100 = {calculateDiscountPercentage()}%
                    </p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">Basic Information</h3>
                
                <div>
                  <label className={labelClass}>Product Title *</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter product title"
                    required
                    disabled={isActuallyUploading}
                  />
                </div>

                <div>
                  <label className={labelClass}>Product Description</label>
                  <textarea
                    className={`${inputClass} min-h-[130px] resize-none`}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product in detail..."
                    disabled={isActuallyUploading}
                    rows={4}
                  />
                  <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    This description appears on the product page.
                  </p>
                </div>
              </div>

              {/* Professional Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">Professional Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Original Price (TSh) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">TSh</span>
                      <input
                        type="number"
                        className={`${inputClass} pl-12`}
                        value={formData.originalPrice}
                        onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                        placeholder="10000"
                        min="0"
                        step="100"
                        required
                        disabled={isActuallyUploading}
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      Price before any discount
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Selling Price (TSh) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">TSh</span>
                      <input
                        type="number"
                        className={`${inputClass} pl-12`}
                        value={formData.sellingPrice}
                        onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                        placeholder="8000"
                        min="0"
                        step="100"
                        required
                        disabled={isActuallyUploading}
                      />
                    </div>
                    {formData.originalPrice && formData.sellingPrice && calculateDiscountPercentage() > 0 && (
                      <p className="mt-2 text-xs font-bold text-green-600">
                        Discount: -{calculateDiscountPercentage()}% (Save TSh {calculateDiscountAmount().toLocaleString()})
                      </p>
                    )}
                    {formData.originalPrice && formData.sellingPrice && calculateDiscountPercentage() === 0 && (
                      <p className="mt-2 text-xs font-bold text-gray-500">
                        No discount applied
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-bold text-gray-600">
                    💡 <span className="text-orange-600">Professional Tip:</span> Enter the original price and selling price. 
                    The discount percentage is calculated automatically: 
                    <span className="font-black"> ((Original - Selling) / Original) × 100</span>
                  </p>
                </div>
              </div>

              {/* Category - REQUIRED - UPDATED to use categoryId */}
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  className={inputClass}
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  disabled={isActuallyUploading}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formData.categoryId && (
                  <p className="mt-2 text-xs font-bold text-green-600">
                    Selected: {categories.find(c => String(c.id) === String(formData.categoryId))?.name || 'Unknown'}
                  </p>
                )}
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Category is required for proper product organization and filtering
                </p>
              </div>

              {/* Gallery Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    Gallery Images * (Max 10)
                    <span className="text-gray-400 font-normal ml-2">
                      {formData.images.length}/10
                    </span>
                  </label>
                  {formData.images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        addDebugLog('Cleared all gallery images');
                        setFormData(prev => ({ ...prev, images: [] }));
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                      disabled={isActuallyUploading}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {formData.images.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group bg-gray-50 transition-all duration-300 hover:border-orange-400 hover:shadow-lg"
                    >
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Use WatermarkedImage for preview in admin too */}
                        <WatermarkedImage
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          containerClass="w-full h-full"
                          productId={`temp-${index}`}
                          isProduct={true}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index, 'gallery')}
                        className="absolute top-1 right-1 bg-black/80 text-white w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isActuallyUploading}
                        title="Remove image"
                      >
                        &times;
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-[10px] text-white font-bold text-center">
                          {index === 0 ? 'Main Image' : `Image #${index + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {formData.images.length < 10 && (
                    <label className={`aspect-square border-2 border-dashed ${
                      isActuallyUploading ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-orange-500 cursor-pointer'
                    } rounded-xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}>
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 mb-2 border border-gray-100">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-center px-2">
                        {isActuallyUploading ? 'Uploading...' : 
                          formData.images.length === 0 
                            ? 'Click to upload images' 
                            : `Add more (${10 - formData.images.length} left)`
                        }
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'image')}
                        disabled={isActuallyUploading}
                        id="gallery-upload-input"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Product Video */}
              <div className="space-y-4">
                <label className={labelClass}>Product Video (Optional)</label>
                
                {formData.videoUrl ? (
                  <div className="relative group">
                    <div className="aspect-video rounded-xl overflow-hidden bg-black border-2 border-gray-200">
                      <VideoPlayer
                        src={formData.videoUrl}
                        containerClass="w-full h-full"
                        controls={true}
                        playInline={true}
                        autoPlay={false}
                      />
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase shadow-lg hover:bg-red-700 transition-colors"
                        disabled={isActuallyUploading}
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={`w-full aspect-video border-2 border-dashed ${
                    isActuallyUploading ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-orange-500 cursor-pointer'
                  } rounded-xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-500 mb-3 border border-gray-100">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                      Upload Product Video
                    </span>
                    <p className="text-[10px] text-gray-500 text-center px-4">
                      MP4, MOV, or WebM format • Max 100MB
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'video')}
                      disabled={isActuallyUploading}
                    />
                  </label>
                )}
              </div>

              {/* Description Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    Description Gallery (Optional)
                    <span className="text-gray-400 font-normal ml-2">
                      {formData.descriptionImages.length}/20
                    </span>
                  </label>
                  {formData.descriptionImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        addDebugLog('Cleared all description images');
                        setFormData(prev => ({ ...prev, descriptionImages: [] }));
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                      disabled={isActuallyUploading}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {formData.descriptionImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group bg-gray-50 transition-all duration-300 hover:border-purple-400 hover:shadow-lg"
                    >
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Use WatermarkedImage for description images too */}
                        <WatermarkedImage
                          src={url}
                          alt={`Description ${index + 1}`}
                          containerClass="w-full h-full"
                          productId={`desc-${index}`}
                          isProduct={true}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index, 'desc')}
                        className="absolute top-1 right-1 bg-black/80 text-white w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isActuallyUploading}
                        title="Remove image"
                      >
                        &times;
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-[10px] text-white font-bold text-center">
                          Desc #{index + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {formData.descriptionImages.length < 20 && (
                    <label className={`aspect-square border-2 border-dashed ${
                      isActuallyUploading ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-purple-500 cursor-pointer'
                    } rounded-xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}>
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 mb-2 border border-gray-100">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-center px-2">
                        {isActuallyUploading ? 'Uploading...' : 
                          formData.descriptionImages.length === 0 
                            ? 'Click to add description images' 
                            : `Add more (${20 - formData.descriptionImages.length} left)`
                        }
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'desc_image')}
                        disabled={isActuallyUploading}
                      />
                    </label>
                  )}
                </div>
                
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  These images appear at the bottom of the product description section.
                </p>
              </div>

              {/* Professional Features Summary */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 uppercase tracking-wide mb-3">
                  🚀 Professional Features Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="green">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Automatic Discount Calculation</p>
                      <p className="text-[10px] text-gray-500">Discount % calculated from original & selling price</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="green">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Real View Counter</p>
                      <p className="text-[10px] text-gray-500">Starts at 0, increments on each view</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="green">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Category Management</p>
                      <p className="text-[10px] text-gray-500">Required for proper product organization</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="green">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Professional Pricing</p>
                      <p className="text-[10px] text-gray-500">Original price + Selling price = Automatic discount</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-gray-100 text-gray-700 font-black py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isActuallyUploading}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isActuallyUploading}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {isActuallyUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>UPLOADING... ({uploadingCount})</span>
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M8 17l4 4 4-4m-4-5v9"></path>
                          <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"></path>
                        </svg>
                        <span>PUBLISH PRODUCT WITH PROFESSIONAL PRICING</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
