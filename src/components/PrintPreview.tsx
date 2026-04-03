import { motion } from "framer-motion";
import Barcode from "react-barcode";
import type { FormSnapshot } from "../models/formSnapshot";
import { formatCurrency } from "../utils/format";
import { formatWeight } from "../utils/weight";

type PrintPreviewProps = {
  snapshot: FormSnapshot;
  issueDate: string;
  thermalWidthPx: string;
  isCargoShipment: boolean;
  isThermalMode: boolean;
  barcodePayload: string;
  cargoIdPayload: string;
  subtotal: number;
  cargoHandlingFee: number;
  grandTotal: number;
  chargeableWeight: number;
  volumetricWeight: number;
};

export function PrintPreview({
  snapshot,
  issueDate,
  thermalWidthPx,
  isCargoShipment,
  isThermalMode,
  barcodePayload,
  cargoIdPayload,
  subtotal,
  cargoHandlingFee,
  grandTotal,
  chargeableWeight,
  volumetricWeight,
}: PrintPreviewProps) {
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="space-y-4"
    >
      <div
        id="print-area"
        className={`print-area bg-white ${
          printMode === "A4" || printMode === "AUTO"
            ? isCargoShipment
              ? "mx-auto max-w-[380px]"
              : ""
            : `mx-auto ${thermalWidthPx}`
        }`}
      >
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
              <p className="text-sm">Tipe Cargo: {cargoType}</p>
              <p className="text-sm">Berat Barang: {itemWeightGr} gr</p>
              <p className="text-sm">
                Dimensi (cm): {dimensions.length} x {dimensions.width} x {dimensions.height}
              </p>
              <p className="text-sm">Berat Volumetrik: {formatWeight(volumetricWeight)}</p>
              <p className="text-sm font-semibold">Berat Kena Hitung: {formatWeight(chargeableWeight)}</p>
              <p className="text-sm">Asuransi: {formatCurrency(insuranceValue)}</p>
              <p className="text-sm">
                Handling: {[fragile ? "Fragile" : null, temperatureControlled ? "Suhu Terkontrol" : null, dangerousGoods ? "Dangerous Goods" : null]
                  .filter(Boolean)
                  .join(", ") || "Standar"}
              </p>
              <p className="text-sm">Isi Paket: {packageNote || "-"}</p>
              <p className="text-sm">Status: {status}</p>
            </div>
          </div>

          {isCargoShipment ? (
            <div className={`mb-4 border border-dashed border-amber-500 bg-amber-50 p-3 sm:p-4 ${isThermalMode ? "text-[10px]" : "text-sm"}`}>
              <div className="flex items-center gap-2 border-b border-amber-300 pb-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">!</span>
                <p className="font-bold tracking-wide text-amber-900">CARGO LABEL</p>
              </div>
              <div className="mt-3 grid gap-2 text-amber-900 sm:grid-cols-2">
                <p>
                  Jenis Cargo: <span className="font-semibold">{cargoType}</span>
                </p>
                <p>
                  Berat Tertagih: <span className="font-semibold">{formatWeight(chargeableWeight)}</span>
                </p>
                <p>
                  Dimensi (P x L x T): <span className="font-semibold">{dimensions.length} x {dimensions.width} x {dimensions.height} cm</span>
                </p>
                <p>
                  Status: <span className="font-semibold">{status}</span>
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {fragile ? <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">FRAGILE - HANDLE WITH CARE</span> : null}
                {temperatureControlled ? <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">TEMPERATURE CONTROLLED</span> : null}
                {dangerousGoods ? <span className="rounded-full bg-red-900 px-3 py-1 text-xs font-semibold text-white">DANGEROUS GOODS</span> : null}
              </div>
              <div className="mt-3 border-t border-amber-300 pt-3">
                <p className="mb-1 font-semibold text-amber-900">Cargo ID: {cargoIdPayload}</p>
                <Barcode value={cargoIdPayload} format="CODE128" width={1.2} height={40} margin={0} fontSize={10} background="#fffef7" />
              </div>
            </div>
          ) : null}

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
            {isCargoShipment ? (
              <div className="flex justify-between">
                <span>Berat Tertagih</span>
                <span>{formatWeight(chargeableWeight)}</span>
              </div>
            ) : null}
            {insuranceValue > 0 ? (
              <div className="flex justify-between">
                <span>Nilai Asuransi</span>
                <span>{formatCurrency(insuranceValue)}</span>
              </div>
            ) : null}
            {cargoHandlingFee > 0 ? (
              <div className="flex justify-between">
                <span>Biaya Handling Cargo</span>
                <span>{formatCurrency(cargoHandlingFee)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-semibold">
              <span>Grand Total</span>
              <span style={{ color: primaryColor }}>{formatCurrency(grandTotal)}</span>
            </div>
            {isCargoShipment ? <p className="pt-1 text-xs text-slate-500">*Biaya cargo dihitung berdasarkan berat tertagih</p> : null}
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
              <p className="text-sm">Tipe Cargo: {cargoType}</p>
              <p className="text-sm">Berat: {itemWeightGr} gr</p>
              <p className="text-sm">
                Dimensi: {dimensions.length} x {dimensions.width} x {dimensions.height} cm
              </p>
              <p className="text-sm">Kena Hitung: {formatWeight(chargeableWeight)}</p>
              <p className="text-sm">Asuransi: {formatCurrency(insuranceValue)}</p>
              <p className="text-sm">Tanggal: {shipDate || "-"}</p>
              <p className="text-sm">Status: {status}</p>
            </div>
            {showQr ? <Barcode value={barcodePayload} format="CODE128" width={1.4} height={44} margin={0} fontSize={11} background="#ffffff" /> : null}
          </div>
          {isCargoShipment ? (
            <div className="mt-3 border-t border-slate-300 pt-3">
              <p className={`${isThermalMode ? "text-[10px]" : "text-xs"} uppercase tracking-[0.14em] text-slate-500`}>Cargo ID</p>
              <p className={`${isThermalMode ? "text-[10px]" : "text-sm"} mb-1 font-semibold text-slate-700`}>{cargoIdPayload}</p>
              <Barcode value={cargoIdPayload} format="CODE128" width={1.2} height={40} margin={0} fontSize={10} background="#ffffff" />
            </div>
          ) : null}
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
    </motion.section>
  );
}
