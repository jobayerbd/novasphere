
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
      {/* Hero Section - Scale Typography for Mobile */}
      <section className="bg-gray-900 text-white pt-16 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
            Modern <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Essentials</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-400 max-w-xl mx-auto mb-10 font-medium px-4">
            Curated selection of high-performance tools and luxury lifestyle goods.
          </p>
          
          {/* Search Bar - Responsive Padding */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-500 group-focus-within:text-indigo-400 text-sm"></i>
            </div>
            <input 
              type="text"
              placeholder="Search masterpieces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm md:text-base text-white placeholder-gray-600 outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all font-bold"
            />
          </div>
        </div>
      </section>

      {/* Categories & Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col gap-6 mb-12">
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
            >
              All Designs
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2.5 rounded-xl font-black text-xs whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid - Mobile 1, Tablet 2, Desktop 3/4 */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map(product => {
              const hasSale = product.salePrice && product.salePrice > 0;
              return (
                <div 
                  key={product.id} 
                  className="group flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {hasSale && (
                      <div className="absolute top-4 left-4 bg-rose-500 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">SALE</div>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
                        <span className="text-sm font-black text-gray-900">${(hasSale ? product.salePrice : product.regularPrice).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-black text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">{product.category}</p>
                    
                    <div className="mt-auto flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <i className="fas fa-star text-amber-400 text-[10px]"></i>
                        <span className="text-xs font-black text-gray-400">{product.rating}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-colors"
                      >
                        <i className="fas fa-plus text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <i className="fas fa-search text-3xl text-gray-100 mb-4"></i>
            <h3 className="text-xl font-black text-gray-900">No items found</h3>
            <p className="text-gray-400 text-sm mt-2">Adjust your filters to see more results.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Storefront;
