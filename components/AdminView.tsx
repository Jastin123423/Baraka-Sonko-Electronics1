import React, { useState, useEffect } from 'react';
import { Product, Order, AdminStats } from '../types';
import { CATEGORIES } from '../constants';

interface AdminViewProps {
  products: Product[];
  onAddProduct: (product: Product) => Promise<boolean>;
  onDeleteProduct: (id: string) => void;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'withdraw';

const AdminView: React.FC<AdminViewProps> = ({ products, onAddProduct, onDeleteProduct }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  /**
   * Upload files to /api/upload (R2) and store returned URLs in form state.
   * This expects upload.ts to return: { success: true, data: string[] }
   * It sends files with field name "files" (multiple).
   */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video' | 'desc_image'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Allow selecting same file again
    e.target.value = '';

    setIsUploading(true);

    const fd = new FormData();
    // ✅ AdminView uses "files" (multiple) to match the multi-upload upload.ts
    for (let i = 0; i < files.length; i++) fd.append('files', files[i]);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result?.success || !Array.isArray(result?.data)) {
        throw new Error(result?.error || 'Upload failed');
      }

      const uploadedUrls = result.data as string[];

      if (type === 'image') {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls].slice(0, 10),
        }));
      } else if (type === 'desc_image') {
        setFormData(prev => ({
          ...prev,
          descriptionImages: [...prev.descriptionImages, ...uploadedUrls].slice(0, 20),
        }));
      } else if (type === 'video') {
        setFormData(prev => ({ ...prev, videoUrl: uploadedUrls[0] || '' }));
      }
    } catch (err: any) {
      alert(err?.message || 'Upload failed. Check R2 configuration.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number, type: 'gallery' | 'desc') => {
    if (type === 'gallery') {
      setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    } else {
      setFormData(prev => ({
        ...prev,
        descriptionImages: prev.descriptionImages.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || formData.images.length === 0 || !formData.category) {
      alert('Required: Title, Price, Category, and at least one image.');
      return;
    }

    const success = await onAddProduct({
      id: '', // Backend generates ID
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      discount: formData.discount ? parseInt(formData.discount, 10) : undefined,
      category: formData.category,
      image: formData.images[0],
      images: formData.images,
      descriptionImages: formData.descriptionImages,
      videoUrl: formData.videoUrl || undefined,
      soldCount: '0 sold',
      status: 'online',
    } as Product);

    if (success) {
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
    } else {
      alert('Failed to save product.');
    }
  };

  const inputClass =
    'w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-base font-bold outline-none focus:border-orange-500 transition-all';
  const labelClass = 'block text-xs font-black text-gray-500 uppercase mb-2 ml-1';

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      {/* Top Tabs */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 px-2 overflow-x-auto no-scrollbar">
        <div className="flex space-x-6 py-4 px-2 min-w-max">
          {(['dashboard', 'products', 'orders', 'withdraw'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] font-black uppercase tracking-wider transition-all relative pb-2 ${
                activeTab === tab ? 'text-orange-600' : 'text-gray-400'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-12">
        {/* Dashboard */}
        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Net Sales</p>
              <p className="text-lg font-black">TSh {stats.netSales.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Earnings</p>
              <p className="text-lg font-black text-orange-600">TSh {stats.earnings.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg"
            >
              + ADD NEW PRODUCT
            </button>

            {products.map(p => (
              <div
                key={p.id}
                className="bg-white p-3 rounded-xl border border-gray-100 flex items-center space-x-3"
              >
                <img src={p.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                <div className="flex-grow">
                  <p className="text-xs font-bold truncate">{p.title}</p>
                  <p className="text-[10px] text-orange-600 font-black">TSh {p.price.toLocaleString()}</p>
                </div>
                <button onClick={() => onDeleteProduct(p.id)} className="text-gray-300 hover:text-red-500">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/75 z-[110] flex flex-col p-0">
          <div className="bg-white w-full h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-black">Product Details</h2>
              <button onClick={() => setIsAdding(false)} className="text-3xl font-light">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
              <div>
                <label className={labelClass}>Product Title</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* ✅ NEW: Description */}
              <div>
                <label className={labelClass}>Product Description</label>
                <textarea
                  className={`${inputClass} min-h-[130px]`}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Write full details about the product..."
                />
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  This text will appear in the product page description area.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price (TSh)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Discount (%)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={formData.discount}
                    onChange={e => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gallery Images */}
              <div>
                <label className={labelClass}>Main Gallery Images (Max 10)</label>
                <div className="grid grid-cols-4 gap-2">
                  {formData.images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square border rounded-xl overflow-hidden shadow-sm bg-gray-50"
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx, 'gallery')}
                        className="absolute top-0 right-0 bg-black/70 text-white w-6 h-6 flex items-center justify-center rounded-bl-xl backdrop-blur-sm"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 10 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className="text-2xl text-gray-400">+</span>
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
              <div>
                <label className={labelClass}>Product Video</label>
                {formData.videoUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black group border border-gray-200">
                    <video src={formData.videoUrl} className="w-full h-full" controls playsInline />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase shadow-xl"
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-500 mb-2 border border-gray-100">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Upload Product Video
                    </span>
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
              <div>
                <label className={labelClass}>Description Gallery (Shown in Info Area)</label>
                <div className="grid grid-cols-4 gap-2">
                  {formData.descriptionImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square border rounded-xl overflow-hidden shadow-sm bg-gray-50"
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx, 'desc')}
                        className="absolute top-0 right-0 bg-black/70 text-white w-6 h-6 flex items-center justify-center rounded-bl-xl backdrop-blur-sm"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {formData.descriptionImages.length < 20 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className="text-2xl text-gray-400">+</span>
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
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Images added here will appear at the bottom of the product page.
                </p>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-black text-white py-5 rounded-2xl font-black tracking-widest disabled:opacity-50 active:scale-[0.98] transition-all shadow-xl shadow-gray-200 flex items-center justify-center space-x-3"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>PROCESSING...</span>
                    </>
                  ) : (
                    <span>PUBLISH TO SONKO</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
