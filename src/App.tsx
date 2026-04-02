import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Barcode from "react-barcode";

type OrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

type PrintMode = "A4" | "THERMAL_80" | "THERMAL_58";

type BrandingTemplate = "MONO" | "OCEAN" | "FOREST";

type FormSnapshot = {
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
};

type TransactionRecord = {
  id: string;
  createdAt: string;
  snapshot: FormSnapshot;
};

const STORAGE_KEY = "umkm_invoice_shipping_tool_v2";
const HISTORY_STORAGE_KEY = "umkm_invoice_shipping_history_v1";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

const createInvoiceNo = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${rand}`;
};

const createReceiptNo = () => {
  const seed = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RSI${seed}${rand}`;
};

const TEMPLATE_COLOR: Record<BrandingTemplate, { label: string; color: string }> = {
  MONO: { label: "Minimal Monokrom", color: "#0f172a" },
  OCEAN: { label: "Ocean Professional", color: "#1d4ed8" },
  FOREST: { label: "Forest UMKM", color: "#166534" },
};

const SHIPPING_OPTIONS = [
  "JNE",
  "J&T",
  "SiCepat",
  "POS Indonesia",
  "AnterAja",
  "Kurir Toko",
  "Bus",
  "Kereta Api",
  "Travel",
  "Cargo Lokal",
  "Ambil di Tempat",
];

const getDefaultSnapshot = (): FormSnapshot => ({
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
  printMode: "A4",
  brandingTemplate: "MONO",
  primaryColor: TEMPLATE_COLOR.MONO.color,
});

const getThermalWidth = (printMode: PrintMode) => {
  if (printMode === "THERMAL_58") return 58;
  if (printMode === "THERMAL_80") return 80;
  return 80;
};

const normalizeSnapshot = (input?: Partial<FormSnapshot>): FormSnapshot => {
  const defaults = getDefaultSnapshot();
  const merged = { ...defaults, ...(input ?? {}) };
  const items = Array.isArray(merged.items) && merged.items.length > 0 ? merged.items : defaults.items;
  return {
    ...merged,
    packageQty: Number(merged.packageQty) > 0 ? Number(merged.packageQty) : 1,
    itemWeightGr: Number(merged.itemWeightGr) > 0 ? Number(merged.itemWeightGr) : 0,
    shippingCost: Number(merged.shippingCost) > 0 ? Number(merged.shippingCost) : 0,
    isFreeShipping: Boolean(merged.isFreeShipping),
    items: items.map((item, index) => ({
      id: item.id || `${Date.now()}-${index}`,
      name: item.name || "",
      qty: Number(item.qty) > 0 ? Number(item.qty) : 0,
      price: Number(item.price) > 0 ? Number(item.price) : 0,
    })),
  };
};

