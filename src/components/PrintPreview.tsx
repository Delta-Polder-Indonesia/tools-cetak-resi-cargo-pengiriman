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

const FragileStamp = () => (
  <div className="relative overflow-hidden border-2 border-red-600 bg-red-600 text-white">
    <div className="flex">
      <div className="flex w-1/3 flex-col items-center justify-center border-r-2 border-white p-3">
        <svg viewBox="0 0 100 140" className="h-20 w-16 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 20 L30 60 Q30 80 50 90 L50 120 L35 120 L35 130 L65 130 L65 120 L50 120 L50 90 Q70 80 70 60 L70 20 Z" />
          <path d="M50 25 L45 40 L55 50 L48 65" stroke="red" strokeWidth="3" fill="none" />
          <path d="M48 65 L52 75 L45 85" stroke="red" strokeWidth="2" fill="none" />
        </svg>
        <p className="mt-2 text-center text-xs font-black leading-tight">
          FRAGILE
          <br />
          DO NOT DROP
        </p>
      </div>

      <div className="w-2/3 p-2">
        <div className="mb-2 border-b-2 border-white pb-2 text-center">
          <p className="text-xl font-black tracking-wider">HATI-HATI</p>
          <p className="text-lg font-black">MUDAH PECAH</p>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <div className="flex flex-col items-center justify-center border border-white p-1">
            <svg viewBox="0 0 40 50" className="h-8 w-6 fill-white">
              <path d="M20 5 L10 20 L16 20 L16 45 L24 45 L24 20 L30 20 Z" />
            </svg>
            <p className="mt-1 text-[8px] font-bold">THIS WAY UP</p>
          </div>

          <div className="flex flex-col items-center justify-center border border-white p-1">
            <svg viewBox="0 0 50 40" className="h-8 w-8 fill-white">
              <path d="M25 5 Q15 5 15 15 L15 25 Q15 30 20 30 L20 35 L30 35 L30 30 Q35 30 35 25 L35 15 Q35 5 25 5 Z" />
              <path d="M10 20 Q5 20 5 25 L5 30 Q5 35 10 35 L15 35 L15 30 L12 30 Q8 30 8 25 L8 22 Q8 20 10 20 Z" />
              <path d="M40 20 Q45 20 45 25 L45 30 Q45 35 40 35 L35 35 L35 30 L38 30 Q42 30 42 25 L42 22 Q42 20 40 20 Z" />
            </svg>
            <p className="mt-1 text-[8px] font-bold">HANDLE WITH CARE</p>
          </div>

          <div className="flex flex-col items-center justify-center border border-white p-1">
            <svg viewBox="0 0 50 40" className="h-8 w-8 fill-white">
              <path d="M25 5 Q5 15 5 25 L8 25 Q8 18 25 12 Q42 18 42 25 L45 25 Q45 15 25 5 Z" />
              <path d="M25 12 L25 35" stroke="white" strokeWidth="2" />
              <path d="M20 38 Q25 42 30 38" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="15" cy="8" r="1.5" fill="white" />
              <circle cx="35" cy="10" r="1.5" fill="white" />
              <circle cx="10" cy="15" r="1" fill="white" />
            </svg>
            <p className="mt-1 text-[8px] font-bold">KEEP DRY</p>
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className="text-sm font-black tracking-wider">HANDLE WITH CARE</p>
        </div>
      </div>
    </div>
  </div>
);

const TemperatureStamp = () => (
  <div className="relative overflow-hidden border-2 border-blue-600 bg-blue-600 text-white">
    <div className="flex">
      <div className="flex w-1/3 flex-col items-center justify-center border-r-2 border-white p-3">
        <p className="text-3xl font-black">COLD</p>
        <p className="mt-2 text-center text-xs font-black">KEEP COOL</p>
      </div>
      <div className="w-2/3 p-3">
        <div className="text-center">
          <p className="text-lg font-black">SUHU TERKONTROL</p>
          <p className="text-sm font-bold">TEMPERATURE CONTROLLED</p>
        </div>
        <div className="mt-2 border-t border-white pt-2 text-center">
          <p className="text-xs">Jangan dibekukan / Do not freeze</p>
          <p className="text-xs">Suhu: 2C - 8C</p>
        </div>
      </div>
    </div>
  </div>
);

