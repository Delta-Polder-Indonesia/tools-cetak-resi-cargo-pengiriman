import type { CargoType, PrintMode } from "../models/formSnapshot";

export const STORAGE_KEY = "umkm_invoice_shipping_tool_v3";
export const HISTORY_STORAGE_KEY = "umkm_invoice_shipping_history_v2";
export const LEGACY_STORAGE_KEY_V2 = "umkm_invoice_shipping_tool_v2";
export const LEGACY_HISTORY_STORAGE_KEY_V1 = "umkm_invoice_shipping_history_v1";

export const SHIPPING_OPTIONS: Array<{ label: string; options: string[] }> = [
  {
    label: "Ekspedisi & Kurir",
    options: ["JNE", "J&T", "SiCepat", "POS Indonesia", "AnterAja", "Kurir Toko", "Ambil di Tempat"],
  },
  {
    label: "Transportasi Umum",
    options: ["Bus", "Kereta Api", "Travel"],
  },
  {
    label: "Layanan Cargo",
    options: [
      "Cargo Lokal",
      "JNE Cargo",
      "J&T Cargo",
      "SiCepat Cargo",
      "POS Cargo",
      "Dakota Cargo",
      "Indah Cargo",
      "Lion Parcel Cargo",
      "Kargo Bus",
      "Kereta Api Logistik",
      "Pelni Cargo",
      "Trucking Lokal",
      "Container Truck",
      "Same Day Cargo",
      "Cold Chain Logistics",
    ],
  },
];

export const STEP_ITEMS = [
  { id: 1, title: "Data Toko/Pembeli" },
  { id: 2, title: "Detail Produk" },
  { id: 3, title: "Pengiriman" },
  { id: 4, title: "Detail Cargo" },
] as const;

export const CARGO_INFO_TEXT = "Berat volumetrik digunakan jika lebih besar dari berat aktual";
export const INSURANCE_INFO_TEXT = "Asuransi wajib untuk barang fragile";

export const CARGO_TYPE_LABELS: Record<CargoType, string> = {
  REGULER: "Reguler",
  CARGO_KECIL: "Cargo Kecil",
  CARGO_SEDANG: "Cargo Sedang",
  CARGO_BESAR: "Cargo Besar",
  CARGO_KHUSUS: "Cargo Khusus",
};

export const getThermalWidth = (printMode: PrintMode) => {
  if (printMode === "THERMAL_58") return 58;
  if (printMode === "THERMAL_80") return 80;
  return 80;
};
