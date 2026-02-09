// ProductDetailView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { COLORS } from '../constants';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onProductClick: (product: Product) => void;
  WatermarkedImage: React.ComponentType<any>;
  VideoPlayer?: React.ComponentType<any>;
  Banner?: React.ComponentType<any>;
  onWhatsAppClick?: () => void;
  onCallClick?: () => void;
}

// Large Watermarked Image Component specifically for Product Detail View
const LargeWatermarkedImage: React.FC<{
  src: string;
  alt?: string;
  containerClass?: string;
  productId?: string;
}> = ({ src, alt = '', containerClass = '', productId = '' }) => {
  const logoUrl = 'https://media.barakasonko.store/download__82_-removebg-preview.png';
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

      {/* SINGLE LARGE HIGH-CONTRAST WATERMARK */}
      {isLoaded && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Large Center Watermark with HIGH CONTRAST */}
          <div className="relative w-40 h-40 opacity-80">
            <img
              src={logoUrl}
              alt="Watermark"
              className="w-full h-full object-contain"
              draggable="false"
              style={{
                filter: `
                  drop-shadow(0 0 15px rgba(0,0,0,0.8)) 
                  drop-shadow(0 0 25px rgba(0,0,0,0.6))
                  brightness(1.2) 
                  contrast(1.5)
                `,
                WebkitFilter: `
                  drop-shadow(0 0 15px rgba(0,0,0,0.8)) 
                  drop-shadow(0 0 25px rgba(0,0,0,0.6))
                  brightness(1.2) 
                  contrast(1.5)
                `,
              }}
            />
          </div>

          {/* Copyright Text with higher contrast */}
          <div
            className="absolute bottom-6 left-6 px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.85)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              opacity: 0.95,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            ©barakasonko
          </div>
        </div>
      )}
    </div>
  );
};

// Comment Button Component with Twitter-like styling
const CommentButton: React.FC<{
  count?: number;
  onClick?: () => void;
  isActive?: boolean;
}> = ({ count = 0, onClick, isActive = false }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-blue-50 active:scale-95"
      style={{
        color: isActive ? '#1d9bf0' : '#536471',
        backgroundColor: isActive ? 'rgba(29, 155, 240, 0.1)' : 'transparent',
      }}
      aria-label={`${count} comments`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isActive ? '#1d9bf0' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <span className="text-xs font-semibold">{count > 0 ? count.toLocaleString() : 'Comment'}</span>
    </button>
  );
};

