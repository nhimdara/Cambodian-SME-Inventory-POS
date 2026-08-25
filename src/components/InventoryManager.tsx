import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  Edit3,
  Trash2,
  Package,
  ArrowUpDown,
  TrendingUp,
  Check,
  X,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Product, Settings, Language } from "../types";
import { convertUsdToKhr, formatUSD, formatKHR } from "../utils/khqr";
import { translations } from "../utils/translations";

interface InventoryManagerProps {
  products: Product[];
  settings: Settings;
  language: Language;
  onAddProduct: (product: Omit<Product, "id">) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onRestockProduct: (id: string, quantity: number) => Promise<void>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  settings,
  language,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestockProduct,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStockStatus, setFilterStockStatus] = useState<
    "ALL" | "LOW" | "OUT"
  >("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Add/Edit product
  const [formName, setFormName] = useState("");
  const [formNameKh, setFormNameKh] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formCategory, setFormCategory] = useState("Groceries");
  const [formPriceUsd, setFormPriceUsd] = useState("");
  const [formStockQty, setFormStockQty] = useState("");
  const [formMinStock, setFormMinStock] = useState(
    settings.stockBuffer.toString(),
  );
  const [formImage, setFormImage] = useState("📦");

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Identify low stock products
  const lowStockItems = useMemo(() => {
    return products.filter(
      (p) => p.stockQty <= (p.minStockAlert || settings.stockBuffer),
    );
  }, [products, settings.stockBuffer]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        filterCategory === "ALL" || p.category === filterCategory;
      const isOut = p.stockQty <= 0;
      const isLow =
        !isOut && p.stockQty <= (p.minStockAlert || settings.stockBuffer);

      let matchesStock = true;
      if (filterStockStatus === "LOW") matchesStock = isLow;
      if (filterStockStatus === "OUT") matchesStock = isOut;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.nameKh && p.nameKh.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      return matchesCat && matchesStock && matchesSearch;
    });
  }, [
    products,
    filterCategory,
    filterStockStatus,
    searchQuery,
    settings.stockBuffer,
  ]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormNameKh("");
    setFormSku(`SKU-${Date.now().toString().slice(-4)}`);
    setFormBarcode("");
    setFormCategory("Groceries");
    setFormPriceUsd("1.00");
    setFormStockQty("20");
    setFormMinStock(settings.stockBuffer.toString());
    setFormImage("📦");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormNameKh(product.nameKh || "");
    setFormSku(product.sku);
    setFormBarcode(product.barcode || "");
    setFormCategory(product.category || "Groceries");
    setFormPriceUsd(product.priceUsd.toString());
    setFormStockQty(product.stockQty.toString());
    setFormMinStock((product.minStockAlert || settings.stockBuffer).toString());
    setFormImage(product.image || "📦");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPriceUsd) return;

    const payload = {
      name: formName.trim(),
      nameKh: formNameKh.trim(),
      sku: formSku.trim(),
      barcode: formBarcode.trim(),
      category: formCategory.trim() || "General",
      priceUsd: parseFloat(formPriceUsd) || 0,
      stockQty: parseInt(formStockQty, 10) || 0,
      minStockAlert: parseInt(formMinStock, 10) || settings.stockBuffer,
      image: formImage.trim() || "📦",
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onAddProduct(payload);
    }

    setIsModalOpen(false);
  };

  // Bulk restock all low stock items
  const handleBulkRestockLowItems = async () => {
    for (const item of lowStockItems) {
      await onRestockProduct(item.id, 10);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Safety Stock Buffer Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>
                  {lowStockItems.length} Products Reached Safety Buffer
                </span>
                <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.2 rounded-full">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-amber-800/90">
                {t.safetyBufferWarn} Threshold: ≤ {settings.stockBuffer} units.
              </p>
            </div>
          </div>

          <button
            id="bulk-restock-btn"
            onClick={handleBulkRestockLowItems}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restock All Low Items (+10 each)</span>
          </button>
        </div>
      )}

      {/* Header Actions & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchProducts}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Add Product Button */}
          <button
            id="add-product-btn"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProduct}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setFilterStockStatus("ALL")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterStockStatus === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Stock ({products.length})
            </button>
            <button
              onClick={() => setFilterStockStatus("LOW")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                filterStockStatus === "LOW"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-amber-700 hover:text-amber-800"
              }`}
            >
              <span>Low Buffer</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded-full">
                {lowStockItems.length}
              </span>
            </button>
            <button
              onClick={() => setFilterStockStatus("OUT")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterStockStatus === "OUT"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-rose-600 hover:text-rose-700"
              }`}
            >
              Out of Stock ({products.filter((p) => p.stockQty <= 0).length})
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 shrink-0"></div>

          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === "ALL"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  filterCategory === c
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">SKU / Barcode</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price (USD / KHR)</th>
                <th className="p-3.5">Stock Status</th>
                <th className="p-3.5">Buffer Alert</th>
                <th className="p-3.5">{t.replenish}</th>
                <th className="p-3.5 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const priceKhr = convertUsdToKhr(
                    p.priceUsd,
                    settings.exchangeRate,
                  );
                  const isOut = p.stockQty <= 0;
                  const isLow =
                    !isOut &&
                    p.stockQty <= (p.minStockAlert || settings.stockBuffer);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOut ? "bg-rose-50/40" : isLow ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {/* Product Name & Photo */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                            {p.image && (p.image.startsWith('http') || p.image.startsWith('/') || p.image.startsWith('data:')) ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-lg">
                                {p.image && p.image.length <= 4 ? p.image : <Package className="w-5 h-5 text-slate-300" />}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {p.name}
                            </div>
                            {p.nameKh && (
                              <div className="font-khmer text-xs text-indigo-600 font-medium">
                                {p.nameKh}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU / Barcode */}
                      <td className="p-3.5 font-mono text-slate-500">
                        <div className="font-medium text-slate-700">
                          {p.sku}
                        </div>
                        {p.barcode && (
                          <div className="text-[10px] text-slate-400">
                            {p.barcode}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Dual-currency Price */}
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-slate-900 text-sm">
                          {formatUSD(p.priceUsd)}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold">
                          {formatKHR(priceKhr)}
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg ${
                              isOut
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : isLow
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-800 border border-slate-200"
                            }`}
                          >
                            {p.stockQty}
                          </span>
                          {isOut ? (
                            <span className="text-[10px] font-bold text-rose-600 uppercase">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Min Stock Alert */}
                      <td className="p-3.5 font-mono text-slate-500">
                        ≤ {p.minStockAlert || settings.stockBuffer} units
                      </td>

                      {/* Quick Restock Action Buttons */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          {[5, 10, 50].map((qty) => (
                            <button
                              key={qty}
                              onClick={() => onRestockProduct(p.id, qty)}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title={`Add ${qty} units to stock`}
                            >
                              +{qty}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`edit-prod-${p.id}`}
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title={t.editProduct}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`del-prod-${p.id}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `${t.deleteConfirm} "${p.name}"?`,
                                )
                              ) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="font-bold text-base text-white">
                {editingProduct ? t.editProduct : t.addProduct}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 space-y-4 bg-white"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Product Photo URL */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Image (Photo URL)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                      {formImage && (formImage.startsWith('http') || formImage.startsWith('/') || formImage.startsWith('data:')) ? (
                        <img
                          src={formImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="url"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://images.unsplash.com/... or paste image link"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                        <span className="text-slate-400 font-medium whitespace-nowrap">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setFormImage("https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium whitespace-nowrap cursor-pointer"
                        >
                          Coffee
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage("https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium whitespace-nowrap cursor-pointer"
                        >
                          Rice
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage("https://images.unsplash.com/photo-1608270191772-a16df14545ea?auto=format&fit=crop&w=400&q=80")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium whitespace-nowrap cursor-pointer"
                        >
                          Drink
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage("https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium whitespace-nowrap cursor-pointer"
                        >
                          Snack
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage("https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80")}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium whitespace-nowrap cursor-pointer"
                        >
                          Fruit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.category}
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Beverages, Groceries, Snacks"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Product Name EN & KH */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.productName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Iced Milk Coffee"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">
                    {t.productNameKh}
                  </label>
                  <input
                    type="text"
                    value={formNameKh}
                    onChange={(e) => setFormNameKh(e.target.value)}
                    placeholder="ឧទាហរណ៍៖ កាហ្វេទឹកដោះគោទឹកកក"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-khmer focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="e.g. 8841001001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Price & Stocks */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.priceUsd} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPriceUsd}
                    onChange={(e) => setFormPriceUsd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    ≈{" "}
                    {formatKHR(
                      convertUsdToKhr(
                        parseFloat(formPriceUsd) || 0,
                        settings.exchangeRate,
                      ),
                    )}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.stockQty}
                  </label>
                  <input
                    type="number"
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 mb-1">
                    Buffer Threshold
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-amber-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {t.saveProduct}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