export default function App() {
  const [snapshot, setSnapshot] = useState<FormSnapshot>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultSnapshot();
      const parsed = JSON.parse(raw) as Partial<FormSnapshot>;
      return normalizeSnapshot(parsed);
    } catch {
      return getDefaultSnapshot();
    }
  });
  const [history, setHistory] = useState<TransactionRecord[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as TransactionRecord[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        snapshot: normalizeSnapshot(entry.snapshot),
      }));
    } catch {
      return [];
    }
  });
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatus, setHistoryStatus] = useState("Semua");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [snapshot]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const {
    storeName,
    storeAddress,
    storeCity,
    storePostalCode,
    storePhone,
    sellerSigner,
    logoDataUrl,
    buyerName,
    buyerAddress,
    buyerCity,
    buyerPostalCode,
    buyerPhone,
    items,
    courier,
    shippingService,
    shipDate,
    packageQty,
    packageNote,
    status,
    itemWeightGr,
    shippingCost,
    isFreeShipping,
    receiptNo,
    invoiceNo,
    showQr,
    printMode,
    brandingTemplate,
    primaryColor,
  } = snapshot;

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.qty * item.price, 0), [items]);
  const effectiveShippingCost = isFreeShipping ? 0 : shippingCost;
  const grandTotal = subtotal + effectiveShippingCost;

  // Barcode now only uses receipt number for shorter, scanner-friendly payload.
  const barcodePayload = useMemo(() => receiptNo || "-", [receiptNo]);

  const filteredHistory = useMemo(() => {
    const keyword = historyQuery.trim().toLowerCase();
    return history.filter((entry) => {
      const isStatusMatch = historyStatus === "Semua" || entry.snapshot.status === historyStatus;
      const searchable = `${entry.snapshot.invoiceNo} ${entry.snapshot.receiptNo} ${entry.snapshot.buyerName} ${entry.snapshot.storeName}`.toLowerCase();
      const isKeywordMatch = keyword ? searchable.includes(keyword) : true;
      return isStatusMatch && isKeywordMatch;
    });
  }, [history, historyQuery, historyStatus]);

  const thermalWidthPx = printMode === "THERMAL_58" ? "max-w-[235px]" : "max-w-[324px]";

  const updateField = <K extends keyof FormSnapshot>(key: K, value: FormSnapshot[K]) => {
    setSnapshot((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (id: string, key: keyof OrderItem, value: string) => {
    setSnapshot((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        if (key === "qty" || key === "price") {
          return { ...item, [key]: Math.max(0, Number(value) || 0) };
        }
        return { ...item, [key]: value };
      }),
    }));
  };

  const addItem = () => {
    setSnapshot((prev) => ({
      ...prev,
      items: [...prev.items, { id: `${Date.now()}`, name: "", qty: 1, price: 0 }],
    }));
  };

  const removeItem = (id: string) => {
    setSnapshot((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
    }));
  };

  const applyPrintPageSize = (mode: PrintMode) => {
    const existing = document.getElementById("dynamic-print-page-size");
    if (existing) existing.remove();

    const styleNode = document.createElement("style");
    styleNode.id = "dynamic-print-page-size";
    const css =
      mode === "A4"
        ? "@media print { @page { size: A4 portrait; margin: 10mm; } }"
        : `@media print { @page { size: ${getThermalWidth(mode)}mm auto; margin: 2mm; } }`;
    styleNode.textContent = css;
    document.head.appendChild(styleNode);
  };

  const handlePrint = (mode: PrintMode = printMode) => {
    applyPrintPageSize(mode);
    window.print();
  };

  const handleDownloadPdf = async (options?: { mode?: PrintMode; invoice?: string; receipt?: string }) => {
    const target = document.getElementById("print-area");
    if (!target) return;

    const activeMode = options?.mode ?? printMode;
    const activeInvoice = options?.invoice ?? invoiceNo;
    const activeReceipt = options?.receipt ?? receiptNo;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      if (activeMode !== "A4") {
        const widthMm = getThermalWidth(activeMode);
        const heightMm = (canvas.height * widthMm) / canvas.width + 8;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [widthMm, heightMm] });
        pdf.addImage(imgData, "PNG", 2, 2, widthMm - 4, heightMm - 4);
        pdf.save(`${activeInvoice}-${activeReceipt}-thermal.pdf`);
      } else {
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const maxWidth = 194;
        const maxHeight = 277;
        const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        const width = canvas.width * ratio;
        const height = canvas.height * ratio;
        const x = (210 - width) / 2;
        const y = 10;
        pdf.addImage(imgData, "PNG", x, y, width, height);
        pdf.save(`${activeInvoice}-${activeReceipt}.pdf`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("logoDataUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyTemplate = (template: BrandingTemplate) => {
    updateField("brandingTemplate", template);
    updateField("primaryColor", TEMPLATE_COLOR[template].color);
  };

  const resetData = () => {
    const fresh = getDefaultSnapshot();
    setSnapshot(fresh);
  };

  const saveToHistory = () => {
    const recordId = `${snapshot.invoiceNo}-${snapshot.receiptNo}`;
    const record: TransactionRecord = {
      id: recordId,
      createdAt: new Date().toISOString(),
      snapshot: normalizeSnapshot(snapshot),
    };

    setHistory((prev) => {
      const withoutCurrent = prev.filter((entry) => entry.id !== recordId);
      return [record, ...withoutCurrent];
    });
  };

  const loadFromHistory = (record: TransactionRecord) => {
    setSnapshot(normalizeSnapshot(record.snapshot));
  };

  const runAfterLoad = (record: TransactionRecord, action: "print" | "pdf") => {
    setSnapshot(normalizeSnapshot(record.snapshot));
    window.setTimeout(() => {
      if (action === "print") {
        handlePrint(record.snapshot.printMode);
        return;
      }
      handleDownloadPdf({
        mode: record.snapshot.printMode,
        invoice: record.snapshot.invoiceNo,
        receipt: record.snapshot.receiptNo,
      });
    }, 180);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const issueDate = new Date().toLocaleDateString("id-ID");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="no-print border-b border-slate-200 bg-white"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold tracking-tight">UMKM Resi & Invoice Builder</h1>
          <p className="text-sm text-slate-600">
            Pencatatan penjualan dan pembuatan label pengiriman internal. Bukan untuk pemalsuan resi resmi ekspedisi.
          </p>
        </div>
      </motion.header>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1.03fr_1fr] lg:px-8">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="no-print space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <h2 className="text-lg font-semibold">Input Data</h2>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data Toko</h3>
            <input className="input-base" value={storeName} onChange={(e) => updateField("storeName", e.target.value)} placeholder="Nama toko" />
            <textarea
              className="input-base min-h-20"
              value={storeAddress}
              onChange={(e) => updateField("storeAddress", e.target.value)}
              placeholder="Alamat toko"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" value={storeCity} onChange={(e) => updateField("storeCity", e.target.value)} placeholder="Kota/Kabupaten asal" />
              <input
                className="input-base"
                value={storePostalCode}
                onChange={(e) => updateField("storePostalCode", e.target.value)}
                placeholder="Kode pos asal"
              />
            </div>
            <input className="input-base" value={storePhone} onChange={(e) => updateField("storePhone", e.target.value)} placeholder="No HP toko" />
            <input
              className="input-base"
              value={sellerSigner}
              onChange={(e) => updateField("sellerSigner", e.target.value)}
              placeholder="Nama penanggung jawab / tanda tangan"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input-base" value={brandingTemplate} onChange={(e) => applyTemplate(e.target.value as BrandingTemplate)}>
                {(Object.keys(TEMPLATE_COLOR) as BrandingTemplate[]).map((template) => (
                  <option key={template} value={template}>
                    {TEMPLATE_COLOR[template].label}
                  </option>
                ))}
              </select>
              <input
                className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                type="color"
                value={primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                title="Pilih warna brand"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className="input-base" type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)} />
              <button
                onClick={() => updateField("logoDataUrl", "")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
              >
                Hapus Logo
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data Pembeli</h3>
            <input className="input-base" value={buyerName} onChange={(e) => updateField("buyerName", e.target.value)} placeholder="Nama pembeli" />
            <textarea
              className="input-base min-h-24"
              value={buyerAddress}
              onChange={(e) => updateField("buyerAddress", e.target.value)}
              placeholder="Alamat lengkap pembeli"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" value={buyerCity} onChange={(e) => updateField("buyerCity", e.target.value)} placeholder="Kota/Kabupaten tujuan" />
              <input
                className="input-base"
                value={buyerPostalCode}
                onChange={(e) => updateField("buyerPostalCode", e.target.value)}
                placeholder="Kode pos tujuan"
              />
            </div>
            <input className="input-base" value={buyerPhone} onChange={(e) => updateField("buyerPhone", e.target.value)} placeholder="No HP pembeli" />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Detail Pesanan</h3>
            {items.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.2fr_72px_120px_auto]">
                <input
                  className="input-base"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="Nama produk"
                />
                <input
                  className="input-base"
                  type="number"
                  min={0}
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                  placeholder="Qty"
                />
                <input
                  className="input-base"
                  type="number"
                  min={0}
                  value={item.price}
                  onChange={(e) => updateItem(item.id, "price", e.target.value)}
                  placeholder="Harga"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  type="button"
                >
                  Hapus
                </button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              type="button"
            >
              + Tambah Produk
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pengiriman</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <>
                <input
                  className="input-base"
                  value={courier}
                  onChange={(e) => updateField("courier", e.target.value)}
                  list="shipping-options"
                  placeholder="Kurir / metode kirim (contoh: Bus, Kereta Api)"
                />
                <datalist id="shipping-options">
                  {SHIPPING_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </>
              <select className="input-base" value={shippingService} onChange={(e) => updateField("shippingService", e.target.value)}>
                <option>Reguler</option>
                <option>Express</option>
                <option>Same Day</option>
                <option>Ekonomi</option>
                <option>Cargo</option>
                <option>Layanan Lain</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" type="date" value={shipDate} onChange={(e) => updateField("shipDate", e.target.value)} />
              <select className="input-base" value={status} onChange={(e) => updateField("status", e.target.value)}>
                <option>Lunas</option>
                <option>COD</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className="input-base" value={receiptNo} onChange={(e) => updateField("receiptNo", e.target.value)} placeholder="Nomor resi" />
              <button
                onClick={() => updateField("receiptNo", createReceiptNo())}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
              >
                Generate
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input-base"
                type="number"
                min={1}
                value={packageQty}
                onChange={(e) => updateField("packageQty", Math.max(1, Number(e.target.value) || 1))}
                placeholder="Jumlah koli"
              />
              <input
                className="input-base"
                type="number"
                min={0}
                value={itemWeightGr}
                onChange={(e) => updateField("itemWeightGr", Math.max(0, Number(e.target.value) || 0))}
                placeholder="Berat barang (gram)"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input-base"
                value={packageNote}
                onChange={(e) => updateField("packageNote", e.target.value)}
                placeholder="Isi paket / catatan barang"
              />
              <input
                className="input-base"
                type="number"
                min={0}
                value={shippingCost}
                onChange={(e) => updateField("shippingCost", Math.max(0, Number(e.target.value) || 0))}
                placeholder="Ongkir"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" checked={isFreeShipping} onChange={(e) => updateField("isFreeShipping", e.target.checked)} />
                Gratis Ongkir (coret harga ongkir)
              </label>
              <select className="input-base" value={printMode} onChange={(e) => updateField("printMode", e.target.value as PrintMode)}>
                <option value="A4">Mode Cetak A4</option>
                <option value="THERMAL_80">Mode Thermal 80mm</option>
                <option value="THERMAL_58">Mode Thermal 58mm</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={showQr} onChange={(e) => updateField("showQr", e.target.checked)} />
              Tampilkan Barcode resi
            </label>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <button
              onClick={saveToHistory}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              type="button"
            >
              Simpan ke Riwayat
            </button>
            <button
              onClick={() => handlePrint()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              type="button"
            >
              PRINT
            </button>
            <button
              onClick={() => handleDownloadPdf()}
              disabled={isExporting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              type="button"
            >
              {isExporting ? "Memproses PDF..." : "Download PDF"}
            </button>
            <button
              onClick={resetData}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
            >
              Reset Data
            </button>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Riwayat Transaksi</h3>
              <button
                onClick={clearHistory}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
              >
                Hapus Semua
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="input-base"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Cari invoice, resi, pembeli"
              />
              <select className="input-base" value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)}>
                <option>Semua</option>
                <option>Lunas</option>
                <option>COD</option>
              </select>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {filteredHistory.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500">
                  Belum ada riwayat. Klik "Simpan ke Riwayat" setelah mengisi transaksi.
                </p>
              ) : (
                filteredHistory.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{entry.snapshot.invoiceNo}</p>
                    <p className="text-xs text-slate-600">{new Date(entry.createdAt).toLocaleString("id-ID")}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {entry.snapshot.buyerName || "-"} | {entry.snapshot.courier} | {entry.snapshot.status}
                    </p>
                    <p className="text-xs text-slate-600">Resi: {entry.snapshot.receiptNo}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => loadFromHistory(entry)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        type="button"
                      >
                        Muat
                      </button>
                      <button
                        onClick={() => runAfterLoad(entry, "print")}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                        type="button"
                      >
                        Cetak Ulang
                      </button>
                      <button
                        onClick={() => runAfterLoad(entry, "pdf")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                        type="button"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(entry.id)}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                        type="button"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="space-y-4"
        >
          <div id="print-area" className={`print-area bg-white ${printMode === "A4" ? "" : `mx-auto ${thermalWidthPx}`}`}>
            <div className="border border-slate-200 p-4 sm:p-6">
              <div className="mb-4 flex items-start justify-between border-b border-slate-300 pb-4">
                <div className="flex items-start gap-3">
                  {logoDataUrl ? <img src={logoDataUrl} alt="Logo Toko" className="h-12 w-12 rounded-md object-cover" /> : null}
                  <div>
                    <p className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>
                      {storeName || "Nama Toko"}
                    </p>
                    <p className="text-sm text-slate-600">{storeAddress || "Alamat toko"}</p>
                    <p className="text-sm text-slate-600">
                      {storeCity || "Kota asal"}
                      {storePostalCode ? `, ${storePostalCode}` : ""}
                    </p>
                    <p className="text-sm text-slate-600">{storePhone || "No HP toko"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Invoice</p>
                  <p className="font-semibold">{invoiceNo}</p>
                  <p className="text-sm text-slate-600">{issueDate}</p>
                </div>
              </div>

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pembeli</p>
                  <p className="font-semibold">{buyerName || "Nama pembeli"}</p>
                  <p className="text-sm text-slate-600">{buyerAddress || "Alamat pembeli"}</p>
                  <p className="text-sm text-slate-600">
                    {buyerCity || "Kota tujuan"}
                    {buyerPostalCode ? `, ${buyerPostalCode}` : ""}
                  </p>
                  <p className="text-sm text-slate-600">{buyerPhone || "No HP pembeli"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pengiriman</p>
                  <p className="text-sm">Metode/Kurir: {courier}</p>
                  <p className="text-sm">Layanan: {shippingService}</p>
                  <p className="text-sm">Tanggal Kirim: {shipDate || "-"}</p>
                  <p className="text-sm">Nomor Resi: {receiptNo}</p>
                  <p className="text-sm">Jumlah Koli: {packageQty}</p>
                  <p className="text-sm">Berat Barang: {itemWeightGr} gr</p>
                  <p className="text-sm">Isi Paket: {packageNote || "-"}</p>
                  <p className="text-sm">Status: {status}</p>
                </div>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-slate-300 text-left">
                    <th className="py-2">Produk</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Harga</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="py-2">{item.name || "-"}</td>
                      <td className="py-2 text-center">{item.qty}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir</span>
                  {isFreeShipping ? (
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400 line-through">{formatCurrency(shippingCost)}</span>
                      <span className="font-semibold text-emerald-600">GRATIS</span>
                    </span>
                  ) : (
                    <span>{formatCurrency(shippingCost)}</span>
                  )}
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-semibold">
                  <span>Grand Total</span>
                  <span style={{ color: primaryColor }}>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-end justify-end">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Penanggung Jawab</p>
                  <p className="mt-8 text-sm font-semibold" style={{ color: primaryColor }}>
                    {sellerSigner || "Pemilik"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 border border-dashed border-slate-400 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Shipping Label</p>
                  <p className="text-xl font-bold" style={{ color: primaryColor }}>
                    {courier}
                  </p>
                  <p className="text-sm">Layanan: {shippingService}</p>
                  <p className="text-sm">Resi: {receiptNo}</p>
                  <p className="text-sm">Koli: {packageQty}</p>
                  <p className="text-sm">Berat: {itemWeightGr} gr</p>
                  <p className="text-sm">Tanggal: {shipDate || "-"}</p>
                  <p className="text-sm">Status: {status}</p>
                </div>
                {showQr ? (
                  <Barcode
                    value={barcodePayload}
                    format="CODE128"
                    width={1.4}
                    height={44}
                    margin={0}
                    fontSize={11}
                    background="#ffffff"
                  />
                ) : null}
              </div>
              {showQr ? <p className="mt-2 text-[10px] text-slate-500">Barcode memuat: nomor resi saja.</p> : null}
              <div className="mt-4 border-t border-slate-300 pt-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Kepada</p>
                <p className="font-semibold">{buyerName || "Nama pembeli"}</p>
                <p className="text-sm leading-relaxed text-slate-700">{buyerAddress || "Alamat pembeli"}</p>
                <p className="text-sm text-slate-700">
                  {buyerCity || "Kota tujuan"}
                  {buyerPostalCode ? `, ${buyerPostalCode}` : ""}
                </p>
                <p className="text-sm text-slate-700">{buyerPhone || "No HP pembeli"}</p>
              </div>
              <div className="mt-4 border-t border-slate-300 pt-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Pengirim</p>
                <p className="font-semibold">{storeName || "Nama toko"}</p>
                <p className="text-sm leading-relaxed text-slate-700">{storeAddress || "Alamat toko"}</p>
                <p className="text-sm text-slate-700">
                  {storeCity || "Kota asal"}
                  {storePostalCode ? `, ${storePostalCode}` : ""}
                </p>
                <p className="text-sm text-slate-700">{storePhone || "No HP toko"}</p>
              </div>
            </div>
          </div>

          <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-base font-semibold">Output Produk Digital (untuk Lynk)</h3>
            <p className="mt-3 text-sm text-slate-700">
              <span className="font-semibold">Nama produk:</span> ResiCraft UMKM - Generator Invoice + Shipping Label Offline
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Deskripsi jualan:</span> Aplikasi web praktis untuk UMKM membuat invoice profesional dan label
              pengiriman siap cetak tanpa backend. Bisa dipakai offline, mobile friendly, auto hitung total, auto nomor resi, barcode
              resi, layanan kirim, data kota/kode pos, dan ekspor PDF dalam beberapa klik.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Target market:</span> UMKM, dropshipper, reseller, online shop rumahan, admin toko marketplace.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Keunggulan:</span> Offline-ready, data langsung tampil real-time, tampilan invoice/resi bersih,
              format cetak A4 dan thermal, dukungan berat barang, jumlah koli, gratis ongkir (harga dicoret), mudah dipakai dari HP maupun
              laptop.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Ide harga jual:</span> Rp49.000 (personal), Rp99.000 (bisnis 3 device), Rp149.000 (bundle
              + template branding).
            </p>
            <p className="mt-3 text-xs text-slate-500">Tip: Semua data otomatis tersimpan di browser (localStorage), jadi aman dipakai offline.</p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
