import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PosTerminal } from './components/PosTerminal';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { InventoryManager } from './components/InventoryManager';
import { SalesReports } from './components/SalesReports';
import { SettingsModal } from './components/SettingsModal';
import { Product, CartItem, Settings, Language, Sale } from './types';
import { initialSettings, initialProducts } from './data/initialData';
import { convertUsdToKhr } from './utils/khqr';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'pos' | 'inventory' | 'reports' | 'settings'>('pos');
  const [language, setLanguage] = useState<Language>('en');
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from server (with graceful local fallback)
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // 2. Fetch products
      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      // 3. Fetch sales
      const salesRes = await fetch('/api/sales');
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }
    } catch (err) {
      console.warn('Using offline/cached state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (product.stockQty <= 0) return prev;
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Complete Sale Handler
  const handleCompleteSale = async (saleData: {
    paymentType: 'CASH' | 'KHQR';
    cashReceivedUsd?: number;
    cashReceivedKhr?: number;
    changeUsd?: number;
    changeKhr?: number;
    khqrString?: string;
  }): Promise<Sale | null> => {
    try {
      const payload = {
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
        paymentType: saleData.paymentType,
        cashReceivedUsd: saleData.cashReceivedUsd,
        cashReceivedKhr: saleData.cashReceivedKhr,
        cashierName: 'Sokha (Staff)',
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const createdSale: Sale = data.sale;

        // Update sales and products state
        setSales((prev) => [createdSale, ...prev]);
        if (data.updatedProducts) {
          setProducts(data.updatedProducts);
        } else {
          // Optimistically decrement local stock
          setProducts((prev) =>
            prev.map((p) => {
              const inCart = cart.find((c) => c.product.id === p.id);
              return inCart ? { ...p, stockQty: Math.max(0, p.stockQty - inCart.quantity) } : p;
            })
          );
        }

        // Clear cart & close checkout modal
        setCart([]);
        setIsCheckoutOpen(false);

        // Open Receipt Modal
        setActiveReceiptSale(createdSale);
        return createdSale;
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to complete sale');
        return null;
      }
    } catch (err) {
      console.error('Error completing sale:', err);
      // Offline fallback: create local sale
      const totalUsd = Number(
        cart.reduce((a, b) => a + b.product.priceUsd * b.quantity, 0).toFixed(2)
      );
      const totalKhr = convertUsdToKhr(totalUsd, settings.exchangeRate);
      const localSale: Sale = {
        id: `sale-${Date.now()}`,
        billNumber: `INV-${Date.now().toString().slice(-6)}`,
        totalUsd,
        totalKhr,
        exchangeRate: settings.exchangeRate,
        paymentType: saleData.paymentType,
        cashReceivedUsd: saleData.cashReceivedUsd,
        cashReceivedKhr: saleData.cashReceivedKhr,
        changeUsd: saleData.changeUsd,
        changeKhr: saleData.changeKhr,
        khqrString: saleData.khqrString,
        items: cart.map((c) => ({
          id: `item-${Date.now()}-${c.product.id}`,
          productId: c.product.id,
          productName: c.product.name,
          productNameKh: c.product.nameKh,
          sku: c.product.sku,
          quantity: c.quantity,
          priceUsd: c.product.priceUsd,
          subtotalUsd: Number((c.product.priceUsd * c.quantity).toFixed(2)),
          subtotalKhr: convertUsdToKhr(c.product.priceUsd * c.quantity, settings.exchangeRate),
        })),
        cashierName: 'Cashier',
        createdAt: new Date().toISOString(),
        status: 'COMPLETED',
      };

      setSales((prev) => [localSale, ...prev]);
      setProducts((prev) =>
        prev.map((p) => {
          const inCart = cart.find((c) => c.product.id === p.id);
          return inCart ? { ...p, stockQty: Math.max(0, p.stockQty - inCart.quantity) } : p;
        })
      );
      setCart([]);
      setIsCheckoutOpen(false);
      setActiveReceiptSale(localSale);
      return localSale;
    }
  };

  // Inventory Handlers
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        const newProd = await res.json();
        setProducts((prev) => [...prev, newProd]);
      } else {
        // Local fallback
        const newProd: Product = {
          id: `prod-${Date.now()}`,
          ...productData,
          createdAt: new Date().toISOString(),
        };
        setProducts((prev) => [...prev, newProd]);
      }
    } catch {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        ...productData,
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [...prev, newProd]);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      } else {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      }
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch {
      // offline ignore
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRestockProduct = async (id: string, quantity: number) => {
    try {
      const res = await fetch(`/api/products/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stockQty: p.stockQty + quantity } : p))
        );
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stockQty: p.stockQty + quantity } : p))
      );
    }
  };

  // Settings Handlers
  const handleSaveSettings = async (updates: Partial<Settings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      } else {
        setSettings((prev) => ({ ...prev, ...updates }));
      }
    } catch {
      setSettings((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleUpdateExchangeRate = async (rate: number) => {
    await handleSaveSettings({ exchangeRate: rate });
  };

  const handleRestoreSampleData = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      } else {
        setProducts(initialProducts);
      }
    } catch {
      setProducts(initialProducts);
    }
  };

  // Count low stock items
  const lowStockCount = products.filter(
    (p) => p.stockQty <= (p.minStockAlert || settings.stockBuffer)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        onUpdateExchangeRate={handleUpdateExchangeRate}
        language={language}
        setLanguage={setLanguage}
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        lowStockCount={lowStockCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col">
        {currentTab === 'pos' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 items-start">
            <PosTerminal
              products={products}
              settings={settings}
              language={language}
              cart={cart}
              onAddToCart={handleAddToCart}
            />
            <CartSidebar
              cart={cart}
              settings={settings}
              language={language}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onCheckout={() => setIsCheckoutOpen(true)}
            />
          </div>
        )}

        {currentTab === 'inventory' && (
          <InventoryManager
            products={products}
            settings={settings}
            language={language}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRestockProduct={handleRestockProduct}
          />
        )}

        {currentTab === 'reports' && (
          <SalesReports
            sales={sales}
            products={products}
            settings={settings}
            language={language}
            onViewReceipt={(sale) => setActiveReceiptSale(sale)}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsModal
            settings={settings}
            language={language}
            onSaveSettings={handleSaveSettings}
            onRestoreSampleData={handleRestoreSampleData}
          />
        )}
      </main>

      {/* Professional Polish Bottom Status Bar */}
      <footer className="h-10 bg-white border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-600">POS Terminal Active</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono">1 USD = {settings.exchangeRate.toLocaleString()} ៛</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-400">Bakong KHQR Standard 2.0</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            Online Ready
          </span>
        </div>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        settings={settings}
        language={language}
        onCompleteSale={handleCompleteSale}
      />

      {/* Thermal Receipt Slip Modal */}
      <ThermalReceiptModal
        sale={activeReceiptSale}
        settings={settings}
        language={language}
        onClose={() => setActiveReceiptSale(null)}
        onNewSale={() => {
          setActiveReceiptSale(null);
          setCurrentTab('pos');
        }}
      />
    </div>
  );
}
