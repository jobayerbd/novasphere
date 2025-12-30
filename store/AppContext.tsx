
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, Order, CartItem, Category, ViewMode, User, Address, GlobalVariation, ShippingOption, PaymentMethod } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, CATEGORIES } from '../constants';
import { initPixel, trackPixelEvent } from '../services/fbPixel';

interface AppContextType {
  products: Product[];
  orders: Order[];
  categories: Category[];
  globalVariations: GlobalVariation[];
  shippingOptions: ShippingOption[];
  paymentMethods: PaymentMethod[];
  cart: CartItem[];
  viewMode: ViewMode;
  currentUser: User | null;
  users: User[];
  selectedProduct: Product | null;
  lastOrder: Order | null;
  pixelId: string;
  setViewMode: (mode: ViewMode) => void;
  setSelectedProduct: (product: Product | null) => void;
  addToCart: (product: Product, quantity?: number, selectedOptions?: Record<string, string>, price?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  placeOrder: (customer: { name: string; email: string; phone: string }, address: Address, shipping: ShippingOption, payment: PaymentMethod) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, pass: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  addGlobalVariation: (v: GlobalVariation) => void;
  updateGlobalVariation: (v: GlobalVariation) => void;
  deleteGlobalVariation: (id: string) => void;
  setShippingOptions: (options: ShippingOption[]) => void;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  setPixelId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_GLOBAL_VARS: GlobalVariation[] = [
  { id: 'gv1', name: 'Size', options: ['S', 'M', 'L', 'XL'] },
  { id: 'gv2', name: 'Color', options: ['Midnight Black', 'Pearl White', 'Ruby Red'] },
];

const DEFAULT_SHIPPING: ShippingOption[] = [
  { id: 's1', name: 'Inside City', charge: 60 },
  { id: 's2', name: 'Outside City', charge: 120 },
];

const DEFAULT_PAYMENTS: PaymentMethod[] = [
  { id: 'p1', name: 'Cash on Delivery', isActive: true, description: 'Pay when you receive the product' },
  { id: 'p2', name: 'bKash Online', isActive: true, description: 'Pay via bKash gateway' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [globalVariations, setGlobalVariations] = useState<GlobalVariation[]>(MOCK_GLOBAL_VARS);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(DEFAULT_SHIPPING);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEFAULT_PAYMENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('store');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [pixelId, setPixelIdState] = useState<string>(localStorage.getItem('nova_pixel_id') || '');

  // Initialize Pixel as soon as ID is available
  useEffect(() => {
    if (pixelId) {
      initPixel(pixelId);
    }
  }, [pixelId]);

  // Track PageView whenever viewMode changes (SPA Navigation)
  useEffect(() => {
    if (pixelId) {
      // Small delay to ensure initialization is complete on first load
      const timer = setTimeout(() => {
        trackPixelEvent('PageView', { url: window.location.href, view: viewMode });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, pixelId]);

  const setPixelId = (id: string) => {
    setPixelIdState(id);
    localStorage.setItem('nova_pixel_id', id);
    if (id) {
      initPixel(id);
    }
  };

  const addToCart = (product: Product, quantity: number = 1, selectedOptions?: Record<string, string>, price?: number) => {
    const unitPrice = price || product.price;
    setCart(prev => {
      const optionKey = JSON.stringify(selectedOptions || {});
      const existing = prev.find(item => item.id === product.id && JSON.stringify(item.selectedOptions || {}) === optionKey);
      
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && JSON.stringify(item.selectedOptions || {}) === optionKey) 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
        );
      }
      return [...prev, { ...product, quantity, finalUnitPrice: unitPrice, price: unitPrice, selectedOptions }];
    });

    // Track Pixel Event
    if (pixelId) {
      trackPixelEvent('AddToCart', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: unitPrice * quantity,
        currency: 'USD'
      });
    }
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
  };
  const clearCart = () => setCart([]);
  const addProduct = (p: Product) => setProducts(prev => [...prev, p]);
  const updateProduct = (p: Product) => setProducts(prev => prev.map(item => item.id === p.id ? p : item));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const addGlobalVariation = (v: GlobalVariation) => setGlobalVariations(prev => [...prev, v]);
  const updateGlobalVariation = (v: GlobalVariation) => setGlobalVariations(prev => prev.map(item => item.id === v.id ? v : item));
  const deleteGlobalVariation = (id: string) => setGlobalVariations(prev => prev.filter(v => v.id !== id));

  const placeOrder = (customer: { name: string; email: string; phone: string }, address: Address, shipping: ShippingOption, payment: PaymentMethod) => {
    const subtotal = cart.reduce((acc, item) => acc + (item.finalUnitPrice * item.quantity), 0);
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
      userId: currentUser?.id,
      date: new Date().toISOString().split('T')[0],
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      items: [...cart],
      total: subtotal + shipping.charge,
      shippingCharge: shipping.charge,
      shippingMethodName: shipping.name,
      paymentMethodName: payment.name,
      status: 'pending',
      shippingAddress: address
    };
    setOrders(prev => [newOrder, ...prev]);
    setLastOrder(newOrder);

    // Track Pixel Purchase
    if (pixelId) {
      trackPixelEvent('Purchase', {
        value: newOrder.total,
        currency: 'USD',
        num_items: cart.length,
        content_ids: cart.map(i => i.id),
        content_type: 'product'
      });
    }

    clearCart();
    setViewMode('thank-you');
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
  };

  const login = (email: string, pass: string): boolean => {
    if (email === 'admin@example.com' && pass === 'admin') {
      setCurrentUser({ id: 'u2', name: 'Admin User', email: 'admin@example.com', role: 'admin', addresses: [] });
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, pass: string) => {
    const newUser: User = { id: `u-${Date.now()}`, name, email, password: pass, role: 'customer', addresses: [] };
    setCurrentUser(newUser);
  };

  const logout = () => { setCurrentUser(null); setViewMode('store'); };
  const updateUser = (updatedUser: User) => { if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser); };

  return (
    <AppContext.Provider value={{
      products, orders, categories: CATEGORIES, globalVariations, shippingOptions, paymentMethods, cart, viewMode, currentUser, users, selectedProduct, lastOrder, pixelId,
      setViewMode, setSelectedProduct, addToCart, removeFromCart, updateCartQuantity, clearCart,
      addProduct, updateProduct, deleteProduct, placeOrder, updateOrderStatus,
      login, signup, logout, updateUser, addGlobalVariation, updateGlobalVariation, deleteGlobalVariation,
      setShippingOptions, setPaymentMethods, setPixelId
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
