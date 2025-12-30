
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';

const ProductDetail: React.FC = () => {
  const { selectedProduct, addToCart, setViewMode } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (!selectedProduct) return null;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    window.dispatchEvent(new CustomEvent('nova-toast', { detail: { message, type } }));
  };

  const images = useMemo(() => {
    return [selectedProduct.image, ...(selectedProduct.gallery || [])];
  }, [selectedProduct]);

  const currentMainImage = activeImage || selectedProduct.image;

  const pricingData = useMemo(() => {
    if (!selectedProduct.variations || selectedProduct.variations.length === 0) {
      const reg = selectedProduct.regularPrice || selectedProduct.price || 0;
      const sale = selectedProduct.salePrice || 0;
      return {
        regular: reg,
        sale: sale,
        active: (sale > 0) ? sale : reg,
        stock: selectedProduct.stock
      };
    }
    
    // Resolve based on first variation set (primary pricing driver)
    const firstVar = selectedProduct.variations[0];
    const selectedVal = selectedOptions[firstVar.name];
    if (selectedVal) {
      const option = firstVar.options.find(o => o.value === selectedVal);
      if (option) {
        return {
          regular: option.regularPrice,
          sale: option.salePrice || 0,
          active: (option.salePrice && option.salePrice > 0) ? option.salePrice : option.regularPrice,
          stock: option.stock
        };
      }
    }
    
    // Fallback if nothing selected
    const reg = selectedProduct.regularPrice || selectedProduct.price || 0;
    const sale = selectedProduct.salePrice || 0;
    return {
      regular: reg,
      sale: sale,
      active: (sale > 0) ? sale : reg,
      stock: selectedProduct.stock
    };
  }, [selectedProduct, selectedOptions]);

  const validateOptions = () => {
    if (selectedProduct.variations) {
      for (const v of selectedProduct.variations) {
        if (!selectedOptions[v.name]) {
          showToast(`Please select a ${v.name}`, 'error');
          return false;
        }
      }
    }

    if (pricingData.stock <= 0) {
      showToast("This item is currently out of stock.", "error");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateOptions()) return;
    addToCart(selectedProduct, quantity, selectedOptions, pricingData.active);
    showToast(`${selectedProduct.name} added to bag!`, 'success');
  };

  const handleBuyNow = () => {
    if (!validateOptions()) return;
    addToCart(selectedProduct, quantity, selectedOptions, pricingData.active);
    setViewMode('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasVariantDiscount = pricingData.sale > 0 && pricingData.sale < pricingData.regular;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 animate-in fade-in duration-500">
      <button onClick={() => setViewMode('store')} className="mb-10 flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest">
        <i className="fas fa-arrow-left"></i> Return to Collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Gallery Section */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border bg-gray-50 shadow-2xl shadow-gray-200">
            <img src={currentMainImage} alt={selectedProduct.name} className="w-full h-full object-cover animate-in fade-in duration-700" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {images.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`w-24 h-24 rounded-2xl flex-shrink-0 overflow-hidden border-2 transition-all ${currentMainImage === img ? 'border-indigo-600 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col">
          <div className="mb-8">
            <span className="inline-block px-4 py-1 rounded-full bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-6">{selectedProduct.category}</span>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tighter">{selectedProduct.name}</h1>
            
            <p className="text-xl text-gray-500 font-medium leading-relaxed mb-8 border-l-4 border-indigo-100 pl-6 italic">
              {selectedProduct.shortDescription || "Elevate your space with our premium selection."}
            </p>

            <div className="flex items-center gap-8 py-8 border-y border-gray-100">
              <div className="flex flex-col">
                {hasVariantDiscount && (
                  <span className="text-xl text-gray-400 line-through font-black decoration-rose-500/40 tracking-tight">${pricingData.regular.toFixed(2)}</span>
                )}
                <span className={`text-6xl font-black tracking-tighter ${hasVariantDiscount ? 'text-rose-500' : 'text-gray-900'}`}>
                  ${pricingData.active.toFixed(2)}
                </span>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border ${pricingData.stock > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                  {pricingData.stock > 0 ? `Inventory: ${pricingData.stock}` : 'Sold Out'}
                </span>
                {hasVariantDiscount && (
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] ml-1">Exclusive Offer Applied</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-12 mb-12">
            {selectedProduct.variations?.map((v) => (
              <div key={v.id} className="space-y-6">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Select {v.name}</label>
                   {selectedOptions[v.name] && <span className="text-[10px] font-black text-indigo-600 uppercase">Configured</span>}
                </div>
                <div className="flex flex-wrap gap-4">
                  {v.options.map(opt => {
                    const isSelected = selectedOptions[v.name] === opt.value;
                    const isSoldOut = opt.stock <= 0;
                    return (
                      <button 
                        key={opt.value}
                        disabled={isSoldOut}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [v.name]: opt.value }))}
                        className={`px-8 py-5 rounded-[1.5rem] font-black text-sm transition-all border-2 flex flex-col items-center min-w-[120px] ${
                          isSoldOut ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed grayscale' :
                          isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xl shadow-indigo-100 -translate-y-2' : 
                          'border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        {opt.value}
                        {!isSoldOut && (opt.salePrice && opt.salePrice < opt.regularPrice) && (
                          <span className="text-[9px] text-rose-500 mt-1 font-black">-{Math.round((1 - opt.salePrice/opt.regularPrice)*100)}%</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6 mt-auto">
            <div className="space-y-4">
              <div className="flex items-center bg-gray-100 rounded-[2rem] p-2 w-full border border-gray-200">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-16 h-16 flex items-center justify-center font-black text-2xl hover:text-indigo-600 transition-colors">&minus;</button>
                <span className="w-16 text-center font-black text-xl flex-grow">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-16 h-16 flex items-center justify-center font-black text-2xl hover:text-indigo-600 transition-colors">&plus;</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={pricingData.stock <= 0}
                  className={`py-6 rounded-[2rem] font-black text-xl transition-all shadow-xl border-2 ${
                    pricingData.stock > 0 
                      ? 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50' 
                      : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                  }`}
                >
                  {pricingData.stock > 0 ? 'Add to Bag' : 'Out of Stock'}
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={pricingData.stock <= 0}
                  className={`py-6 rounded-[2rem] font-black text-xl transition-all shadow-2xl border-2 ${
                    pricingData.stock > 0 
                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-1' 
                      : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                  }`}
                >
                  {pricingData.stock > 0 ? 'Buy it Now' : 'Check Back'}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border mt-10 space-y-4">
              <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-4">Detailed Description</h3>
              <p className="text-gray-600 font-medium leading-[1.8] whitespace-pre-wrap">{selectedProduct.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
