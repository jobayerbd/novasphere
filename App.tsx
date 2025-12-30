
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
  const { viewMode } = useApp();

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
