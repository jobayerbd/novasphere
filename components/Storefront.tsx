
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Product } from '../types';

const Storefront: React.FC = () => {
  const { products, categories, cart, addToCart, setViewMode, setSelectedProduct } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setViewMode('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-none">
            Modern <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Essentials</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 font-medium">
            Elevate your daily experience with our meticulously curated collection of high-performance tools and luxury lifestyle goods.
          </p>
          
          {/* Main Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400 group-focus-within:text-indigo-400 transition-colors"></i>
            </div>
            <input 
              type="text"
              placeholder="Search for a masterpiece..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-white placeholder-gray-500 outline-none focus:bg-white/20 focus:border-indigo-500/50 transition-all font-bold"
            />
          </div>
        </div>
      </section>

      {/* Categories & Secondary Controls */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-3 overflow-x-auto pb-4 no-scrollbar">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300'}`}
            >
              All Designs
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-8 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {searchQuery && (
            <div className="text-sm font-bold text-gray-400">
              Showing {filteredProducts.length} results for <span className="text-indigo-600">"{searchQuery}"</span>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => {
              const hasSale = product.salePrice && product.salePrice > 0;
              const regPrice = product.regularPrice || product.price || 0;
              const salePrice = product.salePrice || 0;
              const discountPercent = hasSale ? Math.round(((regPrice - salePrice) / regPrice) * 100) : 0;
              
              return (
                <div 
                  key={product.id} 
                  className="group flex flex-col h-full bg-white rounded-[2rem] border border-gray-50 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative h-80 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    
                    {hasSale && (
                      <div className="absolute top-6 left-6 bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {discountPercent}% OFF
                      </div>
                    )}

                    <div className="absolute top-6 right-6">
                      <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm text-right">
                        {hasSale ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 line-through font-bold">${regPrice.toFixed(2)}</span>
                            <span className="text-lg font-black text-rose-500">${salePrice.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-black text-gray-900">${regPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-grow">
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mb-2">{product.category}</p>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-2 mb-6">{product.description}</p>
                    
                    <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-50">
                      <div className="flex items-center text-amber-400">
                        <i className="fas fa-star text-[10px] mr-1"></i>
                        <span className="text-xs font-bold text-gray-400">{product.rating}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="w-10 h-10 bg-gray-50 text-gray-900 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <i className="fas fa-plus text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-search text-3xl text-gray-200"></i>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-8 text-indigo-600 font-black hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Storefront;
