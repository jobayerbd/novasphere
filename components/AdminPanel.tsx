
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Product, Order, GlobalVariation, ProductVariation, ProductVariantOption, ShippingOption, PaymentMethod } from '../types';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'variations' | 'settings';

const AdminPanel: React.FC = () => {
  const { 
    products, orders, globalVariations, shippingOptions, paymentMethods, categories,
    setShippingOptions, setPaymentMethods,
    addProduct, updateProduct, deleteProduct, 
    addGlobalVariation, updateGlobalVariation, deleteGlobalVariation,
    updateOrderStatus
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Settings States
  const [newShipping, setNewShipping] = useState<Partial<ShippingOption>>({ name: '', charge: 0 });

  const metrics = useMemo(() => {
    const totalRev = orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.total : acc, 0);
    return {
      revenue: totalRev,
      orderCount: orders.length,
      inventoryCount: products.reduce((acc, p) => acc + p.stock, 0)
    };
  }, [orders, products]);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: 'fa-chart-line' },
    { id: 'products', label: 'Inventory', icon: 'fa-boxes-stacked' },
    { id: 'orders', label: 'Orders', icon: 'fa-receipt' },
    { id: 'variations', label: 'Variations', icon: 'fa-layer-group' },
    { id: 'settings', label: 'Settings', icon: 'fa-sliders' },
  ];

  // Settings Handlers
  const handleAddShipping = () => {
    if (!newShipping.name) return;
    const opt: ShippingOption = {
      id: `ship-${Date.now()}`,
      name: newShipping.name,
      charge: newShipping.charge || 0
    };
    setShippingOptions([...shippingOptions, opt]);
    setNewShipping({ name: '', charge: 0 });
  };

  const removeShipping = (id: string) => {
    setShippingOptions(shippingOptions.filter(s => s.id !== id));
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct?.regularPrice) {
      alert("Name and Regular Price are required.");
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
      category: editingProduct.category || categories[0].id
    } as Product;

    if (editingProduct.id) updateProduct(p);
    else addProduct(p);
    setEditingProduct(null);
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

  const removeVariationFromProduct = (vId: string) => {
    setEditingProduct(prev => ({
      ...prev,
      variations: (prev?.variations || []).filter(v => v.id !== vId)
    }));
  };

  const updateVariantOption = (vIdx: number, oIdx: number, field: keyof ProductVariantOption, val: any) => {
    const newVars = [...(editingProduct?.variations || [])];
    const newOpts = [...newVars[vIdx].options];
    newOpts[oIdx] = { ...newOpts[oIdx], [field]: val };
    
    // Auto-compute current effective price for this variant
    const activeSale = field === 'salePrice' ? val : newOpts[oIdx].salePrice;
    const activeReg = field === 'regularPrice' ? val : newOpts[oIdx].regularPrice;
    newOpts[oIdx].price = (activeSale && activeSale > 0) ? activeSale : activeReg;
    
    newVars[vIdx] = { ...newVars[vIdx], options: newOpts };
    setEditingProduct(prev => ({ ...prev, variations: newVars }));
  };

  const handleGalleryChange = (idx: number, val: string) => {
    const newGallery = [...(editingProduct?.gallery || [])];
    newGallery[idx] = val;
    setEditingProduct(prev => ({ ...prev, gallery: newGallery }));
  };

  const addGalleryImage = () => {
    setEditingProduct(prev => ({ ...prev, gallery: [...(prev?.gallery || []), ''] }));
  };

  const removeGalleryImage = (idx: number) => {
    setEditingProduct(prev => ({ ...prev, gallery: (prev?.gallery || []).filter((_, i) => i !== idx) }));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50/50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r sticky top-16 h-[calc(100vh-64px)] p-8">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Command Center</p>
        <div className="space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i className={`fas ${item.icon}`}></i> <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Navigation - Mobile */}
      <nav className="lg:hidden flex overflow-x-auto bg-white border-b p-2 sticky top-16 z-40 no-scrollbar gap-2">
        {menuItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as AdminTab)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap font-black text-xs transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
          >
            <i className={`fas ${item.icon} text-[10px]`}></i> {item.label}
          </button>
        ))}
      </nav>

      <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-x-hidden pb-32">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{activeTab}</h1>
          {activeTab === 'products' && (
            <button 
              onClick={() => setEditingProduct({ name: '', regularPrice: 0, salePrice: 0, stock: 0, variations: [], gallery: [], category: categories[0].id, image: '', description: '' })}
              className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-xl"
            >
              + Add New Product
            </button>
          )}
        </div>

        {/* --- Dashboard Tab --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Total Revenue</p>
               <p className="text-3xl font-black text-gray-900">${metrics.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Total Orders</p>
               <p className="text-3xl font-black text-gray-900">{metrics.orderCount}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Items in Shop</p>
               <p className="text-3xl font-black text-gray-900">{products.length}</p>
            </div>
          </div>
        )}

        {/* --- Inventory Tab --- */}
        {activeTab === 'products' && (
          <div className="animate-in fade-in">
             <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Product</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Price</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Stock</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5 flex items-center gap-4">
                            <img src={p.image} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{p.category}</p>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="font-bold text-sm text-gray-900">${p.price.toFixed(2)}</p>
                            {p.salePrice && p.salePrice > 0 && <p className="text-[9px] text-rose-500 font-bold line-through">${p.regularPrice.toFixed(2)}</p>}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${p.stock > 5 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                              {p.stock} In Stock
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right space-x-3">
                            <button onClick={() => setEditingProduct(p)} className="text-indigo-600 hover:text-indigo-800 transition-colors"><i className="fas fa-edit"></i></button>
                            <button onClick={() => deleteProduct(p.id)} className="text-rose-400 hover:text-rose-600 transition-colors"><i className="fas fa-trash-alt"></i></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
             </div>
          </div>
        )}

        {/* --- Orders Tab --- */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border overflow-hidden shadow-sm animate-in fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">ID</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Customer</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Total</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="px-8 py-5 font-mono text-xs font-bold text-indigo-600">#{order.id.split('-')[1]}</td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900 text-sm">{order.customerName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{order.customerPhone}</p>
                      </td>
                      <td className="px-8 py-5 font-black text-sm">${order.total.toFixed(2)}</td>
                      <td className="px-8 py-5 text-right">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          className="text-[10px] font-black uppercase border rounded-lg px-3 py-1.5 focus:ring-0 bg-gray-50 outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Settings Tab --- */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in">
             {/* Shipping */}
             <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3"><i className="fas fa-truck text-indigo-600"></i> Shipping Config</h3>
                <div className="space-y-3 mb-6">
                  {shippingOptions.map(opt => (
                    <div key={opt.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{opt.name}</p>
                        <p className="text-xs text-indigo-600 font-black">${opt.charge}</p>
                      </div>
                      <button onClick={() => removeShipping(opt.id)} className="text-rose-400"><i className="fas fa-times-circle"></i></button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-900 rounded-2xl">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      placeholder="Name" className="bg-white/10 text-white p-3 rounded-lg text-xs outline-none" 
                      value={newShipping.name} onChange={e => setNewShipping({...newShipping, name: e.target.value})}
                    />
                    <input 
                      type="number" placeholder="Charge" className="bg-white/10 text-white p-3 rounded-lg text-xs outline-none" 
                      value={newShipping.charge} onChange={e => setNewShipping({...newShipping, charge: parseFloat(e.target.value)})}
                    />
                  </div>
                  <button onClick={handleAddShipping} className="w-full bg-indigo-600 text-white py-3 rounded-lg text-[10px] font-black uppercase">Add Shipping Zone</button>
                </div>
             </div>

             {/* Payments */}
             <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3"><i className="fas fa-credit-card text-amber-500"></i> Payment Gateways</h3>
                <div className="space-y-3">
                  {paymentMethods.map(m => (
                    <div key={m.id} className="flex justify-between items-center p-4 border rounded-xl">
                      <div>
                        <p className="text-sm font-bold">{m.name}</p>
                        <p className="text-[10px] text-gray-400">{m.description}</p>
                      </div>
                      <button 
                        onClick={() => togglePaymentMethod(m.id)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${m.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${m.isActive ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* --- Product Modal (Universal Add/Edit) --- */}
        {editingProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl p-6 md:p-12 relative my-auto animate-in zoom-in duration-300">
              <button onClick={() => setEditingProduct(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>

              <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-10">{editingProduct.id ? 'Edit Masterpiece' : 'Design New Product'}</h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
                
                {/* Left Column: Basic Details */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Identification</label>
                    <input 
                      type="text" placeholder="Product Title *" 
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    />
                    <select 
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <textarea 
                      placeholder="Product Story / Description *" 
                      rows={5}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Regular Price</label>
                      <input 
                        type="number" placeholder="0.00" 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={editingProduct.regularPrice} onChange={e => setEditingProduct({...editingProduct, regularPrice: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sale Price</label>
                      <input 
                        type="number" placeholder="Optional" 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-indigo-500 transition-all text-rose-500"
                        value={editingProduct.salePrice} onChange={e => setEditingProduct({...editingProduct, salePrice: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Stock</label>
                      <input 
                        type="number" placeholder="Units" 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  {/* Image Assets */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Management (URLs)</label>
                    <input 
                      type="text" placeholder="Main Feature Image URL *" 
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                    />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gallery Assets</span>
                        <button onClick={addGalleryImage} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Add Link</button>
                      </div>
                      {editingProduct.gallery?.map((url, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text" placeholder={`Gallery Link #${idx + 1}`}
                            className="flex-grow bg-gray-50 border border-gray-100 p-3 rounded-xl outline-none font-bold text-[10px]"
                            value={url} onChange={e => handleGalleryChange(idx, e.target.value)}
                          />
                          <button onClick={() => removeGalleryImage(idx)} className="text-rose-400 px-2"><i className="fas fa-trash"></i></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Variations */}
                <div className="lg:col-span-5 bg-gray-900 rounded-[2rem] p-6 md:p-10 text-white">
                  <h3 className="text-xl font-black mb-6 tracking-tight flex items-center gap-3">
                    <i className="fas fa-layer-group text-indigo-400"></i> Variations
                  </h3>
                  
                  <div className="mb-8">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">Add From Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {globalVariations.map(gv => (
                        <button 
                          key={gv.id} 
                          disabled={editingProduct.variations?.some(v => v.id === gv.id)}
                          onClick={() => addVariationToProduct(gv.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${editingProduct.variations?.some(v => v.id === gv.id) ? 'bg-gray-800 border-gray-700 text-gray-500 opacity-50' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                        >
                          {gv.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {editingProduct.variations?.map((v, vIdx) => (
                      <div key={v.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{v.name} Configuration</span>
                          <button onClick={() => removeVariationFromProduct(v.id)} className="text-rose-400 text-xs"><i className="fas fa-minus-circle"></i></button>
                        </div>
                        <div className="space-y-3">
                          {v.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-4 bg-black/20 p-3 rounded-xl">
                              <span className="w-16 font-bold text-xs truncate">{opt.value}</span>
                              <div className="flex-grow grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[8px] text-gray-500 font-black uppercase">Stock</label>
                                  <input 
                                    type="number" value={opt.stock} 
                                    onChange={e => updateVariantOption(vIdx, oIdx, 'stock', parseInt(e.target.value))}
                                    className="w-full bg-white/10 border-none rounded-lg p-2 text-[10px] font-bold text-center outline-none focus:ring-1 focus:ring-indigo-500" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] text-gray-500 font-black uppercase">Price Override</label>
                                  <input 
                                    type="number" value={opt.regularPrice} 
                                    onChange={e => updateVariantOption(vIdx, oIdx, 'regularPrice', parseFloat(e.target.value))}
                                    className="w-full bg-white/10 border-none rounded-lg p-2 text-[10px] font-bold text-center outline-none focus:ring-1 focus:ring-indigo-500" 
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!editingProduct.variations || editingProduct.variations.length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                      <p className="text-xs text-gray-500 font-medium">No variations applied.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="px-8 py-5 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveProduct}
                  className="flex-grow py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  Finalize & Save Product
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
