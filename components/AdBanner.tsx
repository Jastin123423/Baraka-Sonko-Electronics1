
import React from 'react';

interface AdBannerProps {
  src: string;
  onClick?: () => void;
  className?: string;
  containerClass?: string;
  fullWidth?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  src, 
  onClick, 
  className = "", 
  containerClass = "",
  fullWidth = false 
}) => {
  const wrapperClasses = fullWidth 
    ? `w-full ${onClick ? 'cursor-pointer active:opacity-90 transition-opacity' : ''} ${className}`
    : `px-3 py-1 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`;

  const innerClasses = fullWidth
    ? `w-full overflow-hidden bg-white ${containerClass}`
    : `w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white ${containerClass}`;

  return (
    <div className={wrapperClasses} onClick={onClick}>
      <div className={innerClasses}>
        <img 
          src={src} 
          alt="Promotion Banner" 
          className="w-full h-full object-cover block"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default AdBanner;
