// In ProductCard component of ProductGrid.tsx:
const ProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
  // Calculate final price
  const finalPrice = product.price;
  const originalPrice = (product as any).originalPrice || finalPrice;
  const discountPercentage = (product as any).discountPercentage || 0;
  const hasDiscount = discountPercentage > 0;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col mb-2.5 active:opacity-90 transition-all cursor-pointer border border-gray-50" 
      onClick={onClick}
    >
      <div className="relative w-full">
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-auto object-cover block" 
        />
        
        {/* Show discount badge only if there's a discount */}
        {hasDiscount && (
          <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] px-1.5 py-0.5 font-bold rounded-sm z-10 shadow-sm">
            -{discountPercentage}%
          </div>
        )}

        {/* View count indicator */}
        <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[8px] px-1.5 py-0.5 font-bold rounded-sm backdrop-blur-sm">
          👁️ {(product as any).views || 0}
        </div>

        <div className="absolute bottom-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400">
          <ICONS.Heart />
        </div>
      </div>
      
      <div className="p-2.5 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-[11px] text-gray-800 line-clamp-2 leading-tight font-medium h-8">
            {product.title}
          </h3>

          {/* Clean pricing display */}
          <div className="flex flex-col pt-1">
            <div className="flex items-baseline">
              <span className="text-[14px] font-black text-black">
                TSh {finalPrice.toLocaleString()}
              </span>
            </div>
            
            {/* Only show original price if there's a discount */}
            {hasDiscount && originalPrice > finalPrice && (
              <span className="text-[10px] text-gray-400 line-through">
                TSh {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Category tag */}
          <div className="mt-1">
            <span className="text-[8px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {(product as any).categoryName || 'General'}
            </span>
          </div>
          
          {/* Rating */}
          <div className="flex items-center mt-2">
            <div className="flex items-center space-x-0.5">
              <span className="text-[10px] text-orange-400">⭐</span>
              <span className="text-[10px] text-gray-500 font-bold">
                {typeof product.rating === 'number' ? product.rating.toFixed(1) : '5.0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
