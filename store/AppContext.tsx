
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, Order, CartItem, Category, ViewMode, User, Address, GlobalVariation, ShippingOption, PaymentMethod } from '../types';
import { CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS } from '../constants';
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
  isLocalMode: boolean;
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
  const [isLocalMode, setIsLocalMode] = useState(false);
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

  const safeJson = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: text || `Server error (${response.status})`, status: response.status };
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders')
      ]);
      
      // If we get 404, we assume we are in a static environment/local dev without serverless functions
      if (prodRes.status === 404 || orderRes.status === 404) {
        console.warn("API endpoints not found (404). Falling back to LocalStorage/Mock mode.");
        loadLocalData();
        return;
      }

      const prodData = await safeJson(prodRes);
      const orderData = await safeJson(orderRes);

      if (!prodRes.ok) throw new Error(prodData.error || "Failed to fetch products");
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to fetch orders");

      setProducts(prodData);
      setOrders(orderData);
      setIsLocalMode(false);
    } catch (err: any) {
      console.error("Database connection failed, using local storage fallback:", err);
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalData = () => {
    setIsLocalMode(true);
    const savedProducts = localStorage.getItem('nova_local_products');
    const savedOrders = localStorage.getItem('nova_local_orders');
    
    setProducts(savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS);
    setOrders(savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync to local storage if in local mode
  useEffect(() => {
    if (isLocalMode) {
      localStorage.setItem('nova_local_products', JSON.stringify(products));
      localStorage.setItem('nova_local_orders', JSON.stringify(orders));
    }
  }, [products, orders, isLocalMode]);

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
    if (!isLocalMode) {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
    }
    setProducts(prev => [...prev, p]);
  };

  const updateProduct = async (p: Product) => {
    if (!isLocalMode) {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
    }
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
  };

  const deleteProduct = async (id: string) => {
    if (!isLocalMode) {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    }
    setProducts(prev => prev.filter(p => p.id !== id));
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

    if (!isLocalMode) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
    }

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
    if (!isLocalMode) {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status })
      });
    }
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
      products, orders, categories: CATEGORIES, globalVariations, shippingOptions, paymentMethods, cart, viewMode, currentUser, users, selectedProduct, lastOrder, pixelId, isLoading, error, isLocalMode,
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
