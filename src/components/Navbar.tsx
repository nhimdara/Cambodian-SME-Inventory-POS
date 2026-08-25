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
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md select-none border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Store Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-600/30 shrink-0">
              {settings.storeName.charAt(0) || 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>{language === 'km' ? settings.storeNameKh || settings.storeName : settings.storeName}</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  Bakong KHQR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-850/90 p-1 rounded-xl border border-slate-800">
            <button
              id="tab-pos"
              onClick={() => setCurrentTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'pos'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t.posTerminal}</span>
              {cartCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  currentTab === 'pos' ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
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
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.inventory}</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
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
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
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
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={t.settings}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </nav>

          {/* Right Action Widgets: Exchange Rate, Language, Cashier Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Exchange Rate Badge */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase text-slate-400 font-semibold tracking-wider">
                {t.exchangeRate}
              </span>
              {isEditingRate ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-16 px-1 py-0.5 bg-slate-800 border border-indigo-500 rounded text-emerald-400 text-xs font-mono font-bold focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRate();
                      if (e.key === 'Escape') setIsEditingRate(false);
                    }}
                  />
                  <span className="text-xs text-slate-400">៛</span>
                  <button
                    id="save-rate-btn"
                    onClick={handleSaveRate}
                    className="p-0.5 text-emerald-400 hover:bg-emerald-950 rounded cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="cancel-rate-btn"
                    onClick={() => setIsEditingRate(false)}
                    className="p-0.5 text-slate-400 hover:bg-slate-700 rounded cursor-pointer"
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
                  className="flex items-center gap-1 font-mono text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors group cursor-pointer"
                  title="Click to change exchange rate"
                >
                  <span>$1.00 = {settings.exchangeRate.toLocaleString()} ៛</span>
                  <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-300 ml-0.5" />
                </button>
              )}
            </div>

            <div className="hidden sm:block h-8 w-px bg-slate-800"></div>

            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Switch Language / ប្តូរភាសា"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'en' ? 'ខ្មែរ' : 'EN'}</span>
            </button>

            {/* Cashier Staff Avatar */}
            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-tight">Dara Chan</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">Senior Staff</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 text-indigo-300 font-bold text-xs flex items-center justify-center border border-slate-700 shadow-inner">
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
