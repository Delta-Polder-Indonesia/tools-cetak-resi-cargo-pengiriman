import { AnimatePresence, motion } from "framer-motion";
import {
  CARGO_INFO_TEXT,
  INSURANCE_INFO_TEXT,
  SHIPPING_OPTIONS,
} from "../constants/appConfig";
import {
  type BrandingTemplate,
  type Dimensions,
  type FormSnapshot,
  type OrderItem,
  type PrintMode,
  TEMPLATE_COLOR,
  createReceiptNo,
} from "../models/formSnapshot";
import type { TransactionRecord } from "../types/transaction";
import { formatWeight } from "../utils/weight";
import { InfoTooltip } from "./InfoTooltip";

type InputPanelProps = {
  snapshot: FormSnapshot;
  activeStep: number;
  setActiveStep: (step: number) => void;
  isCargoShipment: boolean;
  volumetricWeight: number;
  chargeableWeight: number;
  stepItems: ReadonlyArray<{ id: number; title: string }>;
  isExporting: boolean;
  historyQuery: string;
  setHistoryQuery: (value: string) => void;
  historyStatus: string;
  setHistoryStatus: (value: string) => void;
  historyCargoType: string;
  setHistoryCargoType: (value: string) => void;
  filteredHistory: TransactionRecord[];
  cargoTypeLabels: Record<FormSnapshot["cargoType"], string>;
  onFieldChange: (key: keyof FormSnapshot, value: FormSnapshot[keyof FormSnapshot]) => void;
  onItemChange: (id: string, key: keyof OrderItem, value: string) => void;
  onDimensionChange: (key: keyof Dimensions, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onApplyTemplate: (template: BrandingTemplate) => void;
  onLogoUpload: (file: File | null) => void;
  onSaveToHistory: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onCheckSinglePageFit: () => void;
  fitCheckMessage: string;
  fitCheckStatus: "idle" | "ok" | "warn";
  onResetData: () => void;
  onExportCargoManifest: () => void;
  onClearHistory: () => void;
  onLoadFromHistory: (record: TransactionRecord) => void;
  onRunAfterLoad: (record: TransactionRecord, action: "print" | "pdf") => void;
  onDeleteHistoryItem: (id: string) => void;
};

export function InputPanel({
  snapshot,
  activeStep,
  setActiveStep,
  isCargoShipment,
  volumetricWeight,
  chargeableWeight,
  stepItems,
  isExporting,
  historyQuery,
  setHistoryQuery,
  historyStatus,
  setHistoryStatus,
  historyCargoType,
  setHistoryCargoType,
  filteredHistory,
  cargoTypeLabels,
  onFieldChange,
  onItemChange,
  onDimensionChange,
  onAddItem,
  onRemoveItem,
  onApplyTemplate,
  onLogoUpload,
  onSaveToHistory,
  onPrint,
  onDownloadPdf,
  onCheckSinglePageFit,
  fitCheckMessage,
  fitCheckStatus,
  onResetData,
  onExportCargoManifest,
  onClearHistory,
  onLoadFromHistory,
  onRunAfterLoad,
  onDeleteHistoryItem,
}: InputPanelProps) {
  const {
    storeName,
    storeAddress,
    storeCity,
    storePostalCode,
    storePhone,
    sellerSigner,
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
    showQr,
    printMode,
    brandingTemplate,
    receiptTemplate,
    primaryColor,
    cargoType,
    dimensions,
    insuranceValue,
    fragile,
    temperatureControlled,
    dangerousGoods,
  } = snapshot;

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="no-print space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <h2 className="text-lg font-semibold">Input Data</h2>

      <div className="rounded-xl border border-slate-200 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stepItems.map((step) => {
            const isActive = activeStep === step.id;
            const isCargoStepHighlight = step.id === 4 && isCargoShipment;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                type="button"
                className={`rounded-lg border px-2 py-2 text-left text-xs font-semibold transition ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : isCargoStepHighlight
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wide">Step {step.id}</p>
                <p>{step.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeStep === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data Toko</h3>
              <input className="input-base" value={storeName} onChange={(e) => onFieldChange("storeName", e.target.value)} placeholder="Nama toko" />
              <textarea className="input-base min-h-20" value={storeAddress} onChange={(e) => onFieldChange("storeAddress", e.target.value)} placeholder="Alamat toko" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input-base" value={storeCity} onChange={(e) => onFieldChange("storeCity", e.target.value)} placeholder="Kota/Kabupaten asal" />
                <input className="input-base" value={storePostalCode} onChange={(e) => onFieldChange("storePostalCode", e.target.value)} placeholder="Kode pos asal" />
              </div>
              <input className="input-base" value={storePhone} onChange={(e) => onFieldChange("storePhone", e.target.value)} placeholder="No HP toko" />
              <input className="input-base" value={sellerSigner} onChange={(e) => onFieldChange("sellerSigner", e.target.value)} placeholder="Nama penanggung jawab / tanda tangan" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="input-base" value={brandingTemplate} onChange={(e) => onApplyTemplate(e.target.value as BrandingTemplate)}>
                  {(Object.keys(TEMPLATE_COLOR) as BrandingTemplate[]).map((template) => (
                    <option key={template} value={template}>
                      {TEMPLATE_COLOR[template].label}
                    </option>
                  ))}
                </select>
                <input className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" type="color" value={primaryColor} onChange={(e) => onFieldChange("primaryColor", e.target.value)} title="Pilih warna brand" />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input className="input-base" type="file" accept="image/*" onChange={(e) => onLogoUpload(e.target.files?.[0] ?? null)} />
                <button onClick={() => onFieldChange("logoDataUrl", "")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" type="button">
                  Hapus Logo
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data Pembeli</h3>
              <input className="input-base" value={buyerName} onChange={(e) => onFieldChange("buyerName", e.target.value)} placeholder="Nama pembeli" />
              <textarea className="input-base min-h-24" value={buyerAddress} onChange={(e) => onFieldChange("buyerAddress", e.target.value)} placeholder="Alamat lengkap pembeli" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input-base" value={buyerCity} onChange={(e) => onFieldChange("buyerCity", e.target.value)} placeholder="Kota/Kabupaten tujuan" />
                <input className="input-base" value={buyerPostalCode} onChange={(e) => onFieldChange("buyerPostalCode", e.target.value)} placeholder="Kode pos tujuan" />
              </div>
              <input className="input-base" value={buyerPhone} onChange={(e) => onFieldChange("buyerPhone", e.target.value)} placeholder="No HP pembeli" />
            </div>
          </motion.div>
        ) : null}

        {activeStep === 2 ? (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Detail Pesanan</h3>
            {items.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.2fr_72px_120px_auto]">
                <input className="input-base" value={item.name} onChange={(e) => onItemChange(item.id, "name", e.target.value)} placeholder="Nama produk" />
                <input className="input-base" type="number" min={0} value={item.qty} onChange={(e) => onItemChange(item.id, "qty", e.target.value)} placeholder="Qty" />
                <input className="input-base" type="number" min={0} value={item.price} onChange={(e) => onItemChange(item.id, "price", e.target.value)} placeholder="Harga" />
                <button onClick={() => onRemoveItem(item.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" type="button">
                  Hapus
                </button>
              </div>
            ))}
            <button onClick={onAddItem} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700" type="button">
              + Tambah Produk
            </button>
          </motion.div>
        ) : null}

        {activeStep === 3 ? (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pengiriman</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input-base" value={courier} onChange={(e) => onFieldChange("courier", e.target.value)}>
                {SHIPPING_OPTIONS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select className="input-base" value={shippingService} onChange={(e) => onFieldChange("shippingService", e.target.value)}>
                <option>Reguler</option>
                <option>Express</option>
                <option>Same Day</option>
                <option>Ekonomi</option>
                <option>Cargo</option>
                <option>Layanan Lain</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" type="date" value={shipDate} onChange={(e) => onFieldChange("shipDate", e.target.value)} />
              <select className="input-base" value={status} onChange={(e) => onFieldChange("status", e.target.value)}>
                <option>Lunas</option>
                <option>COD</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className="input-base" value={receiptNo} onChange={(e) => onFieldChange("receiptNo", e.target.value)} placeholder="Nomor resi" />
              <button onClick={() => onFieldChange("receiptNo", createReceiptNo())} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" type="button">
                Generate
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" type="number" min={1} value={packageQty} onChange={(e) => onFieldChange("packageQty", Math.max(1, Number(e.target.value) || 1))} placeholder="Jumlah koli" />
              <input className="input-base" type="number" min={0} value={itemWeightGr} onChange={(e) => onFieldChange("itemWeightGr", Math.max(0, Number(e.target.value) || 0))} placeholder="Berat barang (gram)" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" value={packageNote} onChange={(e) => onFieldChange("packageNote", e.target.value)} placeholder="Isi paket / catatan barang" />
              <input className="input-base" type="number" min={0} value={shippingCost} onChange={(e) => onFieldChange("shippingCost", Math.max(0, Number(e.target.value) || 0))} placeholder="Ongkir" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" checked={isFreeShipping} onChange={(e) => onFieldChange("isFreeShipping", e.target.checked)} />
                Gratis Ongkir (coret harga ongkir)
              </label>
              <select className="input-base" value={printMode} onChange={(e) => onFieldChange("printMode", e.target.value as PrintMode)}>
                <option value="AUTO">Auto (Ikuti Ukuran Kertas Printer)</option>
                <option value="LABEL_100X150">Label 10 x 15 cm (Umum Pengiriman)</option>
                <option value="LABEL_100X100">Label 10 x 10 cm</option>
                <option value="A4">Kertas A4</option>
                <option value="A4_COMPACT">A4 Full (Font Auto-Kecil)</option>
                <option value="THERMAL_80">Mode Thermal 80mm</option>
                <option value="THERMAL_58">Mode Thermal 58mm</option>
              </select>
            </div>
            <select className="input-base" value={receiptTemplate} onChange={(e) => onFieldChange("receiptTemplate", e.target.value as FormSnapshot["receiptTemplate"])}>
              <option value="UMKM_CLASSIC">Template Resi: UMKM Classic</option>
              <option value="MARKETPLACE">Template Resi: Marketplace (Shopee/Tokopedia Style)</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={showQr} onChange={(e) => onFieldChange("showQr", e.target.checked)} />
              Tampilkan Barcode resi
            </label>
          </motion.div>
        ) : null}

        {activeStep === 4 ? (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Detail Cargo</h3>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Tipe Cargo</span>
              <InfoTooltip text={CARGO_INFO_TEXT} />
            </div>
            <select className="input-base" value={cargoType} onChange={(e) => onFieldChange("cargoType", e.target.value as FormSnapshot["cargoType"])}>
              <option value="REGULER">REGULER</option>
              <option value="CARGO_KECIL">CARGO_KECIL (1-10kg)</option>
              <option value="CARGO_SEDANG">CARGO_SEDANG (10-50kg)</option>
              <option value="CARGO_BESAR">CARGO_BESAR (50-200kg)</option>
              <option value="CARGO_KHUSUS">CARGO_KHUSUS</option>
            </select>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Dimensi (cm)</span>
              <InfoTooltip text={CARGO_INFO_TEXT} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input className="input-base" type="number" min={0} value={dimensions.length} onChange={(e) => onDimensionChange("length", e.target.value)} placeholder="Panjang (cm)" />
              <input className="input-base" type="number" min={0} value={dimensions.width} onChange={(e) => onDimensionChange("width", e.target.value)} placeholder="Lebar (cm)" />
              <input className="input-base" type="number" min={0} value={dimensions.height} onChange={(e) => onDimensionChange("height", e.target.value)} placeholder="Tinggi (cm)" />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Nilai Asuransi</span>
              <InfoTooltip text={INSURANCE_INFO_TEXT} />
            </div>
            <input className="input-base" type="number" min={0} value={insuranceValue} onChange={(e) => onFieldChange("insuranceValue", Math.max(0, Number(e.target.value) || 0))} placeholder="Nilai asuransi (Rp)" />
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" checked={fragile} onChange={(e) => onFieldChange("fragile", e.target.checked)} />
                Fragile
                <InfoTooltip text={INSURANCE_INFO_TEXT} />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" checked={temperatureControlled} onChange={(e) => onFieldChange("temperatureControlled", e.target.checked)} />
                Temperature Controlled
                <InfoTooltip text={CARGO_INFO_TEXT} />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" checked={dangerousGoods} onChange={(e) => onFieldChange("dangerousGoods", e.target.checked)} />
                Dangerous Goods
                <InfoTooltip text={CARGO_INFO_TEXT} />
              </label>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm">
              <p className="font-semibold text-indigo-900">Hasil Perhitungan Cargo</p>
              <div className="mt-2 space-y-1 text-indigo-900">
                <p>Berat aktual: {formatWeight(itemWeightGr / 1000)}</p>
                <p>Berat volumetrik: {formatWeight(volumetricWeight)}</p>
                <p className="font-bold text-indigo-700">Berat tertagih: {formatWeight(chargeableWeight)}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={() => setActiveStep(Math.max(1, activeStep - 1))} disabled={activeStep === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
          Step Sebelumnya
        </button>
        <button type="button" onClick={() => setActiveStep(Math.min(4, activeStep + 1))} disabled={activeStep === 4} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
          Step Berikutnya
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <button onClick={onSaveToHistory} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700" type="button">
          Simpan ke Riwayat
        </button>
        <button onClick={onPrint} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500" type="button">
          PRINT
        </button>
        <button onClick={onDownloadPdf} disabled={isExporting} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60" type="button">
          {isExporting ? "Memproses PDF..." : "Download PDF"}
        </button>
        <button onClick={onCheckSinglePageFit} className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100" type="button">
          Cek Muat 1 Lembar
        </button>
        <button onClick={onResetData} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" type="button">
          Reset Data
        </button>
      </div>
      {fitCheckStatus !== "idle" ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            fitCheckStatus === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          {fitCheckMessage}
        </div>
      ) : null}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Riwayat Transaksi</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onExportCargoManifest} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100" type="button">
              Export Cargo CSV
            </button>
            <button onClick={onClearHistory} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100" type="button">
              Hapus Semua
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className="input-base" value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)} placeholder="Cari invoice, resi, pembeli, 30x30x30" />
          <select className="input-base" value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)}>
            <option>Semua</option>
            <option>Lunas</option>
            <option>COD</option>
          </select>
          <select className="input-base" value={historyCargoType} onChange={(e) => setHistoryCargoType(e.target.value)}>
            <option>Semua</option>
            <option>Reguler</option>
            <option>Cargo Kecil</option>
            <option>Cargo Sedang</option>
            <option>Cargo Besar</option>
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
                {entry.snapshot.cargoType !== "REGULER" ? (
                  <div className="mt-2">
                    <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      {cargoTypeLabels[entry.snapshot.cargoType]}
                    </span>
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => onLoadFromHistory(entry)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100" type="button">
                    Muat
                  </button>
                  <button onClick={() => onRunAfterLoad(entry, "print")} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500" type="button">
                    Cetak Ulang
                  </button>
                  <button onClick={() => onRunAfterLoad(entry, "pdf")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500" type="button">
                    PDF
                  </button>
                  <button onClick={() => onDeleteHistoryItem(entry.id)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50" type="button">
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.section>
  );
}
