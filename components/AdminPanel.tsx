
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Product, Order, GlobalVariation, ProductVariation, ProductVariantOption, ShippingOption, PaymentMethod } from '../types';
import { isPixelBlocked, trackPixelEvent } from '../services/fbPixel';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'variations' | 'settings';
type SortOption = 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc';

const AdminPanel: React.FC = () => {
  const { 
    products, orders, globalVariations, shippingOptions, paymentMethods, categories, pixelId,
    setShippingOptions, setPaymentMethods, setPixelId,
    addProduct, updateProduct, deleteProduct, 
    addGlobalVariation, updateGlobalVariation, deleteGlobalVariation,
    updateOrderStatus
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Settings States
  const [newShipping, setNewShipping] = useState<Partial<ShippingOption>>({ name: '', charge: 0 });
  const [tempPixelId, setTempPixelId] = useState(pixelId);
  const [pixelStatus, setPixelStatus] = useState<'checking' | 'active' | 'blocked' | 'idle'>('idle');

  // Order Filtering & Sorting States
  const [orderFilter, setOrderFilter] = useState<Order['status'] | 'all'>('all');
  const [orderSort, setOrderSort] = useState<SortOption>('date-desc');

  useEffect(() => {
    if (pixelId) {
      setPixelStatus('checking');
      isPixelBlocked().then(blocked => {
        setPixelStatus(blocked ? 'blocked' : 'active');
      });
    } else {
      setPixelStatus('idle');
    }
  }, [pixelId]);

  const metrics = useMemo(() => {
    const totalRev = orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.total : acc, 0);
    return {
      revenue: totalRev,
      orderCount: orders.length,
      inventoryCount: products.reduce((acc, p) => acc + p.stock, 0)
    };
  }, [orders, products]);

  // Processed Orders (Filtered and Sorted)
  const processedOrders = useMemo(() => {
    let result = [...orders];

    // Filtering
    if (orderFilter !== 'all') {
      result = result.filter(o => o.status === orderFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (orderSort) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'total-desc':
          return b.total - a.total;
        case 'total-asc':
          return a.total - b.total;
        default:
          return 0;
      }
    });

    return result;
  }, [orders, orderFilter, orderSort]);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: 'fa-chart-line' },
    { id: 'products', label: 'Inventory', icon: 'fa-boxes-stacked' },
    { id: 'orders', label: 'Orders', icon: 'fa-receipt' },
    { id: 'variations', label: 'Variations', icon: 'fa-layer-group' },
    { id: 'settings', label: 'Settings', icon: 'fa-sliders' },
  ];

  const handleSavePixelId = () => {
    if (!tempPixelId) {
      alert("Please enter a valid Pixel ID");
      return;
    }
    setPixelId(tempPixelId);
    alert("Meta Pixel ID updated and synced!");
  };

  const sendTestEvent = () => {
    trackPixelEvent('Contact', { method: 'Admin Test Button' });
    alert("Test event 'Contact' sent to Pixel queue. Check your Events Manager.");
  };

  const removeShipping = (id: string) => {
    setShippingOptions(shippingOptions.filter(opt => opt.id !== id));
  };

  const handleAddShipping = () => {
    if (!newShipping.name) {
      alert("Shipping name is required.");
      return;
    }
    const newOpt: ShippingOption = {
      id: `ship-${Date.now()}`,
      name: newShipping.name,
      charge: newShipping.charge || 0
    };
    setShippingOptions([...shippingOptions, newOpt]);
    setNewShipping({ name: '', charge: 0 });
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
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
    setEditingProduct(prev => ({ ...prev, variations: [...(prev?.variations || []), newProdVar] }));
  };

  const removeVariationFromProduct = (vId: string) => {
    setEditingProduct(prev => ({ ...prev, variations: (prev?.variations || []).filter(v => v.id !== vId) }));
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
              + Create Masterpiece
            </button>
          )}
        </div>

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
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Total Inventory</p>
               <p className="text-3xl font-black text-gray-900">{products.length}</p>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="animate-in fade-in">
             <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Product</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Price</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Inventory</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5 flex items-center gap-4">
                            <img src={p.image} className="w-12 h-12 rounded-xl object-cover border" alt="" />
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
                              {p.stock} Units
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right space-x-4">
                            <button onClick={() => setEditingProduct(p)} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Edit</button>
                            <button onClick={() => deleteProduct(p.id)} className="text-rose-400 font-black text-[10px] uppercase hover:underline">Del</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Filtering & Sorting Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-5 rounded-2xl border shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filter by Status</p>
                  <select 
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value as any)}
                    className="w-full sm:w-48 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-all"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sort Orders</p>
                  <select 
                    value={orderSort}
                    onChange={(e) => setOrderSort(e.target.value as any)}
                    className="w-full sm:w-48 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-all"
                  >
                    <option value="date-desc">Date: Newest First</option>
                    <option value="date-asc">Date: Oldest First</option>
                    <option value="total-desc">Amount: High to Low</option>
                    <option value="total-asc">Amount: Low to High</option>
                  </select>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Results</p>
                <p className="text-lg font-black text-indigo-600">{processedOrders.length} Orders</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Date & ID</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Customer</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Total Amount</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400 pr-12">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-black text-indigo-600 mb-0.5 uppercase tracking-tighter">#{order.id.split('-')[1]}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.date}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-gray-900 text-sm">{order.customerName}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{order.customerPhone}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-black text-sm text-gray-900">${order.total.toFixed(2)}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{order.items.length} Items</p>
                        </td>
                        <td className="px-8 py-5 text-right pr-12">
                          <div className="inline-block relative">
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                              className={`text-[10px] font-black uppercase border rounded-lg px-4 py-2 focus:ring-0 outline-none cursor-pointer transition-all ${
                                order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-yellow-50 text-yellow-600 border-yellow-100'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {processedOrders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <i className="fas fa-search text-3xl text-gray-100 mb-4"></i>
                          <p className="text-gray-400 font-bold text-sm">No orders found matching your filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variations' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-gray-900">Global Variations</h3>
                  <button 
                    onClick={() => {
                      const name = prompt("Variation Name (e.g. Size, Color)");
                      if (name) addGlobalVariation({ id: `gv-${Date.now()}`, name, options: [] });
                    }}
                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    + Add Preset
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {globalVariations.map(gv => (
                    <div key={gv.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 group relative">
                      <button onClick={() => deleteGlobalVariation(gv.id)} className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">{gv.name}</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {gv.options.map((opt, idx) => (
                          <span key={idx} className="bg-white px-3 py-1 rounded-lg border text-[10px] font-black text-gray-600 uppercase">
                            {opt}
                            <button 
                              onClick={() => updateGlobalVariation({...gv, options: gv.options.filter((_, i) => i !== idx)})}
                              className="ml-2 text-gray-300 hover:text-rose-500"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          placeholder="Add Option..." className="flex-grow bg-white border border-gray-100 p-3 rounded-xl text-[10px] outline-none font-bold"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value;
                              if (val) {
                                updateGlobalVariation({...gv, options: [...gv.options, val]});
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in">
             <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-truck text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Shipping Config</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global delivery charges</p>
                  </div>
                </div>
                {/* Shipping Form Content */}
                <div className="space-y-3 mb-8">
                  {shippingOptions.map(opt => (
                    <div key={opt.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div>
                        <p className="text-sm font-black text-gray-900">{opt.name}</p>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">${opt.charge} Flat Rate</p>
                      </div>
                      <button onClick={() => removeShipping(opt.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fas fa-times-circle"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-gray-900 rounded-[2rem]">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Add New Zone</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <input 
                      placeholder="e.g. Inside City" className="bg-white/10 text-white p-4 rounded-xl text-xs outline-none border border-white/10 focus:border-indigo-500 font-bold" 
                      value={newShipping.name} onChange={e => setNewShipping({...newShipping, name: e.target.value})}
                    />
                    <input 
                      type="number" placeholder="Charge Amount" className="bg-white/10 text-white p-4 rounded-xl text-xs outline-none border border-white/10 focus:border-indigo-500 font-bold" 
                      value={newShipping.charge} onChange={e => setNewShipping({...newShipping, charge: parseFloat(e.target.value)})}
                    />
                  </div>
                  <button onClick={handleAddShipping} className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Create Shipping Zone</button>
                </div>
             </div>

             <div className="space-y-8">
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <i className="fab fa-facebook-f text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">Meta Pixel</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Marketing & Events</p>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${pixelStatus === 'active' ? 'bg-emerald-500' : pixelStatus === 'blocked' ? 'bg-rose-500' : 'bg-gray-300'}`}></span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                        {pixelStatus === 'active' ? 'Script Active' : pixelStatus === 'blocked' ? 'Blocked by AdBlocker' : 'Not Ready'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Pixel ID</label>
                    <input 
                      type="text" 
                      placeholder="Enter Pixel ID (e.g. 1234567890)" 
                      value={tempPixelId}
                      onChange={e => setTempPixelId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-none font-bold text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                        onClick={handleSavePixelId}
                        className="bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
                      >
                        Save & Sync
                      </button>
                      <button 
                        onClick={sendTestEvent}
                        disabled={!pixelId}
                        className="bg-gray-100 text-gray-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                      >
                        Send Test Event
                      </button>
                    </div>
                    {pixelStatus === 'blocked' && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                        <p className="text-[9px] text-rose-600 font-bold leading-relaxed">
                          ⚠️ WARNING: We detected that an Ad-blocker is preventing the Pixel from loading. Please disable any Ad-blockers on this site to see data in Facebook.
                        </p>
                      </div>
                    )}
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-credit-card text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Payment Gateways</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Channels</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {paymentMethods.map(m => (
                      <div key={m.id} className="flex justify-between items-center p-6 border rounded-2xl hover:bg-gray-50/50 transition-colors">
                        <div>
                          <p className="text-sm font-black text-gray-900">{m.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{m.description}</p>
                        </div>
                        <button 
                          onClick={() => togglePaymentMethod(m.id)}
                          className={`w-12 h-7 rounded-full transition-colors relative ${m.isActive ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${m.isActive ? 'right-1' : 'left-1'}`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl p-6 md:p-12 relative my-auto animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <button onClick={() => setEditingProduct(null)} className="absolute top-8 right-10 text-gray-300 hover:text-gray-900 transition-colors z-10">
                <i className="fas fa-times text-2xl"></i>
              </button>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-10 pr-12">
                {editingProduct.id ? 'Refine Product' : 'Craft New Product'}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-y-auto no-scrollbar pr-2 flex-grow">
                <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Core Identity</p>
                    <input type="text" placeholder="Visual Title *" className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                       <select className="bg-gray-50 border border-gray-100 p-5 rounded-2xl outline-none font-bold text-xs focus:ring-2 focus:ring-indigo-500 transition-all appearance-none" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="number" placeholder="Global Stock *" className="bg-gray-50 border border-gray-100 p-5 rounded-2xl outline-none font-black text-xs focus:ring-2 focus:ring-indigo-500 transition-all" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                    </div>
                    <textarea placeholder="Product Narrative / Specifications *" rows={4} className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl outline-none font-medium text-xs focus:ring-2 focus:ring-indigo-500 transition-all" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Regular Price</label>
                      <input type="number" placeholder="0.00" className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={editingProduct.regularPrice} onChange={e => setEditingProduct({...editingProduct, regularPrice: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Limited Offer Price</label>
                      <input type="number" placeholder="Optional" className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-indigo-500 transition-all text-rose-500" value={editingProduct.salePrice} onChange={e => setEditingProduct({...editingProduct, salePrice: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Media Assets</p>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Master Showcase URL</label>
                      <input type="text" placeholder="Main Image URL *" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-none font-bold text-[10px] focus:ring-2 focus:ring-indigo-500" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gallery Expansion</span>
                        <button onClick={addGalleryImage} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Add New Slide</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {editingProduct.gallery?.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <input type="text" placeholder={`Slide Link #${idx + 1}`} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-none font-bold text-[10px] focus:ring-2 focus:ring-indigo-500" value={url} onChange={e => handleGalleryChange(idx, e.target.value)} />
                            <button onClick={() => removeGalleryImage(idx)} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300 hover:text-rose-500 p-1"><i className="fas fa-trash-alt text-[10px]"></i></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 bg-gray-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl overflow-y-auto no-scrollbar">
                  <h3 className="text-xl font-black mb-8 tracking-tight flex items-center gap-3"><i className="fas fa-layer-group text-indigo-400"></i> Logic Variations</h3>
                  <div className="mb-10">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Inject Preset Logic</label>
                    <div className="flex flex-wrap gap-3">
                      {globalVariations.map(gv => (
                        <button key={gv.id} disabled={editingProduct.variations?.some(v => v.id === gv.id)} onClick={() => addVariationToProduct(gv.id)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${editingProduct.variations?.some(v => v.id === gv.id) ? 'bg-gray-800 border-gray-700 text-gray-600 opacity-50' : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'}`}>+ {gv.name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-8">
                    {editingProduct.variations?.map((v, vIdx) => (
                      <div key={v.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-6">
                          <div><span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{v.name}</span><p className="text-[8px] text-gray-500 uppercase font-black mt-0.5">Control Grid</p></div>
                          <button onClick={() => removeVariationFromProduct(v.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-2"><i className="fas fa-trash-alt text-xs"></i></button>
                        </div>
                        <div className="space-y-4">
                          {v.options.map((opt, oIdx) => (
                            <div key={oIdx} className="bg-black/20 p-5 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="font-black text-xs uppercase tracking-widest">{opt.value}</span></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Inventory</label><input type="number" value={opt.stock} onChange={e => updateVariantOption(vIdx, oIdx, 'stock', parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-black text-center outline-none focus:ring-1 focus:ring-indigo-500 text-white" /></div>
                                <div className="space-y-2"><label className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Price Point</label><input type="number" value={opt.regularPrice} onChange={e => updateVariantOption(vIdx, oIdx, 'regularPrice', parseFloat(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-black text-center outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-400" /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row gap-4">
                <button onClick={() => setEditingProduct(null)} className="px-10 py-5 border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all text-center">Discard Changes</button>
                <button onClick={handleSaveProduct} className="flex-grow py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all text-center">Finalize & Update Inventory</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
