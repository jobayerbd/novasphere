
import React from 'react';
import { useApp } from '../store/AppContext';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, setViewMode } = useApp();
  const cartTotal = cart.reduce((acc, item) => acc + (item.finalUnitPrice * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Your bag is empty</h2>
        <button onClick={() => setViewMode('store')} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black">Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-12">Your Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          {cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
              <img src={item.image} className="w-32 h-32 rounded-2xl object-cover border" alt={item.name} />
              <div className="flex-grow text-center sm:text-left">
                <h4 className="text-xl font-black text-gray-900 mb-1">{item.name}</h4>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, val]) => (
                    <span key={key} className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      {key}: {val}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex items-center bg-gray-50 rounded-xl p-1 border">
                    <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center font-bold">-</button>
                    <span className="w-10 text-center font-black">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-sm font-bold text-rose-500 hover:underline">Remove</button>
                </div>
              </div>
              <div className="sm:text-right min-w-[100px]">
                <p className="text-2xl font-black text-gray-900">${(item.finalUnitPrice * item.quantity).toFixed(2)}</p>
                <p className="text-xs text-gray-400 font-bold">${item.finalUnitPrice.toFixed(2)} each</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-32">
            <h3 className="text-2xl font-black mb-8">Summary</h3>
            <div className="flex justify-between items-center text-3xl font-black tracking-tighter mb-10">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => setViewMode('checkout')}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-xl"
            >
              Checkout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