// Share Button Component with Facebook-like styling
const ShareButton: React.FC<{
  onClick?: () => void;
  type?: 'facebook' | 'twitter' | 'whatsapp' | 'copy';
  label?: string;
}> = ({ onClick, type = 'facebook', label }) => {
  const getButtonConfig = () => {
    switch (type) {
      case 'facebook':
        return {
          bgColor: 'bg-[#1877F2]',
          hoverBg: 'hover:bg-[#166FE5]',
          icon: (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          ),
          text: 'Share',
        };
      case 'twitter':
        return {
          bgColor: 'bg-[#1DA1F2]',
          hoverBg: 'hover:bg-[#1A8CD8]',
          icon: (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          ),
          text: 'Tweet',
        };
      case 'whatsapp':
        return {
          bgColor: 'bg-[#25D366]',
          hoverBg: 'hover:bg-[#22C35E]',
          icon: (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.149-.669.149-.198.297-.767.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          ),
          text: 'Share',
        };
      case 'copy':
        return {
          bgColor: 'bg-gray-700',
          hoverBg: 'hover:bg-gray-800',
          icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          ),
          text: 'Copy Link',
        };
    }
  };

  const config = getButtonConfig();

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all duration-200 active:scale-95 ${config.bgColor} ${config.hoverBg}`}
      aria-label={`Share on ${type}`}
    >
      {config.icon}
      <span>{label || config.text}</span>
    </button>
  );
};

// Share Modal Component
const ShareModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productLink: string;
  shareImageUrl: string;
}> = ({ isOpen, onClose, productTitle, productLink, shareImageUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const text = `Check out ${productTitle} on BARAKA SONKO!`;
    
    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productLink)}&quote=${encodeURIComponent(text)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productLink)}&hashtags=barakasonko`,
          '_blank',
          'width=550,height=420'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${productLink}`)}`,
          '_blank',
          'width=600,height=600'
        );
        break;
    }
    
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Share Product</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <ShareButton
              type="facebook"
              onClick={() => handleShare('facebook')}
              label="Facebook"
            />
            <ShareButton
              type="twitter"
              onClick={() => handleShare('twitter')}
              label="Twitter"
            />
            <ShareButton
              type="whatsapp"
              onClick={() => handleShare('whatsapp')}
              label="WhatsApp"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all duration-200 ${
                copied ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-800'
              }`}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {copied ? (
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </>
                )}
              </svg>
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Link Preview */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1 font-semibold">Product Link:</p>
            <div className="flex items-center">
              <input
                type="text"
                readOnly
                value={productLink}
                className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  onBack,
  onProductClick,
  WatermarkedImage,
  onWhatsAppClick,
  onCallClick,
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentCount, setCommentCount] = useState(Math.floor(Math.random() * 50) + 10);
  const [hasCommented, setHasCommented] = useState(false);

  const gallery = product.images && product.images.length > 0 ? product.images : [product.image];
  const descImages =
    product.descriptionImages && product.descriptionImages.length > 0 ? product.descriptionImages : [];

  const PHONE_NUMBER = '+255656738253';

  // Best image to share (first available)
  const shareImageUrl = useMemo(() => {
    const first =
      (Array.isArray(product.images) && product.images.find((x: any) => !!x)) ||
      (product as any)?.image ||
      '';
    return String(first || '').trim();
  }, [product]);

  // Build a shareable product link
  const productLink = useMemo(() => {
    try {
      const origin = window.location.origin;
      // You can enhance this with product-specific URLs later
      return `${origin}/product/${encodeURIComponent(String(product.id))}`;
    } catch {
      return 'https://barakasonko.store';
    }
  }, [product.id]);

  const WHATSAPP_TEXT = useMemo(() => {
    const title = String(product.title || 'Bidhaa').trim();
    const price = Number(product.price || 0);
    const priceStr = Number.isFinite(price) ? price.toLocaleString() : '0';

    const lines = [
      `Hi habari, ningependa kuagiza au kujua zaidi hii: ${title}`,
      `Bei: TSh ${priceStr}`,
      shareImageUrl ? `Picha: ${shareImageUrl}` : '',
      `Link: ${productLink}`,
    ].filter(Boolean);

    return lines.join('\n');
  }, [product.title, product.price, shareImageUrl, productLink]);

  const WHATSAPP_URL = useMemo(() => {
    const digits = PHONE_NUMBER.replace('+', '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
  }, [PHONE_NUMBER, WHATSAPP_TEXT]);

  // Generate a random-ish view count based on product ID
  const viewCount = useMemo(() => {
    const seed = String(product.id || '')
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (seed % 900) + 120;
  }, [product.id]);

  // Calculate original price if not provided
  const originalPriceValue =
    (product as any).originalPrice ||
    ((product as any).discount ? Math.round(Number(product.price || 0) * (1 + Number((product as any).discount) / 100)) : null);

  // Related products logic: products in same category, excluding current
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p) => String(p.id) !== String(product.id) && (p as any).category === (product as any).category)
      .slice(0, 6);
  }, [allProducts, product.id, (product as any).category]);

  useEffect(() => {
    // Reset scroll when product changes
    const contentArea = document.getElementById('product-detail-scroll-area');
    if (contentArea) contentArea.scrollTo(0, 0);
  }, [product.id]);

  const handleWhatsApp = () => {
    onWhatsAppClick?.();
    window.open(WHATSAPP_URL, '_blank');
  };

  const handleCall = () => {
    onCallClick?.();
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  const handleComment = () => {
    setShowComments(!showComments);
    if (!hasCommented) {
      setCommentCount(prev => prev + 1);
      setHasCommented(true);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleQuickShare = (platform: 'facebook' | 'twitter') => {
    const text = `Check out ${product.title} on BARAKA SONKO! - TSh ${Number(product.price || 0).toLocaleString()}`;
    const url = platform === 'facebook'
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productLink)}`
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productLink)}`;
    
    window.open(url, '_blank', 'width=600,height=400');
  };

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
          <button 
            onClick={handleShare}
            className="p-2 text-gray-800 hover:text-blue-600 transition-colors"
            aria-label="Share"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button className="p-2 text-gray-800" aria-label="Cart (placeholder)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div id="product-detail-scroll-area" className="flex-grow overflow-y-auto no-scrollbar bg-white">
        {/* Hero Image Slider with HIGH-CONTRAST Watermark */}
        <div className="relative w-full aspect-square bg-[#f9f9f9] border-b border-gray-50">
          <div
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full"
            onScroll={(e) => {
              const width = e.currentTarget.offsetWidth;
              const index = Math.round(e.currentTarget.scrollLeft / width);
              setActiveImage(index);
            }}
          >
            {gallery.map((img, idx) => (
              <div key={idx} className="min-w-full h-full snap-center">
                <LargeWatermarkedImage
                  src={img}
                  alt={`Product image ${idx + 1}`}
                  containerClass="w-full h-full"
                  productId={String(product.id)}
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
                <span className="text-3xl font-black" style={{ color: COLORS.primary }}>
                  TSh {Number(product.price || 0).toLocaleString()}
                </span>
                {(product as any).discount ? (
                  <span className="bg-red-50 text-red-600 text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter">
                    -{(product as any).discount}% OFF
                  </span>
                ) : null}
              </div>

              {/* Blinking Eye View Counter */}
              <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <div className="animate-blink text-sm">👁️</div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{viewCount} views</span>
              </div>
            </div>

            {originalPriceValue ? (
              <span className="text-sm text-gray-400 line-through mt-1">
                Actual Price: TSh {Number(originalPriceValue || 0).toLocaleString()}
              </span>
            ) : null}
          </div>

          <h1 className="text-lg font-bold text-gray-800 leading-tight mb-2">{product.title}</h1>

          {/* Social Interaction Row */}
          <div className="flex items-center justify-between py-3 mb-4 border-y border-gray-100">
            <CommentButton 
              count={commentCount}
              onClick={handleComment}
              isActive={showComments}
            />
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuickShare('twitter')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#1DA1F2]/10 active:scale-95"
                aria-label="Share on Twitter"
              >
                <svg width="18" height="18" fill="#1DA1F2" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                <span className="text-xs font-semibold text-gray-600">Tweet</span>
              </button>
              
              <button
                onClick={() => handleQuickShare('facebook')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#1877F2]/10 active:scale-95"
                aria-label="Share on Facebook"
              >
                <svg width="18" height="18" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-semibold text-gray-600">Share</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95"
                aria-label="More sharing options"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>

          {/* Video Player */}
          {(product as any).videoUrl ? (
            <div className="mb-8 py-6 border-y border-gray-50">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Product Experience</h3>
              <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl relative">
                <video
                  src={String((product as any).videoUrl)}
                  className="w-full h-full"
                  controls
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ) : null}

          {/* Description Text */}
          <div className="py-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">About This Product</h3>
            <div className="text-sm text-gray-600 leading-relaxed font-medium">
              <p>
                Welcome to BARAKA SONKO. Our {product.title} is selected for its superior quality and durability. Perfect
                for professional or home use.
              </p>
            </div>
          </div>

          {/* Comments Section (Collapsible) */}
          {showComments && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Comments ({commentCount})</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">JD</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">John D.</span>
                      <span className="text-xs text-gray-400">2h ago</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">Great product! Delivery was fast.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">SM</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">Sarah M.</span>
                      <span className="text-xs text-gray-400">1d ago</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">Quality exceeded my expectations!</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gallery Details Images */}
          {descImages.length > 0 ? (
            <div className="mt-8 space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Gallery Details</h3>
              {descImages.map((img, idx) => (
                <div
                  key={idx}
                  className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50"
                >
                  <LargeWatermarkedImage
                    src={img}
                    alt={`Product detail ${idx + 1}`}
                    containerClass="w-full h-auto"
                    productId={`${product.id}-desc-${idx}`}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {/* Related Products Grid */}
          {relatedProducts.length > 0 ? (
            <div className="mt-12 mb-10">
              <div className="mb-4 flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Products You May Like</h3>
                <button className="text-xs font-black text-orange-600">View All</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer"
                    onClick={() => onProductClick(relatedProduct)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-50 relative">
                      <WatermarkedImage
                        src={(relatedProduct as any).image}
                        alt={(relatedProduct as any).title}
                        containerClass="w-full h-full"
                        productId={(relatedProduct as any).id}
                        isProduct={true}
                      />
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 mb-1 line-clamp-2">{(relatedProduct as any).title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-orange-600">
                        TSh {Number((relatedProduct as any).price || 0).toLocaleString()}
                      </span>
                      {Number((relatedProduct as any).discount || 0) > 0 ? (
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                          -{Number((relatedProduct as any).discount)}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 p-3 pb-6 flex items-center justify-between space-x-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        {/* Call Button */}
        <button
          onClick={handleCall}
          className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl border-2 active:scale-95 transition-all"
          style={{ borderColor: COLORS.primary, color: COLORS.primary }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Call</span>
        </button>

        {/* Weka Oda (WhatsApp) Button */}
        <button
          onClick={handleWhatsApp}
          className="flex-[2] flex items-center justify-center space-x-2 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg"
          style={{ backgroundColor: COLORS.primary, boxShadow: `0 8px 20px -4px ${COLORS.primary}60` }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>Weka oda</span>
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        productTitle={product.title}
        productLink={productLink}
        shareImageUrl={shareImageUrl}
      />
    </div>
  );
};

export default ProductDetailView;
