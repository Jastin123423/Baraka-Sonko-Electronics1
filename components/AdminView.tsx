// AdminView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, AdminStats } from '../types';

interface AdminViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<void> | void;
  onEditProduct?: (product: Product) => void;
  WatermarkedImage: React.ComponentType<any>;
  VideoPlayer: React.ComponentType<any>;
  Banner: React.ComponentType<any>;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'withdraw';
type UploadType = 'image' | 'video' | 'desc_image';
type EditMode = 'create' | 'edit';
type AnalyticsRange = 'week' | 'month' | 'year' | 'custom';

type ProductImageItem = {
  url: string;
  price: string;
  label?: string;
  isMain?: boolean;
};

type ViewsAnalytics = {
  totalViews: number;
  lifetimeViews: number;
  from?: string;
  to?: string;
  series?: Array<{
    date: string;
    views: number;
  }>;
  monthlySeries?: Array<{
    month: string;
    views: number;
  }>;
  topProducts?: Array<{
    productId: string;
    title: string;
    views: number;
  }>;
};

const AdminView: React.FC<AdminViewProps> = ({
  products,
  categories,
  onAddProduct,
  onDeleteProduct,
  onEditProduct,
  WatermarkedImage,
  VideoPlayer,
  Banner,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('create');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('week');
  const [viewsAnalytics, setViewsAnalytics] = useState<ViewsAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [selectedYear, setSelectedYear] = useState(() => String(today.getFullYear()));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: '',
    sellingPrice: '',
    categoryId: '',
    videoUrl: '',
    images: [] as ProductImageItem[],
    descriptionImages: [] as string[],
  });

  const formatDateInput = (d: Date) => d.toISOString().slice(0, 10);

  const getWeekRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);

    return {
      from: formatDateInput(start),
      to: formatDateInput(end),
    };
  };

  const getMonthRange = (monthValue: string) => {
    const [yearStr, monthStr] = monthValue.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;

    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);

    return {
      from: formatDateInput(start),
      to: formatDateInput(end),
    };
  };

  const getYearRange = (yearValue: string) => {
    const year = Number(yearValue);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    return {
      from: formatDateInput(start),
      to: formatDateInput(end),
    };
  };

  const rangeLabel = useMemo(() => {
    if (analyticsRange === 'week') return 'Last 7 Days';
    if (analyticsRange === 'month') return selectedMonth;
    return selectedYear;
  }, [analyticsRange, selectedMonth, selectedYear]);

  const calculateDiscountPercentage = () => {
    const originalPrice = parseFloat(formData.originalPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);

    if (!originalPrice || originalPrice <= 0 || !sellingPrice || sellingPrice <= 0) {
      return 0;
    }

    if (sellingPrice >= originalPrice) {
      return 0;
    }

    const discount = ((originalPrice - sellingPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

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

  const isActuallyUploading = uploadingCount > 0;

  const addDebugLog = (message: string) => {
    console.log(`🔍 ${message}`);
    setDebugLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const fetchViewsAnalytics = async (from: string, to: string) => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError('');

      const params = new URLSearchParams({ from, to });
      const response = await fetch(`/api/admin/views-analytics?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch views analytics');
      }

      const data = await response.json();

      if (!data?.success) {
        throw new Error(data?.error || 'Invalid analytics response');
      }

      const rawSeries = Array.isArray(data.data?.series) ? data.data.series : [];

      let monthlySeries: Array<{ month: string; views: number }> = [];

      if (analyticsRange === 'year') {
        const monthMap = new Map<string, number>();

        for (let i = 1; i <= 12; i++) {
          const mm = String(i).padStart(2, '0');
          monthMap.set(`${selectedYear}-${mm}`, 0);
        }

        rawSeries.forEach((item: any) => {
          const date = String(item.date || '');
          const monthKey = date.slice(0, 7);
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + Number(item.views || 0));
        });

        monthlySeries = Array.from(monthMap.entries()).map(([month, views]) => ({
          month,
          views,
        }));
      }

      setViewsAnalytics({
        totalViews: Number(data.data?.totalViews || 0),
        lifetimeViews: Number(data.data?.lifetimeViews || 0),
        from: data.data?.from,
        to: data.data?.to,
        series: rawSeries,
        monthlySeries,
        topProducts: Array.isArray(data.data?.topProducts) ? data.data.topProducts : [],
      });
    } catch (error: any) {
      console.error('Error fetching views analytics:', error);
      setAnalyticsError(error?.message || 'Failed to load views analytics');
      setViewsAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
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

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    if (analyticsRange === 'week') {
      const { from, to } = getWeekRange();
      fetchViewsAnalytics(from, to);
      return;
    }

    if (analyticsRange === 'month') {
      const { from, to } = getMonthRange(selectedMonth);
      fetchViewsAnalytics(from, to);
      return;
    }

    if (analyticsRange === 'year') {
      const { from, to } = getYearRange(selectedYear);
      fetchViewsAnalytics(from, to);
    }
  }, [activeTab, analyticsRange, selectedMonth, selectedYear]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((category) => {
      const name = String(category.name || '').toLowerCase();
      const id = String(category.id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [categories, categorySearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) => {
      const title = String(product.title || '').toLowerCase();
      const categoryName = String(
        (product as any).category_name ||
          product.categoryName ||
          product.category ||
          ''
      ).toLowerCase();
      const id = String(product.id || '').toLowerCase();

      return title.includes(q) || categoryName.includes(q) || id.includes(q);
    });
  }, [products, productSearch]);

  const selectedCategoryName =
    categories.find(c => String(c.id) === String(formData.categoryId))?.name || '';

  const closeForm = () => {
    setIsAdding(false);
    setEditMode('create');
    setEditingProductId(null);
    setCategorySearch('');
    setFormData({
      title: '',
      description: '',
      originalPrice: '',
      sellingPrice: '',
      categoryId: '',
      videoUrl: '',
      images: [],
      descriptionImages: [],
    });
    setUploadError('');
  };

  const loadProductForEdit = (product: Product) => {
    const images: ProductImageItem[] = [];

    if ((product as any).imageVariants && Array.isArray((product as any).imageVariants)) {
      (product as any).imageVariants.forEach((variant: any, index: number) => {
        images.push({
          url: variant.url || '',
          price: String(variant.price || product.sellingPrice || product.price || ''),
          label: variant.label || '',
          isMain: variant.isMain || index === 0,
        });
      });
    } else {
      const productImages = (product as any).images || (product as any).image_urls || [];
      if (Array.isArray(productImages) && productImages.length > 0) {
        productImages.forEach((url: string, index: number) => {
          images.push({
            url: String(url),
            price: String(product.sellingPrice || product.price || ''),
            label: '',
            isMain: index === 0,
          });
        });
      } else if (product.image) {
        images.push({
          url: product.image,
          price: String(product.sellingPrice || product.price || ''),
          label: '',
          isMain: true,
        });
      }
    }

    const descImages =
      (product as any).descriptionImages ||
      (product as any).description_images ||
      [];

    setFormData({
      title: product.title || '',
      description: product.description || '',
      originalPrice: String(
        (product as any).originalPrice ||
          (product as any).original_price ||
          product.price ||
          ''
      ),
      sellingPrice: String(product.sellingPrice || product.price || ''),
      categoryId: String((product as any).categoryId || (product as any).category_id || ''),
      videoUrl: (product as any).videoUrl || (product as any).video_url || '',
      images,
      descriptionImages: Array.isArray(descImages) ? descImages.map(String) : [],
    });

    setEditMode('edit');
    setEditingProductId(product.id);
    setIsAdding(true);
    setCategorySearch('');
  };

  const uploadSingleFile = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const uniqueFilename = `${timestamp}-${randomStr}-${safeFilename}`;
    const progressKey = `${uniqueFilename}-${timestamp}`;

    addDebugLog(
      `Starting upload: ${file.name} (type: "${file.type}", size: ${file.size} bytes)`
    );
    addDebugLog(`Generated filename: ${uniqueFilename}`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

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
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[progressKey];
          return next;
        });
        setUploadingCount(c => Math.max(0, c - 1));
      };

      xhr.addEventListener('load', () => {
        cleanup();

        addDebugLog(`Upload response for ${file.name}: HTTP ${xhr.status}`);
        addDebugLog(`Response preview: ${xhr.responseText?.slice(0, 200)}`);

        let response: any = null;
        try {
          response = JSON.parse(xhr.responseText);
          addDebugLog(
            `Parsed JSON response for ${file.name}: ${JSON.stringify(response).slice(0, 100)}`
          );
        } catch {
          addDebugLog(
            `❌ JSON parse error for ${file.name}: ${xhr.responseText?.slice(0, 100)}`
          );
          return reject(
            new Error(
              `Upload failed: server returned non-JSON (HTTP ${xhr.status}). Check /api/upload endpoint.`
            )
          );
        }

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

      const endpoint = new URL('/api/upload', window.location.origin);
      endpoint.searchParams.set('filename', uniqueFilename);

      addDebugLog(`Making request to: ${endpoint.toString()}`);

      xhr.open('POST', endpoint.toString());
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: UploadType
  ) => {
    setUploadError('');

    addDebugLog(`handleFileUpload triggered for ${type}`);

    const files = e.currentTarget.files;
    const fileList: File[] = files ? Array.from(files) : [];

    if (fileList.length === 0) {
      addDebugLog('❌ No files selected or picker cancelled');
      return;
    }

    e.currentTarget.value = '';
    setUploadProgress({});

    try {
      const uploadedUrls: string[] = [];

      addDebugLog(`Processing ${fileList.length} file(s) for ${type}`);

      for (const file of fileList) {
        const fileName = file.name.toLowerCase();

        if (type === 'image' || type === 'desc_image') {
          const looksLikeImage =
            file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName);

          if (!looksLikeImage) {
            throw new Error(`Invalid file type: ${file.name}. Please upload images only.`);
          }
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`Image too large: ${file.name}. Maximum size is 10MB.`);
          }
        } else if (type === 'video') {
          const looksLikeVideo =
            file.type.startsWith('video/') ||
            /\.(mp4|mov|webm|m4v|avi|mkv|flv|wmv)$/i.test(fileName);

          if (!looksLikeVideo) {
            throw new Error(`Invalid file type: ${file.name}. Please upload videos only.`);
          }
          if (file.size > 100 * 1024 * 1024) {
            throw new Error(`Video too large: ${file.name}. Maximum size is 100MB.`);
          }
        }
      }

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

      if (type === 'image') {
        setFormData(prev => {
          const existing = prev.images.length;
          const newImages: ProductImageItem[] = [
            ...prev.images,
            ...uploadedUrls.map((url, index) => ({
              url,
              price: prev.sellingPrice || '',
              label: '',
              isMain: existing === 0 && index === 0,
            })),
          ].slice(0, 10);

          const hasMain = newImages.some(img => img.isMain);
          const normalized = hasMain
            ? newImages
            : newImages.map((img, i) => ({ ...img, isMain: i === 0 }));

          addDebugLog(`Setting ${normalized.length} images (${uploadedUrls.length} new)`);

          return {
            ...prev,
            images: normalized,
          };
        });
      } else if (type === 'desc_image') {
        setFormData(prev => ({
          ...prev,
          descriptionImages: [...prev.descriptionImages, ...uploadedUrls].slice(0, 20),
        }));
      } else if (type === 'video') {
        if (uploadedUrls.length > 0) {
          setFormData(prev => ({ ...prev, videoUrl: uploadedUrls[0] }));
        }
      }

      addDebugLog(`✅ Successfully updated form state for ${type}`);
    } catch (err: any) {
      const errorMessage =
        err?.message || 'Upload failed. Please check your connection and try again.';
      addDebugLog(`❌ Error: ${errorMessage}`);
      setUploadError(errorMessage);
    } finally {
      setUploadProgress({});
    }
  };

  const removeImage = (index: number, type: 'gallery' | 'desc') => {
    if (type === 'gallery') {
      setFormData(prev => {
        const nextImages = prev.images.filter((_, i) => i !== index);
        const normalized = nextImages.map((img, i) => ({
          ...img,
          isMain: i === 0,
        }));

        return {
          ...prev,
          images: normalized,
        };
      });
      addDebugLog(`Removed gallery image at index ${index}`);
    } else {
      setFormData(prev => ({
        ...prev,
        descriptionImages: prev.descriptionImages.filter((_, i) => i !== index),
      }));
      addDebugLog(`Removed description image at index ${index}`);
    }
  };

  const updateImagePrice = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, price: value } : img)),
    }));
  };

  const updateImageLabel = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, label: value } : img)),
    }));
  };

  const setMainImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isMain: i === index,
      })),
    }));
  };

  const syncEmptyImagePricesWithSellingPrice = (newSellingPrice: string) => {
    setFormData(prev => ({
      ...prev,
      sellingPrice: newSellingPrice,
      images: prev.images.map(img => ({
        ...img,
        price: img.price || newSellingPrice,
      })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isActuallyUploading) {
      alert('⏳ Please wait for all uploads to finish before publishing');
      return;
    }

    const mainImageObj =
      formData.images.find(img => img.isMain) || formData.images[0] || formData.images.at(-1);

    const mainImage = mainImageObj?.url || '';

    if (!mainImage) {
      alert('❌ At least one main image is required');
      return;
    }

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

    if (!formData.categoryId) {
      alert('❌ Please select a category');
      return;
    }

    const selectedCat = categories.find(c => String(c.id) === String(formData.categoryId));
    if (!selectedCat) {
      alert('❌ Please select a valid category');
      return;
    }

    const discountPercentage = calculateDiscountPercentage();
    const discountAmount = calculateDiscountAmount();

    try {
      const imageVariants = formData.images.map((img, index) => ({
        url: img.url,
        price: Number(img.price || formData.sellingPrice || 0),
        label: img.label || '',
        isMain: !!img.isMain,
        position: index,
      }));

      const payload = {
        ...(editMode === 'edit' && editingProductId ? { id: editingProductId } : {}),
        title: formData.title.trim(),
        description: formData.description,

        image: mainImage,
        image_url: mainImage,
        images: formData.images.map(img => img.url),
        image_urls: formData.images.map(img => img.url),

        imageVariants,
        image_variants: imageVariants,

        descriptionImages: formData.descriptionImages,
        description_images: formData.descriptionImages,

        videoUrl: formData.videoUrl || '',
        video_url: formData.videoUrl || '',

        originalPrice,
        sellingPrice,
        price: sellingPrice,

        discountAmount,
        discount: discountPercentage,

        category_id: String(selectedCat.id),
        categoryId: String(selectedCat.id),
        category_name: selectedCat.name,
        categoryName: selectedCat.name,
        category: selectedCat.name,

        views: 0,
        viewCount: 0,

        rating: 5.0,
        status: 'online',
      };

      let success = false;

      if (editMode === 'edit' && editingProductId) {
        const response = await fetch(`/api/products?id=${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => null);
        success = result?.success === true;

        if (success && onEditProduct && result.data) {
          onEditProduct(result.data);
        }
      } else {
        success = await onAddProduct(payload as any);
      }

      if (success) {
        closeForm();
        alert(
          editMode === 'edit'
            ? '✅ Product updated successfully!'
            : '✅ Product published successfully!'
        );
      } else {
        alert(`❌ Failed to ${editMode === 'edit' ? 'update' : 'save'} product. Please try again.`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('❌ An unexpected error occurred. Please try again.');
    }
  };

  const handleMenuClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === productId ? null : productId);
  };

  const handleDelete = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this product?')) {
      await onDeleteProduct(productId);
    }
    setActiveMenuId(null);
  };

  const handleEdit = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    loadProductForEdit(product);
    setActiveMenuId(null);
  };

  const getTotalUploadProgress = () => {
    const values = Object.values(uploadProgress);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const inputClass =
    'w-full bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-base font-bold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all duration-200 shadow-sm';

  const descriptionTextareaClass =
    'w-full bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-base text-gray-800 font-normal leading-7 outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all duration-200 resize-y shadow-sm';

  const labelClass =
    'block text-[11px] font-black text-[#6B7280] uppercase mb-2 ml-1 tracking-[0.12em]';

  const isDev =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFF7F0_0%,#FFF2E8_35%,#FFF9F5_100%)]">
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

      <div className="sticky top-0 z-20 bg-[linear-gradient(90deg,#FF6A00_0%,#FF7C1F_45%,#FF9A3D_100%)] text-white shadow-[0_10px_30px_rgba(255,106,0,0.22)] border-b border-orange-300/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-black">SS</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight truncate">Baraka Sonko Admin</h1>
                <p className="text-xs text-orange-100 truncate">Sonko management panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold">
                {products.length} Products
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold">
                ©BarakaSonko
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[74px] z-10 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm px-3">
        <div className="flex space-x-6 py-4 overflow-x-auto no-scrollbar">
          {(['dashboard', 'products', 'orders', 'withdraw'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] font-black uppercase tracking-[0.18em] transition-all relative pb-2 whitespace-nowrap ${
                activeTab === tab ? 'text-[#FF6A00]' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6A00] to-[#FF9A3D] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-12 max-w-5xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-gray-800">Dashboard Overview</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track total views by week, month, or year
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-4 md:p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {(['week', 'month', 'year'] as Array<'week' | 'month' | 'year'>).map((range) => (
                  <button
                    key={range}
                    onClick={() => setAnalyticsRange(range)}
                    className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] transition-all ${
                      analyticsRange === range
                        ? 'bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white shadow-[0_10px_24px_rgba(255,106,0,0.22)]'
                        : 'bg-white text-gray-600 border border-orange-100 hover:border-orange-300'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {analyticsRange === 'week' && (
                <div className="rounded-2xl border border-orange-100 bg-[#FFF9F5] px-4 py-3">
                  <p className="text-sm font-bold text-gray-700">
                    Showing last 7 days automatically
                  </p>
                </div>
              )}

              {analyticsRange === 'month' && (
                <div className="max-w-sm">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 shadow-sm"
                  />
                </div>
              )}

              {analyticsRange === 'year' && (
                <div className="max-w-sm">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                    Select Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 shadow-sm"
                  >
                    {Array.from({ length: 6 }).map((_, i) => {
                      const year = String(new Date().getFullYear() - i);
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <p className="text-xs text-gray-500 font-semibold">
                Showing: <span className="text-[#FF6A00] font-black">{rangeLabel}</span>
              </p>
            </div>

            {stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="rounded-3xl border border-orange-100 bg-white shadow-[0_6px_20px_rgba(255,106,0,0.06)] p-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                    Total Products
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {stats.totalProducts?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-white shadow-[0_6px_20px_rgba(255,106,0,0.06)] p-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                    Net Sales
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    TSh {stats.netSales?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-[linear-gradient(135deg,#FFF7F0_0%,#FFFFFF_100%)] shadow-[0_6px_20px_rgba(255,106,0,0.08)] p-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                    Earnings
                  </p>
                  <p className="text-3xl font-black text-[#FF6A00]">
                    TSh {stats.earnings?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-[linear-gradient(135deg,#FFF5F0_0%,#FFFFFF_100%)] shadow-[0_6px_20px_rgba(255,106,0,0.08)] p-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                    {analyticsRange === 'week'
                      ? 'Week Views'
                      : analyticsRange === 'month'
                        ? 'Month Views'
                        : 'Year Views'}
                  </p>
                  <p className="text-3xl font-black text-[#FF6A00]">
                    {analyticsLoading ? '...' : viewsAnalytics?.totalViews?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-white shadow-[0_6px_20px_rgba(255,106,0,0.06)] p-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                    Lifetime Views
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {analyticsLoading
                      ? '...'
                      : viewsAnalytics?.lifetimeViews?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center border border-orange-100 shadow-sm">
                <div className="inline-block w-8 h-8 border-[3px] border-gray-300 border-t-[#FF6A00] rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Loading dashboard data...</p>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-gray-800">
                    {analyticsRange === 'year' ? 'Views by Month' : 'Views Breakdown'}
                  </h2>
                  <span className="text-xs font-black px-3 py-1.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-100">
                    {rangeLabel}
                  </span>
                </div>

                {analyticsError ? (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-bold text-red-700">
                    {analyticsError}
                  </div>
                ) : analyticsLoading ? (
                  <div className="py-12 text-center text-gray-400">
                    <div className="inline-block w-8 h-8 border-[3px] border-gray-300 border-t-[#FF6A00] rounded-full animate-spin mb-4" />
                    <p className="font-bold">Loading views analytics...</p>
                  </div>
                ) : analyticsRange === 'week' ? (
                  viewsAnalytics?.series?.length ? (
                    <div className="space-y-3">
                      {viewsAnalytics.series.map((item, index) => (
                        <div
                          key={`${item.date}-${index}`}
                          className="flex items-center justify-between rounded-2xl border border-orange-100 bg-[#FFF9F5] px-4 py-3"
                        >
                          <span className="text-sm font-bold text-gray-700">{item.date}</span>
                          <span className="text-sm font-black text-[#FF6A00]">
                            {Number(item.views || 0).toLocaleString()} views
                          </span>
                        </div>
                      ))}

                      <div className="mt-4 rounded-2xl bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white px-4 py-4 flex items-center justify-between">
                        <span className="text-sm font-black uppercase tracking-wide">
                          Total Week Views
                        </span>
                        <span className="text-lg font-black">
                          {Number(viewsAnalytics?.totalViews || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      <p className="font-bold">No views found in last 7 days</p>
                    </div>
                  )
                ) : analyticsRange === 'month' ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-orange-100 bg-[#FFF9F5] px-4 py-5">
                      <p className="text-xs font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
                        Selected Month
                      </p>
                      <p className="text-lg font-black text-gray-800">{selectedMonth}</p>
                    </div>

                    <div className="rounded-2xl bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white px-4 py-5 flex items-center justify-between">
                      <span className="text-sm font-black uppercase tracking-wide">
                        Total Month Views
                      </span>
                      <span className="text-2xl font-black">
                        {Number(viewsAnalytics?.totalViews || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : viewsAnalytics?.monthlySeries?.length ? (
                  <div className="space-y-3">
                    {viewsAnalytics.monthlySeries.map((item, index) => (
                      <div
                        key={`${item.month}-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-orange-100 bg-[#FFF9F5] px-4 py-3"
                      >
                        <span className="text-sm font-bold text-gray-700">{item.month}</span>
                        <span className="text-sm font-black text-[#FF6A00]">
                          {Number(item.views || 0).toLocaleString()} views
                        </span>
                      </div>
                    ))}

                    <div className="mt-4 rounded-2xl bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white px-4 py-4 flex items-center justify-between">
                      <span className="text-sm font-black uppercase tracking-wide">
                        Total Year Views
                      </span>
                      <span className="text-lg font-black">
                        {Number(viewsAnalytics?.totalViews || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <p className="font-bold">No monthly views found for selected year</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-gray-800">Top Viewed Products</h2>
                  <span className="text-xs font-black px-3 py-1.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-100">
                    Top 10
                  </span>
                </div>

                {analyticsLoading ? (
                  <div className="py-12 text-center text-gray-400">
                    <div className="inline-block w-8 h-8 border-[3px] border-gray-300 border-t-[#FF6A00] rounded-full animate-spin mb-4" />
                    <p className="font-bold">Loading top products...</p>
                  </div>
                ) : viewsAnalytics?.topProducts?.length ? (
                  <div className="space-y-3">
                    {viewsAnalytics.topProducts.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white px-4 py-3"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-black text-gray-800 truncate">
                            #{index + 1} {item.title || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            Product ID: {item.productId}
                          </p>
                        </div>

                        <span className="text-sm font-black text-[#FF6A00] shrink-0">
                          {Number(item.views || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <p className="font-bold">No top products yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-xl font-black text-gray-800">Products Management</h1>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={() => {
                    setEditMode('create');
                    setEditingProductId(null);
                    setIsAdding(true);
                    setCategorySearch('');
                  }}
                  className="bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white font-black py-3 px-6 rounded-2xl shadow-[0_10px_24px_rgba(255,106,0,0.22)] hover:shadow-[0_14px_28px_rgba(255,106,0,0.28)] active:scale-[0.98] transition-all"
                >
                  + ADD NEW PRODUCT
                </button>
              </div>
            </div>

            {/* Prominent Search Section - Moved below ADD NEW PRODUCT button */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-200 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-6 h-6 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                </svg>
                <span className="text-sm font-black text-gray-700 uppercase tracking-wide">Search Products</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by product title, category name, or product ID..."
                  className="w-full rounded-2xl border-2 border-orange-200 bg-white pl-12 pr-4 py-4 text-base font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 shadow-md transition-all"
                  autoFocus={false}
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {productSearch && (
                <div className="mt-3 text-sm font-semibold text-[#FF6A00]">
                  Found {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{productSearch}"
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-[0_8px_24px_rgba(255,106,0,0.05)]">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="font-bold">
                    {products.length === 0 ? 'No products yet' : 'No matching products'}
                  </p>
                  <p className="text-sm mt-1">
                    {products.length === 0
                      ? 'Start by adding your first product'
                      : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-orange-100">
                  {filteredProducts.map(product => {
                    const originalPriceNumber = Number((product as any).originalPrice ?? 0);
                    const sellingPriceNumber = Number(
                      (product as any).sellingPrice ?? (product as any).price ?? 0
                    );
                    const displaySellingPrice = Number.isFinite(sellingPriceNumber)
                      ? sellingPriceNumber.toLocaleString()
                      : '0';
                    const displayOriginalPrice = Number.isFinite(originalPriceNumber)
                      ? originalPriceNumber.toLocaleString()
                      : '0';

                    const discount =
                      product.discount ||
                      (originalPriceNumber > sellingPriceNumber
                        ? Math.round(
                            ((originalPriceNumber - sellingPriceNumber) / originalPriceNumber) *
                              100
                          )
                        : 0);

                    return (
                      <div
                        key={product.id}
                        className="p-4 flex items-center space-x-4 hover:bg-[#FFF9F5] transition-colors relative"
                      >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-orange-200 bg-white shadow-sm">
                          <WatermarkedImage
                            src={
                              product.image ||
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGM0YzRjMiLz48cGF0aCBkPSJNMzUgNDVINTVWNjVINzVMNTAgODBMNTUgNzVMMzUgNTVWNDVaIiBmaWxsPSIjQ0NDIi8+PC9zdmc+'
                            }
                            alt={product.title}
                            containerClass="w-full h-full"
                            productId={product.id}
                            isProduct={true}
                          />
                        </div>

                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold truncate text-gray-900">
                            {product.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {discount > 0 ? (
                              <>
                                <p className="text-xs font-black text-[#FF6A00]">
                                  TSh {displaySellingPrice}
                                </p>
                                <p className="text-xs font-black text-gray-400 line-through">
                                  TSh {displayOriginalPrice}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs font-black text-[#FF6A00]">
                                TSh {displaySellingPrice}
                              </p>
                            )}

                            {discount > 0 && (
                              <span className="text-[10px] font-black bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                                -{discount}%
                              </span>
                            )}

                            <div className="flex items-center space-x-1 text-gray-500">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              <span className="text-xs font-bold">
                                {product.views?.toLocaleString() ||
                                  product.viewCount?.toLocaleString() ||
                                  '0'}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                product.status === 'online'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {product.status}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Category:{' '}
                            {(product as any).category_name ||
                              product.categoryName ||
                              product.category ||
                              'Uncategorized'}
                          </p>
                        </div>

                        <div className="relative">
                          <button
                            onClick={(e) => handleMenuClick(e, product.id)}
                            className="p-2 rounded-xl hover:bg-orange-100 transition-colors"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="1" fill="currentColor" />
                              <circle cx="12" cy="5" r="1" fill="currentColor" />
                              <circle cx="12" cy="19" r="1" fill="currentColor" />
                            </svg>
                          </button>

                          {activeMenuId === product.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-orange-100 py-2 z-50 overflow-hidden">
                              <button
                                onClick={(e) => handleEdit(e, product)}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 flex items-center space-x-3"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, product.id)}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center space-x-3"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 text-center py-2">
              <span className="text-xs text-gray-400">©SonkoSound - Product images protected</span>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-orange-100 shadow-sm">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="font-bold">Orders Management</p>
            <p className="text-sm mt-1">Coming soon...</p>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-orange-100 shadow-sm">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="font-bold">Withdraw Earnings</p>
            <p className="text-sm mt-1">Coming soon...</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/75 z-[110] flex flex-col">
          <div className="bg-[linear-gradient(180deg,#FFF9F5_0%,#FFFFFF_35%,#FFF8F2_100%)] w-full h-full p-4 md:p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-orange-100">
              <h2 className="text-xl md:text-2xl font-black text-gray-800">
                {editMode === 'edit' ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeForm}
                className="text-3xl font-light text-gray-400 hover:text-gray-700 transition-colors"
                disabled={isActuallyUploading}
              >
                &times;
              </button>
            </div>

            {editMode === 'edit' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-sm font-black text-blue-800">
                  ✏️ Editing Product: {formData.title}
                </p>
              </div>
            )}

            {uploadError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-black text-red-800">Upload Error</h3>
                    <div className="mt-1 text-sm text-red-700">{uploadError}</div>
                  </div>
                </div>
              </div>
            )}

            {isActuallyUploading && Object.keys(uploadProgress).length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
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
                  />
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Please wait for uploads to complete before publishing
                </p>
              </div>
            )}

            {(formData.images.length > 0 ||
              formData.videoUrl ||
              formData.descriptionImages.length > 0) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 uppercase tracking-wide mb-3">
                  📸 Upload Summary
                </h4>
                <div className="flex flex-wrap gap-4">
                  {formData.images.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-black text-blue-600">
                          {formData.images.length}
                        </span>
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

            {(formData.originalPrice || formData.sellingPrice) && (
              <div className="mb-6 p-4 bg-green-50 rounded-2xl border border-green-100">
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
                    <p className="text-lg font-black text-[#FF6A00]">
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
                      💡 Discount calculated automatically: ({formData.originalPrice} -{' '}
                      {formData.sellingPrice}) / {formData.originalPrice} × 100 ={' '}
                      {calculateDiscountPercentage()}%
                    </p>
                  </div>
                )}
                {formData.originalPrice &&
                  formData.sellingPrice &&
                  calculateDiscountPercentage() === 0 && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs font-bold text-gray-500 text-center">
                        ℹ️ No discount applied - selling price equals original price
                      </p>
                    </div>
                  )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Basic Information
                </h3>

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
                    className={`${descriptionTextareaClass} min-h-[180px]`}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder={`Describe your product in detail...

Example:
1. Strong leather material
2. Available in black and brown
3. Durable zip and inner pockets

This bag is suitable for office work, travel, and daily use.

Package includes:
- 1 bag
- 1 shoulder strap`}
                    disabled={isActuallyUploading}
                    rows={8}
                    spellCheck={true}
                  />
                  <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Line breaks and paragraphs will be kept as written.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Professional Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Original Price (TSh) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                        TSh
                      </span>
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
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                        TSh
                      </span>
                      <input
                        type="number"
                        className={`${inputClass} pl-12`}
                        value={formData.sellingPrice}
                        onChange={e => syncEmptyImagePricesWithSellingPrice(e.target.value)}
                        placeholder="8000"
                        min="0"
                        step="100"
                        required
                        disabled={isActuallyUploading}
                      />
                    </div>
                    {formData.originalPrice &&
                      formData.sellingPrice &&
                      calculateDiscountPercentage() > 0 && (
                        <p className="mt-2 text-xs font-bold text-green-600">
                          Discount: -{calculateDiscountPercentage()}% (Save TSh{' '}
                          {calculateDiscountAmount().toLocaleString()})
                        </p>
                      )}
                    {formData.originalPrice &&
                      formData.sellingPrice &&
                      calculateDiscountPercentage() === 0 && (
                        <p className="mt-2 text-xs font-bold text-gray-500">
                          No discount applied
                        </p>
                      )}
                  </div>
                </div>

                <div className="bg-[#FFF7F0] p-3 rounded-xl border border-orange-100">
                  <p className="text-xs font-bold text-gray-600">
                    💡 <span className="text-[#FF6A00]">Professional Tip:</span> Enter the
                    original price first, then the selling price. The discount percentage is
                    calculated automatically:
                    <span className="font-black"> ((Original - Selling) / Original) × 100</span>
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className={labelClass}>Category *</label>
                  <div className="relative w-full max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search category..."
                      className="w-full rounded-xl border border-orange-200 bg-white pl-9 pr-3 py-2.5 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 shadow-sm"
                      disabled={isActuallyUploading}
                    />
                  </div>
                </div>

                <select
                  className={inputClass}
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  disabled={isActuallyUploading}
                  size={Math.min(Math.max(filteredCategories.length + 1, 4), 8)}
                >
                  <option value="">Select Category</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {formData.categoryId && (
                  <p className="mt-2 text-xs font-bold text-green-600">
                    Selected: {selectedCategoryName || 'Unknown'}
                  </p>
                )}

                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Search categories above to reduce scrolling time
                </p>
              </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.images.map((imageItem, index) => (
                    <div
                      key={index}
                      className="relative border-2 border-orange-100 rounded-2xl overflow-hidden group bg-gray-50 transition-all duration-300 hover:border-[#FF6A00] hover:shadow-lg"
                    >
                      <div className="relative aspect-square w-full overflow-hidden">
                        <WatermarkedImage
                          src={imageItem.url}
                          alt={`Gallery ${index + 1}`}
                          containerClass="w-full h-full"
                          productId={`temp-${index}`}
                          isProduct={true}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

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
                            {imageItem.isMain ? 'Main Image' : `Image #${index + 1}`}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 space-y-3 bg-white border-t border-orange-100">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                            Thumbnail Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={imageItem.price}
                            onChange={(e) => updateImagePrice(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100"
                            placeholder="Enter price"
                            disabled={isActuallyUploading}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                            Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={imageItem.label || ''}
                            onChange={(e) => updateImageLabel(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100"
                            placeholder="e.g. Red, XL, 128GB"
                            disabled={isActuallyUploading}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setMainImage(index)}
                          className={`w-full text-[11px] font-black py-2 rounded-xl transition ${
                            imageItem.isMain
                              ? 'bg-[#FF6A00] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          disabled={isActuallyUploading}
                        >
                          {imageItem.isMain ? 'MAIN IMAGE' : 'SET AS MAIN'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {formData.images.length < 10 && (
                    <label
                      className={`aspect-square border-2 border-dashed ${
                        isActuallyUploading
                          ? 'border-gray-200 cursor-not-allowed'
                          : 'border-gray-300 hover:border-[#FF6A00] cursor-pointer'
                      } rounded-2xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 mb-2 border border-gray-100">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-center px-2">
                        {isActuallyUploading
                          ? 'Uploading...'
                          : formData.images.length === 0
                            ? 'Click to upload images'
                            : `Add more (${10 - formData.images.length} left)`}
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

                {formData.images.length > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3">
                    <p className="text-xs font-bold text-orange-700">
                      Each image can have its own price and label for different sizes, colors,
                      storage, or variants.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className={labelClass}>Product Video (Optional)</label>

                {formData.videoUrl ? (
                  <div className="relative group">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-black border-2 border-orange-100">
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
                        className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-red-700 transition-colors"
                        disabled={isActuallyUploading}
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={`w-full aspect-video border-2 border-dashed ${
                      isActuallyUploading
                        ? 'border-gray-200 cursor-not-allowed'
                        : 'border-gray-300 hover:border-[#FF6A00] cursor-pointer'
                    } rounded-2xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#FF6A00] mb-3 border border-gray-100">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
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
                      className="relative aspect-square border-2 border-orange-100 rounded-2xl overflow-hidden group bg-gray-50 transition-all duration-300 hover:border-purple-400 hover:shadow-lg"
                    >
                      <div className="relative w-full h-full overflow-hidden">
                        <WatermarkedImage
                          src={url}
                          alt={`Description ${index + 1}`}
                          containerClass="w-full h-full"
                          productId={`desc-${index}`}
                          isProduct={true}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
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
                    <label
                      className={`aspect-square border-2 border-dashed ${
                        isActuallyUploading
                          ? 'border-gray-200 cursor-not-allowed'
                          : 'border-gray-300 hover:border-purple-500 cursor-pointer'
                      } rounded-2xl flex flex-col items-center justify-center transition-all bg-gray-50/50`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 mb-2 border border-gray-100">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-center px-2">
                        {isActuallyUploading
                          ? 'Uploading...'
                          : formData.descriptionImages.length === 0
                            ? 'Click to add description images'
                            : `Add more (${20 - formData.descriptionImages.length} left)`}
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

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 uppercase tracking-wide mb-3">
                  🚀 Professional Features Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ['Automatic Discount Calculation', 'Discount % calculated from original & selling price'],
                    ['Real View Counter', 'Starts at 0, increments on each view'],
                    ['Category Search + Management', 'Find categories faster and organize products correctly'],
                    ['Per-Image Pricing', 'Every gallery image can have its own price and label'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="green">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{title}</p>
                        <p className="text-[10px] text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-6 pb-4 border-t border-orange-100">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 bg-gray-100 text-gray-700 font-black py-4 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isActuallyUploading}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isActuallyUploading}
                    className="flex-1 bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white font-black py-4 rounded-2xl shadow-[0_10px_24px_rgba(255,106,0,0.22)] hover:shadow-[0_14px_28px_rgba(255,106,0,0.28)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {isActuallyUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>UPLOADING... ({uploadingCount})</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M8 17l4 4 4-4m-4-5v9"></path>
                          <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"></path>
                        </svg>
                        <span>
                          {editMode === 'edit' ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}
                        </span>
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