const DangerousStamp = () => (
  <div className="relative overflow-hidden border-2 border-red-800 bg-red-800 text-white">
    <div className="flex">
      <div className="flex w-1/3 flex-col items-center justify-center border-r-2 border-white p-3">
        <p className="text-3xl font-black">HAZ</p>
        <p className="mt-2 text-center text-xs font-black">DANGEROUS</p>
      </div>
      <div className="w-2/3 p-3">
        <div className="text-center">
          <p className="text-lg font-black">BAHAN BERBAHAYA</p>
          <p className="text-sm font-bold">DANGEROUS GOODS</p>
        </div>
        <div className="mt-2 border-t border-white pt-2 text-center">
          <p className="text-xs font-bold">HANDLE WITH EXTREME CARE</p>
          <p className="text-xs">Follow safety protocols</p>
        </div>
      </div>
    </div>
  </div>
);

const formatAddressLines = (address: string, city: string, postalCode: string, maxLength: number = 45): string[] => {
  const fullAddress = `${address}${city ? `, ${city}` : ""}${postalCode ? `, ${postalCode}` : ""}`;
  const lines: string[] = [];
  let currentLine = "";

  const words = fullAddress.split(" ");
  for (const word of words) {
    if ((currentLine + word).length > maxLength) {
      if (currentLine) {
        lines.push(currentLine.trim());
      }
      currentLine = `${word} `;
    } else {
      currentLine += `${word} `;
    }
  }

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines.slice(0, 4);
};

