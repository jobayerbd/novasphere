
import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Address, ShippingOption, PaymentMethod } from '../types';

const CheckoutPage: React.FC = () => {
  const { cart, currentUser, placeOrder, setViewMode, shippingOptions, paymentMethods } = useApp();
  const [shippingInfo, setShippingInfo] = useState({ name: '', email: '' });
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(shippingOptions[0] || null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(paymentMethods.find(p => p.isActive) || null);

  const [manualAddress, setManualAddress] = useState<Partial<Address>>({
    fullName: '',
    street: '',
    city: '',
    zip: '',
    country: 'USA'
  });

  useEffect(() => {
    if (currentUser) {
      setShippingInfo({ name: currentUser.name, email: currentUser.email });
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
    if (!shippingInfo.name || !shippingInfo.email) {
      alert("Please provide contact information.");
      return;
    }

    if (!selectedShipping || !selectedPayment) {
      alert("Please select shipping and payment methods.");
      return;
    }

    let finalAddress: Address;
    if (useManualAddress) {
      if (!manualAddress.fullName || !manualAddress.street || !manualAddress.city || !manualAddress.zip) {
        alert("Please complete all shipping address fields.");
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

    placeOrder(shippingInfo, finalAddress, selectedShipping, selectedPayment);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-black mb-6 text-gray-900">Your bag is empty</h2>
        <button onClick={() => setViewMode('store')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl">Explore Collection</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 animate-in fade-in duration-500">
      <h1 className="text-5xl font-black mb-16 tracking-tighter text-gray-900">Checkout Process</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-16">
          {/* Step 1: Shipping Address */}
          <section className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-5">
                <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg">1</span>
                <h3 className="text-2xl font-black text-gray-900">Delivery Address</h3>
              </div>
              {currentUser && currentUser.addresses.length > 0 && (
                <button 
                  onClick={() => setUseManualAddress(!useManualAddress)}
                  className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  {useManualAddress ? 'Choose Saved' : 'Enter Manually'}
                </button>
              )}
            </div>

            {!useManualAddress && currentUser && currentUser.addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {currentUser.addresses.map(addr => (
                  <button 
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`text-left p-8 rounded-[2rem] border-2 transition-all ${selectedAddress?.id === addr.id ? 'border-indigo-600 bg-indigo-50/30 shadow-xl' : 'border-gray-50 hover:border-gray-200 bg-gray-50/20'}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{addr.label}</span>
                      {selectedAddress?.id === addr.id && <i className="fas fa-check-circle text-indigo-600 text-xl"></i>}
                    </div>
                    <p className="font-black text-gray-900 text-lg">{addr.fullName}</p>
                    <p className="text-gray-500 text-sm font-medium mt-1 leading-relaxed">{addr.street}, {addr.city}, {addr.zip}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <input 
                  type="text" placeholder="Recipient Full Name"
                  value={manualAddress.fullName}
                  onChange={e => setManualAddress({ ...manualAddress, fullName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 outline-none font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                />
                <input 
                  type="text" placeholder="Street Address / Apartment"
                  value={manualAddress.street}
                  onChange={e => setManualAddress({ ...manualAddress, street: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 outline-none font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                />
                <div className="grid grid-cols-2 gap-6">
                   <input 
                    type="text" placeholder="City"
                    value={manualAddress.city}
                    onChange={e => setManualAddress({ ...manualAddress, city: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 outline-none font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <input 
                    type="text" placeholder="ZIP"
                    value={manualAddress.zip}
                    onChange={e => setManualAddress({ ...manualAddress, zip: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 outline-none font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Shipping Method */}
          <section className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
             <div className="flex items-center gap-5 mb-10">
                <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg">2</span>
                <h3 className="text-2xl font-black text-gray-900">Shipping Strategy</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shippingOptions.map(option => (
                  <button 
                    key={option.id}
                    onClick={() => setSelectedShipping(option)}
                    className={`p-8 rounded-[2rem] border-2 text-left transition-all ${selectedShipping?.id === option.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-black text-gray-900 text-lg">{option.name}</span>
                       <span className="font-black text-indigo-600">${option.charge.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Secured doorstep delivery via premium carriers.</p>
                  </button>
                ))}
             </div>
          </section>

          {/* Step 3: Payment Selection */}
          <section className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
            <div className="flex items-center gap-5 mb-10">
              <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg">3</span>
              <h3 className="text-2xl font-black text-gray-900">Secure Payment</h3>
            </div>
            <div className="space-y-4">
              {paymentMethods.filter(p => p.isActive).map(method => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedPayment(method)}
                  className={`w-full p-8 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between ${selectedPayment?.id === method.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-gray-50/50'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedPayment?.id === method.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <i className={`fas ${method.name.toLowerCase().includes('cash') ? 'fa-money-bill-wave' : 'fa-credit-card'}`}></i>
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{method.description}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPayment?.id === method.id ? 'border-indigo-600' : 'border-gray-300'}`}>
                    {selectedPayment?.id === method.id && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-10">
            <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
              <h3 className="text-3xl font-black mb-10 tracking-tight">Order Profile</h3>
              
              <div className="space-y-8 mb-10 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-5">
                    <img src={item.image} className="w-20 h-20 rounded-2xl object-cover border border-white/10" alt="" />
                    <div className="flex-grow flex flex-col justify-center">
                      <p className="font-black text-sm leading-tight mb-1">{item.name}</p>
                      <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black text-sm self-center">${((item.finalUnitPrice || item.price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-8 space-y-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                  <span className="font-black">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Logistics ({selectedShipping?.name || '...'})</span>
                  <span className="font-black text-indigo-400">+ ${shippingCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-4xl font-black pt-8 border-t border-white/10 tracking-tighter">
                  <span>Pay</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full bg-white text-gray-900 py-6 rounded-[2rem] font-black mt-12 hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm"
              >
                Confirm Purchase
              </button>
            </div>
            
            <div className="bg-white p-8 rounded-[2rem] flex gap-5 border shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-shield-halved"></i>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                NovaSphere ensures encrypted transactions. Your financial safety is our highest engineering priority.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
