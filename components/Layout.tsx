
import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import AuthModal from './AuthModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { viewMode, setViewMode, cart, currentUser, logout } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const { message, type = 'success' } = e.detail;
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    window.addEventListener('nova-toast', handleToast);
    return () => window.removeEventListener('nova-toast', handleToast);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Toast Notification Container - Adjusted for mobile position */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-20 sm:right-8 z-[200] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-white/95 border-emerald-100 text-emerald-900' : 
            toast.type === 'error' ? 'bg-rose-50/95 border-rose-100 text-rose-900' : 'bg-indigo-50/95 border-indigo-100 text-indigo-900'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
              toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation' : 'fa-info'}`}></i>
            </div>
            <p className="font-bold text-xs">{toast.message}</p>
          </div>
        ))}
      </div>

      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setViewMode('store'); setIsMobileMenuOpen(false); }}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-cube text-white text-sm"></i>
              </div>
              <span className="text-lg font-black text-gray-900 tracking-tighter">NovaSphere</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => setViewMode('store')} className={`text-sm font-bold transition-colors ${viewMode === 'store' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>Shop</button>
              {currentUser?.role === 'admin' && (
                <button onClick={() => setViewMode('admin')} className={`text-sm font-bold transition-colors ${viewMode === 'admin' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>Admin</button>
              )}
            </nav>

            <div className="flex items-center space-x-4 sm:space-x-6">
              {currentUser ? (
                <div className="relative">
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 group p-1">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200">{currentUser.name.charAt(0)}</div>
                    <i className={`fas fa-chevron-down text-[8px] text-gray-400 transition-transform hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button onClick={() => { setViewMode('profile'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center"><i className="fas fa-user-circle mr-3 text-gray-400"></i> My Profile</button>
                      <hr className="my-2 border-gray-100" />
                      <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center"><i className="fas fa-sign-out-alt mr-3"></i> Log Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">Sign In</button>
              )}

              <button className="relative cursor-pointer group p-1" onClick={() => setViewMode('cart')}>
                <i className="fas fa-shopping-bag text-gray-700 text-lg sm:text-xl group-hover:text-indigo-600 transition-colors"></i>
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>}
              </button>

              <button className="md:hidden p-1 text-gray-700" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars-staggered'} text-lg`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col gap-2">
              <button onClick={() => { setViewMode('store'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm ${viewMode === 'store' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                <i className="fas fa-shop w-5"></i> Shop Collections
              </button>
              {currentUser?.role === 'admin' && (
                <button onClick={() => { setViewMode('admin'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm ${viewMode === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                  <i className="fas fa-user-shield w-5"></i> Admin Dashboard
                </button>
              )}
              {currentUser && (
                <button onClick={() => { setViewMode('profile'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm ${viewMode === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                  <i className="fas fa-user-gear w-5"></i> Account Settings
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
              <i className="fas fa-cube text-white text-xs"></i>
            </div>
            <span className="text-xl font-bold tracking-tight">NovaSphere</span>
          </div>
          <p className="text-gray-400 text-xs mb-8">Premium e-commerce engineering for the modern web.</p>
          <div className="flex justify-center gap-6 mb-8 text-gray-500">
            <i className="fab fa-instagram hover:text-white transition-colors cursor-pointer"></i>
            <i className="fab fa-twitter hover:text-white transition-colors cursor-pointer"></i>
            <i className="fab fa-facebook hover:text-white transition-colors cursor-pointer"></i>
          </div>
          <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest">&copy; 2024 NovaSphere E-Commerce. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