const formatProductSummary = (items: Array<{ qty: number; name: string }>, maxLength: number = 50): string => {
  const summary = items.map((item) => `${item.qty}x ${item.name}`).join(", ");
  return summary.substring(0, maxLength) || "-";
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
    receiptTemplate,
    primaryColor,
    cargoType,
    dimensions,
    insuranceValue,
    fragile,
    temperatureControlled,
    dangerousGoods,
  } = snapshot;

  const senderLines = formatAddressLines(storeAddress, storeCity, storePostalCode);
  const receiverLines = formatAddressLines(buyerAddress, buyerCity, buyerPostalCode);
  const productSummary = formatProductSummary(items);
  const isCod = status === "COD";
  const codAmount = isCod ? grandTotal : 0;
  const hasHandlingLabels = fragile || temperatureControlled || dangerousGoods;
  const isA4Layout = printMode === "A4" || printMode === "A4_COMPACT" || printMode === "AUTO";
  const isCompactA4 = printMode === "A4_COMPACT";
  const isSquareLabel = printMode === "LABEL_100X100";
  const isMarketplaceTemplate = receiptTemplate === "MARKETPLACE";
  const useMarketplaceMmLayout = isMarketplaceTemplate && !isThermalMode;
  const rowHeights = useMarketplaceMmLayout
    ? {
        header: "min-h-[12mm]",
        barcode: "min-h-[22mm]",
        payment: "min-h-[14mm]",
        invoice: "min-h-[7mm]",
        insurance: "min-h-[8mm]",
        qty: "min-h-[7mm]",
        priceTable: "min-h-[24mm]",
        address: "min-h-[50mm]",
        note: "min-h-[10mm]",
        shipInfo: "min-h-[8mm]",
        total: "min-h-[16mm]",
        legal: "min-h-[7mm]",
      }
    : {
        header: "min-h-[14mm]",
        barcode: "min-h-[24mm]",
        payment: "min-h-[13mm]",
        invoice: "min-h-[8mm]",
        insurance: "min-h-[8mm]",
        qty: "min-h-[8mm]",
        priceTable: "min-h-[24mm]",
        address: "min-h-[42mm]",
        note: "min-h-[10mm]",
        shipInfo: "min-h-[8mm]",
        total: "min-h-[13mm]",
        legal: "min-h-[7mm]",
      };
  const receiptSizeStyle = isThermalMode
    ? undefined
    : isA4Layout
      ? {
          width: "100%",
          minHeight: "277mm",
        }
      : {
          width: "100mm",
          minHeight: isSquareLabel ? "100mm" : "150mm",
        };
  const sectionPad = isThermalMode ? "p-1.5" : isCompactA4 ? "p-2" : isA4Layout ? "p-3" : "p-2";
  const serviceCode = (shippingService || "REG").slice(0, 3).toUpperCase();
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  const renderLogo = (size: "small" | "large" = "small") => {
    const sizeClasses = size === "small" ? "h-8 w-8" : "h-12 w-12 rounded-md object-cover";

    if (logoDataUrl) {
      return <img src={logoDataUrl} alt="Logo" className={sizeClasses} crossOrigin="anonymous" />;
    }

    return (
      <div
        className={`flex ${size === "small" ? "h-8 w-8" : "h-12 w-12"} items-center justify-center rounded text-xs font-bold text-white`}
        style={{ backgroundColor: primaryColor }}
      >
        {storeName?.substring(0, 2).toUpperCase() || "UM"}
      </div>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="w-full max-w-full space-y-4"
    >
      <div
        id="print-area"
        className={`print-area break-words bg-white ${isCompactA4 ? "a4-compact" : ""} ${isA4Layout ? "mx-auto w-full max-w-[794px]" : printMode === "LABEL_100X150" || printMode === "LABEL_100X100" ? "mx-auto max-w-[420px]" : `mx-auto ${thermalWidthPx}`}`}
      >
        <div
          className={`border-2 border-black bg-white p-0 font-sans text-black ${isThermalMode ? "text-[10px]" : "text-xs"} ${isMarketplaceTemplate ? "receipt-marketplace" : ""}`}
          style={receiptSizeStyle}
        >
          <div className={`flex ${rowHeights.header} items-center justify-between border-b-2 border-black ${sectionPad}`}>
            <div className="flex items-center gap-2">
              {renderLogo("small")}
              <span className="text-xs font-bold">{storeName || "UMKM"}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-black tracking-tight" style={{ color: primaryColor }}>
                {courier}
              </p>
              <p className="text-[10px] font-semibold">{shippingService}</p>
            </div>
          </div>

          <div className={`${rowHeights.barcode} border-b-2 border-black ${sectionPad} text-center`}>
            {showQr ? (
              <>
                <div className="flex w-full justify-center overflow-hidden">
                  <Barcode
                    value={barcodePayload}
                    format="CODE128"
                    width={isThermalMode ? 1 : isMarketplaceTemplate ? 1.45 : 1.35}
                    height={isThermalMode ? 40 : isMarketplaceTemplate ? 55 : 52}
                    margin={0}
                    fontSize={12}
                    background="#ffffff"
                    lineColor="#000000"
                  />
                </div>
                <p className="mt-1 text-center text-sm font-bold tracking-wider">RESI : {receiptNo}</p>
              </>
            ) : (
              <p className="py-2 text-center text-sm font-bold">NO. RESI: {receiptNo}</p>
            )}
          </div>

          {isCod ? (
            <div className={`${rowHeights.payment} border-b-2 border-black bg-black py-2 text-center text-white`}>
              <p className="text-xs font-semibold uppercase tracking-wider">COD (Cash On Delivery)</p>
              <p className="text-2xl font-black tracking-tight">{formatCurrency(codAmount)}</p>
            </div>
          ) : (
            <div className={`${rowHeights.payment} border-b-2 border-black py-2 text-center`}>
              <p className="text-lg font-black text-emerald-600">LUNAS</p>
            </div>
          )}

          <div className={`${rowHeights.invoice} border-b-2 border-black ${sectionPad} text-center text-sm font-bold`}>
            {invoiceNo} | Layanan: {serviceCode}
          </div>

          <div className={`grid ${rowHeights.insurance} grid-cols-2 border-b-2 border-black text-xs`}>
            <div className={`border-r-2 border-black ${sectionPad}`}>
              <span className="font-semibold">Asuransi:</span> {formatCurrency(insuranceValue)}
            </div>
            <div className={`${sectionPad} text-right`}>
              <span className="font-semibold">Berat:</span> {itemWeightGr} gr
            </div>
          </div>

          <div className={`${rowHeights.qty} border-b-2 border-black ${sectionPad} text-xs`}>
            <span className="font-bold">Qty: {packageQty}</span> | {productSummary}
          </div>

          <div className={`${rowHeights.priceTable} border-b-2 border-black ${sectionPad}`}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide">Detail Harga Produk</p>
            <div className={`overflow-hidden ${isMarketplaceTemplate ? "border border-slate-300" : "border-y border-slate-300"}`}>
              <table className={`w-full border-collapse ${isMarketplaceTemplate ? "marketplace-price-table text-[11px]" : "text-[11px]"}`}>
                <thead>
                  <tr className={`text-left ${isMarketplaceTemplate ? "bg-slate-50" : ""}`}>
                    <th className="border-b border-slate-300 px-2 py-1 font-bold">Produk</th>
                    <th className="border-b border-slate-300 px-2 py-1 text-center font-bold">Qty</th>
                    <th className="border-b border-slate-300 px-2 py-1 text-right font-bold">Harga</th>
                    <th className="border-b border-slate-300 px-2 py-1 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`price-${item.id}`} className={isMarketplaceTemplate ? "odd:bg-white even:bg-slate-50/40" : ""}>
                      <td className="border-b border-slate-200 px-2 py-1">{item.name || `Produk ${index + 1}`}</td>
                      <td className="border-b border-slate-200 px-2 py-1 text-center">{item.qty}</td>
                      <td className="border-b border-slate-200 px-2 py-1 text-right">{formatCurrency(item.price)}</td>
                      <td className="border-b border-slate-200 px-2 py-1 text-right">{formatCurrency(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[10px] text-slate-600">Total item: {totalQty} pcs</p>
          </div>

          <div className={`grid ${rowHeights.address} grid-cols-2 border-b-2 border-black text-xs`}>
            <div className={`border-r-2 border-black ${sectionPad}`}>
              <p className="mb-1 font-bold underline">Penerima:</p>
              <p className="font-bold">{buyerName || "-"}</p>
              {receiverLines.map((line, index) => (
                <p key={`recv-${index}`} className="leading-tight">
                  {line}
                </p>
              ))}
              <p className="mt-1 font-semibold">Telp: {buyerPhone || "-"}</p>
            </div>

            <div className={sectionPad}>
              <p className="mb-1 font-bold underline">Pengirim:</p>
              <p className="font-bold">{storeName || "-"}</p>
              {senderLines.map((line, index) => (
                <p key={`send-${index}`} className="leading-tight">
                  {line}
                </p>
              ))}
              <p className="mt-1 font-semibold">Telp: {storePhone || "-"}</p>
            </div>
          </div>

          <div className={`${rowHeights.note} border-b-2 border-black ${sectionPad} text-xs`}>
            <p className="font-semibold">Catatan:</p>
            <p className="leading-tight">{packageNote || "-"}</p>
          </div>

          {hasHandlingLabels ? (
            <div className={`space-y-2 border-b-2 border-black ${sectionPad}`}>
              {fragile ? <FragileStamp /> : null}
              {temperatureControlled ? <TemperatureStamp /> : null}
              {dangerousGoods ? <DangerousStamp /> : null}
            </div>
          ) : null}

          {isCargoShipment ? (
            <div className={`border-b-2 border-dashed border-amber-500 bg-amber-50 ${sectionPad} text-xs ${isThermalMode ? "text-[10px]" : ""}`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">!</span>
                <p className="font-bold text-amber-800">CARGO LABEL</p>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-amber-900">
                <p>Jenis Cargo: <span className="font-semibold">{cargoType}</span></p>
                <p>Berat Tertagih: <span className="font-semibold">{formatWeight(chargeableWeight)}</span></p>
                <p>Dimensi: <span className="font-semibold">{dimensions.length}x{dimensions.width}x{dimensions.height} cm</span></p>
                <p>Status: <span className="font-semibold">{status}</span></p>
              </div>
              <p className="mt-1 text-[10px] text-amber-700">Volumetrik: {formatWeight(volumetricWeight)}</p>
              {cargoIdPayload ? (
                <div className="mt-1 flex w-full justify-center overflow-hidden">
                  <Barcode
                    value={cargoIdPayload}
                    format="CODE128"
                    width={1.2}
                    height={25}
                    margin={0}
                    fontSize={8}
                    background="#fffbeb"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={`${rowHeights.shipInfo} border-b-2 border-black ${sectionPad} text-[10px]`}>
            <div className="flex items-center justify-between">
              <p>Tanggal: {shipDate || issueDate}</p>
              <p>Status: {status}</p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p>Koli: {packageQty}</p>
              <p>Penanggung Jawab: {sellerSigner || "Pemilik"}</p>
            </div>
          </div>

          <div className={`${rowHeights.total} border-b-2 border-black ${sectionPad} text-[11px]`}>
            <div className={`ml-auto w-full ${isMarketplaceTemplate ? "max-w-[360px]" : "max-w-[320px]"} space-y-1`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
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
              {isCargoShipment && cargoHandlingFee > 0 ? (
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span>Handling Cargo</span>
                  <span>{formatCurrency(cargoHandlingFee)}</span>
                </div>
              ) : null}
              <div className={`flex items-center justify-between pt-1 leading-tight ${isMarketplaceTemplate ? "text-2xl" : "text-xl"} font-bold`}>
                <span className="text-slate-900">Grand Total</span>
                <span className="text-blue-700">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className={`${rowHeights.legal} bg-gray-100 p-2 text-center text-[10px] italic`}>
            *Pengirim wajib meminta bukti serah terima paket ke kurir.
          </div>
        </div>
      </div>
    </motion.section>
  );
}