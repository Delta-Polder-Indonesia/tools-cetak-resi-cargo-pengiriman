// src/utils/printUtils.ts
import type { PrintMode } from "../models/formSnapshot";

// ==========================================
// KONSTANTA
// ==========================================

const PX_PER_MM = 96 / 25.4;
const MIN_SCALE = 0.6;
const SAFETY_MARGIN_PX = 24;
const STYLE_ID = "dynamic-print-page-size";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

type PageConfig = {
  size: string;
  margin: string;
  orientation?: "portrait" | "landscape";
};

type Dimensions = {
  width: number;
  height: number;
};

// ==========================================
// CONFIGURATION MAPS
// ==========================================

const PAGE_CONFIGS: Record<PrintMode | "CARGO", PageConfig> = {
  AUTO: { size: "auto", margin: "8mm" },
  A4: { size: "A4", margin: "10mm", orientation: "portrait" },
  LABEL_100X150: { size: "100mm 150mm", margin: "4mm" },
  LABEL_100X100: { size: "100mm 100mm", margin: "4mm" },
  THERMAL_58: { size: "58mm auto", margin: "2mm" },
  THERMAL_80: { size: "80mm auto", margin: "2mm" },
  CARGO: { size: "100mm 150mm", margin: "4mm" },
};

const DIMENSIONS_MM: Record<PrintMode, { w: number; h: number | null }> = {
  AUTO: { w: 0, h: null },
  A4: { w: 210, h: 297 },
  LABEL_100X150: { w: 100, h: 150 },
  LABEL_100X100: { w: 100, h: 100 },
  THERMAL_58: { w: 58, h: null },
  THERMAL_80: { w: 80, h: null },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const isBrowser = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

const getViewportSize = (): Dimensions => {
  if (!isBrowser()) return { width: 1024, height: 768 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const mmToPx = (mm: number): number => mm * PX_PER_MM;

// ==========================================
// MAIN FUNCTIONS
// ==========================================

/**
 * Cleanup style element yang ada
 */
const cleanupExistingStyle = (): void => {
  if (!isBrowser()) return;
  const existing = document.getElementById(STYLE_ID);
  if (existing) {
    existing.remove();
  }
};

/**
 * Mengapply CSS @page size untuk print
 * @param mode - Print mode yang dipilih
 * @param isCargoShipment - Force cargo label size regardless of mode
 */
export const applyPrintPageSize = (mode: PrintMode, isCargoShipment = false): void => {
  if (!isBrowser()) return;

  // Cleanup existing dengan delay untuk menghindari race condition
  cleanupExistingStyle();

  // Determine config
  const configKey = isCargoShipment ? "CARGO" : mode;
  const config = PAGE_CONFIGS[configKey] ?? PAGE_CONFIGS.AUTO;

  // Build CSS
  const orientationCss = config.orientation ? ` ${config.orientation}` : "";
  const css = `@media print { 
    @page { 
      size: ${config.size}${orientationCss}; 
      margin: ${config.margin}; 
    } 
  }`;

  // Inject dengan requestAnimationFrame untuk ensure proper cleanup
  requestAnimationFrame(() => {
    const styleNode = document.createElement("style");
    styleNode.id = STYLE_ID;
    styleNode.textContent = css;
    document.head.appendChild(styleNode);
  });
};

/**
 * Menghitung dan apply scale untuk print area
 * @param mode - Print mode
 * @param isCargoShipment - Whether this is a cargo shipment
 */
export const syncPrintScale = (mode: PrintMode, isCargoShipment = false): void => {
  if (!isBrowser()) return;

  // Delay execution untuk ensure DOM sudah update
  requestAnimationFrame(() => {
    const printArea = document.getElementById("print-area");
    if (!printArea) {
      console.warn("[PrintUtils] #print-area not found");
      return;
    }

    const targetDims = calculateTargetDimensions(mode, isCargoShipment);
    const contentDims = {
      width: printArea.scrollWidth,
      height: printArea.scrollHeight,
    };

    if (contentDims.width <= 0 || contentDims.height <= 0) {
      console.warn("[PrintUtils] Invalid content dimensions");
      return;
    }

    const scale = calculateScale(targetDims, contentDims);
    
    printArea.style.setProperty("--print-scale", scale.toFixed(3));
    
    // Set explicit dimensions untuk preview
    if (mode !== "AUTO") {
      printArea.style.width = `${targetDims.width}px`;
      printArea.style.maxWidth = `${targetDims.width}px`;
    } else {
      // Reset untuk auto mode
      printArea.style.width = "";
      printArea.style.maxWidth = "";
    }
  });
};

// ==========================================
// INTERNAL HELPERS
// ==========================================

function calculateTargetDimensions(mode: PrintMode, isCargoShipment: boolean): Dimensions {
  // Cargo override
  if (isCargoShipment) {
    return {
      width: mmToPx(100),
      height: mmToPx(150),
    };
  }

  // Auto mode: use viewport
  if (mode === "AUTO") {
    const viewport = getViewportSize();
    return {
      width: Math.max(320, viewport.width - 32),
      height: Math.max(400, viewport.height - 32),
    };
  }

  // Standard modes
  const config = DIMENSIONS_MM[mode];
  const widthPx = mmToPx(config.w);
  
  // Height: use config atau estimate 5:1 ratio untuk thermal
  const heightPx = config.h ? mmToPx(config.h) : widthPx * 5;

  return { width: widthPx, height: heightPx };
}

function calculateScale(target: Dimensions, content: Dimensions): number {
  const usableWidth = Math.max(1, target.width - SAFETY_MARGIN_PX);
  const usableHeight = Math.max(1, target.height - SAFETY_MARGIN_PX);

  const widthRatio = usableWidth / Math.max(1, content.width);
  const heightRatio = usableHeight / Math.max(1, content.height);
  
  const optimalScale = Math.min(1, widthRatio, heightRatio);
  
  return Math.max(MIN_SCALE, optimalScale);
}

// ==========================================
// BONUS: UTILITY EXPORTS
// ==========================================

export const PrintUtils = {
  mmToPx: (mm: number) => mm * PX_PER_MM,
  pxToMm: (px: number) => px / PX_PER_MM,
  getPrintDimensions: (mode: PrintMode, isCargo = false) => 
    calculateTargetDimensions(mode, isCargo),
  cleanup: cleanupExistingStyle,
};