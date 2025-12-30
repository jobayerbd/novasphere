
import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Address, ShippingOption, PaymentMethod } from '../types';

const CheckoutPage: React.FC = () => {
  const { cart, currentUser, placeOrder, setViewMode, shippingOptions, paymentMethods } = useApp();
  const [shippingInfo, setShippingInfo] = useState({ name: '', email: '', phone: '' });
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(shippingOptions[0] || null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(paymentMethods.find(p => p.isActive) || null);

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

    if (!shippingInfo.name || !shippingInfo.email || !finalPhone) {
      alert("Please provide contact name, email, and a valid phone number.");
      return;
    }

    if (!selectedShipping || !selectedPayment) {
      alert("Please select shipping and payment methods.");
      return;
    }

    let finalAddress: Address;
    if (useManualAddress) {
      if (!manualAddress.fullName || !manualAddress.street || !manualAddress.city || !manualAddress.zip || !manualAddress.phoneNumber) {
        alert("Please complete all shipping address fields including phone number.");
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black mb-6 text-gray-900">Your bag is empty</h2>
        <button onClick={() => setViewMode('store')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl">Explore Collection</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-12 animate-in fade-in duration-500">
      <h1 className="text-3xl md:text-5xl font-black mb-8 md:mb-12 tracking-tighter text-gray-900 text-center md:text-left">Checkout</h1>
      
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          {/* Step 1: Shipping Address */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">1</span>
                <h3 className="text-xl font-black text-gray-900">Shipping Info</h3>
              </div>
              {currentUser && currentUser.addresses.length > 0 && (
                <button 
                  onClick={() => setUseManualAddress(!useManualAddress)}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  {useManualAddress ? 'Use Saved' : 'Add New'}
                </button>
              )}
            </div>

            {!useManualAddress && currentUser && currentUser.addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {currentUser.addresses.map(addr => (
                  <button 
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all flex justify-between items-center ${selectedAddress?.id === addr.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-50 bg-gray-50/20'}`}
                  >
                    <div>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">{addr.label}</span>
                      <p className="font-black text-gray-900 text-sm">{addr.fullName}</p>
                      <p className="text-gray-500 text-xs font-medium mt-1">{addr.street}, {addr.city}</p>
                      <p className="text-indigo-600 text-xs font-bold mt-1">{addr.phoneNumber}</p>
                    </div>
                    {selectedAddress?.id === addr.id && <i className="fas fa-check-circle text-indigo-600 text-lg"></i>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input 
                    type="text" placeholder="Full Name *"
                    value={manualAddress.fullName}
                    onChange={e => setManualAddress({ ...manualAddress, fullName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <input 
                    type="tel" placeholder="Mobile Number *"
                    value={manualAddress.phoneNumber}
                    onChange={e => setManualAddress({ ...manualAddress, phoneNumber: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <input 
                  type="text" placeholder="Street Address / Area *"
                  value={manualAddress.street}
                  onChange={e => setManualAddress({ ...manualAddress, street: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <div className="grid grid-cols-2 gap-4">
                   <input 
                    type="text" placeholder="City *"
                    value={manualAddress.city}
                    onChange={e => setManualAddress({ ...manualAddress, city: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <input 
                    type="text" placeholder="ZIP Code *"
                    value={manualAddress.zip}
                    onChange={e => setManualAddress({ ...manualAddress, zip: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Shipping Method */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">2</span>
                <h3 className="text-xl font-black text-gray-900">Shipping</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shippingOptions.map(option => (
                  <button 
                    key={option.id}
                    onClick={() => setSelectedShipping(option)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedShipping?.id === option.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'}`}
                  >
                    <div className="flex justify-between items-center">
                       <span className="font-black text-gray-900 text-sm">{option.name}</span>
                       <span className="font-black text-indigo-600 text-sm">${option.charge.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
             </div>
          </section>

          {/* Step 3: Payment Selection */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">3</span>
              <h3 className="text-xl font-black text-gray-900">Payment</h3>
            </div>
            <div className="space-y-3">
              {paymentMethods.filter(p => p.isActive).map(method => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedPayment(method)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${selectedPayment?.id === method.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-gray-50/50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedPayment?.id === method.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <i className={`fas ${method.name.toLowerCase().includes('cash') ? 'fa-money-bill-wave' : 'fa-credit-card'} text-xs`}></i>
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{method.name}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment?.id === method.id ? 'border-indigo-600' : 'border-gray-300'}`}>
                    {selectedPayment?.id === method.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="bg-gray-900 text-white p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <h3 className="text-xl font-black mb-6 tracking-tight">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 no-scrollbar border-b border-white/10 pb-6">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4">
                    <img src={item.image} className="w-14 h-14 rounded-xl object-cover border border-white/10" alt="" />
                    <div className="flex-grow flex flex-col justify-center">
                      <p className="font-black text-xs leading-tight mb-1">{item.name}</p>
                      <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black text-xs self-center">${((item.finalUnitPrice || item.price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Subtotal</span>
                  <span className="font-black">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Shipping</span>
                  <span className="font-black text-indigo-400">+ ${shippingCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-black pt-4 border-t border-white/10 tracking-tighter">
                  <span>Payable</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full bg-white text-gray-900 py-4 rounded-xl font-black mt-8 hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
              >
                Place Order
              </button>
            </div>
            
            <div className="bg-white p-5 rounded-2xl flex gap-4 border shadow-sm items-center">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-shield-halved text-sm"></i>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                Safe & Secure 256-bit SSL Encrypted Transactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
