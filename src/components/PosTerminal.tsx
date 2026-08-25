import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  ShoppingBag,
  Filter,
  X,
  Package
} from 'lucide-react';
import { Product, CartItem, Settings, Language } from '../types';
import { convertUsdToKhr, formatUSD, formatKHR } from '../utils/khqr';
import { translations } from '../utils/translations';

interface PosTerminalProps {
  products: Product[];
  settings: Settings;
  language: Language;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  settings,
  language,
  cart,
  onAddToCart,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesName = p.name.toLowerCase().includes(q);
      const matchesNameKh = p.nameKh ? p.nameKh.toLowerCase().includes(q) : false;
      const matchesSku = p.sku.toLowerCase().includes(q);
      const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;

      return matchesCategory && (matchesName || matchesNameKh || matchesSku || matchesBarcode);
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle barcode quick scan / enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched && matched.stockQty > 0) {
      onAddToCart(matched);
      setBarcodeInput('');
    } else if (matched && matched.stockQty <= 0) {
      alert(`"${matched.name}" is out of stock!`);
    } else {
      // If not exact match, search for it
      setSearchQuery(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  // Helper to get cart quantity for a product
  const getCartQuantity = (productId: string): number => {
    const found = cart.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 space-y-3">
      {/* Top Search & Filter Bar */}
      <div className="shrink-0 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchProducts}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Barcode Quick Scanner Form */}
          <form onSubmit={handleBarcodeSubmit} className="relative sm:w-60">
            <Barcode className="w-4 h-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Barcode / SKU Scan"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </form>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 no-scrollbar">
          <button
            id="cat-all"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {t.allCategories} ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                id={`cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border border-dashed border-slate-300 rounded-3xl p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 mx-auto flex items-center justify-center text-indigo-500 mb-3 shadow-inner">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords or select a different category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3.5 pb-6">
            {filteredProducts.map((product) => {
              const priceKhr = convertUsdToKhr(product.priceUsd, settings.exchangeRate);
              const isOutOfStock = product.stockQty <= 0;
              const isLowStock =
                !isOutOfStock && product.stockQty <= (product.minStockAlert || settings.stockBuffer);
              const inCartQty = getCartQuantity(product.id);
              const remainingStock = product.stockQty - inCartQty;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => {
                    if (!isOutOfStock && remainingStock > 0) {
                      onAddToCart(product);
                    }
                  }}
                  className={`group relative bg-white border rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 select-none ${
                    isOutOfStock
                      ? 'border-slate-200/70 opacity-60 cursor-not-allowed bg-slate-50'
                      : remainingStock <= 0
                      ? 'border-amber-300/80 opacity-80 cursor-not-allowed bg-amber-50/30'
                      : inCartQty > 0
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/10 cursor-pointer'
                      : isLowStock
                      ? 'border-slate-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer hover:-translate-y-0.5'
                      : 'border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer hover:-translate-y-0.5'
                  }`}
                >
                  {/* Card Image Container */}
                  <div className="relative h-32 sm:h-36 w-full bg-slate-100 rounded-xl overflow-hidden mb-2.5 shadow-inner flex items-center justify-center">
                    {product.image && (product.image.startsWith('http') || product.image.startsWith('/') || product.image.startsWith('data:')) ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : null}
                    <div className={`img-fallback w-full h-full ${product.image && (product.image.startsWith('http') || product.image.startsWith('/') || product.image.startsWith('data:')) ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400`}>
                      {product.image && !product.image.startsWith('http') && !product.image.startsWith('/') ? (
                        <span className="text-4xl select-none">{product.image}</span>
                      ) : (
                        <Package className="w-10 h-10 text-slate-300" />
                      )}
                    </div>

                    {/* Gradient Overlay for Top Badges */}
                    <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                    {/* SKU & Category badge top left */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-[10px] font-mono-num font-bold text-white bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs">
                        {product.sku}
                      </span>
                    </div>

                    {/* Stock Status Badge top right */}
                    <div className="absolute top-2 right-2">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-white bg-red-600/90 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          {t.outOfStock}
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold text-amber-950 bg-amber-400/95 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-pulse"></span>
                          {product.stockQty} left
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-white bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
                          {product.stockQty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Titles */}
                  <div className="px-0.5 mb-2">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 leading-snug group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    {product.nameKh && (
                      <p className="font-khmer text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {product.nameKh}
                      </p>
                    )}
                  </div>

                  {/* Pricing and Action Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto px-0.5">
                    <div>
                      <div className="text-base font-extrabold font-mono-num text-slate-900 tracking-tight leading-tight">
                        {formatUSD(product.priceUsd)}
                      </div>
                      <div className="text-[11px] font-bold font-mono-num text-slate-400 leading-tight">
                        {formatKHR(priceKhr)}
                      </div>
                    </div>

                    {/* Quick Add Button */}
                    <div className="shrink-0">
                      {inCartQty > 0 ? (
                        <div className="h-8 px-2.5 rounded-xl bg-indigo-600 text-white font-bold font-mono-num text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30">
                          <span>{inCartQty}</span>
                          <Plus className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 shadow-xs group-hover:shadow-md group-hover:shadow-indigo-600/30">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
