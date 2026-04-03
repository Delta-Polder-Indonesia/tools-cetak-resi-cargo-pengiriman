export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type PrintMode =
  | "AUTO"
  | "A4"
  | "A4_COMPACT"
  | "LABEL_100X150"
  | "LABEL_100X100"
  | "THERMAL_80"
  | "THERMAL_58";

export type BrandingTemplate = "MONO" | "OCEAN" | "FOREST";
export type ReceiptTemplate =
  | "UMKM_CLASSIC"
  | "JNE_LIKE"
  | "SHOPEE_LIKE"
  | "TOKOPEDIA_LIKE"
  | "MARKETPLACE";

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
  receiptTemplate: ReceiptTemplate;
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

const RECEIPT_TEMPLATES: ReceiptTemplate[] = [
  "UMKM_CLASSIC",
  "JNE_LIKE",
  "SHOPEE_LIKE",
  "TOKOPEDIA_LIKE",
  "MARKETPLACE",
];

const CARGO_TYPES: CargoType[] = ["REGULER", "CARGO_KECIL", "CARGO_SEDANG", "CARGO_BESAR", "CARGO_KHUSUS"];
const PRINT_MODES: PrintMode[] = [
  "AUTO",
  "A4",
  "A4_COMPACT",
  "LABEL_100X150",
  "LABEL_100X100",
  "THERMAL_80",
  "THERMAL_58",
];

export const createInvoiceNo = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${rand}`;
};

export const createReceiptNo = () => {
  const seed = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RSI${seed}${rand}`;
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
  items: [{ id: "1", name: "Produk UMKM", qty: 1, price: 50000 }],
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
  receiptTemplate: "UMKM_CLASSIC",
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

export const normalizeSnapshot = (input?: Partial<FormSnapshot>): FormSnapshot => {
  const defaults = getDefaultSnapshot();
  const merged = { ...defaults, ...(input ?? {}) };
  const items = Array.isArray(merged.items) && merged.items.length > 0 ? merged.items : defaults.items;
  const dimensionsInput = merged.dimensions ?? defaults.dimensions;
  const cargoType = CARGO_TYPES.includes(merged.cargoType) ? merged.cargoType : defaults.cargoType;
  const printMode = PRINT_MODES.includes(merged.printMode) ? merged.printMode : defaults.printMode;
  const rawReceiptTemplate = RECEIPT_TEMPLATES.includes(merged.receiptTemplate)
    ? merged.receiptTemplate
    : defaults.receiptTemplate;
  const receiptTemplate = rawReceiptTemplate === "MARKETPLACE" ? "SHOPEE_LIKE" : rawReceiptTemplate;

  return {
    ...merged,
    packageQty: Number(merged.packageQty) > 0 ? Number(merged.packageQty) : 1,
    itemWeightGr: Number(merged.itemWeightGr) > 0 ? Number(merged.itemWeightGr) : 0,
    shippingCost: Number(merged.shippingCost) > 0 ? Number(merged.shippingCost) : 0,
    insuranceValue: Number(merged.insuranceValue) > 0 ? Number(merged.insuranceValue) : 0,
    isFreeShipping: Boolean(merged.isFreeShipping),
    fragile: Boolean(merged.fragile),
    temperatureControlled: Boolean(merged.temperatureControlled),
    dangerousGoods: Boolean(merged.dangerousGoods),
    cargoType,
    printMode,
    receiptTemplate,
    dimensions: {
      length: Number(dimensionsInput.length) > 0 ? Number(dimensionsInput.length) : 0,
      width: Number(dimensionsInput.width) > 0 ? Number(dimensionsInput.width) : 0,
      height: Number(dimensionsInput.height) > 0 ? Number(dimensionsInput.height) : 0,
    },
    items: items.map((item, index) => ({
      id: item.id || `${Date.now()}-${index}`,
      name: item.name || "",
      qty: Number(item.qty) > 0 ? Number(item.qty) : 0,
      price: Number(item.price) > 0 ? Number(item.price) : 0,
    })),
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