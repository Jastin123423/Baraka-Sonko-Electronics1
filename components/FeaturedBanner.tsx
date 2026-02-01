
import React from 'react';

const FeaturedBanner: React.FC = () => {
  return (
    <div className="px-3 py-4">
      <div className="relative w-full rounded-[24px] overflow-hidden shadow-lg" 
           style={{ background: 'linear-gradient(145deg, #ffd700 0%, #ff8c00 100%)' }}>
        
        {/* Banner Content */}
        <div className="p-5 flex flex-col h-full justify-between">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white italic drop-shadow-md">Hot Fashion</h2>
            <p className="text-[11px] font-bold text-white/90 uppercase tracking-[0.2em]">Unlock Your Style Potential</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'watch', img: 'https://images.unsplash.com/photo-1524592091214-8f97ad337c73?auto=format&fit=crop&w=200&q=80' },
              { id: 'dress', img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=200&q=80' },
              { id: 'handbag', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=200&q=80' },
              { id: 'heel', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=200&q=80' }
            ].map(item => (
              <div key={item.id} className="aspect-square bg-white/20 backdrop-blur-md rounded-xl p-1 shadow-inner flex items-center justify-center">
                 <img src={item.img} alt="" className="w-full h-full object-contain rounded-lg shadow-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default FeaturedBanner;
