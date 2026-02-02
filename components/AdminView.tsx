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
  const [uploadError, setUploadError] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
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
    
    addDebugLog(`Starting upload: ${file.name} (${file.type}, ${file.size} bytes)`);
    addDebugLog(`Generated filename: ${uniqueFilename}`);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [progressKey]: percentComplete }));
          if (percentComplete % 25 === 0) {
            addDebugLog(`Upload progress ${file.name}: ${percentComplete}%`);
          }
        }
      });

      xhr.addEventListener('load', () => {
        // Clean up progress tracking
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });

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
        addDebugLog(`❌ Network error during upload of ${file.name}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        addDebugLog(`Upload cancelled for ${file.name}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
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
    
    const files = e.target.files;
    console.log("📁 files selected:", files?.length);
    console.log("📁 file details:", files ? Array.from(files).map(f => `${f.name} (${f.type}) ${f.size} bytes`) : null);
    
    if (!files || files.length === 0) {
      addDebugLog('❌ No files selected or picker cancelled');
      return;
    }

    // Reset input to allow same file selection
    e.target.value = '';

    setIsUploading(true);
    setUploadProgress({});

    try {
      const fileList = Array.from(files);
      const uploadedUrls: string[] = [];

      addDebugLog(`Processing ${fileList.length} file(s) for ${type}`);

      // Validate file sizes and types
      for (const file of fileList) {
        if (type === 'image' || type === 'desc_image') {
          if (!file.type.startsWith('image/')) {
            throw new Error(`Invalid file type: ${file.name}. Please upload images only.`);
          }
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`Image too large: ${file.name}. Maximum size is 10MB.`);
          }
        } else if (type === 'video') {
          if (!file.type.startsWith('video/')) {
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

      // Step 3: Debug - Check what we're about to set
      console.log("📊 upload complete. URLs received:", uploadedUrls);
      console.log("📊 current formData.images:", formData.images);
      
      // Update form state based on upload type
      if (type === 'image') {
        const newImages = [...formData.images, ...uploadedUrls].slice(0, 10);
        console.log("🔄 Setting new images array:", newImages);
        addDebugLog(`Setting ${newImages.length} images (${uploadedUrls.length} new)`);
        
        setFormData(prev => ({
          ...prev,
          images: newImages,
        }));
        
        // Verify the update
        setTimeout(() => {
          console.log("✅ formData.images after state update should be:", newImages);
        }, 0);
        
      } else if (type === 'desc_image') {
        const newDescImages = [...formData.descriptionImages, ...uploadedUrls].slice(0, 20);
        console.log("🔄 Setting new descriptionImages:", newDescImages);
        
        setFormData(prev => ({
          ...prev,
          descriptionImages: newDescImages,
        }));
      } else if (type === 'video') {
        if (uploadedUrls.length > 0) {
          console.log("🔄 Setting videoUrl:", uploadedUrls[0]);
          setFormData(prev => ({ ...prev, videoUrl: uploadedUrls[0] }));
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
      setIsUploading(false);
      setUploadProgress({});
      console.log("🏁 handleFileUpload completed");
    }
  };

  // ... rest of the component (removeImage, handleSubmit, etc. remain the same) ...

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

  // ... handleSubmit function remains the same ...

  const getTotalUploadProgress = () => {
    const values = Object.values(uploadProgress);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-base font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200';
  const labelClass = 'block text-xs font-black text-gray-500 uppercase mb-2 ml-1 tracking-wide';

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      {/* Debug Panel - Can be toggled in development */}
      {process.env.NODE_ENV === 'development' && debugLogs.length > 0 && (
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
        {/* ... tabs remain the same ... */}
      </div>

      <div className="p-4 pb-12 max-w-4xl mx-auto">
        {/* ... dashboard, products tabs remain the same ... */}

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
                {/* ... rest of the form remains the same ... */}
                
                {/* Gallery Images Section */}
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
                        disabled={isUploading}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {/* Debug: Show current images state */}
                  {formData.images.length > 0 && process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mb-2">
                      Current images: {formData.images.length} URLs stored
                    </div>
                  )}
                  
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
                          onError={(e) => {
                            console.error(`❌ Image failed to load: ${url}`);
                            addDebugLog(`Image load error: ${url}`);
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGM0YzRjMiLz48cGF0aCBkPSJNMzUgNDVINTVWNjVINzVMNTAgODBMNTUgNzVMMzUgNTVWNDVaIiBmaWxsPSIjQ0NDIi8+PC9zdmc+';
                          }}
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
                          id="gallery-upload-input"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* ... rest of the form remains the same ... */}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
