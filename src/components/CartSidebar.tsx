import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { CartItem, Settings, Language } from '../types';
import { convertUsdToKhr, formatUSD, formatKHR } from '../utils/khqr';
import { translations } from '../utils/translations';

interface CartSidebarProps {
  cart: CartItem[];
  settings: Settings;
  language: Language;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  settings,
  language,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const t = translations[language];

  const totalUsd = Number(
    cart.reduce((acc, item) => acc + item.product.priceUsd * item.quantity, 0).toFixed(2)
  );
  const totalKhr = convertUsdToKhr(totalUsd, settings.exchangeRate);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-full max-h-[calc(100vh-5.5rem)]">
      {/* Cart Header */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>{t.cart}</span>
              {totalItemsCount > 0 && (
                <span className="text-xs bg-indigo-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">
                  {totalItemsCount}
                </span>
              )}
            </h2>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            id="clear-cart-btn"
            onClick={onClearCart}
            className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearCart}</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">{t.emptyCart}</p>
            <p className="text-xs text-slate-400 max-w-[200px]">{t.tapToAdd}</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemTotalUsd = Number((item.product.priceUsd * item.quantity).toFixed(2));
            const itemTotalKhr = convertUsdToKhr(itemTotalUsd, settings.exchangeRate);

            return (
              <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-xl shrink-0">
                    {item.product.image || '📦'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {language === 'km' && item.product.nameKh ? item.product.nameKh : item.product.name}
                    </h4>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono font-medium text-slate-500">
                        {formatUSD(item.product.priceUsd)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({formatKHR(convertUsdToKhr(item.product.priceUsd, settings.exchangeRate))})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5 shrink-0">
                  <button
                    id={`qty-minus-${item.product.id}`}
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold font-mono text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    id={`qty-plus-${item.product.id}`}
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stockQty}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Item Total */}
                <div className="text-right shrink-0 min-w-[65px]">
                  <div className="text-xs font-bold font-mono text-indigo-700">
                    {formatUSD(itemTotalUsd)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {formatKHR(itemTotalKhr)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Dual Currency Totals */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>{t.subtotal}</span>
            <span className="font-mono font-medium text-slate-700">{formatUSD(totalUsd)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>{t.exchangeRate}</span>
            <span className="font-mono text-emerald-600 font-bold">$1 = {settings.exchangeRate.toLocaleString()} ៛</span>
          </div>
        </div>

        {/* Highlighted Dual-Currency Total Card (Slate-900 dark contrast container) */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
            {t.total} (USD / KHR)
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatUSD(totalUsd)}
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {formatKHR(totalKhr)}
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          id="proceed-checkout-btn"
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
        >
          <span>{t.checkout}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
