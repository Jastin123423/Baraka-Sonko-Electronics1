
import React from 'react';
import { COLORS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white pt-8 pb-20 border-t border-gray-100">
      <div className="px-6 mb-8 flex flex-col items-center">
        <div className="text-2xl font-black italic tracking-tighter mb-4" style={{ color: COLORS.primary }}>
          BARAKA SONKO
        </div>
        <div className="text-[11px] text-gray-400 text-center leading-relaxed">
          The best online electronics destination in Tanzania. Wide variety of products from mobiles to sound systems.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 px-6 mb-8 text-[12px] text-gray-600">
        <div className="space-y-3">
          <h4 className="font-bold text-gray-900 uppercase">Customer Service</h4>
          <p>Help Center</p>
          <p>Shipping Info</p>
          <p>Returns & Refund</p>
          <p>Contact Us</p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-gray-900 uppercase">About BARAKA SONKO</h4>
          <p>Who We Are</p>
          <p>Business Partnership</p>
          <p>Privacy Policy</p>
          <p>Terms of Use</p>
        </div>
      </div>

      <div className="border-t border-gray-50 pt-4 px-6 flex flex-col items-center">
        <div className="flex space-x-4 mb-4 grayscale opacity-60">
          <img src="https://picsum.photos/seed/pay1/40/24" alt="visa" className="h-4" />
          <img src="https://picsum.photos/seed/pay2/40/24" alt="master" className="h-4" />
          <img src="https://picsum.photos/seed/pay3/40/24" alt="mpesa" className="h-4" />
        </div>
        <p className="text-[10px] text-gray-400">© 2025 BARAKA SONKO. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
