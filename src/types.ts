export interface Product {
  id: string;
  name: string;
  nameKh?: string;
  sku: string;
  barcode?: string;
  priceUsd: number;
  stockQty: number;
  minStockAlert: number;
  category: string;
  image?: string;
  createdAt?: string;
}

export interface SaleItem {
  id: string;
  saleId?: string;
  productId: string;
  productName: string;
  productNameKh?: string;
  sku: string;
  quantity: number;
  priceUsd: number;
  subtotalUsd: number;
  subtotalKhr: number;
}

export interface Sale {
  id: string;
  billNumber: string;
  totalUsd: number;
  totalKhr: number;
  exchangeRate: number;
  paymentType: 'CASH' | 'KHQR';
  cashReceivedUsd?: number;
  cashReceivedKhr?: number;
  changeUsd?: number;
  changeKhr?: number;
  khqrString?: string;
  items: SaleItem[];
  cashierName: string;
  createdAt: string;
  status: 'COMPLETED' | 'REFUNDED';
}

export interface Settings {
  id: number;
  storeName: string;
  storeNameKh: string;
  phone: string;
  address: string;
  exchangeRate: number; // e.g. 4100
  bakongId: string; // e.g. "sokha_market@aclb" or "vireak_pos@ftb"
  merchantName: string;
  merchantCity: string;
  terminalLabel: string;
  stockBuffer: number; // default low-stock alert threshold, e.g. 5
  receiptWidth: '58mm' | '80mm';
  receiptFooter: string;
  receiptFooterKh: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Language = 'en' | 'km';
