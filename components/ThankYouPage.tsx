
import React from 'react';
import { useApp } from '../store/AppContext';

const ThankYouPage: React.FC = () => {
  const { lastOrder, setViewMode } = useApp();

  if (!lastOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-black">Something went wrong</h2>
        <button onClick={() => setViewMode('store')} className="mt-4 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-in zoom-in duration-700">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-10 shadow-lg border-4 border-white">
        <i className="fas fa-check"></i>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter">Ordered Successfully!</h1>
      <p className="text-xl text-gray-500 max-w-lg mx-auto mb-12 font-medium">
        We've received your order and our team is already preparing it for shipment.
      </p>

      <div className="bg-white rounded-[2.5rem] border shadow-xl overflow-hidden mb-12 text-left">
        <div className="bg-gray-50 p-8 flex flex-col md:flex-row justify-between gap-6 border-b">
          <div>
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Order Number</p>
            <p className="font-mono font-black text-indigo-600">{lastOrder.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Expected Delivery</p>
            <p className="font-bold text-gray-800">3-5 Business Days</p>
          </div>
          <div className="md:text-right">
             <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Status</p>
             <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-black uppercase border border-indigo-200">Processing</span>
          </div>
        </div>
        
        <div className="p-8">
          <h4 className="font-black text-lg mb-6">Order Items</h4>
          <div className="space-y-4 mb-8">
            {lastOrder.items.map((item, idx) => {
              const unitPrice = item.finalUnitPrice || item.price || 0;
              return (
                <div key={`${item.id}-${idx}`} className="flex items-center gap-4">
                   <img src={item.image} className="w-14 h-14 rounded-xl object-cover border" alt="" />
                   <div className="flex-grow">
                     <p className="font-bold text-gray-900">{item.name}</p>
                     <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                   </div>
                   <p className="font-black text-gray-900">${(unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-6 border-t">
            <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Grand Total</span>
            <span className="text-3xl font-black text-gray-900 tracking-tighter">${(lastOrder.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button 
          onClick={() => setViewMode('store')}
          className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl"
        >
          Continue Shopping
        </button>
        <button 
          onClick={() => setViewMode('profile')}
          className="bg-white border text-gray-700 px-10 py-5 rounded-2xl font-black hover:bg-gray-50 transition-all"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
};

export default ThankYouPage;
