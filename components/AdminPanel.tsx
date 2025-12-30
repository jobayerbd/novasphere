
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

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: 'fa-chart-line' },
    { id: 'products', label: 'Inventory', icon: 'fa-boxes-stacked' },
    { id: 'orders', label: 'Orders', icon: 'fa-receipt' },
    { id: 'variations', label: 'Variations', icon: 'fa-layer-group' },
    { id: 'settings', label: 'Settings', icon: 'fa-sliders' },
  ];

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

  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct?.regularPrice) return;
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
    if (!editingGlobalVar?.name || !editingGlobalVar?.options?.length) return;
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r sticky top-16 h-[calc(100vh-64px)] p-8">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Command Center</p>
        <div className="space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i className={`fas ${item.icon}`}></i> <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile Top Navigation Tabs */}
      <nav className="lg:hidden flex overflow-x-auto bg-white border-b p-2 sticky top-16 z-40 no-scrollbar gap-2">
        {menuItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as AdminTab)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap font-black text-xs transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}
          >
            <i className={`fas ${item.icon} text-[10px]`}></i> {item.label}
          </button>
        ))}
      </nav>

      <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-x-hidden pb-32 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{activeTab}</h1>
          {activeTab === 'products' && (
            <button 
              onClick={() => setEditingProduct({ name: '', regularPrice: 0, stock: 0, variations: [], gallery: [], category: 'electronics' })}
              className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-center"
            >
              + Create Product
            </button>
          )}
        </div>

        {/* --- Tab Content --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 animate-in fade-in">
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Revenue</p>
               <p className="text-3xl font-black text-gray-900">${metrics.revenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Orders</p>
               <p className="text-3xl font-black text-gray-900">{metrics.orderCount}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Catalog</p>
               <p className="text-3xl font-black text-gray-900">{products.length}</p>
            </div>
          </div>
        )}

        {/* Variations List */}
        {activeTab === 'variations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {globalVariations.map(gv => (
              <div key={gv.id} className="bg-white p-8 rounded-3xl border shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-black text-gray-900">{gv.name}</h3>
                  <div className="flex gap-4">
                    <button onClick={() => setEditingGlobalVar(gv)} className="text-indigo-600 text-[10px] font-black uppercase">Edit</button>
                    <button onClick={() => deleteGlobalVariation(gv.id)} className="text-rose-400 text-[10px] font-black uppercase">Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {gv.options.map(o => (
                    <span key={o} className="px-3 py-1.5 bg-gray-50 border rounded-lg text-[10px] font-bold text-gray-500">{o}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inventory List - Mobile optimized Cards */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 gap-4 lg:hidden animate-in fade-in">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-4">
                <img src={p.image} className="w-16 h-16 rounded-xl object-cover border" alt="" />
                <div className="flex-grow">
                  <p className="font-black text-gray-900 text-sm">{p.name}</p>
                  <p className="text-indigo-600 font-bold text-xs">${p.price.toFixed(2)}</p>
                </div>
                <button onClick={() => setEditingProduct(p)} className="p-2 text-indigo-600"><i className="fas fa-edit"></i></button>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Product Table */}
        {activeTab === 'products' && (
          <div className="hidden lg:block bg-white rounded-3xl border overflow-hidden shadow-sm animate-in fade-in">
             <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Inventory Item</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Regular Price</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Availability</th>
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
                          <p className="text-[10px] text-gray-400 uppercase font-black">{p.category}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-sm text-gray-900">${p.regularPrice.toFixed(2)}</td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${p.stock > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {p.stock} Units
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right space-x-4">
                        <button onClick={() => setEditingProduct(p)} className="text-indigo-600 font-black text-[10px] uppercase">Edit</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-rose-400 font-black text-[10px] uppercase">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}

        {/* --- MODALS - Optimized for Full Screen on Mobile --- */}
        {editingProduct && (
          <div className="fixed inset-0 bg-white lg:bg-black/60 lg:backdrop-blur-md flex items-center justify-center lg:p-4 z-[200]">
            <div className="bg-white w-full h-full lg:h-auto lg:rounded-[3rem] lg:max-w-7xl p-6 lg:p-12 overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl lg:text-4xl font-black tracking-tight">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 text-gray-400"><i className="fas fa-times text-xl"></i></button>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 pb-24 lg:pb-0">
                <div className="xl:col-span-4 space-y-6">
                  <input type="text" placeholder="Name" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full border p-4 rounded-xl bg-gray-50 font-bold outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Regular Price" value={editingProduct.regularPrice} onChange={e => setEditingProduct({...editingProduct, regularPrice: parseFloat(e.target.value)})} className="w-full border p-4 rounded-xl bg-gray-50 font-bold outline-none" />
                    <input type="number" placeholder="Stock" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full border p-4 rounded-xl bg-gray-50 font-bold outline-none" />
                  </div>
                  <input type="text" placeholder="Image URL" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full border p-4 rounded-xl bg-gray-50 font-bold outline-none" />
                </div>
                <div className="xl:col-span-4">
                   <textarea placeholder="Description" rows={8} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full border p-4 rounded-xl bg-gray-50 font-medium outline-none text-sm" />
                </div>
                <div className="xl:col-span-4 bg-gray-900 text-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem]">
                   <h4 className="text-lg font-black mb-6">Variations</h4>
                   <select onChange={e => addVariationToProduct(e.target.value)} className="w-full bg-white/10 text-[10px] p-3 rounded-xl outline-none font-black border border-white/20 uppercase tracking-widest mb-6" value="">
                        <option value="" disabled className="bg-gray-800">Select Preset</option>
                        {globalVariations.map(gv => <option key={gv.id} value={gv.id} className="bg-gray-800">{gv.name}</option>)}
                   </select>
                   <div className="space-y-6">
                      {editingProduct.variations?.map((v, vIdx) => (
                        <div key={v.id} className="space-y-4">
                          <p className="font-black text-indigo-400 uppercase text-[10px]">{v.name}</p>
                          {v.options.map((opt, oIdx) => (
                            <div key={oIdx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                              <span className="font-bold text-xs">{opt.value}</span>
                              <input type="number" value={opt.stock} onChange={e => updateVariantOption(vIdx, oIdx, 'stock', parseInt(e.target.value))} className="w-16 bg-white/10 border-none rounded-lg p-1 text-[10px] text-center font-bold" />
                            </div>
                          ))}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
              
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t lg:static lg:bg-transparent lg:border-none lg:p-0 lg:mt-10 lg:flex lg:justify-end">
                <button onClick={handleSaveProduct} className="w-full lg:w-auto px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl text-xs uppercase tracking-widest">Save Product</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
