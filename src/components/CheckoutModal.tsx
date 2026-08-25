import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import {
  QrCode,
  Banknote,
  CheckCircle2,
  Copy,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Coins,
  AlertCircle,
} from "lucide-react";
import { CartItem, Settings, Language, Sale } from "../types";
import {
  convertUsdToKhr,
  formatUSD,
  formatKHR,
  generateBakongKHQR,
  calculateCashChange,
} from "../utils/khqr";
import { translations } from "../utils/translations";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  settings: Settings;
  language: Language;
  onCompleteSale: (saleData: {
    paymentType: "CASH" | "KHQR";
    cashReceivedUsd?: number;
    cashReceivedKhr?: number;
    changeUsd?: number;
    changeKhr?: number;
    khqrString?: string;
  }) => Promise<Sale | null>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  settings,
  language,
  onCompleteSale,
}) => {
  const t = translations[language];
  const [paymentType, setPaymentType] = useState<"KHQR" | "CASH">("KHQR");
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidUsdInput, setPaidUsdInput] = useState<string>("");
  const [paidKhrInput, setPaidKhrInput] = useState<string>("");
  const [khqrString, setKhqrString] = useState<string>("");
  const [billNumber, setBillNumber] = useState<string>("");

  const totalUsd = Number(
    cart
      .reduce((acc, item) => acc + item.product.priceUsd * item.quantity, 0)
      .toFixed(2),
  );
  const totalKhr = convertUsdToKhr(totalUsd, settings.exchangeRate);

  // Generate KHQR when modal opens or total changes
  useEffect(() => {
    if (isOpen && totalUsd > 0) {
      const inv = `INV-${Date.now().toString().slice(-6)}`;
      setBillNumber(inv);
      const qr = generateBakongKHQR({
        bakongId: settings.bakongId,
        merchantName: settings.merchantName,
        merchantCity: settings.merchantCity,
        amount: totalKhr,
        currency: "KHR",
        billNumber: inv,
        storeLabel: settings.storeName,
        terminalLabel: settings.terminalLabel,
      });
      setKhqrString(qr);
      // Reset inputs
      setPaidUsdInput("");
      setPaidKhrInput("");
    }
  }, [isOpen, totalUsd, totalKhr, settings]);

  if (!isOpen) return null;

  // Cash change calculation
  const paidUsdNum = parseFloat(paidUsdInput) || 0;
  const paidKhrNum = parseFloat(paidKhrInput) || 0;
  const cashCalc = calculateCashChange(
    totalUsd,
    settings.exchangeRate,
    paidUsdNum,
    paidKhrNum,
  );

  const handleCopyQR = () => {
    if (!khqrString) return;
    navigator.clipboard.writeText(khqrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (paymentType === "CASH" && !cashCalc.isSufficient) {
      return;
    }

    setIsProcessing(true);
    try {
      const sale = await onCompleteSale({
        paymentType,
        cashReceivedUsd: paymentType === "CASH" ? paidUsdNum : undefined,
        cashReceivedKhr: paymentType === "CASH" ? paidKhrNum : undefined,
        changeUsd: paymentType === "CASH" ? cashCalc.changeUsd : undefined,
        changeKhr: paymentType === "CASH" ? cashCalc.changeKhr : undefined,
        khqrString: paymentType === "KHQR" ? khqrString : undefined,
      });

      if (sale) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              {t.checkout} • {billNumber}
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-white">
                {formatUSD(totalUsd)}
              </h2>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                {formatKHR(totalKhr)}
              </span>
            </div>
          </div>

          <button
            id="close-checkout-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Method Tabs */}
        <div className="p-4 sm:p-6 space-y-5 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <button
              id="pay-method-khqr"
              onClick={() => setPaymentType("KHQR")}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                paymentType === "KHQR"
                  ? "bg-red-50/80 border-red-500 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentType === "KHQR"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900">
                    {t.bakongKHQR}
                  </h4>
                  <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                    KHQR
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {t.khqrDesc}
                </p>
              </div>
            </button>

            <button
              id="pay-method-cash"
              onClick={() => setPaymentType("CASH")}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                paymentType === "CASH"
                  ? "bg-emerald-50/80 border-emerald-500 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentType === "CASH"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                <Banknote className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900">{t.cash}</h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {t.cashDesc}
                </p>
              </div>
            </button>
          </div>

          {/* TAB 1: Bakong KHQR Display */}
          {paymentType === "KHQR" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center">
              {/* Bakong KHQR Official Stand Card */}
              <div className="w-full max-w-xs bg-white text-slate-900 rounded-2xl overflow-hidden shadow-lg border-2 border-red-600 p-4 select-none">
                {/* Red Header Bar */}
                <div className="bg-red-600 text-white py-1.5 px-3 rounded-lg flex items-center justify-between mb-3 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold tracking-wider text-xs">
                    <span>KHQR</span>
                    <span className="text-[10px] bg-red-700 px-1.5 py-0.2 rounded font-normal">
                      NBC
                    </span>
                  </div>
                  <div className="text-[10px] font-medium tracking-tight">
                    {settings.storeName}
                  </div>
                </div>

                {/* QR Canvas */}
                <div className="bg-white p-2 flex items-center justify-center rounded-xl border border-slate-200">
                  {khqrString ? (
                    <QRCodeSVG
                      value={khqrString}
                      size={190}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* Merchant & Amount Info */}
                <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                  <div className="font-bold text-xs text-slate-800 uppercase tracking-tight">
                    {settings.merchantName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {settings.bakongId}
                  </div>
                  <div className="mt-1.5 text-lg font-black text-red-600 font-mono">
                    {formatKHR(totalKhr)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 font-mono">
                    ({formatUSD(totalUsd)})
                  </div>
                </div>
              </div>

              {/* KHQR Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  id="copy-khqr-btn"
                  onClick={handleCopyQR}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-300 transition-colors shadow-sm cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">
                        {t.copied}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.copyQR}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>{t.waitingPayment}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cash Payment Calculator */}
          {paymentType === "CASH" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Paid in USD */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{t.amountPaidUsd}</span>
                    <span className="text-[11px] text-indigo-600 font-mono font-semibold">
                      Rate: {settings.exchangeRate}៛
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                      $
                    </span>
                    <input
                      id="cash-input-usd"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paidUsdInput}
                      onChange={(e) => setPaidUsdInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  {/* Quick USD preset buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 5, 10, 20, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPaidUsdInput(val.toString())}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 rounded-lg shadow-sm cursor-pointer"
                      >
                        ${val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPaidUsdInput(totalUsd.toString())}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-mono font-bold text-indigo-700 rounded-lg cursor-pointer"
                    >
                      Exact (${totalUsd})
                    </button>
                  </div>
                </div>

                {/* Paid in KHR */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    {t.amountPaidKhr}
                  </label>
                  <div className="relative">
                    <input
                      id="cash-input-khr"
                      type="number"
                      step="100"
                      placeholder="0"
                      value={paidKhrInput}
                      onChange={(e) => setPaidKhrInput(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                      ៛
                    </span>
                  </div>
                  {/* Quick KHR preset buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5000, 10000, 20000, 50000, 100000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPaidKhrInput(val.toString())}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 rounded-lg shadow-sm cursor-pointer"
                      >
                        {(val / 1000).toLocaleString()}k៛
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPaidKhrInput(totalKhr.toString())}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-mono font-bold text-emerald-700 rounded-lg cursor-pointer"
                    >
                      Exact ({totalKhr.toLocaleString()}៛)
                    </button>
                  </div>
                </div>
              </div>

              {/* Cash Calculation Results Card */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{t.totalReceived}</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {formatUSD(cashCalc.totalPaidUsd)} (≈{" "}
                    {formatKHR(
                      convertUsdToKhr(
                        cashCalc.totalPaidUsd,
                        settings.exchangeRate,
                      ),
                    )}
                    )
                  </span>
                </div>

                {cashCalc.isSufficient ? (
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        {t.changeDue}:
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black font-mono text-emerald-600">
                        {formatUSD(cashCalc.changeUsd)}
                      </div>
                      <div className="text-xs font-bold font-mono text-emerald-700">
                        {formatKHR(cashCalc.changeKhr)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600 font-bold">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{t.shortfall}:</span>
                    </span>
                    <span className="font-mono text-sm">
                      {formatUSD(cashCalc.shortfallUsd)} (
                      {formatKHR(
                        convertUsdToKhr(
                          cashCalc.shortfallUsd,
                          settings.exchangeRate,
                        ),
                      )}
                      )
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            id="cancel-checkout-btn"
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer shadow-sm"
          >
            {t.cancel}
          </button>

          <button
            id="confirm-payment-btn"
            onClick={handleConfirm}
            disabled={
              isProcessing || (paymentType === "CASH" && !cashCalc.isSufficient)
            }
            className={`flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              paymentType === "KHQR"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : paymentType === "KHQR" ? (
              <>
                <Smartphone className="w-4 h-4" />
                <span>{t.simulatedScan}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.completeSale}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
