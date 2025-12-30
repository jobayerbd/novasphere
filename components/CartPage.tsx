
import React from 'react';
import { useApp } from '../store/AppContext';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, setViewMode } = useApp();
  const cartTotal = cart.reduce((acc, item) => acc + (item.finalUnitPrice * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-shopping-bag text-gray-200 text-2xl"></i>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Your shopping bag is empty</h2>
        <button onClick={() => setViewMode('store')} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black text-sm shadow-xl">Browse Collections</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-20 animate-in fade-in">
      <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-10">Shopping Bag</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:flex-grow space-y-4">
          {cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
              <img src={item.image} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border" alt={item.name} />
              <div className="flex-grow text-center sm:text-left w-full">
                <h4 className="text-lg font-black text-gray-900 mb-1">{item.name}</h4>
                <div className="flex flex-wrap justify-center sm:justify-start gap-1 mb-4">
                  {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, val]) => (
                    <span key={key} className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {key}: {val}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-6">
                  <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border">
                    <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-400 hover:text-indigo-600">-</button>
                    <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-400 hover:text-indigo-600">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Remove</button>
                </div>
              </div>
              <div className="sm:text-right min-w-[100px] w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 flex justify-between sm:block">
                <p className="text-xl font-black text-gray-900">${(item.finalUnitPrice * item.quantity).toFixed(2)}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-96">
          <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
            <h3 className="text-xl font-black mb-6">Order Summary</h3>
            <div className="flex justify-between items-center text-3xl font-black tracking-tighter mb-8">
              <span className="text-lg font-bold text-gray-400 uppercase tracking-widest">Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => setViewMode('checkout')}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
            >
              Secure Checkout
            </button>
            <p className="text-[8px] text-gray-500 text-center mt-6 uppercase font-black tracking-[0.2em]">Shipping & Taxes calculated at checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
