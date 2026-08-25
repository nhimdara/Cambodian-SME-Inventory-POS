/**
 * Bakong KHQR Generation and Dual Currency Utilities
 * Conforms to NBC (National Bank of Cambodia) and EMVCo QR Code Specifications
 */

// Format TLV (Tag-Length-Value) field for EMVCo QR format
function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

/**
 * CRC-16/CCITT-FALSE implementation (Polynomial: 0x1021, Initial: 0xFFFF)
 * Required by EMVCo / Bakong standard for Tag 63 checksum
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= (byte << 8);
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

export interface KHQROptions {
  bakongId: string; // e.g. "sokha_market@aclb"
  merchantName: string;
  merchantCity?: string;
  amount: number; // e.g. in KHR or USD
  currency?: 'KHR' | 'USD';
  billNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
}

/**
 * Generates an EMVCo compliant Bakong KHQR payload string
 */
export function generateBakongKHQR(options: KHQROptions): string {
  const {
    bakongId,
    merchantName,
    merchantCity = 'Phnom Penh',
    amount,
    currency = 'KHR',
    billNumber = `INV-${Date.now().toString().slice(-6)}`,
    storeLabel = 'SME Store',
    terminalLabel = 'POS-01',
  } = options;

  // Tag 00: Payload Format Indicator (01)
  let qr = formatTLV('00', '01');

  // Tag 01: Point of Initiation Method (12 = Dynamic QR with specific amount, 11 = Static)
  qr += formatTLV('01', amount > 0 ? '12' : '11');

  // Tag 29: Merchant Account Information (Bakong Individual / Merchant)
  // Subtag 00: Global Unique Identifier "kh.gov.nbc.bakong"
  // Subtag 01: Bakong Account ID
  const sub29_00 = formatTLV('00', 'kh.gov.nbc.bakong');
  const sub29_01 = formatTLV('01', bakongId || 'merchant@bakong');
  const tag29 = sub29_00 + sub29_01;
  qr += formatTLV('29', tag29);

  // Tag 52: Merchant Category Code (Default: 5399 General Merchandise)
  qr += formatTLV('52', '5399');

  // Tag 53: Transaction Currency (116 = KHR, 840 = USD)
  const currencyCode = currency === 'KHR' ? '116' : '840';
  qr += formatTLV('53', currencyCode);

  // Tag 54: Transaction Amount
  if (amount > 0) {
    const formattedAmount = currency === 'KHR' ? Math.round(amount).toString() : amount.toFixed(2);
    qr += formatTLV('54', formattedAmount);
  }

  // Tag 58: Country Code
  qr += formatTLV('58', 'KH');

  // Tag 59: Merchant Name
  const cleanMerchantName = (merchantName || 'Bakong Merchant').slice(0, 25);
  qr += formatTLV('59', cleanMerchantName);

  // Tag 60: Merchant City
  qr += formatTLV('60', (merchantCity || 'Phnom Penh').slice(0, 15));

  // Tag 62: Additional Data Field Template
  let sub62 = '';
  if (billNumber) sub62 += formatTLV('01', billNumber.slice(0, 25));
  if (storeLabel) sub62 += formatTLV('03', storeLabel.slice(0, 25));
  if (terminalLabel) sub62 += formatTLV('07', terminalLabel.slice(0, 25));
  if (sub62) {
    qr += formatTLV('62', sub62);
  }

  // Tag 63: CRC16 Checksum
  // Prefix Tag 63 with length '04' and append computed checksum
  const qrWithoutCrc = qr + '6304';
  const checksum = calculateCRC16(qrWithoutCrc);
  return qrWithoutCrc + checksum;
}

/**
 * Currency Conversion Utilities
 */

/**
 * Converts USD to KHR and rounds to the nearest 100 Riel (standard Cambodian retail practice)
 */
export function convertUsdToKhr(usdAmount: number, exchangeRate: number): number {
  if (!usdAmount || usdAmount <= 0) return 0;
  const rawKhr = usdAmount * exchangeRate;
  return Math.round(rawKhr / 100) * 100;
}

/**
 * Converts KHR to USD
 */
export function convertKhrToUsd(khrAmount: number, exchangeRate: number): number {
  if (!khrAmount || khrAmount <= 0 || !exchangeRate) return 0;
  return Number((khrAmount / exchangeRate).toFixed(2));
}

/**
 * Format USD currency string
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format KHR currency string with Riel symbol ៛
 */
export function formatKHR(amount: number): string {
  const num = Math.round(amount || 0);
  return `${num.toLocaleString('en-US')} ៛`;
}

/**
 * Calculate change when customer pays in USD, KHR, or a combination
 */
export function calculateCashChange(
  totalUsd: number,
  exchangeRate: number,
  paidUsd: number = 0,
  paidKhr: number = 0
): {
  totalPaidUsd: number;
  changeUsd: number;
  changeKhr: number;
  isSufficient: boolean;
  shortfallUsd: number;
} {
  const paidKhrInUsd = (paidKhr || 0) / exchangeRate;
  const totalPaidUsd = (paidUsd || 0) + paidKhrInUsd;
  const differenceUsd = totalPaidUsd - totalUsd;

  if (differenceUsd >= -0.001) {
    const changeUsd = Math.max(0, Number(differenceUsd.toFixed(2)));
    const changeKhr = convertUsdToKhr(changeUsd, exchangeRate);
    return {
      totalPaidUsd: Number(totalPaidUsd.toFixed(2)),
      changeUsd,
      changeKhr,
      isSufficient: true,
      shortfallUsd: 0,
    };
  } else {
    const shortfallUsd = Math.abs(differenceUsd);
    return {
      totalPaidUsd: Number(totalPaidUsd.toFixed(2)),
      changeUsd: 0,
      changeKhr: 0,
      isSufficient: false,
      shortfallUsd: Number(shortfallUsd.toFixed(2)),
    };
  }
}
