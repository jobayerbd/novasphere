
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Address, Order } from '../types';

const UserProfile: React.FC = () => {
  const { currentUser, orders, logout, updateUser } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'settings'>('orders');
  const userOrders = orders.filter(o => o.userId === currentUser?.id);

  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    label: '', fullName: '', phoneNumber: '', street: '', city: '', zip: '', country: 'Bangladesh'
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleAddAddress = () => {
    if (!currentUser) return;
    if (!newAddress.fullName || !newAddress.phoneNumber || !newAddress.street || !newAddress.city) {
      alert("Please fill in the required fields: Name, Phone, Street, and City.");
      return;
    }
    const addr: Address = {
      ...newAddress,
      id: `a-${Date.now()}`
    } as Address;
    
    updateUser({
      ...currentUser,
      addresses: [...currentUser.addresses, addr]
    });
    setNewAddress({ label: '', fullName: '', phoneNumber: '', street: '', city: '', zip: '', country: 'Bangladesh' });
    setShowAddressForm(false);
  };

  const removeAddress = (id: string) => {
    if (!currentUser) return;
    updateUser({
      ...currentUser,
      addresses: currentUser.addresses.filter(a => a.id !== id)
    });
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <div className="p-6 bg-white rounded-2xl border shadow-sm mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold mb-4">
              {currentUser.name.charAt(0)}
            </div>
            <h3 className="font-bold text-gray-900">{currentUser.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{currentUser.email}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors text-xs md:text-sm ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <i className="fas fa-shopping-bag mr-3"></i> Orders
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors text-xs md:text-sm ${activeTab === 'addresses' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <i className="fas fa-map-marker-alt mr-3"></i> Addresses
            </button>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors text-xs md:text-sm ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <i className="fas fa-cog mr-3"></i> Settings
          </button>
          <hr className="my-4 hidden md:block" />
          <button 
            onClick={logout}
            className="w-full text-left px-4 py-3 rounded-xl font-medium text-rose-500 hover:bg-rose-50 transition-colors text-xs md:text-sm"
          >
            <i className="fas fa-sign-out-alt mr-3"></i> Log Out
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Order History</h2>
              {userOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
                  <i className="fas fa-box-open text-5xl mb-4 text-gray-200"></i>
                  <p>No orders yet.</p>
                </div>
              ) : (
                userOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gray-50/80 px-4 md:px-6 py-4 flex justify-between items-center border-b">
                      <div>
                        <p className="text-[8px] md:text-xs text-gray-400 uppercase font-black tracking-widest">Order ID</p>
                        <p className="font-mono text-xs md:text-sm font-bold text-gray-800">{order.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[8px] md:text-[10px] px-3 py-1 rounded-full font-black uppercase border shadow-sm ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <div className="space-y-4">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-4">
                            <img src={item.image} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border" alt={item.name} />
                            <div className="flex-grow">
                              <p className="font-bold text-gray-900 text-xs md:text-sm">{item.name}</p>
                              <p className="text-[10px] md:text-xs text-gray-500">{item.quantity} &times; ${item.price.toFixed(2)}</p>
                            </div>
                            <p className="font-black text-gray-900 text-xs md:text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 pt-6 border-t flex flex-row justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Date</p>
                          <p className="text-xs text-gray-700 font-medium">{order.date}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total</p>
                           <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Addresses</h2>
                <button 
                  onClick={() => setShowAddressForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
                >
                  <i className="fas fa-plus mr-2"></i> Add New
                </button>
              </div>

              {showAddressForm && (
                <div className="bg-white rounded-2xl border p-5 md:p-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-4">
                  <h4 className="font-bold text-sm">New Shipping Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Label (e.g. Home)" 
                      className="border p-3 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500"
                      value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                    />
                    <input 
                      placeholder="Full Name *" 
                      className="border p-3 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500"
                      value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})}
                    />
                  </div>
                  <input 
                    placeholder="Phone Number *" 
                    type="tel"
                    className="w-full border p-3 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500"
                    value={newAddress.phoneNumber} onChange={e => setNewAddress({...newAddress, phoneNumber: e.target.value})}
                  />
                  <input 
                    placeholder="Street Address *" 
                    className="w-full border p-3 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500"
                    value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="City *" 
                      className="border p-3 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500"
                      value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                    />
                    <input 
                      placeholder="ZIP Code" 
                      className="border p-3 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500"
                      value={newAddress.zip} onChange={e => setNewAddress({...newAddress, zip: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowAddressForm(false)} className="px-4 py-2 text-gray-500 text-xs">Cancel</button>
                    <button onClick={handleAddAddress} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-md">Save Address</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentUser.addresses.map(addr => (
                  <div key={addr.id} className="bg-white rounded-2xl border p-5 relative group shadow-sm">
                    <button 
                      onClick={() => removeAddress(addr.id)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-rose-500"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{addr.label}</span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1">{addr.fullName}</h4>
                    <p className="text-indigo-600 text-xs font-bold mt-1">{addr.phoneNumber}</p>
                    <p className="text-gray-500 text-xs mt-2">{addr.street}, {addr.city}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white rounded-2xl border p-8 md:p-12 text-center text-gray-500">
                <i className="fas fa-user-edit text-4xl mb-4 text-gray-200"></i>
                <h3 className="text-lg font-bold text-gray-900">Account</h3>
                <p className="mt-2 text-sm">Email: <strong className="text-indigo-600">{currentUser.email}</strong></p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
