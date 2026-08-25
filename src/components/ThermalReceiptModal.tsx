import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckCircle, RefreshCw, X, FileText, Sparkles, Share2 } from 'lucide-react';
import { Sale, Settings, Language } from '../types';
import { formatUSD, formatKHR } from '../utils/khqr';
import { translations } from '../utils/translations';

interface ThermalReceiptModalProps {
  sale: Sale | null;
  settings: Settings;
  language: Language;
  onClose: () => void;
  onNewSale: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  sale,
  settings,
  language,
  onClose,
  onNewSale,
}) => {
  const t = translations[language];
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(settings.receiptWidth || '80mm');

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header Controls */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{t.receipt}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{sale.billNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 58mm / 80mm Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                  paperWidth === '58mm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                  paperWidth === '80mm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Container Preview (Printable target) */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] flex justify-center bg-slate-100">
          <div
            id="thermal-receipt-printable"
            className={`bg-white text-slate-900 font-mono text-xs p-4 sm:p-5 rounded-xl shadow-md transition-all select-none border border-slate-300 ${
              paperWidth === '58mm' ? 'w-[260px]' : 'w-[320px]'
            }`}
            style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-sm sm:text-base text-black uppercase tracking-tight">
                {settings.storeName}
              </h2>
              {settings.storeNameKh && (
                <p className="font-khmer text-xs text-slate-800 mt-0.5">
                  {settings.storeNameKh}
                </p>
              )}
              <p className="text-[10px] text-slate-600 mt-1">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
            </div>

            {/* Meta Info */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5 text-slate-700">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold text-black">{sale.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYMENT:</span>
                <span className="font-bold uppercase text-black">{sale.paymentType}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200">
                <span className="w-6">QTY</span>
                <span className="flex-1 px-1">ITEM</span>
                <span className="text-right">TOTAL</span>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px]">
                {sale.items.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between">
                      <span className="w-6 font-bold">{item.quantity}x</span>
                      <span className="flex-1 px-1 truncate font-medium">{item.productName}</span>
                      <span className="text-right font-bold">{formatUSD(item.subtotalUsd)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 pl-6">
                      <span>@{formatUSD(item.priceUsd)}</span>
                      <span>{formatKHR(item.subtotalKhr)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>SUBTOTAL (USD):</span>
                <span>{formatUSD(sale.totalUsd)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>EXCHANGE RATE:</span>
                <span>$1 = {sale.exchangeRate.toLocaleString()} ៛</span>
              </div>

              {/* Highlighted Dual-Currency Grand Total */}
              <div className="pt-1.5 border-t border-slate-300 flex justify-between font-bold text-sm text-black">
                <span>TOTAL (USD):</span>
                <span>{formatUSD(sale.totalUsd)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-black">
                <span>TOTAL (KHR):</span>
                <span>{formatKHR(sale.totalKhr)}</span>
              </div>
            </div>

            {/* Payment Details */}
            {sale.paymentType === 'CASH' && (
              <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5 text-slate-700">
                {sale.cashReceivedUsd ? (
                  <div className="flex justify-between">
                    <span>PAID USD:</span>
                    <span>{formatUSD(sale.cashReceivedUsd)}</span>
                  </div>
                ) : null}
                {sale.cashReceivedKhr ? (
                  <div className="flex justify-between">
                    <span>PAID KHR:</span>
                    <span>{formatKHR(sale.cashReceivedKhr)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-bold text-black pt-0.5">
                  <span>CHANGE DUE:</span>
                  <span>
                    {formatUSD(sale.changeUsd || 0)} / {formatKHR(sale.changeKhr || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Bakong QR Section on Receipt */}
            <div className="pt-3 text-center flex flex-col items-center">
              <div className="bg-white p-1.5 rounded border border-slate-300 mb-1.5">
                <QRCodeSVG
                  value={sale.khqrString || `https://bakong.nbc.org.kh/pay?inv=${sale.billNumber}`}
                  size={paperWidth === '58mm' ? 100 : 120}
                  level="M"
                />
              </div>
              <p className="text-[9px] font-bold tracking-wider text-slate-700 uppercase">
                BAKONG KHQR VERIFIED
              </p>
              <p className="text-[8px] text-slate-500">{settings.bakongId}</p>
            </div>

            {/* Store Footer Message */}
            <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-600">
              <p className="font-khmer">{settings.receiptFooterKh}</p>
              <p className="text-[9px] mt-0.5">{settings.receiptFooter}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            id="print-receipt-btn"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReceipt}</span>
          </button>

          <button
            id="new-sale-btn"
            onClick={onNewSale}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 border border-slate-300 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t.newSale}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
