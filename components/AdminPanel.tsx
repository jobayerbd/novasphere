
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Product, Order, GlobalVariation, ProductVariation, ProductVariantOption, ShippingOption, PaymentMethod } from '../types';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'variations' | 'settings';

const AdminPanel: React.FC = () => {
  const { 
    products, orders, globalVariations, shippingOptions, paymentMethods,
    setShippingOptions, setPaymentMethods,
    addProduct, updateProduct, deleteProduct, 
    addGlobalVariation, updateGlobalVariation, deleteGlobalVariation,
    updateOrderStatus
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingGlobalVar, setEditingGlobalVar] = useState<Partial<GlobalVariation> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Settings Local State
  const [newShipping, setNewShipping] = useState<Partial<ShippingOption>>({ name: '', charge: 0 });
  const [newOptionVal, setNewOptionVal] = useState('');

  const metrics = useMemo(() => {
    const totalRev = orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.total : acc, 0);
    return {
      revenue: totalRev,
      orderCount: orders.length,
      inventoryCount: products.reduce((acc, p) => acc + p.stock, 0)
    };
  }, [orders, products]);

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // --- Shipping Management ---
  const handleAddShipping = () => {
    if (!newShipping.name || newShipping.charge === undefined) return;
    const opt: ShippingOption = {
      id: `ship-${Date.now()}`,
      name: newShipping.name,
      charge: newShipping.charge
    };
    setShippingOptions([...shippingOptions, opt]);
    setNewShipping({ name: '', charge: 0 });
  };

  const handleDeleteShipping = (id: string) => {
    setShippingOptions(shippingOptions.filter(s => s.id !== id));
  };

  // --- Payment Management ---
  const togglePaymentStatus = (id: string) => {
    setPaymentMethods(paymentMethods.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const updatePaymentInfo = (id: string, field: keyof PaymentMethod, val: any) => {
    setPaymentMethods(paymentMethods.map(p => 
      p.id === id ? { ...p, [field]: val } : p
    ));
  };

  // Save Product
  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct?.regularPrice) {
      alert("Name and Base Price are required.");
      return;
    }
    const p = {
      ...editingProduct,
      id: editingProduct.id || Date.now().toString(),
      price: (editingProduct.salePrice && editingProduct.salePrice > 0) ? editingProduct.salePrice : (editingProduct.regularPrice || 0),
      stock: editingProduct.stock || 0,
      rating: editingProduct.rating || 4.5,
      reviews: editingProduct.reviews || [],
      variations: editingProduct.variations || [],
      gallery: editingProduct.gallery || [],
      category: editingProduct.category || 'electronics'
    } as Product;

    if (editingProduct.id) updateProduct(p);
    else addProduct(p);
    setEditingProduct(null);
  };

  const handleSaveGlobalVar = () => {
    if (!editingGlobalVar?.name || !editingGlobalVar?.options?.length) {
      alert("Name and at least one option required.");
      return;
    }
    const gv = {
      ...editingGlobalVar,
      id: editingGlobalVar.id || `gv-${Date.now()}`,
      options: editingGlobalVar.options
    } as GlobalVariation;

    if (editingGlobalVar.id) updateGlobalVariation(gv);
    else addGlobalVariation(gv);
    setEditingGlobalVar(null);
  };

  const addVariationToProduct = (presetId: string) => {
    const preset = globalVariations.find(v => v.id === presetId);
    if (!preset || editingProduct?.variations?.find(v => v.id === presetId)) return;

    const newProdVar: ProductVariation = {
      id: preset.id,
      name: preset.name,
      options: preset.options.map(opt => ({
        value: opt,
        regularPrice: editingProduct?.regularPrice || 0,
        salePrice: editingProduct?.salePrice || undefined,
        price: (editingProduct?.salePrice && editingProduct.salePrice > 0) ? editingProduct.salePrice : (editingProduct?.regularPrice || 0),
        stock: editingProduct?.stock || 0
      }))
    };

    setEditingProduct(prev => ({
      ...prev,
      variations: [...(prev?.variations || []), newProdVar]
    }));
  };

  const updateVariantOption = (vIdx: number, oIdx: number, field: keyof ProductVariantOption, val: any) => {
    const newVars = [...(editingProduct?.variations || [])];
    const newOpts = [...newVars[vIdx].options];
    newOpts[oIdx] = { ...newOpts[oIdx], [field]: val };
    const activeSale = field === 'salePrice' ? val : newOpts[oIdx].salePrice;
    const activeReg = field === 'regularPrice' ? val : newOpts[oIdx].regularPrice;
    newOpts[oIdx].price = (activeSale && activeSale > 0) ? activeSale : activeReg;
    newVars[vIdx] = { ...newVars[vIdx], options: newOpts };
    setEditingProduct(prev => ({ ...prev, variations: newVars }));
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <aside className="w-72 bg-white border-r border-gray-100 p-8 hidden lg:flex flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto no-scrollbar">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Admin Command</p>
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-chart-line"></i> <span className="font-bold text-sm">Overview</span>
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-boxes-stacked"></i> <span className="font-bold text-sm">Inventory</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-receipt"></i> <span className="font-bold text-sm">Orders</span>
          </button>
          <button onClick={() => setActiveTab('variations')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'variations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-layer-group"></i> <span className="font-bold text-sm">Variations</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-sliders"></i> <span className="font-bold text-sm">Settings</span>
          </button>
        </div>
      </aside>

      <main className="flex-grow p-8 lg:p-12 overflow-x-hidden">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter capitalize">{activeTab}</h1>
          {activeTab === 'products' && (
            <button 
              onClick={() => setEditingProduct({ name: '', regularPrice: 0, stock: 0, variations: [], gallery: [], category: 'electronics' })}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              + Create Product
            </button>
          )}
        </div>

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Total Revenue</p>
               <p className="text-4xl font-black text-gray-900">${metrics.revenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Processed Orders</p>
               <p className="text-4xl font-black text-gray-900">{metrics.orderCount}</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Live Catalog</p>
               <p className="text-4xl font-black text-gray-900">{products.length}</p>
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="space-y-12 animate-in fade-in max-w-5xl">
            {/* Shipping Management Section */}
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Shipping Methods</h2>
                  <p className="text-sm text-gray-400 font-medium">Configure where you ship and how much it costs.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {shippingOptions.map(s => (
                  <div key={s.id} className="p-6 border rounded-[2rem] flex justify-between items-center bg-gray-50 group hover:border-indigo-200 transition-all">
                    <div>
                      <p className="font-black text-gray-900">{s.name}</p>
                      <p className="text-sm font-bold text-indigo-600">${s.charge.toFixed(2)}</p>
                    </div>
                    <button onClick={() => handleDeleteShipping(s.id)} className="w-10 h-10 rounded-xl bg-white text-rose-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 border flex items-center justify-center transition-all">
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-8 rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Add New Delivery Option</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="text" placeholder="Method Name (e.g. Express)" 
                    value={newShipping.name} onChange={e => setNewShipping({...newShipping, name: e.target.value})}
                    className="flex-grow bg-white border p-4 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <input 
                    type="number" placeholder="Charge ($)" 
                    value={newShipping.charge || ''} onChange={e => setNewShipping({...newShipping, charge: parseFloat(e.target.value)})}
                    className="w-full sm:w-32 bg-white border p-4 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <button onClick={handleAddShipping} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all">Add Zone</button>
                </div>
              </div>
            </div>

            {/* Payment Methods Section */}
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Financial Gateways</h2>
              <div className="space-y-6">
                {paymentMethods.map(p => (
                  <div key={p.id} className={`p-8 border rounded-[2.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${p.isActive ? 'border-indigo-100 bg-indigo-50/30 shadow-sm' : 'border-gray-100 grayscale opacity-60'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${p.isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-200 text-gray-400'}`}>
                        <i className={`fas ${p.name.toLowerCase().includes('cash') ? 'fa-wallet' : 'fa-credit-card'}`}></i>
                      </div>
                      <div>
                        <input 
                          type="text" value={p.name} 
                          onChange={e => updatePaymentInfo(p.id, 'name', e.target.value)}
                          className="font-black text-gray-900 bg-transparent border-none p-0 focus:ring-0 text-lg w-full"
                        />
                        <input 
                          type="text" value={p.description || ''} 
                          onChange={e => updatePaymentInfo(p.id, 'description', e.target.value)}
                          className="text-sm text-gray-400 font-medium bg-transparent border-none p-0 focus:ring-0 w-full"
                          placeholder="Description..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${p.isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                         {p.isActive ? 'Active' : 'Disabled'}
                       </span>
                       <button 
                        onClick={() => togglePaymentStatus(p.id)}
                        className={`w-14 h-8 rounded-full relative transition-all ${p.isActive ? 'bg-indigo-600' : 'bg-gray-200'}`}
                       >
                         <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${p.isActive ? 'left-7' : 'left-1'}`}></div>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Order ID</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Customer</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Date</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Amount</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Status</th>
                    <th className="px-10 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-6 font-mono font-bold text-indigo-600">{o.id}</td>
                      <td className="px-10 py-6">
                        <p className="font-bold text-gray-900">{o.customerName}</p>
                        <p className="text-xs text-gray-400">{o.customerEmail}</p>
                      </td>
                      <td className="px-10 py-6 text-sm font-medium text-gray-600">{o.date}</td>
                      <td className="px-10 py-6 font-black text-gray-900">${o.total.toFixed(2)}</td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border shadow-sm ${getStatusStyle(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button onClick={() => setSelectedOrder(o)} className="bg-gray-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in">
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Inventory Item</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Regular Price</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Offer Price</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Availability</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 group transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-14 h-14 rounded-2xl object-cover border" alt="" />
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400 uppercase font-black">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-bold text-gray-900">${p.regularPrice.toFixed(2)}</td>
                      <td className="px-10 py-6 font-bold text-rose-500">{p.salePrice ? `$${p.salePrice.toFixed(2)}` : '--'}</td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border shadow-sm ${p.stock > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {p.stock} Units
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right space-x-6">
                        <button onClick={() => setEditingProduct(p)} className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800">Edit</button>
                        <button onClick={() => { if(confirm('Delete product?')) deleteProduct(p.id); }} className="text-rose-400 font-black text-xs uppercase tracking-widest hover:text-rose-600">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VARIATIONS TAB --- */}
        {activeTab === 'variations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in">
            {globalVariations.map(gv => (
              <div key={gv.id} className="bg-white p-10 rounded-[2.5rem] border shadow-sm group hover:border-indigo-200 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{gv.name}</h3>
                  <div className="flex gap-4">
                    <button onClick={() => setEditingGlobalVar(gv)} className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">Edit</button>
                    <button onClick={() => deleteGlobalVariation(gv.id)} className="text-rose-400 text-xs font-black uppercase tracking-widest hover:underline">Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {gv.options.map(o => (
                    <span key={o} className="px-4 py-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-600">{o}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODALS --- */}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[300]">
            <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 lg:p-14 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in no-scrollbar">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-4xl font-black tracking-tighter mb-2">Order Information</h3>
                  <p className="font-mono text-indigo-600 font-bold">Ref: {selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 pb-12 border-b">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer Details</h4>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <p className="font-black text-lg text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-gray-500 font-medium">{selectedOrder.customerEmail}</p>
                    {selectedOrder.shippingAddress && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-black text-indigo-600 mb-1">SHIPPING ADDRESS</p>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                          {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}<br/>
                          {selectedOrder.shippingAddress.zip}, {selectedOrder.shippingAddress.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Management</h4>
                  <div className="bg-gray-900 text-white p-6 rounded-3xl space-y-4">
                    <p className="text-[10px] font-black uppercase text-indigo-400">Current Status: {selectedOrder.status}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(['pending', 'shipped', 'delivered', 'cancelled'] as Order['status'][]).map(status => (
                        <button 
                          key={status}
                          onClick={() => { updateOrderStatus(selectedOrder.id, status); setSelectedOrder({...selectedOrder, status}); }}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedOrder.status === status ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ordered Items</h4>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6 p-4 border rounded-[2rem] hover:bg-gray-50 transition-colors">
                      <img src={item.image} className="w-20 h-20 rounded-2xl object-cover border" alt="" />
                      <div className="flex-grow">
                        <p className="font-black text-gray-900">{item.name}</p>
                        <div className="flex gap-2 mt-1">
                          {item.selectedOptions && Object.entries(item.selectedOptions).map(([k, v]) => (
                            <span key={k} className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100">{k}: {v}</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-bold">Qty: {item.quantity} &times; ${(item.finalUnitPrice || item.price).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">${((item.finalUnitPrice || item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 flex flex-col items-end gap-3">
                <div className="flex justify-between w-full max-w-[300px] text-sm">
                  <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Logistics ({selectedOrder.shippingMethodName})</span>
                  <span className="font-black">+ ${selectedOrder.shippingCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[300px] pt-4 border-t border-gray-200">
                  <span className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Grand Total</span>
                  <span className="text-4xl font-black text-gray-900 tracking-tighter">${selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="mt-4 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                  <i className="fas fa-credit-card mr-2"></i> Paid via {selectedOrder.paymentMethodName}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Variation Preset Modal */}
        {editingGlobalVar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[300]">
            <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in">
               <h3 className="text-3xl font-black mb-8 tracking-tighter">{editingGlobalVar.id ? 'Edit Master Preset' : 'New Master Preset'}</h3>
               <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Preset Name (e.g. Size)</label>
                   <input 
                    type="text" placeholder="Variation Name" value={editingGlobalVar.name} 
                    onChange={e => setEditingGlobalVar({...editingGlobalVar, name: e.target.value})}
                    className="w-full border p-4 rounded-2xl bg-gray-50 font-bold outline-none mt-2"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Variation Options</label>
                   <div className="flex gap-2 mt-2">
                     <input 
                      type="text" placeholder="Add option" value={newOptionVal} 
                      onChange={e => setNewOptionVal(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), editingGlobalVar.options && (setEditingGlobalVar({...editingGlobalVar, options: [...editingGlobalVar.options, newOptionVal]}), setNewOptionVal('')))}
                      className="flex-grow border p-4 rounded-2xl bg-gray-50 font-bold outline-none"
                     />
                     <button onClick={() => { if(newOptionVal) { setEditingGlobalVar({...editingGlobalVar, options: [...(editingGlobalVar.options || []), newOptionVal]}); setNewOptionVal(''); } }} className="bg-gray-900 text-white px-6 rounded-2xl font-black">Add</button>
                   </div>
                   <div className="flex flex-wrap gap-2 mt-4">
                     {editingGlobalVar.options?.map((opt, idx) => (
                       <span key={idx} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-indigo-100">
                         {opt}
                         <button onClick={() => setEditingGlobalVar({...editingGlobalVar, options: editingGlobalVar.options?.filter((_, i) => i !== idx)})} className="text-indigo-300 hover:text-rose-500"><i className="fas fa-times"></i></button>
                       </span>
                     ))}
                   </div>
                 </div>
                 <div className="flex gap-4 pt-6">
                   <button onClick={() => setEditingGlobalVar(null)} className="flex-grow p-4 bg-gray-50 text-gray-400 font-black rounded-2xl">Cancel</button>
                   <button onClick={handleSaveGlobalVar} className="flex-grow p-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100">Save Preset</button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Product Designer Modal with Variations Matrix */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
            <div className="bg-white rounded-[3rem] w-full max-w-[95vw] lg:max-w-7xl p-8 lg:p-12 max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in no-scrollbar">
               <div className="flex justify-between items-center mb-10">
                <h3 className="text-4xl font-black tracking-tight">{editingProduct.id ? 'Edit Catalog Product' : 'Add New Catalog Product'}</h3>
                <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-900 transition-colors"><i className="fas fa-times text-2xl"></i></button>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                <div className="xl:col-span-4 space-y-10">
                  <div className="space-y-6">
                    <input type="text" placeholder="Product Name" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full border p-5 rounded-[1.5rem] bg-gray-50 font-bold outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="Regular Price" value={editingProduct.regularPrice} onChange={e => setEditingProduct({...editingProduct, regularPrice: parseFloat(e.target.value)})} className="w-full border p-5 rounded-[1.5rem] bg-gray-50 font-bold outline-none" />
                      <input type="number" placeholder="Offer Price" value={editingProduct.salePrice || ''} onChange={e => setEditingProduct({...editingProduct, salePrice: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full border p-5 rounded-[1.5rem] bg-gray-50 font-bold outline-none text-rose-500" />
                    </div>
                  </div>
                  <input type="text" placeholder="Main Feature Image URL" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full border p-5 rounded-[1.5rem] bg-gray-50 font-bold outline-none" />
                </div>
                <div className="xl:col-span-4 space-y-10">
                   <textarea placeholder="Main Description" rows={14} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full border p-5 rounded-[1.5rem] bg-gray-50 font-medium outline-none text-sm leading-relaxed" />
                </div>
                <div className="xl:col-span-4 flex flex-col h-full bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl overflow-hidden">
                   <div className="flex justify-between items-center mb-8 relative z-10">
                      <h4 className="text-2xl font-black tracking-tight">Variant Matrix</h4>
                      <select onChange={e => addVariationToProduct(e.target.value)} className="bg-white/10 text-[10px] p-3 rounded-xl outline-none font-black border border-white/20 uppercase tracking-widest" value="">
                        <option value="" disabled className="bg-gray-800">Add Preset</option>
                        {globalVariations.map(gv => <option key={gv.id} value={gv.id} className="bg-gray-800">{gv.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-10 flex-grow overflow-y-auto pr-4 no-scrollbar">
                      {editingProduct.variations?.map((v, vIdx) => (
                        <div key={v.id} className="space-y-6 pb-6 border-b border-white/10">
                          <p className="font-black text-indigo-400 uppercase tracking-widest text-[11px]">{v.name}</p>
                          {v.options.map((opt, oIdx) => (
                            <div key={oIdx} className="bg-white/5 p-5 rounded-[1.25rem] border border-white/10">
                              <p className="font-bold text-sm mb-4">{opt.value}</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[8px] text-white/40 font-black uppercase">Variant Price</label>
                                  <input type="number" value={opt.regularPrice} onChange={e => updateVariantOption(vIdx, oIdx, 'regularPrice', parseFloat(e.target.value))} className="w-full bg-white/10 border-none rounded-xl p-2 text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] text-white/40 font-black uppercase">In Stock</label>
                                  <input type="number" value={opt.stock} onChange={e => updateVariantOption(vIdx, oIdx, 'stock', parseInt(e.target.value))} className="w-full bg-white/10 border-none rounded-xl p-2 text-xs font-bold" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-12 pt-10 border-t border-gray-100">
                <button onClick={() => setEditingProduct(null)} className="font-black text-gray-400 hover:text-gray-900 uppercase text-xs tracking-widest transition-colors">Abort Changes</button>
                <button onClick={handleSaveProduct} className="px-16 py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all text-sm uppercase tracking-widest">Publish Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
