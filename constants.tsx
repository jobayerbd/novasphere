
import { Product, Category, Order } from './types';

export const CATEGORIES: Category[] = [
  { id: 'electronics', name: 'Electronics', icon: 'fa-laptop' },
  { id: 'fashion', name: 'Fashion', icon: 'fa-shirt' },
  { id: 'home', name: 'Home & Living', icon: 'fa-house' },
  { id: 'beauty', name: 'Beauty', icon: 'fa-sparkles' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Aether Pro Wireless Headphones',
    description: 'Immersive sound quality with industry-leading noise cancellation. Experience audio like never before with 40 hours of battery life.',
    regularPrice: 349.99,
    salePrice: 299.99,
    price: 299.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    stock: 25,
    rating: 4.8,
    reviews: [
      { id: 'r1', user: 'Alice Smith', rating: 5, comment: 'Best headphones I ever owned!', date: '2023-10-15' }
    ],
    // Fix: Added missing regularPrice and salePrice properties to variants to comply with ProductVariantOption interface
    variations: [
      { 
        id: 'gv2',
        name: 'Color', 
        options: [
          { value: 'Midnight Black', regularPrice: 349.99, salePrice: 299.99, price: 299.99, stock: 10 },
          { value: 'Silver Grey', regularPrice: 349.99, salePrice: 299.99, price: 299.99, stock: 10 },
          { value: 'Deep Blue', regularPrice: 349.99, salePrice: 299.99, price: 299.99, stock: 5 }
        ] 
      }
    ]
  },
  {
    id: '2',
    name: 'Lunar Silk Summer Dress',
    description: 'Breathable and elegant, the Lunar Silk dress is perfect for evening galas or beach sunsets. Hand-crafted from sustainable silk.',
    regularPrice: 145.00,
    price: 145.00,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&q=80&w=800',
    stock: 12,
    rating: 4.5,
    reviews: [],
    // Fix: Added missing regularPrice property to variants to comply with ProductVariantOption interface
    variations: [
      { 
        id: 'gv1',
        name: 'Size', 
        options: [
          { value: 'XS', regularPrice: 145.00, price: 145.00, stock: 2 },
          { value: 'S', regularPrice: 145.00, price: 145.00, stock: 3 },
          { value: 'M', regularPrice: 145.00, price: 145.00, stock: 3 },
          { value: 'L', regularPrice: 145.00, price: 145.00, stock: 2 },
          { value: 'XL', regularPrice: 145.00, price: 145.00, stock: 2 }
        ] 
      },
      { 
        id: 'gv2',
        name: 'Color', 
        options: [
          { value: 'Pure White', regularPrice: 145.00, price: 145.00, stock: 6 },
          { value: 'Sky Blue', regularPrice: 145.00, price: 145.00, stock: 6 }
        ] 
      }
    ]
  },
  {
    id: '3',
    name: 'Zenith Mechanical Keyboard',
    description: 'Compact 65% layout with hot-swappable switches and customizable RGB lighting. Built for performance and style.',
    regularPrice: 220.00,
    salePrice: 189.50,
    price: 189.50,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800',
    stock: 8,
    rating: 4.9,
    reviews: [],
    // Fix: Added missing regularPrice and salePrice properties to variants to comply with ProductVariantOption interface
    variations: [
      { 
        id: 'gv3',
        name: 'Switches', 
        options: [
          { value: 'Linear Red', regularPrice: 220.00, salePrice: 189.50, price: 189.50, stock: 3 },
          { value: 'Tactile Brown', regularPrice: 220.00, salePrice: 189.50, price: 189.50, stock: 3 },
          { value: 'Clicky Blue', regularPrice: 220.00, salePrice: 189.50, price: 189.50, stock: 2 }
        ] 
      }
    ]
  },
  {
    id: '4',
    name: 'Minimalist Oak Coffee Table',
    description: 'Solid oak construction with a clean, Scandinavian aesthetic. A perfect center-piece for modern living rooms.',
    regularPrice: 450.00,
    price: 450.00,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    stock: 5,
    rating: 4.7,
    reviews: []
  },
  {
    id: '5',
    name: 'Midnight Rose Perfume',
    description: 'A sophisticated blend of damask rose and deep oud. Captures the essence of a moonlit garden.',
    regularPrice: 120.00,
    salePrice: 85.00,
    price: 85.00,
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800',
    stock: 50,
    rating: 4.6,
    reviews: []
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    date: '2023-11-20',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    // Fix: provide the missing finalUnitPrice property required by CartItem
    items: [{ ...INITIAL_PRODUCTS[0], quantity: 1, finalUnitPrice: INITIAL_PRODUCTS[0].price }],
    total: 299.99,
    // Fix: Added missing mandatory properties to comply with Order interface
    shippingCharge: 0,
    shippingMethodName: 'Standard Shipping',
    paymentMethodName: 'Cash on Delivery',
    status: 'delivered'
  }
];
