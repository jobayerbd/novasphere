
export interface Address {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  addresses: Address[];
  role: 'customer' | 'admin';
}

export interface ShippingOption {
  id: string;
  name: string;
  charge: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
}

// Global Preset Template
export interface GlobalVariation {
  id: string;
  name: string;
  options: string[]; // e.g. ["S", "M", "L"]
}

// Specific option instance for a product
export interface ProductVariantOption {
  value: string;
  regularPrice: number; // MSRP for this variant
  salePrice?: number;    // Discounted price for this variant
  price: number;        // Active price (legacy support/computed)
  stock: number;
}

// Variation instance for a product
export interface ProductVariation {
  id: string; // References GlobalVariation.id
  name: string;
  options: ProductVariantOption[];
}

export interface Product {
  id: string;
  name: string;
  shortDescription?: string; // Short summary
  description: string;       // Main description
  regularPrice: number;      // Base regular price
  salePrice?: number;        // Base offer price
  price: number;             // Legacy price (default active)
  category: string;
  image: string;             // Main image
  gallery?: string[];        // Image gallery
  stock: number;             // Global stock
  rating: number;
  reviews: Review[];
  variations?: ProductVariation[]; // Enhanced variation system
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOptions?: Record<string, string>; // name -> value
  finalUnitPrice: number; 
}

export interface Order {
  id: string;
  userId?: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  total: number;
  shippingCharge: number;
  shippingMethodName: string;
  paymentMethodName: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: Address;
}

export type ViewMode = 'store' | 'admin' | 'profile' | 'product-detail' | 'checkout' | 'thank-you' | 'cart';
