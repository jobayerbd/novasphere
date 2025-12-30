
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, Order, CartItem, Category, ViewMode, User, Address, GlobalVariation, ShippingOption, PaymentMethod } from '../types';
import { CATEGORIES } from '../constants';
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
  isLoading: boolean;
  error: string | null;
  setViewMode: (mode: ViewMode) => void;
  setSelectedProduct: (product: Product | null) => void;
  addToCart: (product: Product, quantity?: number, selectedOptions?: Record<string, string>, price?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  placeOrder: (customer: { name: string; email: string; phone: string }, address: Address, shipping: ShippingOption, payment: PaymentMethod) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
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

const DEFAULT_SHIPPING: ShippingOption[] = [
  { id: 's1', name: 'Inside City', charge: 60 },
  { id: 's2', name: 'Outside City', charge: 120 },
];

const DEFAULT_PAYMENTS: PaymentMethod[] = [
  { id: 'p1', name: 'Cash on Delivery', isActive: true, description: 'Pay when you receive the product' },
  { id: 'p2', name: 'bKash Online', isActive: true, description: 'Pay via bKash gateway' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalVariations, setGlobalVariations] = useState<GlobalVariation[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(DEFAULT_SHIPPING);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEFAULT_PAYMENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('store');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [pixelId, setPixelIdState] = useState<string>(localStorage.getItem('nova_pixel_id') || '');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders')
      ]);
      
      if (!prodRes.ok || !orderRes.ok) {
        const pErr = await prodRes.json();
        throw new Error(pErr.error || "Failed to connect to database");
      }

      setProducts(await prodRes.json());
      setOrders(await orderRes.json());
    } catch (err: any) {
      console.error("Database Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (pixelId) initPixel(pixelId);
  }, [pixelId]);

  const setPixelId = (id: string) => {
    setPixelIdState(id);
    localStorage.setItem('nova_pixel_id', id);
    if (id) initPixel(id);
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

  const addProduct = async (p: Product) => {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    fetchData(); // Refresh data
  };

  const updateProduct = async (p: Product) => {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addGlobalVariation = (v: GlobalVariation) => setGlobalVariations(prev => [...prev, v]);
  const updateGlobalVariation = (v: GlobalVariation) => setGlobalVariations(prev => prev.map(item => item.id === v.id ? v : item));
  const deleteGlobalVariation = (id: string) => setGlobalVariations(prev => prev.filter(v => v.id !== id));

  const placeOrder = async (customer: { name: string; email: string; phone: string }, address: Address, shipping: ShippingOption, payment: PaymentMethod) => {
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

    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });

    setOrders(prev => [newOrder, ...prev]);
    setLastOrder(newOrder);

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

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status })
    });
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
      products, orders, categories: CATEGORIES, globalVariations, shippingOptions, paymentMethods, cart, viewMode, currentUser, users, selectedProduct, lastOrder, pixelId, isLoading, error,
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
