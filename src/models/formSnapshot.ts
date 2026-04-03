export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type PrintMode = "AUTO" | "A4" | "LABEL_100X150" | "LABEL_100X100" | "THERMAL_80" | "THERMAL_58";

export type BrandingTemplate = "MONO" | "OCEAN" | "FOREST";

export type CargoType = "REGULER" | "CARGO_KECIL" | "CARGO_SEDANG" | "CARGO_BESAR" | "CARGO_KHUSUS";

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export type FormSnapshot = {
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storePostalCode: string;
  storePhone: string;
  sellerSigner: string;
  logoDataUrl: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerPostalCode: string;
  buyerPhone: string;
  items: OrderItem[];
  courier: string;
  shippingService: string;
  shipDate: string;
  packageQty: number;
  packageNote: string;
  status: string;
  itemWeightGr: number;
  shippingCost: number;
  isFreeShipping: boolean;
  receiptNo: string;
  invoiceNo: string;
  showQr: boolean;
  printMode: PrintMode;
  brandingTemplate: BrandingTemplate;
  primaryColor: string;
  cargoType: CargoType;
  dimensions: Dimensions;
  insuranceValue: number;
  fragile: boolean;
  temperatureControlled: boolean;
  dangerousGoods: boolean;
};

export const TEMPLATE_COLOR: Record<BrandingTemplate, { label: string; color: string }> = {
  MONO: { label: "Minimal Monokrom", color: "#0f172a" },
  OCEAN: { label: "Ocean Professional", color: "#1d4ed8" },
  FOREST: { label: "Forest UMKM", color: "#166534" },
};

const CARGO_TYPES: CargoType[] = ["REGULER", "CARGO_KECIL", "CARGO_SEDANG", "CARGO_BESAR", "CARGO_KHUSUS"];
const PRINT_MODES: PrintMode[] = ["AUTO", "A4", "LABEL_100X150", "LABEL_100X100", "THERMAL_80", "THERMAL_58"];

// Counter untuk ID unik
let idCounter = 0;
const generateUniqueId = (): string => {
  idCounter += 1;
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 5)}`;
};

export const createInvoiceNo = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${rand}`;
};

export const createReceiptNo = (): string => {
  const seed = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RSI${seed}${rand}`;
};

export const createCargoId = (invoiceNo: string): string => {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CGO-${invoiceNo}-${rand}`;
};

export const getDefaultSnapshot = (): FormSnapshot => ({
  storeName: "Toko Maju UMKM",
  storeAddress: "Jl. Merdeka No. 12, Bandung",
  storeCity: "Bandung",
  storePostalCode: "40111",
  storePhone: "0812-3456-7890",
  sellerSigner: "Pemilik Toko",
  logoDataUrl: "",
  buyerName: "Budi Santoso",
  buyerAddress: "Perum Griya Asri Blok C2 No. 7, Surabaya",
  buyerCity: "Surabaya",
  buyerPostalCode: "60111",
  buyerPhone: "0813-2222-1111",
  items: [{ id: generateUniqueId(), name: "Produk UMKM", qty: 1, price: 50000 }],
  courier: "Kurir Toko",
  shippingService: "Reguler",
  shipDate: new Date().toISOString().slice(0, 10),
  packageQty: 1,
  packageNote: "Barang umum",
  status: "Lunas",
  itemWeightGr: 500,
  shippingCost: 12000,
  isFreeShipping: true,
  receiptNo: createReceiptNo(),
  invoiceNo: createInvoiceNo(),
  showQr: true,
  printMode: "AUTO",
  brandingTemplate: "MONO",
  primaryColor: TEMPLATE_COLOR.MONO.color,
  cargoType: "REGULER",
  dimensions: {
    length: 10,
    width: 10,
    height: 10,
  },
  insuranceValue: 0,
  fragile: false,
  temperatureControlled: false,
  dangerousGoods: false,
});

/**
 * Deep clone dan normalize snapshot untuk menghindari reference issues
 */
