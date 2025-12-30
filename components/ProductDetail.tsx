
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { trackPixelEvent } from '../services/fbPixel';

const ProductDetail: React.FC = () => {
  const { selectedProduct, addToCart, setViewMode } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      trackPixelEvent('ViewContent', {
        content_name: selectedProduct.name,
        content_ids: [selectedProduct.id],
        content_type: 'product',
        value: selectedProduct.price,
        currency: 'USD'
      });
    }
  }, [selectedProduct]);

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
      return { regular: reg, sale: sale, active: (sale > 0) ? sale : reg, stock: selectedProduct.stock };
    }
    const firstVar = selectedProduct.variations[0];
    const selectedVal = selectedOptions[firstVar.name];
    if (selectedVal) {
      const option = firstVar.options.find(o => o.value === selectedVal);
      if (option) {
        return { regular: option.regularPrice, sale: option.salePrice || 0, active: (option.salePrice && option.salePrice > 0) ? option.salePrice : option.regularPrice, stock: option.stock };
      }
    }
    const reg = selectedProduct.regularPrice || selectedProduct.price || 0;
    const sale = selectedProduct.salePrice || 0;
    return { regular: reg, sale: sale, active: (sale > 0) ? sale : reg, stock: selectedProduct.stock };
  }, [selectedProduct, selectedOptions]);

  const handleAddToCart = () => {
    if (selectedProduct.variations) {
      for (const v of selectedProduct.variations) {
        if (!selectedOptions[v.name]) {
          showToast(`Select a ${v.name}`, 'error');
          return;
        }
      }
    }
    addToCart(selectedProduct, quantity, selectedOptions, pricingData.active);
    showToast(`${selectedProduct.name} in bag!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 animate-in fade-in">
      <button onClick={() => setViewMode('store')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase">
        <i className="fas fa-arrow-left"></i> Back to Shop
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
        {/* Gallery Stack */}
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden border bg-gray-50 shadow-sm">
            <img src={currentMainImage} alt={selectedProduct.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {images.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden border-2 transition-all ${currentMainImage === img ? 'border-indigo-600' : 'border-transparent opacity-50'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 block">{selectedProduct.category}</span>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4 leading-tight">{selectedProduct.name}</h1>
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-4xl font-black text-gray-900">${pricingData.active.toFixed(2)}</span>
              {pricingData.sale > 0 && (
                <span className="text-lg text-gray-400 line-through font-bold">${pricingData.regular.toFixed(2)}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-10">{selectedProduct.description}</p>
          </div>

          {/* Configurable Variations */}
          <div className="space-y-8 mb-10">
            {selectedProduct.variations?.map((v) => (
              <div key={v.id} className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select {v.name}</label>
                <div className="flex flex-wrap gap-3">
                  {v.options.map(opt => (
                    <button 
                      key={opt.value}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [v.name]: opt.value }))}
                      className={`px-6 py-3 rounded-xl font-bold text-xs transition-all border-2 ${
                        selectedOptions[v.name] === opt.value ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center bg-gray-100 rounded-2xl p-1 w-fit border">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center font-black">-</button>
              <span className="w-10 text-center font-black text-sm">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center font-black">+</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={handleAddToCart}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                Add to Bag
              </button>
              <button 
                onClick={() => { handleAddToCart(); setViewMode('checkout'); }}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
              >
                Checkout Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
