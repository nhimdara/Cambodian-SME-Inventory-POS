import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  DollarSign,
  QrCode,
  Banknote,
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  User,
  Tag,
  Building2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Share2
} from 'lucide-react';
import { Sale, Product, Settings, Language } from '../types';
import { convertUsdToKhr, formatUSD, formatKHR } from '../utils/khqr';
import { translations } from '../utils/translations';

export type ReportType =
  | 'daily_shift'
  | 'sales_summary'
  | 'payment_methods'
  | 'inventory_audit'
  | 'product_performance';

export type DatePreset =
  | 'today'
  | 'yesterday'
  | '1week'
  | '1month'
  | '1year'
  | '7days'
  | '30days'
  | 'all'
  | 'custom';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  products: Product[];
  settings: Settings;
  language: Language;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose,
  sales,
  products,
  settings,
  language,
}) => {
  const t = translations[language];
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Configuration state
  const [reportType, setReportType] = useState<ReportType>('daily_shift');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'KHQR'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCashier, setSelectedCashier] = useState<string>('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isThermalPreview, setIsThermalPreview] = useState(false);

  // Extract unique categories & cashiers
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const cashiers = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.cashierName) set.add(s.cashierName);
    });
    return Array.from(set);
  }, [sales]);

  // Date range filter helper
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date(8640000000000000);

    if (datePreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (datePreset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (datePreset === '1week' || datePreset === '7days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = new Date();
    } else if (datePreset === '1month' || datePreset === '30days') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = new Date();
    } else if (datePreset === '1year') {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      end = new Date();
    } else if (datePreset === 'custom') {
      if (startDate) {
        start = new Date(`${startDate}T00:00:00`);
      }
      if (endDate) {
        end = new Date(`${endDate}T23:59:59.999`);
      }
    }
    return { start, end };
  }, [datePreset, startDate, endDate]);

  // Filter sales based on date range and options
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleTime = new Date(s.createdAt).getTime();
      const inDateRange =
        saleTime >= dateRangeBounds.start.getTime() &&
        saleTime <= dateRangeBounds.end.getTime();

      const inPayment = paymentFilter === 'ALL' || s.paymentType === paymentFilter;
      const inCashier = selectedCashier === 'ALL' || s.cashierName === selectedCashier;

      return inDateRange && inPayment && inCashier && s.status === 'COMPLETED';
    });
  }, [sales, dateRangeBounds, paymentFilter, selectedCashier]);

  // Aggregated calculations
  const totalRevenueUsd = useMemo(
    () => Number(filteredSales.reduce((sum, s) => sum + s.totalUsd, 0).toFixed(2)),
    [filteredSales]
  );
  const totalRevenueKhr = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.totalKhr, 0),
    [filteredSales]
  );

  const cashSales = useMemo(
    () => filteredSales.filter((s) => s.paymentType === 'CASH'),
    [filteredSales]
  );
  const khqrSales = useMemo(
    () => filteredSales.filter((s) => s.paymentType === 'KHQR'),
    [filteredSales]
  );

  const cashUsd = useMemo(
    () => Number(cashSales.reduce((sum, s) => sum + s.totalUsd, 0).toFixed(2)),
    [cashSales]
  );
  const cashKhr = useMemo(
    () => cashSales.reduce((sum, s) => sum + s.totalKhr, 0),
    [cashSales]
  );

  const khqrUsd = useMemo(
    () => Number(khqrSales.reduce((sum, s) => sum + s.totalUsd, 0).toFixed(2)),
    [khqrSales]
  );
  const khqrKhr = useMemo(
    () => khqrSales.reduce((sum, s) => sum + s.totalKhr, 0),
    [khqrSales]
  );

  const avgOrderUsd = filteredSales.length > 0
    ? Number((totalRevenueUsd / filteredSales.length).toFixed(2))
    : 0;
  const avgOrderKhr = convertUsdToKhr(avgOrderUsd, settings.exchangeRate);

  // Total items sold in filtered sales
  const totalItemsSold = useMemo(() => {
    return filteredSales.reduce(
      (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.quantity, 0),
      0
    );
  }, [filteredSales]);

  // Product performance stats from filtered sales
  const productStats = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        nameKh?: string;
        sku: string;
        category: string;
        qty: number;
        revenueUsd: number;
      }
    > = {};

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'General';

        if (selectedCategory !== 'ALL' && cat !== selectedCategory) {
          return;
        }

        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            nameKh: item.productNameKh || prod?.nameKh,
            sku: item.sku,
            category: cat,
            qty: 0,
            revenueUsd: 0,
          };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenueUsd += item.subtotalUsd;
      });
    });

    return Object.entries(map)
      .map(([id, data]) => ({
        id,
        ...data,
        revenueUsd: Number(data.revenueUsd.toFixed(2)),
        revenueKhr: convertUsdToKhr(data.revenueUsd, settings.exchangeRate),
        percentOfTotal:
          totalRevenueUsd > 0 ? ((data.revenueUsd / totalRevenueUsd) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredSales, products, selectedCategory, totalRevenueUsd, settings.exchangeRate]);

  // Inventory valuation data
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const totalInventoryUsd = useMemo(() => {
    return Number(
      filteredProducts.reduce((sum, p) => sum + p.priceUsd * p.stockQty, 0).toFixed(2)
    );
  }, [filteredProducts]);

  const totalInventoryKhr = useMemo(() => {
    return convertUsdToKhr(totalInventoryUsd, settings.exchangeRate);
  }, [totalInventoryUsd, settings.exchangeRate]);

  const totalInventoryUnits = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + p.stockQty, 0);
  }, [filteredProducts]);

  const lowStockBufferCount = useMemo(() => {
    return filteredProducts.filter(
      (p) => p.stockQty > 0 && p.stockQty <= (p.minStockAlert || settings.stockBuffer)
    ).length;
  }, [filteredProducts, settings.stockBuffer]);

  const outOfStockCount = useMemo(() => {
    return filteredProducts.filter((p) => p.stockQty <= 0).length;
  }, [filteredProducts]);

  // Handler: Formal Print
  const handlePrint = () => {
    window.print();
  };

  // Handler: Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'daily_shift' || reportType === 'sales_summary') {
      headers = [
        'Invoice Number',
        'Date & Time',
        'Cashier',
        'Payment Method',
        'Total USD ($)',
        'Total KHR (Riel)',
        'Exchange Rate',
        'Items Count',
        'Purchased Items Details',
      ];
      rows = filteredSales.map((s) => [
        s.billNumber,
        new Date(s.createdAt).toLocaleString(),
        s.cashierName,
        s.paymentType,
        s.totalUsd.toFixed(2),
        s.totalKhr,
        s.exchangeRate,
        s.items.reduce((a, b) => a + b.quantity, 0),
        `"${s.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}"`,
      ]);
    } else if (reportType === 'payment_methods') {
      headers = ['Payment Channel', 'Total USD ($)', 'Total KHR (Riel)', 'Transactions Count', 'Share Percentage (%)'];
      rows = [
        [
          'Bakong KHQR',
          khqrUsd.toFixed(2),
          khqrKhr,
          khqrSales.length,
          totalRevenueUsd > 0 ? ((khqrUsd / totalRevenueUsd) * 100).toFixed(1) : 0,
        ],
        [
          'Cash Payment',
          cashUsd.toFixed(2),
          cashKhr,
          cashSales.length,
          totalRevenueUsd > 0 ? ((cashUsd / totalRevenueUsd) * 100).toFixed(1) : 0,
        ],
        ['Total Combined', totalRevenueUsd.toFixed(2), totalRevenueKhr, filteredSales.length, 100],
      ];
    } else if (reportType === 'inventory_audit') {
      headers = [
        'Product Name (EN)',
        'Product Name (KH)',
        'SKU',
        'Category',
        'Unit Price USD',
        'Stock Quantity',
        'Inventory Value USD',
        'Inventory Value KHR',
        'Stock Alert Buffer',
        'Status',
      ];
      rows = filteredProducts.map((p) => {
        let status = 'In Stock';
        if (p.stockQty <= 0) status = 'Out of Stock';
        else if (p.stockQty <= (p.minStockAlert || settings.stockBuffer)) status = 'Low Stock Alert';

        return [
          `"${p.name}"`,
          `"${p.nameKh || ''}"`,
          p.sku,
          p.category,
          p.priceUsd.toFixed(2),
          p.stockQty,
          (p.priceUsd * p.stockQty).toFixed(2),
          convertUsdToKhr(p.priceUsd * p.stockQty, settings.exchangeRate),
          p.minStockAlert || settings.stockBuffer,
          status,
        ];
      });
    } else if (reportType === 'product_performance') {
      headers = [
        'Rank',
        'Product Name (EN)',
        'Product Name (KH)',
        'SKU',
        'Category',
        'Units Sold',
        'Total Revenue USD ($)',
        'Total Revenue KHR (Riel)',
        'Sales Share (%)',
      ];
      rows = productStats.map((p, idx) => [
        idx + 1,
        `"${p.name}"`,
        `"${p.nameKh || ''}"`,
        p.sku,
        p.category,
        p.qty,
        p.revenueUsd.toFixed(2),
        p.revenueKhr,
        p.percentOfTotal,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler: Copy Telegram Text Summary
  const handleCopyTelegramSummary = () => {
    let summaryText = '';
    const reportTitle =
      reportType === 'daily_shift'
        ? `📊 ${settings.storeName} - Daily Shift Closing Report`
        : reportType === 'sales_summary'
        ? `📈 ${settings.storeName} - Sales & Revenue Statement`
        : reportType === 'payment_methods'
        ? `💳 ${settings.storeName} - Payment Channels Summary`
        : reportType === 'inventory_audit'
        ? `📦 ${settings.storeName} - Inventory Valuation & Stock Buffer`
        : `🏆 ${settings.storeName} - Product Performance Ranking`;

    const dateStr =
      datePreset === 'today'
        ? `Today (${new Date().toLocaleDateString()})`
        : `${dateRangeBounds.start.toLocaleDateString()} - ${dateRangeBounds.end.toLocaleDateString()}`;

    summaryText += `═══════════════════════\n`;
    summaryText += `${reportTitle}\n`;
    summaryText += `📅 Period: ${dateStr}\n`;
    summaryText += `🏪 Terminal: ${settings.terminalLabel} | Rate: $1 = ${settings.exchangeRate.toLocaleString()} ៛\n`;
    summaryText += `═══════════════════════\n\n`;

    if (reportType === 'inventory_audit') {
      summaryText += `📦 Total Products: ${filteredProducts.length}\n`;
      summaryText += `🔢 Total Units on Hand: ${totalInventoryUnits.toLocaleString()}\n`;
      summaryText += `💰 Total Valuation: ${formatUSD(totalInventoryUsd)} (${formatKHR(totalInventoryKhr)})\n`;
      summaryText += `⚠️ Low Buffer Items: ${lowStockBufferCount}\n`;
      summaryText += `🚫 Out of Stock Items: ${outOfStockCount}\n`;
    } else {
      summaryText += `💰 Gross Sales: ${formatUSD(totalRevenueUsd)} (${formatKHR(totalRevenueKhr)})\n`;
      summaryText += `🧾 Completed Invoices: ${filteredSales.length}\n`;
      summaryText += `🛍️ Units Sold: ${totalItemsSold}\n`;
      summaryText += `📊 Avg Basket Size: ${formatUSD(avgOrderUsd)} (${formatKHR(avgOrderKhr)})\n\n`;
      summaryText += `💳 PAYMENT BREAKDOWN:\n`;
      summaryText += `  • Bakong KHQR: ${formatUSD(khqrUsd)} (${formatKHR(khqrKhr)}) [${khqrSales.length} txns]\n`;
      summaryText += `  • Cash Payment: ${formatUSD(cashUsd)} (${formatKHR(cashKhr)}) [${cashSales.length} txns]\n\n`;

      if (productStats.length > 0) {
        summaryText += `🔥 TOP 3 BEST SELLERS:\n`;
        productStats.slice(0, 3).forEach((p, idx) => {
          summaryText += `  ${idx + 1}. ${p.name}: ${p.qty} sold (${formatUSD(p.revenueUsd)})\n`;
        });
      }
    }

    summaryText += `\n═══════════════════════\n`;
    summaryText += `Generated at: ${new Date().toLocaleString()}\n`;
    summaryText += `Cashier / Prepared by: Sokha (Staff)\n`;

    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="generate-report-modal"
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>{t.generateReport}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold font-mono">
                  SME Business Intelligence
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-currency reports, shift closing summaries, and inventory valuation for Cambodia retail.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls / Filter Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-4 shrink-0 overflow-x-auto">
          {/* Report Type Selector Pills */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {t.reportType}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setReportType('daily_shift')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  reportType === 'daily_shift'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  {reportType === 'daily_shift' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <div className="font-bold text-xs">Daily Shift Closing</div>
                <div className="text-[10px] text-slate-500">Z-Report & Cash</div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('sales_summary')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  reportType === 'sales_summary'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  {reportType === 'sales_summary' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <div className="font-bold text-xs">Sales Statement</div>
                <div className="text-[10px] text-slate-500">Revenue & Volume</div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('payment_methods')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  reportType === 'payment_methods'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <QrCode className="w-4 h-4 text-rose-600" />
                  {reportType === 'payment_methods' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <div className="font-bold text-xs">Payment Channels</div>
                <div className="text-[10px] text-slate-500">Bakong vs Cash</div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('inventory_audit')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  reportType === 'inventory_audit'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Package className="w-4 h-4 text-amber-600" />
                  {reportType === 'inventory_audit' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <div className="font-bold text-xs">Inventory Audit</div>
                <div className="text-[10px] text-slate-500">Valuation & Buffer</div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('product_performance')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  reportType === 'product_performance'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {reportType === 'product_performance' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <div className="font-bold text-xs">Product Ranking</div>
                <div className="text-[10px] text-slate-500">Units & Margin</div>
              </button>
            </div>
          </div>

          {/* Date Range & Secondary Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Date Preset Chips */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.dateRange}:</span>
              </span>
              {(['today', 'yesterday', '1week', '1month', '1year', 'all', 'custom'] as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    datePreset === preset
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {preset === 'today' && t.today}
                  {preset === 'yesterday' && t.yesterday}
                  {preset === '1week' && t.oneWeek}
                  {preset === '1month' && t.oneMonth}
                  {preset === '1year' && t.oneYear}
                  {preset === 'all' && t.allTime}
                  {preset === 'custom' && t.customRange}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs (if custom is picked) */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 pl-1 text-[11px]">{t.startDate}:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 text-[11px]">{t.endDate}:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Cashier & Payment Selectors */}
            {reportType !== 'inventory_audit' && (
              <div className="flex items-center gap-2">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Payments</option>
                  <option value="KHQR">Bakong KHQR</option>
                  <option value="CASH">Cash Only</option>
                </select>

                <select
                  value={selectedCashier}
                  onChange={(e) => setSelectedCashier(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">{t.allCashiers}</option>
                  {cashiers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Selector (for Inventory & Product ranking) */}
            {(reportType === 'inventory_audit' || reportType === 'product_performance') && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">{t.allCategoriesFilter}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Live Document / Report Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          {/* Printable Report Canvas */}
          <div
            ref={printAreaRef}
            className={`mx-auto bg-white border border-slate-200 shadow-md rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900 transition-all ${
              isThermalPreview ? 'max-w-md font-mono text-xs' : 'max-w-4xl'
            }`}
          >
            {/* Formal Report Header */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {settings.storeName}
                  </h1>
                  {settings.storeNameKh && (
                    <div className="text-sm font-bold text-indigo-700 font-khmer mt-0.5">
                      {settings.storeNameKh}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{settings.address}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{settings.phone}</span>
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 text-xs font-black uppercase tracking-wider mb-1">
                    {reportType === 'daily_shift' && 'DAILY SHIFT Z-REPORT'}
                    {reportType === 'sales_summary' && 'SALES & REVENUE STATEMENT'}
                    {reportType === 'payment_methods' && 'PAYMENT BREAKDOWN AUDIT'}
                    {reportType === 'inventory_audit' && 'INVENTORY VALUATION & BUFFER'}
                    {reportType === 'product_performance' && 'PRODUCT PERFORMANCE STATEMENT'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <div>
                      {t.reportGeneratedAt}: {new Date().toLocaleString()}
                    </div>
                    <div>
                      Active Rate: <span className="font-bold text-slate-800 font-mono">1 USD = {settings.exchangeRate.toLocaleString()} ៛</span>
                    </div>
                    <div>
                      Terminal: <span className="font-bold text-slate-800 font-mono">{settings.terminalLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top KPI High-Contrast Summary Badges */}
            {reportType === 'inventory_audit' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t.totalInventoryValue}
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-indigo-700 mt-1">
                    {formatUSD(totalInventoryUsd)}
                  </div>
                  <div className="text-xs font-bold font-mono text-emerald-600">
                    {formatKHR(totalInventoryKhr)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Units on Hand
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
                    {totalInventoryUnits.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">{filteredProducts.length} unique SKUs</div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    {t.bufferAlertCount}
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-amber-700 mt-1">
                    {lowStockBufferCount}
                  </div>
                  <div className="text-[11px] text-amber-700">Needs replenishment</div>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                    {t.outOfStockCount}
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-rose-700 mt-1">
                    {outOfStockCount}
                  </div>
                  <div className="text-[11px] text-rose-700">Immediate reorder</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Gross Sales */}
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    {t.grossRevenue}
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-indigo-700 mt-1">
                    {formatUSD(totalRevenueUsd)}
                  </div>
                  <div className="text-xs font-bold font-mono text-emerald-600">
                    {formatKHR(totalRevenueKhr)}
                  </div>
                </div>

                {/* Orders Count */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t.totalOrders}
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
                    {filteredSales.length}
                  </div>
                  <div className="text-[11px] text-slate-500">{totalItemsSold} items sold</div>
                </div>

                {/* Bakong KHQR Total */}
                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                    Bakong KHQR Total
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
                    {formatUSD(khqrUsd)}
                  </div>
                  <div className="text-xs font-bold font-mono text-rose-600">
                    {khqrSales.length} txns ({totalRevenueUsd > 0 ? Math.round((khqrUsd / totalRevenueUsd) * 100) : 0}%)
                  </div>
                </div>

                {/* Cash Total */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Cash in Drawer
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
                    {formatUSD(cashUsd)}
                  </div>
                  <div className="text-xs font-bold font-mono text-emerald-600">
                    {cashSales.length} txns ({totalRevenueUsd > 0 ? Math.round((cashUsd / totalRevenueUsd) * 100) : 0}%)
                  </div>
                </div>
              </div>
            )}

            {/* Primary Table Data Section based on Report Type */}
            {/* 1 & 2: Daily Shift & Sales Summary */}
            {(reportType === 'daily_shift' || reportType === 'sales_summary') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Transaction History Log ({filteredSales.length} Records)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Avg Basket: {formatUSD(avgOrderUsd)} / {formatKHR(avgOrderKhr)}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-mono">Inv #</th>
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Cashier</th>
                        <th className="p-2.5">Items Purchased</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5 text-right">USD ($)</th>
                        <th className="p-2.5 text-right">KHR (៛)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            No transactions found for this date range or filter.
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono font-bold text-slate-900">{s.billNumber}</td>
                            <td className="p-2.5 text-slate-500 font-mono">
                              {new Date(s.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="p-2.5 text-slate-700">{s.cashierName}</td>
                            <td className="p-2.5 max-w-xs truncate text-slate-800">
                              {s.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                            </td>
                            <td className="p-2.5">
                              {s.paymentType === 'KHQR' ? (
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">
                                  Bakong KHQR
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  Cash
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {formatUSD(s.totalUsd)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-600">
                              {formatKHR(s.totalKhr)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                          Grand Total Summary:
                        </td>
                        <td className="p-2.5 text-right font-mono text-indigo-700 text-sm">
                          {formatUSD(totalRevenueUsd)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 text-sm">
                          {formatKHR(totalRevenueKhr)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 3: Payment Methods Breakdown */}
            {reportType === 'payment_methods' && (
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Payment Channels Audit</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bakong KHQR Box */}
                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-rose-950">Bakong KHQR (Digital)</div>
                          <div className="text-[10px] text-slate-500">NBC EMVCo Direct Transfer</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black font-mono text-slate-900">
                          {totalRevenueUsd > 0 ? ((khqrUsd / totalRevenueUsd) * 100).toFixed(1) : 0}%
                        </span>
                        <div className="text-[10px] text-slate-500">Volume Share</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-rose-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Revenue USD</div>
                        <div className="font-bold font-mono text-slate-900">{formatUSD(khqrUsd)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Revenue KHR</div>
                        <div className="font-bold font-mono text-rose-600">{formatKHR(khqrKhr)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Transactions</div>
                        <div className="font-bold font-mono text-slate-900">{khqrSales.length} txns</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Avg Ticket Size</div>
                        <div className="font-bold font-mono text-slate-900">
                          {khqrSales.length > 0 ? formatUSD(khqrUsd / khqrSales.length) : '$0.00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cash Box */}
                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-emerald-950">Cash Payment (USD / KHR)</div>
                          <div className="text-[10px] text-slate-500">Physical Register Drawer</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black font-mono text-slate-900">
                          {totalRevenueUsd > 0 ? ((cashUsd / totalRevenueUsd) * 100).toFixed(1) : 0}%
                        </span>
                        <div className="text-[10px] text-slate-500">Volume Share</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-emerald-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Revenue USD</div>
                        <div className="font-bold font-mono text-slate-900">{formatUSD(cashUsd)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Revenue KHR</div>
                        <div className="font-bold font-mono text-emerald-600">{formatKHR(cashKhr)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Transactions</div>
                        <div className="font-bold font-mono text-slate-900">{cashSales.length} txns</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Avg Ticket Size</div>
                        <div className="font-bold font-mono text-slate-900">
                          {cashSales.length > 0 ? formatUSD(cashUsd / cashSales.length) : '$0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4: Inventory Audit & Valuation */}
            {reportType === 'inventory_audit' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Product Stock Valuation Table ({filteredProducts.length} Items)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Buffer Threshold: {settings.stockBuffer} units
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 font-mono">SKU</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-center">On Hand</th>
                        <th className="p-2.5 text-right">Valuation USD</th>
                        <th className="p-2.5 text-right">Valuation KHR</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const valUsd = Number((p.priceUsd * p.stockQty).toFixed(2));
                        const valKhr = convertUsdToKhr(valUsd, settings.exchangeRate);
                        const isOut = p.stockQty <= 0;
                        const isLow = !isOut && p.stockQty <= (p.minStockAlert || settings.stockBuffer);

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50/50 ${
                              isOut ? 'bg-rose-50/30' : isLow ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{p.name}</div>
                              {p.nameKh && (
                                <div className="text-[11px] font-khmer text-indigo-600">{p.nameKh}</div>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-slate-500">{p.sku}</td>
                            <td className="p-2.5 text-slate-600">{p.category}</td>
                            <td className="p-2.5 text-right font-mono text-slate-800">
                              {formatUSD(p.priceUsd)}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                              {p.stockQty}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {formatUSD(valUsd)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-600">
                              {formatKHR(valKhr)}
                            </td>
                            <td className="p-2.5 text-center">
                              {isOut ? (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Low Stock ({p.stockQty})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Optimal
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right uppercase text-[11px] text-slate-600">
                          Total Asset Valuation:
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-900">
                          {totalInventoryUnits} units
                        </td>
                        <td className="p-2.5 text-right font-mono text-indigo-700 text-sm">
                          {formatUSD(totalInventoryUsd)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 text-sm">
                          {formatKHR(totalInventoryKhr)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 5: Product Performance Ranking */}
            {reportType === 'product_performance' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Product Sales Ranking Table ({productStats.length} Products Sold)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Sorted by Units Sold</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 text-center">Rank</th>
                        <th className="p-2.5">Product Name</th>
                        <th className="p-2.5 font-mono">SKU</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-center">Units Sold</th>
                        <th className="p-2.5 text-right">Gross USD ($)</th>
                        <th className="p-2.5 text-right">Gross KHR (៛)</th>
                        <th className="p-2.5 text-center">Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productStats.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400">
                            No product sales recorded for this timeframe.
                          </td>
                        </tr>
                      ) : (
                        productStats.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-center font-bold font-mono">
                              <span
                                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-800 font-black'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-800'
                                    : idx === 2
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{p.name}</div>
                              {p.nameKh && (
                                <div className="text-[11px] font-khmer text-indigo-600">{p.nameKh}</div>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-slate-500">{p.sku}</td>
                            <td className="p-2.5 text-slate-600">{p.category}</td>
                            <td className="p-2.5 text-center font-bold font-mono text-slate-900">
                              {p.qty} {t.unitsSold}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {formatUSD(p.revenueUsd)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-600">
                              {formatKHR(p.revenueKhr)}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-indigo-600">
                              {p.percentOfTotal}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Formal Cambodian SME Business Verification Signatures */}
            <div className="pt-8 mt-6 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-12">
                <div className="font-bold text-slate-700">{t.cashierSignature}</div>
                <div className="border-t border-slate-300 pt-1 font-mono text-slate-500 text-[11px]">
                  Name: Sokha (Staff)
                </div>
              </div>

              <div className="hidden sm:block space-y-12">
                <div className="font-bold text-slate-700">Official Store Stamp</div>
                <div className="border-t border-slate-300 pt-1 text-slate-400 text-[11px]">
                  (Seal / Stamp)
                </div>
              </div>

              <div className="space-y-12">
                <div className="font-bold text-slate-700">{t.managerSignature}</div>
                <div className="border-t border-slate-300 pt-1 font-mono text-slate-500 text-[11px]">
                  Date: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-slate-400 pt-2 font-mono">
              Certified generated by Cambodian SME POS System • Bakong KHQR Integration • System Timestamp: {new Date().toISOString()}
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {copiedNotification && (
              <span className="flex items-center gap-1 text-emerald-600 font-bold animate-fade-in">
                <Check className="w-4 h-4" />
                <span>{t.summaryCopied}</span>
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            {/* Copy Telegram Text Button */}
            <button
              type="button"
              onClick={handleCopyTelegramSummary}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              title="Copy formatted text to send via Telegram / WhatsApp"
            >
              <Share2 className="w-4 h-4 text-sky-600" />
              <span>{t.copySummary}</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{t.exportCSV}</span>
            </button>

            {/* Print Official Document Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printReport}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
