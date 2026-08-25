import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings as SettingsIcon, 
  Coins, 
  Globe, 
  AlertTriangle,
  Wifi,
  Sparkles,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Settings, Language } from '../types';
import { translations } from '../utils/translations';

interface NavbarProps {
  currentTab: 'pos' | 'inventory' | 'reports' | 'settings';
  setCurrentTab: (tab: 'pos' | 'inventory' | 'reports' | 'settings') => void;
  settings: Settings;
  onUpdateExchangeRate: (rate: number) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  cartCount: number;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  onUpdateExchangeRate,
  language,
  setLanguage,
  cartCount,
  lowStockCount,
}) => {
  const t = translations[language];
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(settings.exchangeRate.toString());

  const handleSaveRate = () => {
    const rateNum = parseInt(tempRate, 10);
    if (!isNaN(rateNum) && rateNum > 1000) {
      onUpdateExchangeRate(rateNum);
      setIsEditingRate(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white shadow-md select-none border-b border-slate-800">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Store Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-indigo-600/30 shrink-0 border border-indigo-400/30">
              {settings.storeName.charAt(0) || 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>{language === 'km' ? settings.storeNameKh || settings.storeName : settings.storeName}</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-950/70 text-red-400 border border-red-800/50 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  KHQR 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
            <button
              id="tab-pos"
              onClick={() => setCurrentTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'pos'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t.posTerminal}</span>
              {cartCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-num font-bold ${
                  currentTab === 'pos' ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white'
                }`}>
                  {cartCount}
                </span>
              )}
            </button>

            <button
              id="tab-inventory"
              onClick={() => setCurrentTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.inventory}</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-num font-bold bg-rose-500 text-white animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              id="tab-reports"
              onClick={() => setCurrentTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t.salesReports}</span>
            </button>

            <button
              id="tab-settings"
              onClick={() => setCurrentTab('settings')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title={t.settings}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </nav>

          {/* Right Action Widgets: Exchange Rate, Language, Cashier Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Exchange Rate Badge */}
            {isEditingRate ? (
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-indigo-500/80">
                <span className="text-[10px] text-slate-400 font-bold">$1 =</span>
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-emerald-400 text-xs font-mono-num font-bold focus:outline-none focus:border-indigo-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRate();
                    if (e.key === 'Escape') setIsEditingRate(false);
                  }}
                />
                <span className="text-xs text-slate-400 font-khmer">៛</span>
                <button
                  id="save-rate-btn"
                  onClick={handleSaveRate}
                  className="p-1 text-emerald-400 hover:bg-emerald-950/60 rounded cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  id="cancel-rate-btn"
                  onClick={() => setIsEditingRate(false)}
                  className="p-1 text-slate-400 hover:bg-slate-700/60 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="edit-rate-badge"
                onClick={() => {
                  setTempRate(settings.exchangeRate.toString());
                  setIsEditingRate(true);
                }}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors cursor-pointer group shadow-xs"
                title="Click to change exchange rate"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono-num text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  $1 = {settings.exchangeRate.toLocaleString()} ៛
                </span>
                <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
              </button>
            )}

            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              title="Switch Language / ប្តូរភាសា"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'en' ? 'ខ្មែរ' : 'EN'}</span>
            </button>

            {/* Cashier Staff Avatar */}
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-950 text-indigo-300 font-bold text-xs flex items-center justify-center border border-slate-700/80 shadow-xs">
                DC
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-800 py-2">
          <button
            onClick={() => setCurrentTab('pos')}
            className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
              currentTab === 'pos' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            {t.posTerminal} {cartCount > 0 ? `(${cartCount})` : ''}
          </button>
          <button
            onClick={() => setCurrentTab('inventory')}
            className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
              currentTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            {t.inventory} {lowStockCount > 0 ? `(${lowStockCount})` : ''}
          </button>
          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
              currentTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            {t.salesReports}
          </button>
          <button
            onClick={() => setCurrentTab('settings')}
            className={`px-3 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
              currentTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <SettingsIcon className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </header>
  );
};
