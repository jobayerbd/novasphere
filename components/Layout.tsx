
import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import AuthModal from './AuthModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { viewMode, setViewMode, cart, currentUser, logout } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  // Listen for custom events to show alerts
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
    <div className="min-h-screen flex flex-col relative">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Toast Notification Container */}
      <div className="fixed top-20 right-8 z-[200] space-y-4 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-8 py-5 rounded-[1.25rem] shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto flex items-center gap-4 ${
            toast.type === 'success' ? 'bg-white/95 border-emerald-100 text-emerald-900' : 
            toast.type === 'error' ? 'bg-rose-50/95 border-rose-100 text-rose-900' : 'bg-indigo-50/95 border-indigo-100 text-indigo-900'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
              toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation' : 'fa-info'}`}></i>
            </div>
            <p className="font-black text-sm">{toast.message}</p>
          </div>
        ))}
      </div>

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('store')}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-cube text-white"></i>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">NovaSphere</span>
            </div>

            <nav className="hidden md:flex space-x-8">
              <button onClick={() => setViewMode('store')} className={`font-medium transition-colors ${viewMode === 'store' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>Shop</button>
              {currentUser?.role === 'admin' && (
                <button onClick={() => setViewMode('admin')} className={`font-medium transition-colors ${viewMode === 'admin' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>Admin</button>
              )}
            </nav>

            <div className="flex items-center space-x-6">
              {currentUser ? (
                <div className="relative">
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200 group-hover:bg-indigo-200 transition-colors">{currentUser.name.charAt(0)}</div>
                    <span className="hidden sm:block text-sm font-bold text-gray-700">{currentUser.name.split(' ')[0]}</span>
                    <i className={`fas fa-chevron-down text-[10px] text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button onClick={() => { setViewMode('profile'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center"><i className="fas fa-user-circle mr-3 text-gray-400"></i> My Profile</button>
                      <hr className="my-2" />
                      <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center"><i className="fas fa-sign-out-alt mr-3"></i> Log Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="text-sm font-bold text-gray-700 hover:text-indigo-600">Sign In</button>
              )}

              <div className="relative cursor-pointer group" onClick={() => setViewMode('cart')}>
                <i className="fas fa-shopping-cart text-gray-600 text-xl group-hover:text-indigo-600 transition-colors"></i>
                {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-6"><div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center"><i className="fas fa-cube text-white text-xs"></i></div><span className="text-xl font-bold tracking-tight">NovaSphere</span></div>
          <p className="text-gray-400 text-sm mb-6">&copy; 2024 NovaSphere E-Commerce.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
