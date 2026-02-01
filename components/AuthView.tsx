
import React, { useState } from 'react';
import { COLORS } from '../constants';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const mockUser: User = {
        id: 'u1',
        name: formData.name || formData.email.split('@')[0],
        email: formData.email
      };
      onLogin(mockUser);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      <div className="p-4 flex items-center">
        <button onClick={onBack} className="p-2 text-gray-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      <div className="flex-grow px-8 pt-4 pb-12 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-10 text-center">
          <div className="text-4xl font-black italic tracking-tighter mb-2 uppercase" style={{ color: COLORS.primary }}>
            BARAKA SONKO
          </div>
          <p className="text-gray-500 text-sm">Professional Admin Portal</p>
        </div>

        <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
          <button 
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Full Name</label>
              <input 
                type="text"
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Email Address</label>
            <input 
              type="email"
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
              placeholder="admin@sonko.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Password</label>
            <input 
              type="password"
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-xs font-medium text-gray-400">Forgot password?</button>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            style={{ backgroundColor: COLORS.primary }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}</span>
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400 uppercase tracking-widest">Or continue with</span></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center py-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="G" />
              <span className="text-xs font-bold text-gray-600">Google</span>
            </button>
            <button className="flex items-center justify-center py-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <img src="https://www.svgrepo.com/show/448234/facebook.svg" className="w-5 h-5 mr-2" alt="F" />
              <span className="text-xs font-bold text-gray-600">Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
