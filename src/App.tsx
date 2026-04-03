import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  CARGO_TYPE_LABELS,
  STEP_ITEMS,
  getThermalWidth,
} from "./constants/appConfig";
import { DigitalProductInfo } from "./components/DigitalProductInfo";
import { InputPanel } from "./components/InputPanel";
import { PrintPreview } from "./components/PrintPreview";
import {
  type BrandingTemplate,
  type Dimensions,
  type FormSnapshot,
  type OrderItem,
  type PrintMode,
  TEMPLATE_COLOR,
  getDefaultSnapshot,
  normalizeSnapshot,
} from "./models/formSnapshot";
import type { TransactionRecord } from "./types/transaction";
import { validateCargo } from "./utils/cargoValidation";
import {
  applyPrintPageSize,
  checkPrintFitsSinglePage,
  syncPrintScale,
} from "./utils/print";
import {
  loadInitialHistory,
  loadInitialSnapshot,
  persistHistory,
  persistSnapshot,
} from "./utils/storage";
import { calculateVolumetricWeight, getChargeableWeight } from "./utils/weight";

export default function App() {
  const [snapshot, setSnapshot] = useState<FormSnapshot>(getDefaultSnapshot);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatus, setHistoryStatus] = useState("Semua");
  const [historyCargoType, setHistoryCargoType] = useState("Semua");
  const [isExporting, setIsExporting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [fitCheckStatus, setFitCheckStatus] = useState<"idle" | "ok" | "warn">("idle");
  const [fitCheckMessage, setFitCheckMessage] = useState("");

  useEffect(() => {
    setSnapshot(loadInitialSnapshot());
    setHistory(loadInitialHistory());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    persistSnapshot(snapshot);
  }, [isHydrated, snapshot]);

  useEffect(() => {
    if (!isHydrated) return;
    persistHistory(history);
  }, [history, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const raf = window.requestAnimationFrame(() => {
      syncPrintScale(snapshot.printMode, snapshot.cargoType !== "REGULER");
    });
    return () => window.cancelAnimationFrame(raf);
  }, [
    isHydrated,
    snapshot.printMode,
    snapshot.cargoType,
    snapshot.items,
    snapshot.itemWeightGr,
    snapshot.dimensions.length,
    snapshot.dimensions.width,
    snapshot.dimensions.height,
    snapshot.packageNote,
    snapshot.buyerAddress,
    snapshot.storeAddress,
  ]);

  useEffect(() => {
    setFitCheckStatus("idle");
    setFitCheckMessage("");
  }, [snapshot]);

  const {
    items,
    itemWeightGr,
    shippingCost,
    isFreeShipping,
    receiptNo,
    invoiceNo,
    printMode,
    cargoType,
    dimensions,
  } = snapshot;

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.qty * item.price, 0), [items]);
  const effectiveShippingCost = isFreeShipping ? 0 : shippingCost;
  const volumetricWeight = useMemo(
    () => calculateVolumetricWeight(dimensions.length, dimensions.width, dimensions.height),
    [dimensions.length, dimensions.width, dimensions.height],
  );
  const chargeableWeight = useMemo(
    () => getChargeableWeight(itemWeightGr, dimensions),
    [itemWeightGr, dimensions],
  );
  const isCargoShipment = cargoType !== "REGULER";
  const isThermalMode = printMode === "THERMAL_80" || printMode === "THERMAL_58";
  const cargoHandlingFee = useMemo(() => {
    if (!isCargoShipment || chargeableWeight <= 50) return 0;
    return Math.ceil((chargeableWeight - 50) * 500);
  }, [chargeableWeight, isCargoShipment]);
  const grandTotal = subtotal + effectiveShippingCost + cargoHandlingFee;
  const barcodePayload = useMemo(() => receiptNo || "-", [receiptNo]);
  const cargoIdPayload = useMemo(() => {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `CGO-${invoiceNo}-${rand}`;
  }, [invoiceNo]);

  const filteredHistory = useMemo(() => {
    const keyword = historyQuery.trim().toLowerCase();
    return history.filter((entry) => {
      const isStatusMatch = historyStatus === "Semua" || entry.snapshot.status === historyStatus;
      const dimensionText = `${entry.snapshot.dimensions.length}x${entry.snapshot.dimensions.width}x${entry.snapshot.dimensions.height}`;
      const searchable = `${entry.snapshot.invoiceNo} ${entry.snapshot.receiptNo} ${entry.snapshot.buyerName} ${entry.snapshot.storeName} ${dimensionText}`.toLowerCase();
      const isKeywordMatch = keyword ? searchable.includes(keyword) : true;
      const isCargoTypeMatch =
        historyCargoType === "Semua" ||
        (historyCargoType === "Reguler" && entry.snapshot.cargoType === "REGULER") ||
        (historyCargoType === "Cargo Kecil" && entry.snapshot.cargoType === "CARGO_KECIL") ||
        (historyCargoType === "Cargo Sedang" && entry.snapshot.cargoType === "CARGO_SEDANG") ||
        (historyCargoType === "Cargo Besar" && entry.snapshot.cargoType === "CARGO_BESAR");
      return isStatusMatch && isKeywordMatch && isCargoTypeMatch;
    });
  }, [history, historyCargoType, historyQuery, historyStatus]);

  const thermalWidthPx =
    printMode === "THERMAL_58"
      ? "max-w-[235px]"
      : printMode === "THERMAL_80"
        ? "max-w-[324px]"
        : printMode === "LABEL_100X100"
          ? "max-w-[380px]"
          : "max-w-[420px]";

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

  const updateDimension = (key: keyof Dimensions, value: string) => {
    setSnapshot((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [key]: Math.max(0, Number(value) || 0),
      },
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

  const handlePrint = (mode: PrintMode = printMode) => {
    syncPrintScale(mode, isCargoShipment);
    applyPrintPageSize(mode, isCargoShipment);
    window.print();
  };

  const handleCheckSinglePageFit = () => {
    syncPrintScale(printMode, isCargoShipment);
    const result = checkPrintFitsSinglePage(printMode, isCargoShipment);
    if (!result) {
      setFitCheckStatus("warn");
      setFitCheckMessage("Gagal membaca area print. Coba lagi setelah preview tampil.");
      return;
    }

    if (result.fits) {
      setFitCheckStatus("ok");
      setFitCheckMessage(`Tampilan muat 1 lembar. Skala otomatis: ${Math.round(result.scale * 100)}%.`);
      return;
    }

    setFitCheckStatus("warn");
    setFitCheckMessage(
      `Konten terlalu panjang untuk 1 lembar (butuh skala ${Math.round(result.scale * 100)}%). Coba mode "A4 Full (Font Auto-Kecil)" atau ringkas catatan/alamat.`,
    );
  };

  const handleDownloadPdf = async (options?: {
    mode?: PrintMode;
    invoice?: string;
    receipt?: string;
    cargoType?: FormSnapshot["cargoType"];
  }) => {
    const target = document.getElementById("print-area");
    if (!target) return;

    const activeMode = options?.mode ?? printMode;
    const activeInvoice = options?.invoice ?? invoiceNo;
    const activeReceipt = options?.receipt ?? receiptNo;
    const activeCargoType = options?.cargoType ?? cargoType;
    const isCargoPdf = activeCargoType !== "REGULER";
    const pdfFileName = isCargoPdf
      ? `${activeInvoice}-${activeCargoType}-${activeReceipt}.pdf`
      : `${activeInvoice}-${activeReceipt}.pdf`;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      if (activeMode === "THERMAL_58" || activeMode === "THERMAL_80") {
        const widthMm = getThermalWidth(activeMode);
        const heightMm = (canvas.height * widthMm) / canvas.width + 8;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [widthMm, heightMm] });
        if (isCargoPdf) {
          pdf.setProperties({
            author: "UMKM Cargo System",
            subject: "Cargo Shipping Label",
            keywords: "cargo,logistics,umkm",
          });
        }
        pdf.addImage(imgData, "PNG", 2, 2, widthMm - 4, heightMm - 4);
        pdf.save(pdfFileName);
      } else {
        const isAuto = activeMode === "AUTO";
        const isA4 = activeMode === "A4" || activeMode === "A4_COMPACT" || isAuto;
        const pageFormat = isA4 ? "a4" : activeMode === "LABEL_100X100" ? [100, 100] : [100, 150];
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: pageFormat,
        });
        if (isCargoPdf) {
          pdf.setProperties({
            author: "UMKM Cargo System",
            subject: "Cargo Shipping Label",
            keywords: "cargo,logistics,umkm",
          });
        }
        const maxWidth = isA4 ? 194 : 92;
        const maxHeight = isA4 ? 277 : activeMode === "LABEL_100X100" ? 92 : 142;
        const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        const width = canvas.width * ratio;
        const height = canvas.height * ratio;
        const pageWidth = isA4 ? 210 : 100;
        const topPadding = isA4 ? 10 : 4;
        const x = (pageWidth - width) / 2;
        pdf.addImage(imgData, "PNG", x, topPadding, width, height);
        pdf.save(pdfFileName);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportCargoManifest = () => {
    const cargoEntries = history.filter((entry) => entry.snapshot.cargoType !== "REGULER");
    if (cargoEntries.length === 0) {
      window.alert("Belum ada transaksi cargo di riwayat.");
      return;
    }

    const csvHeader = ["invoiceNo", "cargoType", "chargeableWeight", "dimensions", "courier", "status"];
    const csvRows = cargoEntries.map((entry) => {
      const weight = getChargeableWeight(entry.snapshot.itemWeightGr, entry.snapshot.dimensions);
      const dimensionsText = `${entry.snapshot.dimensions.length}x${entry.snapshot.dimensions.width}x${entry.snapshot.dimensions.height}`;
      return [
        entry.snapshot.invoiceNo,
        entry.snapshot.cargoType,
        weight.toFixed(2),
        dimensionsText,
        entry.snapshot.courier,
        entry.snapshot.status,
      ];
    });

    const escapeCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = [csvHeader, ...csvRows]
      .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cargo-manifest.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
    setSnapshot(getDefaultSnapshot());
  };

  const saveToHistory = () => {
    const cargoIssues = validateCargo(snapshot);
    if (cargoIssues.length > 0) {
      window.alert(`Data cargo belum valid:\n- ${cargoIssues.join("\n- ")}`);
      return;
    }

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
        cargoType: record.snapshot.cargoType,
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
        <InputPanel
          snapshot={snapshot}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          isCargoShipment={isCargoShipment}
          volumetricWeight={volumetricWeight}
          chargeableWeight={chargeableWeight}
          stepItems={STEP_ITEMS}
          isExporting={isExporting}
          historyQuery={historyQuery}
          setHistoryQuery={setHistoryQuery}
          historyStatus={historyStatus}
          setHistoryStatus={setHistoryStatus}
          historyCargoType={historyCargoType}
          setHistoryCargoType={setHistoryCargoType}
          filteredHistory={filteredHistory}
          cargoTypeLabels={CARGO_TYPE_LABELS}
          onFieldChange={updateField}
          onItemChange={updateItem}
          onDimensionChange={updateDimension}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onApplyTemplate={applyTemplate}
          onLogoUpload={handleLogoUpload}
          onSaveToHistory={saveToHistory}
          onPrint={() => handlePrint()}
          onDownloadPdf={() => handleDownloadPdf()}
          onCheckSinglePageFit={handleCheckSinglePageFit}
          fitCheckMessage={fitCheckMessage}
          fitCheckStatus={fitCheckStatus}
          onResetData={resetData}
          onExportCargoManifest={exportCargoManifest}
          onClearHistory={clearHistory}
          onLoadFromHistory={loadFromHistory}
          onRunAfterLoad={runAfterLoad}
          onDeleteHistoryItem={deleteHistoryItem}
        />

        <div className="space-y-4">
          <PrintPreview
            snapshot={snapshot}
            issueDate={issueDate}
            thermalWidthPx={thermalWidthPx}
            isCargoShipment={isCargoShipment}
            isThermalMode={isThermalMode}
            barcodePayload={barcodePayload}
            cargoIdPayload={cargoIdPayload}
            subtotal={subtotal}
            cargoHandlingFee={cargoHandlingFee}
            grandTotal={grandTotal}
            chargeableWeight={chargeableWeight}
            volumetricWeight={volumetricWeight}
          />
          <DigitalProductInfo />
        </div>
      </div>
    </main>
  );
}
