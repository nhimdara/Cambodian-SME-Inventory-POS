import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Sparkles, Tag, Package } from 'lucide-react';
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
    <aside className="w-72 sm:w-80 md:w-[320px] lg:w-[360px] xl:w-[390px] shrink-0 flex flex-col bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs h-full min-h-0">
      {/* Cart Header */}
      <div className="shrink-0 p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span>{t.cart}</span>
              {totalItemsCount > 0 ? (
                <span className="text-xs bg-indigo-600 text-white font-mono-num font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {totalItemsCount}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 font-mono-num">
                  (0)
                </span>
              )}
            </h2>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            id="clear-cart-btn"
            onClick={onClearCart}
            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-rose-50 border border-rose-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearCart}</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2.5">
        {cart.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">{t.emptyCart}</p>
            <p className="text-xs text-slate-400 max-w-[210px] leading-relaxed">{t.tapToAdd}</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemTotalUsd = Number((item.product.priceUsd * item.quantity).toFixed(2));
            const itemTotalKhr = convertUsdToKhr(itemTotalUsd, settings.exchangeRate);

            return (
              <div
                key={item.product.id}
                className="p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {item.product.image && (item.product.image.startsWith('http') || item.product.image.startsWith('/') || item.product.image.startsWith('data:')) ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 text-lg">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {language === 'km' && item.product.nameKh ? item.product.nameKh : item.product.name}
                    </h4>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono-num font-semibold text-slate-600">
                        {formatUSD(item.product.priceUsd)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-num">
                        ({formatKHR(convertUsdToKhr(item.product.priceUsd, settings.exchangeRate))})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shrink-0 shadow-xs">
                  <button
                    id={`qty-minus-${item.product.id}`}
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold font-mono-num text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    id={`qty-plus-${item.product.id}`}
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stockQty}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Item Total */}
                <div className="text-right shrink-0 min-w-[65px]">
                  <div className="text-xs font-bold font-mono-num text-indigo-600">
                    {formatUSD(itemTotalUsd)}
                  </div>
                  <div className="text-[10px] font-mono-num text-slate-400">
                    {formatKHR(itemTotalKhr)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Dual Currency Totals */}
      <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200/80 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>{t.subtotal}</span>
            <span className="font-mono-num font-bold text-slate-800 text-sm">{formatUSD(totalUsd)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>{t.exchangeRate}</span>
            <span className="font-mono-num text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-xs">
              $1 = {settings.exchangeRate.toLocaleString()} ៛
            </span>
          </div>
        </div>

        {/* Highlighted Dual-Currency Total Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl shadow-slate-950/15 border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{t.total} (USD / KHR)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 font-mono-num font-bold">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-black text-white font-mono-num tracking-tight">
              {formatUSD(totalUsd)}
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono-num">
              {formatKHR(totalKhr)}
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          id="proceed-checkout-btn"
          onClick={onCheckout}
          disabled={cart.length === 0}
          className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            cart.length > 0
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>{t.checkout}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
