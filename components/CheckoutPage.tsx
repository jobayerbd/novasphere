
import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Address, ShippingOption, PaymentMethod } from '../types';
import { trackPixelEvent } from '../services/fbPixel';

const CheckoutPage: React.FC = () => {
  const { cart, currentUser, placeOrder, setViewMode, shippingOptions, paymentMethods } = useApp();
  const [shippingInfo, setShippingInfo] = useState({ name: '', email: '', phone: '' });
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(shippingOptions[0] || null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(paymentMethods.find(p => p.isActive) || null);

  useEffect(() => {
    if (cart.length > 0) {
      trackPixelEvent('InitiateCheckout', {
        num_items: cart.length,
        content_ids: cart.map(i => i.id),
        currency: 'USD',
        value: cart.reduce((acc, i) => acc + (i.finalUnitPrice * i.quantity), 0)
      });
    }
  }, []);

  const [manualAddress, setManualAddress] = useState<Partial<Address>>({
    fullName: '',
    phoneNumber: '',
    street: '',
    city: '',
    zip: '',
    country: 'Bangladesh'
  });

  useEffect(() => {
    if (currentUser) {
      setShippingInfo({ name: currentUser.name, email: currentUser.email, phone: '' });
      if (currentUser.addresses.length > 0) {
        setSelectedAddress(currentUser.addresses[0]);
        setUseManualAddress(false);
      } else {
        setUseManualAddress(true);
      }
    } else {
      setUseManualAddress(true);
    }
  }, [currentUser]);

  const subtotal = cart.reduce((acc, item) => acc + ((item.finalUnitPrice || item.price || 0) * item.quantity), 0);
  const shippingCharge = selectedShipping?.charge || 0;
  const cartTotal = subtotal + shippingCharge;

  const handlePlaceOrder = () => {
    const finalPhone = useManualAddress ? manualAddress.phoneNumber : (selectedAddress?.phoneNumber || shippingInfo.phone);

    if (!shippingInfo.name || !finalPhone) {
      alert("Please provide contact name and a valid mobile number.");
      return;
    }

    if (!selectedShipping || !selectedPayment) {
      alert("Please select shipping and payment methods.");
      return;
    }

    let finalAddress: Address;
    if (useManualAddress) {
      if (!manualAddress.fullName || !manualAddress.street || !manualAddress.city || !manualAddress.zip || !manualAddress.phoneNumber) {
        alert("Please complete the shipping address: Name, Street, City, ZIP and Mobile are required.");
        return;
      }
      finalAddress = {
        id: 'guest-' + Date.now(),
        label: 'Shipping Address',
        ...manualAddress
      } as Address;
    } else {
      if (!selectedAddress) {
        alert("Please select a shipping address.");
        return;
      }
      finalAddress = selectedAddress;
    }

    placeOrder({ ...shippingInfo, phone: finalPhone }, finalAddress, selectedShipping, selectedPayment);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-black mb-4 text-gray-900 tracking-tight">Your bag is empty</h2>
        <button onClick={() => setViewMode('store')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg text-sm">Return to Shop</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-10 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-4xl font-black mb-6 md:mb-10 tracking-tighter text-gray-900">Secure Checkout</h1>
      
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          
          <section className="bg-white p-5 md:p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">1</span>
              <h3 className="text-lg font-black text-gray-900">Contact Info</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                type="text" placeholder="Full Name *"
                value={shippingInfo.name}
                onChange={e => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <input 
                type="email" placeholder="Email (Optional)"
                value={shippingInfo.email}
                onChange={e => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </section>

          <section className="bg-white p-5 md:p-6 rounded-2xl border shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h3 className="text-lg font-black text-gray-900">Delivery Address</h3>
              </div>
              {currentUser && currentUser.addresses.length > 0 && (
                <button 
                  onClick={() => setUseManualAddress(!useManualAddress)}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest"
                >
                  {useManualAddress ? 'Use Saved' : 'Change'}
                </button>
              )}
            </div>

            {!useManualAddress && currentUser && currentUser.addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {currentUser.addresses.map(addr => (
                  <button 
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${selectedAddress?.id === addr.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-50 bg-gray-50/10'}`}
                  >
                    <div>
                      <p className="font-black text-gray-900 text-xs">{addr.fullName} <span className="text-[9px] text-gray-400 font-bold ml-2 uppercase">({addr.label})</span></p>
                      <p className="text-gray-500 text-[10px] font-medium mt-0.5">{addr.street}, {addr.city}</p>
                      <p className="text-indigo-600 text-[10px] font-bold mt-0.5">{addr.phoneNumber}</p>
                    </div>
                    {selectedAddress?.id === addr.id && <i className="fas fa-check-circle text-indigo-600 text-sm"></i>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <input 
                    type="text" placeholder="Receiver's Name *"
                    value={manualAddress.fullName}
                    onChange={e => setManualAddress({ ...manualAddress, fullName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <input 
                    type="tel" placeholder="Mobile Number *"
                    value={manualAddress.phoneNumber}
                    onChange={e => setManualAddress({ ...manualAddress, phoneNumber: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <input 
                  type="text" placeholder="House / Street / Road / Area *"
                  value={manualAddress.street}
                  onChange={e => setManualAddress({ ...manualAddress, street: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                   <input 
                    type="text" placeholder="City *"
                    value={manualAddress.city}
                    onChange={e => setManualAddress({ ...manualAddress, city: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <input 
                    type="text" placeholder="ZIP (Optional)"
                    value={manualAddress.zip}
                    onChange={e => setManualAddress({ ...manualAddress, zip: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3.5 outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white p-5 rounded-2xl border shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">3</span>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Shipping</h3>
               </div>
               <div className="space-y-2">
                  {shippingOptions.map(option => (
                    <button 
                      key={option.id}
                      onClick={() => setSelectedShipping(option)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selectedShipping?.id === option.id ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-50 bg-gray-50/50'}`}
                    >
                      <div className="flex justify-between items-center">
                         <span className="font-black text-gray-900 text-[10px]">{option.name}</span>
                         <span className="font-black text-indigo-600 text-[10px]">${option.charge}</span>
                      </div>
                    </button>
                  ))}
               </div>
            </section>

            <section className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">4</span>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Payment</h3>
              </div>
              <div className="space-y-2">
                {paymentMethods.filter(p => p.isActive).map(method => (
                  <button 
                    key={method.id}
                    onClick={() => setSelectedPayment(method)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${selectedPayment?.id === method.id ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-50 bg-gray-50/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedPayment?.id === method.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        <i className={`fas ${method.name.toLowerCase().includes('cash') ? 'fa-money-bill' : 'fa-credit-card'} text-[10px]`}></i>
                      </div>
                      <span className="font-black text-gray-900 text-[10px]">{method.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="bg-gray-900 text-white p-6 rounded-[1.5rem] shadow-xl relative">
              <h3 className="text-lg font-black mb-4 tracking-tight">Order Details</h3>
              
              <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-2 no-scrollbar border-b border-white/10 pb-5">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-3">
                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt="" />
                    <div className="flex-grow flex flex-col justify-center">
                      <p className="font-black text-[10px] leading-tight mb-0.5 line-clamp-1">{item.name}</p>
                      <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black text-[10px] self-center">${((item.finalUnitPrice || item.price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Subtotal</span>
                  <span className="font-black text-[10px]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Shipping</span>
                  <span className="font-black text-indigo-400 text-[10px]">+ ${shippingCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-tight">Total Payable</span>
                  <span className="text-2xl font-black tracking-tighter">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full bg-white text-gray-900 py-3.5 rounded-xl font-black mt-6 hover:bg-indigo-400 hover:text-white transition-all shadow-lg text-[10px] uppercase tracking-widest"
              >
                Place Order Now
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl flex gap-3 border shadow-sm items-center">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-lock text-xs"></i>
              </div>
              <p className="text-[9px] text-gray-500 leading-tight font-bold uppercase tracking-widest">
                Safe & Encrypted Checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
