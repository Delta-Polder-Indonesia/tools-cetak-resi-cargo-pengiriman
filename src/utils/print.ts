import type { PrintMode } from "../models/formSnapshot";
import { getThermalWidth } from "../constants/appConfig";

export const applyPrintPageSize = (mode: PrintMode, isCargoShipment = false) => {
  const existing = document.getElementById("dynamic-print-page-size");
  if (existing) existing.remove();

  const styleNode = document.createElement("style");
  styleNode.id = "dynamic-print-page-size";
  const css =
    mode === "AUTO"
      ? "@media print { @page { size: auto; margin: 8mm; } }"
      : mode === "A4"
      ? isCargoShipment
        ? "@media print { @page { size: 100mm 150mm; margin: 4mm; } }"
        : "@media print { @page { size: A4 portrait; margin: 10mm; } }"
      : mode === "LABEL_100X150"
        ? "@media print { @page { size: 100mm 150mm; margin: 4mm; } }"
        : mode === "LABEL_100X100"
          ? "@media print { @page { size: 100mm 100mm; margin: 4mm; } }"
          : `@media print { @page { size: ${getThermalWidth(mode)}mm auto; margin: 2mm; } }`;
  styleNode.textContent = css;
  document.head.appendChild(styleNode);
};

const MM_TO_PX = 3.7795275591;

const getTargetPagePx = (mode: PrintMode, isCargoShipment: boolean) => {
  if (mode === "AUTO") {
    return {
      width: Math.max(320, window.innerWidth - 32),
      height: Math.max(400, window.innerHeight - 32),
    };
  }

  if (mode === "A4") {
    if (isCargoShipment) {
      return { width: 100 * MM_TO_PX, height: 150 * MM_TO_PX };
    }
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
  const scale = Math.min(1, widthRatio, heightRatio);

  printArea.style.setProperty("--print-scale", String(Math.max(0.6, scale)));
};
