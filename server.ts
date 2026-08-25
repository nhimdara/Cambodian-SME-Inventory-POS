import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Server-side types
interface Product {
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

interface SaleItem {
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

interface Sale {
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

interface Settings {
  id: number;
  storeName: string;
  storeNameKh: string;
  phone: string;
  address: string;
  exchangeRate: number;
  bakongId: string;
  merchantName: string;
  merchantCity: string;
  terminalLabel: string;
  stockBuffer: number;
  receiptWidth: '58mm' | '80mm';
  receiptFooter: string;
  receiptFooterKh: string;
}

// In-memory data store with sensible Cambodian SME seed data
let currentSettings: Settings = {
  id: 1,
  storeName: 'Angkor Mart & Cafe',
  storeNameKh: 'អង្គរ ម៉ាត & កាហ្វេ',
  phone: '+855 12 345 678',
  address: 'Street 240, Daun Penh, Phnom Penh',
  exchangeRate: 4100, // 1 USD = 4,100 KHR
  bakongId: 'angkor_mart@aclb',
  merchantName: 'ANGKOR MART PHNOM PENH',
  merchantCity: 'Phnom Penh',
  terminalLabel: 'POS-COUNTER-1',
  stockBuffer: 5,
  receiptWidth: '80mm',
  receiptFooter: 'Thank you for shopping with us! Please come again.',
  receiptFooterKh: 'សូមអរគុណចំពោះការគាំទ្រ! សូមអញ្ជើញមកម្តងទៀត។',
};

const initialProductsList: Product[] = [
  {
    id: 'prod-001',
    name: 'Iced Milk Coffee',
    nameKh: 'កាហ្វេទឹកដោះគោទឹកកក',
    sku: 'BEV-001',
    barcode: '8841001001',
    priceUsd: 1.50,
    stockQty: 45,
    minStockAlert: 10,
    category: 'Beverages',
    image: '/products/iced_milk_coffee.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'Cambodian Jasmine Rice (5kg)',
    nameKh: 'អង្ករផ្កាម្លិះខ្មែរ (៥ គីឡូ)',
    sku: 'GROC-001',
    barcode: '8841001002',
    priceUsd: 5.80,
    stockQty: 18,
    minStockAlert: 5,
    category: 'Groceries',
    image: '/products/jasmine_rice.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    name: 'Angkor Beer Can (330ml)',
    nameKh: 'ស្រាបៀរអង្គរ កំប៉ុង',
    sku: 'BEV-002',
    barcode: '8841001003',
    priceUsd: 0.85,
    stockQty: 72,
    minStockAlert: 12,
    category: 'Beverages',
    image: '/products/angkor_beer.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    name: 'Kulen Natural Mineral Water (1.5L)',
    nameKh: 'ទឹកបរិសុទ្ធគូលែន ១.៥លីត្រ',
    sku: 'BEV-003',
    barcode: '8841001004',
    priceUsd: 0.75,
    stockQty: 28,
    minStockAlert: 8,
    category: 'Beverages',
    image: '/products/kulen_mineral_water.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    name: 'Crispy Taro Chips',
    nameKh: 'ត្រាវបំពងស្រួយ',
    sku: 'SNK-001',
    barcode: '8841001005',
    priceUsd: 1.20,
    stockQty: 4, // Triggers low-stock alert
    minStockAlert: 5,
    category: 'Snacks',
    image: '/products/crispy_taro.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-006',
    name: 'Kampot Black Pepper (100g)',
    nameKh: 'ម្រេចខ្មៅកំពត (១០០ក្រាម)',
    sku: 'GROC-002',
    barcode: '8841001006',
    priceUsd: 3.50,
    stockQty: 14,
    minStockAlert: 5,
    category: 'Groceries',
    image: '/products/kampot_pepper.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-007',
    name: 'Green Tea with Honey',
    nameKh: 'តែបៃតងទឹកឃ្មុំ',
    sku: 'BEV-004',
    barcode: '8841001007',
    priceUsd: 1.75,
    stockQty: 32,
    minStockAlert: 6,
    category: 'Beverages',
    image: '/products/green_tea_honey.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-008',
    name: 'Dried Mango Slices (150g)',
    nameKh: 'ស្វាយដំណាប់ធម្មជាតិ (១៥០ក្រាម)',
    sku: 'SNK-002',
    barcode: '8841001008',
    priceUsd: 2.25,
    stockQty: 3, // Low stock buffer alert
    minStockAlert: 5,
    category: 'Snacks',
    image: '/products/dried_mango_slices.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-009',
    name: 'Mama Instant Noodles Box',
    nameKh: 'មីម៉ាម៉ា ១កេស',
    sku: 'GROC-003',
    barcode: '8841001009',
    priceUsd: 4.50,
    stockQty: 8,
    minStockAlert: 5,
    category: 'Groceries',
    image: '/products/mama_noodles.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-010',
    name: 'Palm Sugar Organic (500g)',
    nameKh: 'ស្ករត្នោតធម្មជាតិ (៥០០ក្រាម)',
    sku: 'GROC-004',
    barcode: '8841001010',
    priceUsd: 2.00,
    stockQty: 2, // Low stock alert
    minStockAlert: 6,
    category: 'Groceries',
    image: '/products/palm_sugar_organic.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-011',
    name: 'Coconut Juice Fresh',
    nameKh: 'ទឹកដូងស្រស់',
    sku: 'BEV-005',
    barcode: '8841001011',
    priceUsd: 1.00,
    stockQty: 15,
    minStockAlert: 5,
    category: 'Beverages',
    image: '/products/coconut_juice.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-012',
    name: 'Local Fresh Bread Baguette',
    nameKh: 'នំបុ័ងបារាំងស្រស់',
    sku: 'SNK-003',
    barcode: '8841001012',
    priceUsd: 0.50,
    stockQty: 20,
    minStockAlert: 5,
    category: 'Snacks',
    image: '/products/fresh_baguette.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-013',
    name: 'Roasted Cashew Nuts (250g)',
    nameKh: 'គ្រាប់ស្វាយចន្ទីលីង',
    sku: 'SNK-004',
    barcode: '8841001013',
    priceUsd: 3.90,
    stockQty: 25,
    minStockAlert: 6,
    category: 'Snacks',
    image: '/products/cashew_nuts.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-014',
    name: 'Mondulkiri Wild Honey (500g)',
    nameKh: 'ទឹកឃ្មុំព្រៃមណ្ឌលគិរី',
    sku: 'GROC-005',
    barcode: '8841001014',
    priceUsd: 6.50,
    stockQty: 9,
    minStockAlert: 4,
    category: 'Groceries',
    image: '/products/wild_honey.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-015',
    name: 'Red Dragon Fruit Fresh (1kg)',
    nameKh: 'ផ្លែស្រកានាគក្រហម',
    sku: 'PROD-001',
    barcode: '8841001015',
    priceUsd: 1.80,
    stockQty: 14,
    minStockAlert: 5,
    category: 'Produce',
    image: '/products/dragon_fruit.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-016',
    name: 'Cambodian Palm Wine (500ml)',
    nameKh: 'ស្រាត្នោតព្រៃវែង',
    sku: 'BEV-006',
    barcode: '8841001016',
    priceUsd: 2.80,
    stockQty: 16,
    minStockAlert: 5,
    category: 'Beverages',
    image: '/products/palm_wine.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-017',
    name: 'Phnom Penh Fish Sauce (750ml)',
    nameKh: 'ទឹកត្រីទឹកកកកំពត',
    sku: 'GROC-006',
    barcode: '8841001017',
    priceUsd: 1.60,
    stockQty: 30,
    minStockAlert: 8,
    category: 'Groceries',
    image: '/products/phnom_penh_fish_sauce.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-018',
    name: 'Banana Chips Crispy (120g)',
    nameKh: 'ចេកបំពងស្រួយ',
    sku: 'SNK-005',
    barcode: '8841001018',
    priceUsd: 0.95,
    stockQty: 35,
    minStockAlert: 10,
    category: 'Snacks',
    image: '/products/banana_chips.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-019',
    name: 'Fresh Keo Romeat Mango (1kg)',
    nameKh: 'ស្វាយកែវរមៀតស្រស់',
    sku: 'PROD-002',
    barcode: '8841001019',
    priceUsd: 1.25,
    stockQty: 15,
    minStockAlert: 5,
    category: 'Produce',
    image: '/products/keo_romeat_mango.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-020',
    name: 'Num Pang Pork Pate Sandwich',
    nameKh: 'នំប៉័ងប៉ាតេពិសេស',
    sku: 'SNK-006',
    barcode: '8841001020',
    priceUsd: 1.50,
    stockQty: 20,
    minStockAlert: 5,
    category: 'Snacks',
    image: '/products/num_pang_sandwich.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-021',
    name: 'Roasted Lotus Seeds (100g)',
    nameKh: 'គ្រាប់ឈូកលីងរសជាតិ',
    sku: 'SNK-007',
    barcode: '8841001021',
    priceUsd: 1.40,
    stockQty: 18,
    minStockAlert: 5,
    category: 'Snacks',
    image: '/products/lotus_seeds.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-022',
    name: 'Iced Lime Tea with Chia (500ml)',
    nameKh: 'ទឹកក្រូចឆ្មាគ្រាប់ជី',
    sku: 'BEV-007',
    barcode: '8841001022',
    priceUsd: 1.20,
    stockQty: 28,
    minStockAlert: 8,
    category: 'Beverages',
    image: '/products/iced_lime_tea.jpg',
    createdAt: new Date().toISOString(),
  },
];

let products: Product[] = JSON.parse(JSON.stringify(initialProductsList));

let sales: Sale[] = [
  {
    id: 'sale-001',
    billNumber: 'INV-10042',
    totalUsd: 3.75,
    totalKhr: 15400,
    exchangeRate: 4100,
    paymentType: 'KHQR',
    items: [
      {
        id: 'item-001',
        productId: 'prod-001',
        productName: 'Iced Milk Coffee',
        productNameKh: 'កាហ្វេទឹកដោះគោទឹកកក',
        sku: 'BEV-001',
        quantity: 1,
        priceUsd: 1.50,
        subtotalUsd: 1.50,
        subtotalKhr: 6200,
      },
      {
        id: 'item-002',
        productId: 'prod-008',
        productName: 'Dried Mango Slices (150g)',
        productNameKh: 'ស្វាយដំណាប់ធម្មជាតិ (១៥០ក្រាម)',
        sku: 'SNK-002',
        quantity: 1,
        priceUsd: 2.25,
        subtotalUsd: 2.25,
        subtotalKhr: 9200,
      },
    ],
    cashierName: 'Sokha (Staff)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'COMPLETED',
  },
  {
    id: 'sale-002',
    billNumber: 'INV-10043',
    totalUsd: 2.55,
    totalKhr: 10500,
    exchangeRate: 4100,
    paymentType: 'CASH',
    cashReceivedUsd: 5,
    changeUsd: 2.45,
    changeKhr: 10000,
    items: [
      {
        id: 'item-003',
        productId: 'prod-003',
        productName: 'Angkor Beer Can (330ml)',
        productNameKh: 'ស្រាបៀរអង្គរ កំប៉ុង',
        sku: 'BEV-002',
        quantity: 3,
        priceUsd: 0.85,
        subtotalUsd: 2.55,
        subtotalKhr: 10500,
      },
    ],
    cashierName: 'Sokha (Staff)',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'COMPLETED',
  },
];

// Helper functions
function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generateKHQRString(
  amountKhr: number,
  billNumber: string,
  settings: Settings
): string {
  let qr = formatTLV('00', '01');
  qr += formatTLV('01', amountKhr > 0 ? '12' : '11');

  // Bakong Merchant Account Information (Tag 29)
  const sub29_00 = formatTLV('00', 'kh.gov.nbc.bakong');
  const sub29_01 = formatTLV('01', settings.bakongId || 'merchant@bakong');
  qr += formatTLV('29', sub29_00 + sub29_01);

  // MCC
  qr += formatTLV('52', '5399');
  // Currency KHR (116)
  qr += formatTLV('53', '116');

  // Amount
  if (amountKhr > 0) {
    qr += formatTLV('54', Math.round(amountKhr).toString());
  }

  // Country
  qr += formatTLV('58', 'KH');
  // Merchant Name
  qr += formatTLV('59', (settings.merchantName || 'Bakong Merchant').slice(0, 25));
  // Merchant City
  qr += formatTLV('60', (settings.merchantCity || 'Phnom Penh').slice(0, 15));

  // Additional Data
  let sub62 = '';
  if (billNumber) sub62 += formatTLV('01', billNumber.slice(0, 25));
  if (settings.storeName) sub62 += formatTLV('03', settings.storeName.slice(0, 25));
  if (settings.terminalLabel) sub62 += formatTLV('07', settings.terminalLabel.slice(0, 25));
  if (sub62) qr += formatTLV('62', sub62);

  const qrWithCrcTag = qr + '6304';
  return qrWithCrcTag + calculateCRC16(qrWithCrcTag);
}

function convertUsdToKhr(usd: number, rate: number): number {
  return Math.round((usd * rate) / 100) * 100;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Settings endpoints
  app.get('/api/settings', (req, res) => {
    res.json(currentSettings);
  });

  app.put('/api/settings', (req, res) => {
    const updates = req.body;
    currentSettings = {
      ...currentSettings,
      ...updates,
      exchangeRate: Number(updates.exchangeRate) || currentSettings.exchangeRate,
      stockBuffer: Number(updates.stockBuffer) || currentSettings.stockBuffer,
    };
    res.json({ success: true, settings: currentSettings });
  });

  // 3. Products CRUD
  app.get('/api/products', (req, res) => {
    res.json(products);
  });

  app.post('/api/products', (req, res) => {
    const { id, name, nameKh, sku, barcode, priceUsd, stockQty, minStockAlert, category, image } = req.body;
    if (!name || priceUsd === undefined) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const newProduct: Product = {
      id: (id && typeof id === 'string' && id.trim()) ? id.trim() : `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      nameKh: (nameKh || '').trim(),
      sku: sku ? sku.trim() : `SKU-${Date.now().toString().slice(-4)}`,
      barcode: barcode ? barcode.trim() : '',
      priceUsd: Number(Number(priceUsd).toFixed(2)),
      stockQty: Number(stockQty) || 0,
      minStockAlert: Number(minStockAlert) || currentSettings.stockBuffer,
      category: category || 'General',
      image: image || '📦',
      createdAt: new Date().toISOString(),
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = req.body;
    products[index] = {
      ...products[index],
      ...updates,
      priceUsd: updates.priceUsd !== undefined ? Number(Number(updates.priceUsd).toFixed(2)) : products[index].priceUsd,
      stockQty: updates.stockQty !== undefined ? Number(updates.stockQty) : products[index].stockQty,
      minStockAlert: updates.minStockAlert !== undefined ? Number(updates.minStockAlert) : products[index].minStockAlert,
    };

    res.json(products[index]);
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const deleted = products.splice(index, 1)[0];
    res.json({ success: true, product: deleted });
  });

  app.post('/api/products/:id/restock', (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const product = products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const qtyToAdd = Number(quantity) || 10;
    product.stockQty += qtyToAdd;
    res.json(product);
  });

  // 4. Sales and KHQR Checkout
  app.get('/api/sales', (req, res) => {
    // Sort latest sales first
    const sorted = [...sales].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/sales', (req, res) => {
    const {
      items, // Array of { productId: string, quantity: number }
      paymentType = 'CASH',
      cashReceivedUsd,
      cashReceivedKhr,
      cashierName = 'Cashier',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart must contain at least one item' });
    }

    // Step 1: Validate stock quantities for all items
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ID "${item.productId}" not found` });
      }
      if (product.stockQty < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${item.quantity}`,
          productId: product.id,
          availableStock: product.stockQty,
        });
      }
    }

    // Step 2: Calculate prices, subtotals, and decrement inventory
    let totalUsd = 0;
    const saleItems: SaleItem[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const itemSubtotalUsd = Number((product.priceUsd * item.quantity).toFixed(2));
      const itemSubtotalKhr = convertUsdToKhr(itemSubtotalUsd, currentSettings.exchangeRate);

      // Decrement product inventory
      product.stockQty -= item.quantity;

      saleItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        productNameKh: product.nameKh,
        sku: product.sku,
        quantity: item.quantity,
        priceUsd: product.priceUsd,
        subtotalUsd: itemSubtotalUsd,
        subtotalKhr: itemSubtotalKhr,
      });

      totalUsd += itemSubtotalUsd;
    }

    totalUsd = Number(totalUsd.toFixed(2));
    const totalKhr = convertUsdToKhr(totalUsd, currentSettings.exchangeRate);
    const billNumber = `INV-${Date.now().toString().slice(-6)}`;

    // Generate KHQR if payment is KHQR or for receipt reference
    const khqrString = generateKHQRString(totalKhr, billNumber, currentSettings);

    // Calculate Cash Change if CASH
    let changeUsd = 0;
    let changeKhr = 0;
    if (paymentType === 'CASH') {
      const paidKhrInUsd = (cashReceivedKhr || 0) / currentSettings.exchangeRate;
      const totalPaidUsd = (cashReceivedUsd || 0) + paidKhrInUsd;
      const diff = totalPaidUsd - totalUsd;
      if (diff >= 0) {
        changeUsd = Number(diff.toFixed(2));
        changeKhr = convertUsdToKhr(changeUsd, currentSettings.exchangeRate);
      }
    }

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      billNumber,
      totalUsd,
      totalKhr,
      exchangeRate: currentSettings.exchangeRate,
      paymentType,
      cashReceivedUsd,
      cashReceivedKhr,
      changeUsd,
      changeKhr,
      khqrString,
      items: saleItems,
      cashierName,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    };

    sales.push(newSale);

    res.status(201).json({
      success: true,
      sale: newSale,
      updatedProducts: products,
    });
  });

  // 5. Generate arbitrary Bakong KHQR for any amount
  app.post('/api/sales/khqr', (req, res) => {
    const { amountKhr, billNumber } = req.body;
    const inv = billNumber || `INV-${Date.now().toString().slice(-6)}`;
    const qr = generateKHQRString(Number(amountKhr) || 0, inv, currentSettings);
    res.json({ qr, billNumber: inv, amountKhr });
  });

  // 6. Reports Summary
  app.get('/api/reports/summary', (req, res) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todaySales = sales.filter(
      (s) => new Date(s.createdAt).getTime() >= todayStart && s.status === 'COMPLETED'
    );

    const todayUsd = Number(todaySales.reduce((acc, s) => acc + s.totalUsd, 0).toFixed(2));
    const todayKhr = todaySales.reduce((acc, s) => acc + s.totalKhr, 0);

    const cashSales = todaySales.filter((s) => s.paymentType === 'CASH');
    const khqrSales = todaySales.filter((s) => s.paymentType === 'KHQR');

    // Product sold quantities
    const productSoldMap: Record<string, { name: string; nameKh?: string; qty: number; revenueUsd: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!productSoldMap[item.productId]) {
          productSoldMap[item.productId] = {
            name: item.productName,
            nameKh: item.productNameKh,
            qty: 0,
            revenueUsd: 0,
          };
        }
        productSoldMap[item.productId].qty += item.quantity;
        productSoldMap[item.productId].revenueUsd += item.subtotalUsd;
      }
    }

    const topSelling = Object.entries(productSoldMap)
      .map(([id, data]) => ({
        id,
        name: data.name,
        nameKh: data.nameKh,
        unitsSold: data.qty,
        revenueUsd: Number(data.revenueUsd.toFixed(2)),
        revenueKhr: convertUsdToKhr(data.revenueUsd, currentSettings.exchangeRate),
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    // Low stock items based on minStockAlert and global stockBuffer
    const lowStockProducts = products.filter(
      (p) => p.stockQty <= (p.minStockAlert || currentSettings.stockBuffer)
    );

    res.json({
      todayRevenueUsd: todayUsd,
      todayRevenueKhr: todayKhr,
      totalOrdersCount: todaySales.length,
      cashRevenueUsd: Number(cashSales.reduce((a, s) => a + s.totalUsd, 0).toFixed(2)),
      cashRevenueKhr: cashSales.reduce((a, s) => a + s.totalKhr, 0),
      cashTransactionsCount: cashSales.length,
      khqrRevenueUsd: Number(khqrSales.reduce((a, s) => a + s.totalUsd, 0).toFixed(2)),
      khqrRevenueKhr: khqrSales.reduce((a, s) => a + s.totalKhr, 0),
      khqrTransactionsCount: khqrSales.length,
      topSelling,
      lowStockProducts,
      totalProductsCount: products.length,
      exchangeRate: currentSettings.exchangeRate,
    });
  });

  // 7. Seed / Reset Data
  app.post('/api/seed', (req, res) => {
    // Reset products to default
    products = JSON.parse(JSON.stringify(initialProductsList));
    res.json({ success: true, message: 'Sample Cambodian products restored', products });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, 'localhost', () => {
    console.log(`🚀 SME POS Server running on http://localhost:${PORT}`);
  });

}

startServer();
