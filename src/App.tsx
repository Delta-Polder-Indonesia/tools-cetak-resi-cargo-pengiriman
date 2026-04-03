import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  createCargoId,
  getDefaultSnapshot,
  normalizeSnapshot,
} from "./models/formSnapshot";
import type { TransactionRecord } from "./types/transaction";
import { validateCargo } from "./utils/cargoValidation";
import { applyPrintPageSize, syncPrintScale } from "./utils/print";
import {
  loadInitialHistory,
  loadInitialSnapshot,
  persistHistory,
  persistSnapshot,
} from "./utils/storage";
import { calculateVolumetricWeight, getChargeableWeight } from "./utils/weight";

export default function App() {
  // ============================================================================
  // STATE & REFS
  // ============================================================================
  const [snapshot, setSnapshot] = useState<FormSnapshot>(getDefaultSnapshot);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatus, setHistoryStatus] = useState("Semua");
  const [historyCargoType, setHistoryCargoType] = useState("Semua");
  const [isExporting, setIsExporting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ref untuk tracking apakah cargoId sudah di-generate untuk invoice ini
  const cargoIdMapRef = useRef<Map<string, string>>(new Map());

  // ============================================================================
  // EFFECTS (LIFECYCLE & PERSISTENCE)
  // ============================================================================
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

  // Effect untuk sync print scale - dengan dependencies yang lengkap
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
    snapshot.items.length,
    snapshot.items.map((i) => `${i.name}-${i.qty}-${i.price}`).join(","),
    snapshot.itemWeightGr,
    snapshot.dimensions.length,
    snapshot.dimensions.width,
    snapshot.dimensions.height,
    snapshot.packageNote,
    snapshot.buyerAddress,
    snapshot.storeAddress,
    snapshot.showQr,
    snapshot.isCargoShipment,
  ]);

  // ============================================================================
  // COMPUTED VALUES (MEMOIZATION)
  // ============================================================================
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

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.price, 0),
    [items]
  );
  const effectiveShippingCost = isFreeShipping ? 0 : shippingCost;
  const volumetricWeight = useMemo(
    () => calculateVolumetricWeight(dimensions.length, dimensions.width, dimensions.height),
    [dimensions.length, dimensions.width, dimensions.height]
  );
  const chargeableWeight = useMemo(
    () => getChargeableWeight(itemWeightGr, dimensions),
    [itemWeightGr, dimensions]
  );
  const isCargoShipment = cargoType !== "REGULER";
  const isThermalMode = printMode === "THERMAL_80" || printMode === "THERMAL_58";
  
  const cargoHandlingFee = useMemo(() => {
    if (!isCargoShipment || chargeableWeight <= 50) return 0;
    return Math.ceil((chargeableWeight - 50) * 500);
  }, [chargeableWeight, isCargoShipment]);
  
  const grandTotal = subtotal + effectiveShippingCost + cargoHandlingFee;
  const barcodePayload = useMemo(() => receiptNo || "-", [receiptNo]);

  // Cargo ID yang persist per invoice menggunakan Map
  const cargoIdPayload = useMemo(() => {
    if (!isCargoShipment) return "";

    const existingId = cargoIdMapRef.current.get(invoiceNo);
    if (existingId) return existingId;

    const newId = createCargoId(invoiceNo);
    cargoIdMapRef.current.set(invoiceNo, newId);
    return newId;
  }, [invoiceNo, isCargoShipment]);

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

  const issueDate = useMemo(() => new Date().toLocaleDateString("id-ID"), []);

  // ============================================================================
  // HANDLERS & ACTIONS
  // ============================================================================
  const updateField = useCallback(<K extends keyof FormSnapshot>(key: K, value: FormSnapshot[K]) => {
    setSnapshot((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateItem = useCallback((id: string, key: keyof OrderItem, value: string) => {
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
  }, []);

  const updateDimension = useCallback((key: keyof Dimensions, value: string) => {
    setSnapshot((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [key]: Math.max(0, Number(value) || 0),
      },
    }));
  }, []);

  const addItem = useCallback(() => {
    setSnapshot((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: "",
          qty: 1,
          price: 0,
        },
      ],
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setSnapshot((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
    }));
  }, []);

  const applyTemplate = useCallback((template: BrandingTemplate) => {
    updateField("brandingTemplate", template);
    updateField("primaryColor", TEMPLATE_COLOR[template].color);
  }, [updateField]);

  const handleLogoUpload = useCallback((file: File | null) => {
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar. Maksimal 2MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateField("logoDataUrl", reader.result);
        }
      };
      reader.onerror = () => alert("Gagal membaca file. Silakan coba lagi.");
      reader.readAsDataURL(file);
    },
    [updateField]
  );

  // --- PRINT & EXPORT ---
  const handlePrint = useCallback(
    (mode: PrintMode = printMode) => {
      syncPrintScale(mode, isCargoShipment);
      applyPrintPageSize(mode, isCargoShipment);
      window.print();
    },
    [printMode, isCargoShipment]
  );

  const handleDownloadPdf = useCallback(
    async (options?: {
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
        const canvas = await html2canvas(target, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
        });
        const imgData = canvas.toDataURL("image/png");

        if (activeMode === "THERMAL_58" || activeMode === "THERMAL_80") {
          const widthMm = getThermalWidth(activeMode);
          const heightMm = (canvas.height * widthMm) / canvas.width + 8;
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [widthMm, heightMm],
            compress: true,
          });
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
          const isA4 = activeMode === "A4" || isAuto;
          const pageFormat = isA4
            ? isCargoPdf && !isAuto
              ? [100, 150]
              : "a4"
            : activeMode === "LABEL_100X100"
            ? [100, 100]
            : [100, 150];
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: pageFormat,
            compress: true,
          });
          if (isCargoPdf) {
            pdf.setProperties({
              author: "UMKM Cargo System",
              subject: "Cargo Shipping Label",
              keywords: "cargo,logistics,umkm",
            });
          }
          const maxWidth = isA4 ? (isCargoPdf && !isAuto ? 92 : 194) : 92;
          const maxHeight = isA4
            ? isCargoPdf && !isAuto
              ? 142
              : 277
            : activeMode === "LABEL_100X100"
            ? 92
            : 142;
          const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
          const width = canvas.width * ratio;
          const height = canvas.height * ratio;
          const pageWidth = isA4 ? (isCargoPdf && !isAuto ? 100 : 210) : 100;
          const topPadding = isA4 ? (isCargoPdf && !isAuto ? 4 : 10) : 4;
          const x = (pageWidth - width) / 2;
          pdf.addImage(imgData, "PNG", x, topPadding, width, height);
          pdf.save(pdfFileName);
        }
      } catch (error) {
        console.error("PDF generation failed:", error);
        alert("Gagal membuat PDF. Silakan coba lagi.");
      } finally {
        setIsExporting(false);
      }
    },
    [printMode, invoiceNo, receiptNo, cargoType]
  );

  const exportCargoManifest = useCallback(() => {
    const cargoEntries = history.filter((entry) => entry.snapshot.cargoType !== "REGULER");
    if (cargoEntries.length === 0) {
      window.alert("Belum ada transaksi cargo di riwayat.");
      return;
    }

    const csvHeader = ["invoiceNo", "cargoType", "chargeableWeight", "dimensions", "courier", "status", "createdAt"];
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
        new Date(entry.createdAt).toISOString(),
      ];
    });

    const escapeCsvCell = (value: string) => {
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent = [csvHeader, ...csvRows]
      .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cargo-manifest-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [history]);

  // --- HISTORY & DATA MANAGEMENT ---
  const saveToHistory = useCallback(() => {
    const cargoIssues = validateCargo(snapshot);
    if (cargoIssues.length > 0) {
      window.alert(`Data cargo belum valid:\n- ${cargoIssues.join("\n- ")}`);
      return;
    }

    const recordId = `${snapshot.invoiceNo}-${snapshot.receiptNo}`;
    const isDuplicate = history.some((entry) => entry.id === recordId);
    
    if (isDuplicate) {
      if (!window.confirm("Transaksi dengan nomor ini sudah ada. Apakah Anda ingin memperbarui data yang ada?")) {
        return;
      }
    }

    const record: TransactionRecord = {
      id: recordId,
      createdAt: new Date().toISOString(),
      snapshot: normalizeSnapshot(snapshot),
    };

    setHistory((prev) => {
      const withoutCurrent = prev.filter((entry) => entry.id !== recordId);
      return [record, ...withoutCurrent].slice(0, 100);
    });

    alert("Transaksi berhasil disimpan ke riwayat!");
  }, [snapshot, history]);

  const loadFromHistory = useCallback((record: TransactionRecord) => {
    setSnapshot(normalizeSnapshot(record.snapshot));
    setActiveStep(1);
  }, []);

  const runAfterLoad = useCallback(
    (record: TransactionRecord, action: "print" | "pdf") => {
      setSnapshot(normalizeSnapshot(record.snapshot));
      window.setTimeout(() => {
        if (action === "print") {
          handlePrint(record.snapshot.printMode);
        } else {
          handleDownloadPdf({
            mode: record.snapshot.printMode,
            invoice: record.snapshot.invoiceNo,
            receipt: record.snapshot.receiptNo,
            cargoType: record.snapshot.cargoType,
          });
        }
      }, 250);
    },
    [handlePrint, handleDownloadPdf]
  );

  const resetData = useCallback(() => {
    if (window.confirm("Apakah Anda yakin ingin mereset semua data? Data yang belum disimpan akan hilang.")) {
      const currentInvoice = snapshot.invoiceNo;
      const currentReceipt = snapshot.receiptNo;

      setSnapshot({
        ...getDefaultSnapshot(),
        invoiceNo: currentInvoice,
        receiptNo: currentReceipt,
      });
    }
  }, [snapshot.invoiceNo, snapshot.receiptNo]);

  const deleteHistoryItem = useCallback((id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus item ini dari riwayat?")) {
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    }
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm("Apakah Anda yakin ingin menghapus SEMUA riwayat? Tindakan ini tidak dapat dibatalkan.")) {
      setHistory([]);
    }
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans pb-12">
      
      {/* HEADER: Dibuat lebih modern dengan backdrop-blur dan sticky top */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-40 print:hidden no-print border-b border-slate-200 bg-white/80 backdrop-blur-lg shadow-sm"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
              UMKM Resi & Invoice Builder
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Pencatatan penjualan & label pengiriman internal. Bukan untuk pemalsuan resi resmi.
            </p>
          </div>
          
          {/* Status Indicator (Optional but adds polish) */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Sistem Siap Digunakan
          </div>
        </div>
      </motion.header>

      {/* 
        LAYOUT UTAMA
        xl:grid-cols-12 dengan proporsi 5:7 (42% : 58%)
        Menggunakan gap-6/8 agar lebih bernafas.
      */}
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-12 xl:gap-8">
        
        {/* LEFT COLUMN: Input Panel (Lebih lebar & nyaman) */}
        <div className="xl:col-span-5 print:hidden no-print flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
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
              onResetData={resetData}
              onExportCargoManifest={exportCargoManifest}
              onClearHistory={clearHistory}
              onLoadFromHistory={loadFromHistory}
              onRunAfterLoad={runAfterLoad}
              onDeleteHistoryItem={deleteHistoryItem}
            />
          </motion.div>
          
          {/* DigitalProductInfo - tampil di desktop (xl) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="hidden xl:block bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
          >
            <DigitalProductInfo />
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Print Preview (Proporsional & Sticky) */}
        <div className="xl:col-span-7">
          {/* Sticky container menyesuaikan header baru */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="sticky top-28 space-y-6"
          >
            <div className="bg-slate-200/50 p-2 sm:p-4 rounded-2xl border border-slate-200/60 shadow-inner overflow-hidden">
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
            </div>
            
            {/* DigitalProductInfo - tampil di mobile/tablet saja (di bawah preview) */}
            <div className="xl:hidden print:hidden no-print bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mt-6">
              <DigitalProductInfo />
            </div>
          </motion.div>
        </div>
        
      </div>
    </main>
  );
}