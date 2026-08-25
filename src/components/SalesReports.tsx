import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Coins, 
  QrCode, 
  Banknote, 
  ShoppingBag, 
  TrendingUp, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  FileText,
  FileSpreadsheet,
  Package,
  ArrowUpRight,
  Sparkles,
  Receipt
} from 'lucide-react';
import { Sale, Product, Settings, Language } from '../types';
import { convertUsdToKhr, formatUSD, formatKHR } from '../utils/khqr';
import { translations } from '../utils/translations';
import { GenerateReportModal } from './GenerateReportModal';

interface SalesReportsProps {
  sales: Sale[];
  products: Product[];
  settings: Settings;
  language: Language;
  onViewReceipt: (sale: Sale) => void;
}

export const SalesReports: React.FC<SalesReportsProps> = ({
  sales,
  products,
  settings,
  language,
  onViewReceipt,
}) => {
  const t = translations[language];
  const [searchInvoice, setSearchInvoice] = useState('');
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'CASH' | 'KHQR'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'today' | '1week' | '1month' | '1year' | 'all'>('all');
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);

  // Period filtering for dashboard metrics
  const periodFilteredSales = useMemo(() => {
    const now = new Date();
    let start = new Date(0);

    if (periodFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (periodFilter === '1week') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (periodFilter === '1month') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (periodFilter === '1year') {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    return sales.filter((s) => new Date(s.createdAt).getTime() >= start.getTime());
  }, [sales, periodFilter]);

  // Aggregations
  const totalRevenueUsd = Number(
    periodFilteredSales.reduce((acc, s) => acc + s.totalUsd, 0).toFixed(2)
  );
  const totalRevenueKhr = periodFilteredSales.reduce((acc, s) => acc + s.totalKhr, 0);

  const cashSales = periodFilteredSales.filter((s) => s.paymentType === 'CASH');
  const khqrSales = periodFilteredSales.filter((s) => s.paymentType === 'KHQR');

  const cashRevenueUsd = Number(
    cashSales.reduce((acc, s) => acc + s.totalUsd, 0).toFixed(2)
  );
  const cashRevenueKhr = cashSales.reduce((acc, s) => acc + s.totalKhr, 0);

  const khqrRevenueUsd = Number(
    khqrSales.reduce((acc, s) => acc + s.totalUsd, 0).toFixed(2)
  );
  const khqrRevenueKhr = khqrSales.reduce((acc, s) => acc + s.totalKhr, 0);

  // Top products calculation
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; nameKh?: string; qty: number; revenueUsd: number }> = {};
    for (const sale of periodFilteredSales) {
      for (const item of sale.items) {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            nameKh: item.productNameKh,
            qty: 0,
            revenueUsd: 0,
          };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenueUsd += item.subtotalUsd;
      }
    }

    return Object.entries(map)
      .map(([id, data]) => ({
        id,
        name: data.name,
        nameKh: data.nameKh,
        unitsSold: data.qty,
        revenueUsd: Number(data.revenueUsd.toFixed(2)),
        revenueKhr: convertUsdToKhr(data.revenueUsd, settings.exchangeRate),
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);
  }, [periodFilteredSales, settings.exchangeRate]);

  // Filtered sales history
  const filteredSales = useMemo(() => {
    return periodFilteredSales.filter((s) => {
      const matchesPayment = filterPayment === 'ALL' || s.paymentType === filterPayment;
      const q = searchInvoice.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.billNumber.toLowerCase().includes(q) ||
        s.items.some((i) => i.productName.toLowerCase().includes(q));

      return matchesPayment && matchesSearch;
    });
  }, [periodFilteredSales, filterPayment, searchInvoice]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Payment Type', 'Total USD', 'Total KHR', 'Exchange Rate', 'Items'];
    const rows = sales.map((s) => [
      s.billNumber,
      new Date(s.createdAt).toISOString(),
      s.paymentType,
      s.totalUsd.toFixed(2),
      s.totalKhr,
      s.exchangeRate,
      `"${s.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SME_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Banner: Quick Report Generator Action Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-800/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-950/40">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {t.generateReport}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                Formal A4 & Thermal
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Print official A4/PDF statements, end-of-shift Z-Reports, inventory audits, and export dual-currency CSV.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            type="button"
            id="open-generate-report-btn"
            onClick={() => setIsGenerateReportOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{t.generateReport}</span>
          </button>
        </div>
      </div>

      {/* Dashboard Time Range Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700">{t.dateRange}:</span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPeriodFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodFilter === 'today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('1week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodFilter === '1week'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {t.oneWeek}
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('1month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodFilter === '1month'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {t.oneMonth}
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('1year')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodFilter === '1year'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {t.oneYear}
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {t.allTime}
          </button>
        </div>
      </div>

      {/* Top Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {periodFilter === 'today'
                ? t.todaySales
                : periodFilter === '1week'
                ? t.oneWeek
                : periodFilter === '1month'
                ? t.oneMonth
                : periodFilter === '1year'
                ? t.oneYear
                : t.grossRevenue}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700">
              {formatUSD(totalRevenueUsd)}
            </div>
            <div className="text-sm font-bold font-mono text-emerald-600 mt-0.5">
              {formatKHR(totalRevenueKhr)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>{t.totalOrders}:</span>
            <span className="font-bold text-slate-800">{periodFilteredSales.length}</span>
          </div>
        </div>

        {/* Bakong KHQR Sales */}
        <div className="bg-white border border-rose-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">{t.khqrRevenue}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {formatUSD(khqrRevenueUsd)}
            </div>
            <div className="text-sm font-bold font-mono text-rose-600 mt-0.5">
              {formatKHR(khqrRevenueKhr)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Transactions:</span>
            <span className="font-bold text-slate-800">
              {khqrSales.length} ({periodFilteredSales.length ? Math.round((khqrSales.length / periodFilteredSales.length) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Cash Sales */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{t.cashRevenue}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {formatUSD(cashRevenueUsd)}
            </div>
            <div className="text-sm font-bold font-mono text-emerald-600 mt-0.5">
              {formatKHR(cashRevenueKhr)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Transactions:</span>
            <span className="font-bold text-slate-800">
              {cashSales.length} ({periodFilteredSales.length ? Math.round((cashSales.length / periodFilteredSales.length) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Exchange Rate Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t.exchangeRate}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
              {settings.exchangeRate.toLocaleString()} ៛
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Active Global Rate per 1 USD
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Export:</span>
            <button
              onClick={handleExportCSV}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Top Selling & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>{t.topSelling}</span>
            </h3>
            <span className="text-xs text-slate-500">By units sold</span>
          </div>

          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t.noSalesYet}</p>
            ) : (
              topProducts.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-indigo-600 font-mono text-xs font-bold flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{p.name}</div>
                      {p.nameKh && (
                        <div className="font-khmer text-[11px] text-indigo-600">{p.nameKh}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {p.unitsSold} {t.unitsSold}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-600 font-medium">
                      {formatUSD(p.revenueUsd)} ({formatKHR(p.revenueKhr)})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Type Visual Ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-sm text-slate-900 mb-3">Payment Ratio</h3>

          <div className="space-y-4 my-auto">
            {/* Bakong KHQR bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Bakong KHQR</span>
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {totalRevenueUsd > 0 ? Math.round((khqrRevenueUsd / totalRevenueUsd) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full"
                  style={{
                    width: `${totalRevenueUsd > 0 ? (khqrRevenueUsd / totalRevenueUsd) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Cash bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash Payment</span>
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {totalRevenueUsd > 0 ? Math.round((cashRevenueUsd / totalRevenueUsd) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                  style={{
                    width: `${totalRevenueUsd > 0 ? (cashRevenueUsd / totalRevenueUsd) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Cambodian SME Retail Insights:</p>
            <p>Bakong KHQR adoption eliminates cash change shortages and speeds up checkout for items over 10,000៛.</p>
          </div>
        </div>
      </div>

      {/* Transaction History Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">{t.recentTransactions}</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Invoice Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Invoice # or Item..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Payment Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setFilterPayment('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  filterPayment === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterPayment('KHQR')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  filterPayment === 'KHQR' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                KHQR
              </button>
              <button
                onClick={() => setFilterPayment('CASH')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  filterPayment === 'CASH' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cash
              </button>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Cashier</th>
                <th className="p-3.5">Items Purchased</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Total (USD / KHR)</th>
                <th className="p-3.5 text-right">{t.reprint}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {sale.billNumber}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {sale.cashierName}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="text-slate-800 truncate font-medium">
                        {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sale.items.reduce((a, b) => a + b.quantity, 0)} total items
                      </div>
                    </td>
                    <td className="p-3.5">
                      {sale.paymentType === 'KHQR' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] uppercase">
                          Bakong KHQR
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase">
                          Cash
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatUSD(sale.totalUsd)}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold">
                        {formatKHR(sale.totalKhr)}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onViewReceipt(sale)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="View & Print Receipt"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={isGenerateReportOpen}
        onClose={() => setIsGenerateReportOpen(false)}
        sales={sales}
        products={products}
        settings={settings}
        language={language}
      />
    </div>
  );
};
