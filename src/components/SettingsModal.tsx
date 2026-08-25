import React, { useState } from 'react';
import { 
  Save, 
  Coins, 
  Store, 
  QrCode, 
  Printer, 
  ShieldAlert, 
  Check, 
  RefreshCw, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { Settings, Language } from '../types';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  settings: Settings;
  language: Language;
  onSaveSettings: (updates: Partial<Settings>) => Promise<void>;
  onRestoreSampleData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  language,
  onSaveSettings,
  onRestoreSampleData,
}) => {
  const t = translations[language];
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeNameKh, setStoreNameKh] = useState(settings.storeNameKh || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [exchangeRate, setExchangeRate] = useState(settings.exchangeRate.toString());
  const [bakongId, setBakongId] = useState(settings.bakongId || '');
  const [merchantName, setMerchantName] = useState(settings.merchantName || '');
  const [merchantCity, setMerchantCity] = useState(settings.merchantCity || 'Phnom Penh');
  const [terminalLabel, setTerminalLabel] = useState(settings.terminalLabel || 'POS-01');
  const [stockBuffer, setStockBuffer] = useState(settings.stockBuffer.toString());
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm'>(settings.receiptWidth || '80mm');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || '');
  const [receiptFooterKh, setReceiptFooterKh] = useState(settings.receiptFooterKh || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        storeName: storeName.trim(),
        storeNameKh: storeNameKh.trim(),
        phone: phone.trim(),
        address: address.trim(),
        exchangeRate: parseInt(exchangeRate, 10) || 4100,
        bakongId: bakongId.trim(),
        merchantName: merchantName.trim(),
        merchantCity: merchantCity.trim(),
        terminalLabel: terminalLabel.trim(),
        stockBuffer: parseInt(stockBuffer, 10) || 5,
        receiptWidth,
        receiptFooter: receiptFooter.trim(),
        receiptFooterKh: receiptFooterKh.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async () => {
    if (window.confirm('Reset catalog to sample Cambodian products? Any custom products will be replaced.')) {
      setIsRestoring(true);
      try {
        await onRestoreSampleData();
        alert('Sample Cambodian products restored successfully!');
      } finally {
        setIsRestoring(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Settings Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <span>{t.settings}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure exchange rate, Bakong QR integration, stock safety buffer, and store details.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{t.settingsSaved}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Dual Currency & Exchange Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Daily Market Exchange Rate (USD ➔ KHR)</h3>
              <p className="text-xs text-slate-500">All prices and cash change calculate with this rate in real-time.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1 USD = Khmer Riel (៛)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  required
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-indigo-200 rounded-xl text-indigo-700 font-mono font-bold text-lg focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  ៛
                </span>
              </div>
            </div>

            {/* Quick Rate Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Common Market Rates:
              </label>
              <div className="flex flex-wrap gap-2">
                {[4050, 4080, 4100, 4120, 4150].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setExchangeRate(rate.toString())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      exchangeRate === rate.toString()
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {rate.toLocaleString()} ៛
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Bakong KHQR Integration Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{t.bakongConfig}</h3>
              <p className="text-xs text-slate-500">Official National Bank of Cambodia EMVCo QR code parameters.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.bakongId} *
              </label>
              <input
                type="text"
                required
                value={bakongId}
                onChange={(e) => setBakongId(e.target.value)}
                placeholder="e.g. your_account@aclb or merchant@ftb"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {t.bakongIdHint}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.merchantName} *
              </label>
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g. ANGKOR MART PHNOM PENH"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.merchantCity}
              </label>
              <input
                type="text"
                value={merchantCity}
                onChange={(e) => setMerchantCity(e.target.value)}
                placeholder="Phnom Penh"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.terminalLabel}
              </label>
              <input
                type="text"
                value={terminalLabel}
                onChange={(e) => setTerminalLabel(e.target.value)}
                placeholder="POS-01"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Safety Stock Buffer & Store Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Stock Buffer Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Stock Buffer Alert</h3>
                <p className="text-xs text-slate-500">Global threshold for micro-business reorders.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.stockBufferSetting} (Units)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={stockBuffer}
                onChange={(e) => setStockBuffer(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                When items reach or fall below this number, the POS displays a prominent amber warning badge.
              </p>
            </div>
          </div>

          {/* Thermal Printer Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{t.receiptSize}</h3>
                <p className="text-xs text-slate-500">Default thermal printer width.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReceiptWidth('58mm')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  receiptWidth === '58mm'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                58mm (Compact)
              </button>
              <button
                type="button"
                onClick={() => setReceiptWidth('80mm')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  receiptWidth === '80mm'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                80mm (Standard POS)
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: Store Profile & Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{t.storeProfile}</h3>
              <p className="text-xs text-slate-500">Printed on the header of all customer receipts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.storeName}
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">
                {t.storeNameKh}
              </label>
              <input
                type="text"
                value={storeNameKh}
                onChange={(e) => setStoreNameKh(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-khmer text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.phone}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.address}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.receiptFooterEn}
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">
                {t.receiptFooterKh}
              </label>
              <input
                type="text"
                value={receiptFooterKh}
                onChange={(e) => setReceiptFooterKh(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-khmer text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.seedDemoData}</span>
          </button>

          <button
            id="save-settings-btn"
            type="submit"
            disabled={isSaving}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t.saveSettings}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
