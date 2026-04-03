import type { PrintMode } from "../models/formSnapshot";
import { getThermalWidth } from "../constants/appConfig";

type FitCheckResult = {
  fits: boolean;
  scale: number;
  contentWidth: number;
  contentHeight: number;
  pageWidth: number;
  pageHeight: number;
};

export const applyPrintPageSize = (mode: PrintMode, _isCargoShipment = false) => {
  const existing = document.getElementById("dynamic-print-page-size");
  if (existing) existing.remove();

  const styleNode = document.createElement("style");
  styleNode.id = "dynamic-print-page-size";
  const css =
    mode === "AUTO"
      ? "@media print { @page { size: auto; margin: 8mm; } }"
      : mode === "A4" || mode === "A4_COMPACT"
      ? "@media print { @page { size: A4 portrait; margin: 8mm; } }"
      : mode === "LABEL_100X150"
        ? "@media print { @page { size: 100mm 150mm; margin: 4mm; } }"
        : mode === "LABEL_100X100"
          ? "@media print { @page { size: 100mm 100mm; margin: 4mm; } }"
          : `@media print { @page { size: ${getThermalWidth(mode)}mm auto; margin: 2mm; } }`;
  styleNode.textContent = css;
  document.head.appendChild(styleNode);
};

const MM_TO_PX = 3.7795275591;

const getTargetPagePx = (mode: PrintMode, _isCargoShipment: boolean) => {
  if (mode === "AUTO") {
    // AUTO cannot read printer paper directly, so we fit to current viewport preview area.
    return {
      width: Math.max(320, window.innerWidth - 32),
      height: Math.max(400, window.innerHeight - 32),
    };
  }

  if (mode === "A4" || mode === "A4_COMPACT") {
    return { width: 210 * MM_TO_PX, height: 297 * MM_TO_PX };
  }

  if (mode === "LABEL_100X150") return { width: 100 * MM_TO_PX, height: 150 * MM_TO_PX };
  if (mode === "LABEL_100X100") return { width: 100 * MM_TO_PX, height: 100 * MM_TO_PX };

  const thermalWidth = getThermalWidth(mode) * MM_TO_PX;
  return { width: thermalWidth, height: 1200 };
};

export const syncPrintScale = (mode: PrintMode, isCargoShipment: boolean) => {
  const printArea = document.getElementById("print-area");
  if (!printArea) return;

  const target = getTargetPagePx(mode, isCargoShipment);
  const contentWidth = printArea.scrollWidth;
  const contentHeight = printArea.scrollHeight;
  if (contentWidth <= 0 || contentHeight <= 0) return;

  const usableWidth = target.width - 24;
  const usableHeight = target.height - 24;
  const widthRatio = usableWidth / contentWidth;
  const heightRatio = usableHeight / contentHeight;
  const maxScale = mode === "A4" || mode === "A4_COMPACT" || mode === "AUTO" ? 1.6 : 1;
  const scale = Math.min(maxScale, widthRatio, heightRatio);

  const clampedScale = Math.max(0.45, scale);
  printArea.style.setProperty("--print-scale", String(clampedScale));
  printArea.style.setProperty("--preview-scale", String(clampedScale));
};

export const checkPrintFitsSinglePage = (
  mode: PrintMode,
  isCargoShipment: boolean,
): FitCheckResult | null => {
  const printArea = document.getElementById("print-area");
  if (!printArea) return null;

  const target = getTargetPagePx(mode, isCargoShipment);
  const contentWidth = printArea.scrollWidth;
  const contentHeight = printArea.scrollHeight;
  if (contentWidth <= 0 || contentHeight <= 0) return null;

  const usableWidth = target.width - 24;
  const usableHeight = target.height - 24;
  const widthRatio = usableWidth / contentWidth;
  const heightRatio = usableHeight / contentHeight;
  const maxScale = mode === "A4" || mode === "A4_COMPACT" || mode === "AUTO" ? 1.6 : 1;
  const scale = Math.min(maxScale, widthRatio, heightRatio);

  return {
    // Treat scale below 45% as risky readability for real label usage.
    fits: scale >= 0.45,
    scale,
    contentWidth,
    contentHeight,
    pageWidth: target.width,
    pageHeight: target.height,
  };
};

export const getPreviewSheetSize = (mode: PrintMode, isCargoShipment: boolean) => {
  if (mode === "THERMAL_58" || mode === "THERMAL_80") return null;
  if (mode === "LABEL_100X100") return { width: 380, height: 380 };
  if (mode === "LABEL_100X150") return { width: 420, height: 620 };
  if (mode === "A4" || mode === "A4_COMPACT") {
    return isCargoShipment ? { width: 794, height: 1123 } : { width: 794, height: 1123 };
  }
  return isCargoShipment ? { width: 420, height: 620 } : { width: 420, height: 594 };
};
