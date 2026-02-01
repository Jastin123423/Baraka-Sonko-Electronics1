
import React, { useState, useEffect, useRef } from 'react';

const BANNERS = [
  { 
    id: 1, 
    title: "Best Sound Systems", 
    sub: "Powerful Bass >>", 
    bg: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    img: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=80",
    textColor: "text-white"
  },
  { 
    id: 2, 
    title: "Latest Smartphones", 
    sub: "Shop Now >>", 
    bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80",
    textColor: "text-gray-800"
  },
  { 
    id: 3, 
    title: "Pro Mixers & Audio", 
    sub: "Recording Studio >>", 
    bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=300&q=80",
    textColor: "text-gray-800"
  }
];

interface HeroBannerProps {
  onClick?: () => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ onClick }) => {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (scrollRef.current) {
        const nextIndex = (current + 1) % BANNERS.length;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
          left: nextIndex * width,
          behavior: 'smooth'
        });
        // The onScroll handler will update the 'current' state
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [current]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const index = Math.round(e.currentTarget.scrollLeft / width);
      if (index !== current) {
        setCurrent(index);
      }
    }
  };

  return (
    <div className="w-full px-3 pt-2">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={onClick}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-[110px] rounded-2xl shadow-sm cursor-pointer active:opacity-95 transition-opacity"
      >
        {BANNERS.map((banner) => (
          <div 
            key={banner.id} 
            className="min-w-full h-full snap-center flex items-center px-6 relative overflow-hidden"
            style={{ background: banner.bg }}
          >
            <div className={`z-10 flex flex-col justify-center max-w-[60%] ${banner.textColor || 'text-gray-800'}`}>
              <h2 className="text-base font-black leading-tight">{banner.title}</h2>
              <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase tracking-wider">{banner.sub}</p>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 rotate-6 transform transition-transform duration-700 hover:rotate-0">
               <img src={banner.img} alt="" className="w-full h-full object-contain drop-shadow-lg rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination dots */}
      <div className="flex justify-center space-x-1.5 mt-2">
        {BANNERS.map((_, i) => (
          <div 
            key={i} 
            className={`w-1 h-1 rounded-full transition-all duration-300 ${i === current ? 'bg-orange-500 w-3' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
