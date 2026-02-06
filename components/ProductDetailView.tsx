import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { COLORS } from '../constants';
import ProductGrid from './ProductGrid';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onProductClick: (product: Product) => void;
  WatermarkedImage: React.ComponentType<any>;
}

// Large Watermarked Image Component specifically for Product Detail View
const LargeWatermarkedImage: React.FC<{
  src: string;
  alt?: string;
  containerClass?: string;
  productId?: string;
}> = ({ 
  src, 
  alt = '', 
  containerClass = '', 
  productId = ''
}) => {
  const logoUrl = "https://media.barakasonko.store/download__82_-removebg-preview.png";
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${containerClass}`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Main Product Image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain transition-opacity duration-300 bg-gray-50"
        draggable="false"
        loading="eager"
        style={{
          pointerEvents: 'auto',
          opacity: isLoaded ? 1 : 0.8,
        }}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.error('Failed to load image:', src);
          (e.target as HTMLImageElement).style.opacity = '1';
        }}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
      
      {/* LARGE CENTERED WATERMARK - Increased size and centered */}
      {isLoaded && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Large Center Watermark - Very visible */}
          <div className="relative w-32 h-32 opacity-40"> {/* Increased from w-20 h-20 */}
            <img
              src={logoUrl}
              alt="Watermark"
              className="w-full h-full object-contain"
              draggable="false"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))',
              }}
            />
          </div>
          
          {/* Smaller Bottom Right Watermark */}
          <div className="absolute bottom-8 right-8 w-20 h-20 opacity-50"> {/* Increased from w-14 h-14 */}
            <img
              src={logoUrl}
              alt="Watermark"
              className="w-full h-full object-contain"
              draggable="false"
            />
          </div>
          
          {/* Copyright Text */}
          <div
            className="absolute bottom-4 left-4 px-3 py-1.5 rounded"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '11px', // Slightly larger
              fontWeight: 'bold',
              opacity: 0.9,
            }}
          >
            ©barakasonko
          </div>
        </div>
      )}
    </div>
  );
};

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ 
  product, 
  allProducts, 
  onBack, 
  onProductClick,
  WatermarkedImage
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const gallery = product.images && product.images.length > 0 ? product.images : [product.image];
  const descImages = product.descriptionImages && product.descriptionImages.length > 0 ? product.descriptionImages : [];
  
  const PHONE_NUMBER = "+255656738253";
  const WHATSAPP_URL = `https://wa.me/${PHONE_NUMBER.replace('+', '')}?text=Habari, naomba kuagiza: ${encodeURIComponent(product.title)}`;

  // Generate a random-ish view count based on product ID
  const viewCount = useMemo(() => {
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (seed % 900) + 120;
  }, [product.id]);

  // Calculate original price if not provided
  const originalPriceValue = product.originalPrice || (product.discount ? Math.round(product.price * (1 + product.discount / 100)) : null);

  // Related products logic: products in same category, excluding current
  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category))
    .slice(0, 6);

  useEffect(() => {
    // Reset scroll when product changes
    const contentArea = document.getElementById('product-detail-scroll-area');
    if (contentArea) contentArea.scrollTo(0, 0);
  }, [product.id]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fadeIn overflow-hidden">
      {/* Top Header - Fixed at Top */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-md flex items-center justify-between px-4 py-3 border-b border-gray-100 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-800 active:scale-90 transition-transform">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-sm font-black text-gray-800 truncate px-4">BARAKA SONKO</div>
        <div className="flex items-center space-x-2">
           <button className="p-2 text-gray-800"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
           <button className="p-2 text-gray-800"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div id="product-detail-scroll-area" className="flex-grow overflow-y-auto no-scrollbar bg-white">
        {/* Hero Image Slider with LARGE Watermarks */}
        <div className="relative w-full aspect-square bg-[#f9f9f9] border-b border-gray-50">
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full" 
               onScroll={(e) => {
                 const width = e.currentTarget.offsetWidth;
                 const index = Math.round(e.currentTarget.scrollLeft / width);
                 setActiveImage(index);
               }}>
            {gallery.map((img, idx) => (
              <div key={idx} className="min-w-full h-full snap-center">
                <LargeWatermarkedImage
                  src={img}
                  alt={`Product image ${idx + 1}`}
                  containerClass="w-full h-full"
                  productId={product.id}
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm">
            {activeImage + 1} / {gallery.length}
          </div>
        </div>

        {/* Main Info */}
        <div className="p-4">
          {/* Price Tag & Views */}
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-black" style={{ color: COLORS.primary }}>TSh {product.price.toLocaleString()}</span>
                {product.discount && (
                  <span className="bg-red-50 text-red-600 text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter">
                    -{product.discount}% OFF
                  </span>
                )}
              </div>
              
              {/* Blinking Eye View Counter */}
              <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <div className="animate-blink text-sm">👁️</div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{viewCount} views</span>
              </div>
            </div>
            
            {originalPriceValue && (
              <span className="text-sm text-gray-400 line-through mt-1">
                Actual Price: TSh {originalPriceValue.toLocaleString()}
              </span>
            )}
          </div>

          <h1 className="text-lg font-bold text-gray-800 leading-tight mb-6">
            {product.title}
          </h1>

          {/* ORIGINAL VIDEO PLAYER - Restored to working version */}
          {product.videoUrl && (
            <div className="mb-8 py-6 border-y border-gray-50">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Product Experience</h3>
              <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                <video 
                  src={product.videoUrl} 
                  className="w-full h-full" 
                  controls 
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Description Text */}
          <div className="py-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">About This Product</h3>
            <div className="text-sm text-gray-600 leading-relaxed font-medium">
              <p>Welcome to BARAKA SONKO. Our {product.title} is selected for its superior quality and durability. Perfect for professional or home use.</p>
            </div>
          </div>

          {/* Description Images with LARGE Watermarks */}
          {descImages.length > 0 && (
            <div className="mt-8 space-y-3">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Gallery Details</h3>
               {descImages.map((img, idx) => (
                 <div key={idx} className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 aspect-video">
                   <LargeWatermarkedImage
                     src={img}
                     alt={`Product detail ${idx + 1}`}
                     containerClass="w-full h-full"
                     productId={`${product.id}-desc-${idx}`}
                   />
                 </div>
               ))}
            </div>
          )}

          {/* Related Products Grid - Using original WatermarkedImage for consistency */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 mb-10">
              <div className="mb-4 flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Products You May Like
                </h3>
                <button className="text-xs font-black text-orange-600">
                  View All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {relatedProducts.map(relatedProduct => (
                  <div 
                    key={relatedProduct.id} 
                    className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer"
                    onClick={() => onProductClick(relatedProduct)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-50 relative">
                      {/* Use regular WatermarkedImage for thumbnails */}
                      <WatermarkedImage
                        src={relatedProduct.image}
                        alt={relatedProduct.title}
                        containerClass="w-full h-full"
                        productId={relatedProduct.id}
                        isProduct={true}
                      />
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 mb-1 line-clamp-2">{relatedProduct.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-orange-600">TSh {relatedProduct.price.toLocaleString()}</span>
                      {relatedProduct.discount > 0 && (
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                          -{relatedProduct.discount}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR - Always Visible */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 p-3 pb-6 flex items-center justify-between space-x-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        {/* Call Button */}
        <a 
          href={`tel:${PHONE_NUMBER}`}
          className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl border-2 active:scale-95 transition-all"
          style={{ borderColor: COLORS.primary, color: COLORS.primary }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Call</span>
        </a>

        {/* Weka Oda (WhatsApp) Button */}
        <a 
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-[2] flex items-center justify-center space-x-2 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg"
          style={{ backgroundColor: COLORS.primary, boxShadow: `0 8px 20px -4px ${COLORS.primary}60` }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Weka oda</span>
        </a>
      </div>
    </div>
  );
};

export default ProductDetailView;
