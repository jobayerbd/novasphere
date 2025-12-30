
import React from 'react';
import { AppProvider, useApp } from './store/AppContext';
import Layout from './components/Layout';
import Storefront from './components/Storefront';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import ProductDetail from './components/ProductDetail';
import CheckoutPage from './components/CheckoutPage';
import ThankYouPage from './components/ThankYouPage';
import CartPage from './components/CartPage';

const AppContent: React.FC = () => {
  const { viewMode, isLoading, error, isLocalMode } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-white tracking-tighter">Syncing NovaSphere...</h2>
        <p className="text-gray-400 mt-2 font-medium">Connecting to secure cloud database</p>
      </div>
    );
  }

  // We only show the full-page error if it's NOT a 404 (which triggers local mode)
  // and we actually have a fatal error. 404s are handled by safe fallbacks now.
  if (error && !isLocalMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 text-center border border-rose-100">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-database text-3xl"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">System Error</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (viewMode) {
      case 'admin':
        return <AdminPanel />;
      case 'profile':
        return <UserProfile />;
      case 'product-detail':
        return <ProductDetail />;
      case 'checkout':
        return <CheckoutPage />;
      case 'thank-you':
        return <ThankYouPage />;
      case 'cart':
        return <CartPage />;
      case 'store':
      default:
        return <Storefront />;
    }
  };

  return (
    <Layout>
      {/* Local Mode Banner */}
      {isLocalMode && (
        <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center sticky top-16 z-[90] shadow-md border-b border-amber-600/20">
          <i className="fas fa-wifi-slash mr-2"></i> Local Mode Active (Offline Storage)
        </div>
      )}
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