export const normalizeSnapshot = (input?: Partial<FormSnapshot> | null): FormSnapshot => {
  const defaults = getDefaultSnapshot();
  
  // Handle null/undefined input
  if (!input) {
    return defaults;
  }

  // Deep clone untuk menghindari mutation
  const safeInput: Partial<FormSnapshot> = JSON.parse(JSON.stringify(input));
  
  // Merge dengan defaults
  const merged = { 
    ...defaults, 
    ...safeInput,
    // Pastikan nested objects di-clone properly
    dimensions: safeInput.dimensions ? {
      ...defaults.dimensions,
      ...safeInput.dimensions,
    } : defaults.dimensions,
  };

  // Validate dan normalize cargo type
  const cargoType = CARGO_TYPES.includes(merged.cargoType as CargoType) 
    ? (merged.cargoType as CargoType)
    : defaults.cargoType;

  // Validate dan normalize print mode
  const printMode = PRINT_MODES.includes(merged.printMode as PrintMode)
    ? (merged.printMode as PrintMode)
    : defaults.printMode;

  // Normalize items dengan ID yang valid
  const items = Array.isArray(merged.items) && merged.items.length > 0 
    ? merged.items.map((item, index) => ({
        id: item.id || generateUniqueId(),
        name: String(item.name || ""),
        qty: Math.max(0, Number(item.qty) || 0),
        price: Math.max(0, Number(item.price) || 0),
      }))
    : defaults.items;

  return {
    ...merged,
    storeName: String(merged.storeName || defaults.storeName),
    storeAddress: String(merged.storeAddress || defaults.storeAddress),
    storeCity: String(merged.storeCity || defaults.storeCity),
    storePostalCode: String(merged.storePostalCode || defaults.storePostalCode),
    storePhone: String(merged.storePhone || defaults.storePhone),
    sellerSigner: String(merged.sellerSigner || defaults.sellerSigner),
    logoDataUrl: String(merged.logoDataUrl || defaults.logoDataUrl),
    buyerName: String(merged.buyerName || defaults.buyerName),
    buyerAddress: String(merged.buyerAddress || defaults.buyerAddress),
    buyerCity: String(merged.buyerCity || defaults.buyerCity),
    buyerPostalCode: String(merged.buyerPostalCode || defaults.buyerPostalCode),
    buyerPhone: String(merged.buyerPhone || defaults.buyerPhone),
    courier: String(merged.courier || defaults.courier),
    shippingService: String(merged.shippingService || defaults.shippingService),
    shipDate: String(merged.shipDate || defaults.shipDate),
    packageNote: String(merged.packageNote || defaults.packageNote),
    status: String(merged.status || defaults.status),
    receiptNo: String(merged.receiptNo || defaults.receiptNo),
    invoiceNo: String(merged.invoiceNo || defaults.invoiceNo),
    primaryColor: String(merged.primaryColor || defaults.primaryColor),
    
    // Numeric fields dengan validasi
    packageQty: Math.max(1, Number(merged.packageQty) || 1),
    itemWeightGr: Math.max(0, Number(merged.itemWeightGr) || 0),
    shippingCost: Math.max(0, Number(merged.shippingCost) || 0),
    insuranceValue: Math.max(0, Number(merged.insuranceValue) || 0),
    
    // Boolean fields
    isFreeShipping: Boolean(merged.isFreeShipping),
    showQr: Boolean(merged.showQr),
    fragile: Boolean(merged.fragile),
    temperatureControlled: Boolean(merged.temperatureControlled),
    dangerousGoods: Boolean(merged.dangerousGoods),
    
    // Validated enums
    cargoType,
    printMode,
    
    // Normalized nested objects
    dimensions: {
      length: Math.max(0, Number(merged.dimensions.length) || 0),
      width: Math.max(0, Number(merged.dimensions.width) || 0),
      height: Math.max(0, Number(merged.dimensions.height) || 0),
    },
    
    // Normalized array
    items,
  };
};

export const migrateV2toV3 = (legacySnapshot?: Partial<FormSnapshot>): FormSnapshot => {
  const defaults = getDefaultSnapshot();
  return normalizeSnapshot({
    ...legacySnapshot,
    cargoType: legacySnapshot?.cargoType ?? defaults.cargoType,
    dimensions: legacySnapshot?.dimensions ?? defaults.dimensions,
    insuranceValue: legacySnapshot?.insuranceValue ?? defaults.insuranceValue,
    fragile: legacySnapshot?.fragile ?? defaults.fragile,
    temperatureControlled: legacySnapshot?.temperatureControlled ?? defaults.temperatureControlled,
    dangerousGoods: legacySnapshot?.dangerousGoods ?? defaults.dangerousGoods,
  });
};