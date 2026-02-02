import React, { useState } from 'react';
import { COLORS } from '../constants';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Login failed');
        return;
      }

      onLogin(data.user);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <p className="text-gray-500 text-sm">Admin Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
              placeholder="admin@sonko.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
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
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
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
              <span>LOG IN</span>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Accounts are created by admin in D1.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthView;
