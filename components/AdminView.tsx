import React, { useState, useEffect } from 'react';
import { Product, Order, AdminStats } from '../types';
import { CATEGORIES } from '../constants';

interface AdminViewProps {
  products: Product[];
  onAddProduct: (product: Product) => Promise<boolean>;
  onDeleteProduct: (id: string) => void;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'withdraw';
type UploadType = 'image' | 'video' | 'desc_image';

const AdminView: React.FC<AdminViewProps> = ({ products, onAddProduct, onDeleteProduct }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discount: '',
    category: '',
    videoUrl: '',
    images: [] as string[],
    descriptionImages: [] as string[],
  });

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
   * Upload single file using RAW binary mode (bypasses multipart parsing issues)
   * This method is more reliable on Cloudflare Pages
   */
  const uploadSingleFile = async (file: File): Promise<string> => {
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/\s+/g, '-')}`;
    
    // Create upload progress tracker
    const progressKey = `${uniqueFilename}-${Date.now()}`;
    
    // Use fetch with progress tracking for better UX
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [progressKey]: percentComplete }));
        }
      });

      xhr.addEventListener('load', async () => {
        try {
          const response = JSON.parse(xhr.responseText);
          
          // Clean up progress tracking
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[progressKey];
            return newProgress;
          });

          if (xhr.status === 200 && response.success && response.data?.[0]) {
            resolve(response.data[0]);
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse upload response'));
        }
      });

      xhr.addEventListener('error', () => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
        reject(new Error('Upload cancelled'));
      });

      // Open connection and set headers
      xhr.open('POST', `/api/upload?filename=${encodeURIComponent(uniqueFilename)}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  };

  /**
   * Handle file upload with RAW binary method for reliability
   */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: UploadType
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Reset input to allow same file selection
    e.target.value = '';

    setIsUploading(true);
    setUploadProgress({});

    try {
      const fileList = Array.from(files);
      const uploadedUrls: string[] = [];

      // Validate file sizes and types before upload
      for (const file of fileList) {
        if (type === 'image' || type === 'desc_image') {
          if (!file.type.startsWith('image/')) {
            throw new Error(`Invalid file type: ${file.name}. Please upload images only.`);
          }
          if (file.size > 10 * 1024 * 1024) { // 10MB limit for images
            throw new Error(`Image too large: ${file.name}. Maximum size is 10MB.`);
          }
        } else if (type === 'video') {
          if (!file.type.startsWith('video/')) {
            throw new Error(`Invalid file type: ${file.name}. Please upload videos only.`);
          }
          if (file.size > 100 * 1024 * 1024) { // 100MB limit for videos
            throw new Error(`Video too large: ${file.name}. Maximum size is 100MB.`);
          }
        }
      }

      // Upload files sequentially for better control
      for (const file of fileList) {
        try {
          const url = await uploadSingleFile(file);
          uploadedUrls.push(url);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}. Please try again.`);
        }
      }

      // Update form state based on upload type
      if (type === 'image') {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls].slice(0, 10), // Max 10 images
        }));
      } else if (type === 'desc_image') {
        setFormData(prev => ({
          ...prev,
          descriptionImages: [...prev.descriptionImages, ...uploadedUrls].slice(0, 20), // Max 20 images
        }));
      } else if (type === 'video') {
        if (uploadedUrls.length > 0) {
          setFormData(prev => ({ ...prev, videoUrl: uploadedUrls[0] }));
        }
      }

    } catch (err: any) {
      // User-friendly error messages
      const errorMessage = err?.message || 'Upload failed. Please check your connection and try again.';
      alert(`❌ ${errorMessage}`);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const removeImage = (index: number, type: 'gallery' | 'desc') => {
    if (type === 'gallery') {
      setFormData(prev => ({ 
        ...prev, 
        images: prev.images.filter((_, i) => i !== index) 
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        descriptionImages: prev.descriptionImages.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      alert('❌ Product title is required');
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      alert('❌ Please enter a valid price');
      return;
    }

    if (formData.images.length === 0) {
      alert('❌ At least one main image is required');
      return;
    }

    if (!formData.category) {
      alert('❌ Please select a category');
      return;
    }

    // Validate discount if provided
    if (formData.discount) {
      const discountValue = parseInt(formData.discount, 10);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        alert('❌ Discount must be a number between 0 and 100');
        return;
      }
    }

    try {
      const productData = {
        id: '', // Generated by backend
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discount: formData.discount ? parseInt(formData.discount, 10) : undefined,
        category: formData.category,
        image: formData.images[0], // First image as main
        images: formData.images,
        descriptionImages: formData.descriptionImages,
        videoUrl: formData.videoUrl || undefined,
        soldCount: 0, // Changed from string to number
        status: 'online' as const,
        createdAt: new Date().toISOString(),
      };

      const success = await onAddProduct(productData);

      if (success) {
        // Reset form on success
        setIsAdding(false);
        setFormData({
          title: '',
          description: '',
          price: '',
          discount: '',
          category: '',
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

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
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
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
                    >
                      <img 
                        src={product.image} 
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                        alt={product.title}
                        loading="lazy"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-bold truncate">{product.title}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <p className="text-xs font-black text-orange-600">
                            TSh {product.price.toLocaleString()}
                          </p>
                          {product.discount && (
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              -{product.discount}%
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            product.status === 'online' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {product.status}
                          </span>
                        </div>
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
                  ))}
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
                disabled={isUploading}
              >
                &times;
              </button>
            </div>

            {/* Upload Progress Indicator */}
            {isUploading && Object.keys(uploadProgress).length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                    Uploading Files...
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
                    disabled={isUploading}
                  />
                </div>

                <div>
                  <label className={labelClass}>Product Description</label>
                  <textarea
                    className={`${inputClass} min-h-[130px] resize-none`}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product in detail..."
                    disabled={isUploading}
                    rows={4}
                  />
                  <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    This description appears on the product page.
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Price (TSh) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">TSh</span>
                      <input
                        type="number"
                        className={`${inputClass} pl-12`}
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="100"
                        required
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Discount (%)</label>
                    <div className="relative">
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">%</span>
                      <input
                        type="number"
                        className={`${inputClass} pr-12`}
                        value={formData.discount}
                        onChange={e => setFormData({ ...formData, discount: e.target.value })}
                        placeholder="0"
                        min="0"
                        max="100"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  className={inputClass}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                  disabled={isUploading}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
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
                      onClick={() => setFormData(prev => ({ ...prev, images: [] }))}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                      disabled={isUploading}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {formData.images.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group bg-gray-50"
                    >
                      <img 
                        src={url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={`Gallery ${index + 1}`}
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, 'gallery')}
                        className="absolute top-1 right-1 bg-black/80 text-white w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isUploading}
                        title="Remove image"
                      >
                        &times;
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-[10px] text-white font-bold text-center">
                          {index === 0 ? 'Main' : `#${index + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {formData.images.length < 10 && (
                    <label className={`aspect-square border-2 border-dashed ${
                      isUploading ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-orange-500 cursor-pointer'
                    } rounded-xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}>
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 mb-2 border border-gray-100">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-center px-2">
                        {isUploading ? 'Uploading...' : 'Add Images'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'image')}
                        disabled={isUploading}
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
                      <video 
                        src={formData.videoUrl} 
                        className="w-full h-full"
                        controls
                        playsInline
                      />
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase shadow-lg hover:bg-red-700 transition-colors"
                        disabled={isUploading}
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={`w-full aspect-video border-2 border-dashed ${
                    isUploading ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-orange-500 cursor-pointer'
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
                      disabled={isUploading}
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
                      onClick={() => setFormData(prev => ({ ...prev, descriptionImages: [] }))}
                      className="text-xs font-bold text-red-600 hover:text-red-700"
                      disabled={isUploading}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {formData.descriptionImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group bg-gray-50"
                    >
                      <img 
                        src={url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={`Description ${index + 1}`}
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, 'desc')}
                        className="absolute top-1 right-1 bg-black/80 text-white w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isUploading}
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
                      isUploading ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-orange-500 cursor-pointer'
                    } rounded-xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}>
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 mb-2 border border-gray-100">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-center px-2">
                        {isUploading ? 'Uploading...' : 'Add Images'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'desc_image')}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
                
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  These images appear at the bottom of the product description section.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-gray-100 text-gray-700 font-black py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isUploading}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>UPLOADING...</span>
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M8 17l4 4 4-4m-4-5v9"></path>
                          <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"></path>
                        </svg>
                        <span>PUBLISH PRODUCT</span>
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
