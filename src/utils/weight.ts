import type { Dimensions } from "../models/formSnapshot";

export const calculateVolumetricWeight = (length: number, width: number, height: number): number => {
  const safeLength = Math.max(0, Number(length) || 0);
  const safeWidth = Math.max(0, Number(width) || 0);
  const safeHeight = Math.max(0, Number(height) || 0);
  
  // Hindari division by zero untuk dimensi yang tidak valid
  if (safeLength === 0 || safeWidth === 0 || safeHeight === 0) {
    return 0;
  }
  
  return (safeLength * safeWidth * safeHeight) / 5000;
};

export const getChargeableWeight = (actualWeightGr: number, dimensions: Dimensions): number => {
  const actualWeightKg = Math.max(0, Number(actualWeightGr) || 0) / 1000;
  const volumetricWeightKg = calculateVolumetricWeight(dimensions.length, dimensions.width, dimensions.height);
  return Math.max(actualWeightKg, volumetricWeightKg);
};

export const formatWeight = (kg: number): string => {
  const safeKg = Math.max(0, Number(kg) || 0);
  
  // Handle very small values
  if (safeKg < 0.01) {
    return "< 0.01 kg";
  }
  
  if (safeKg >= 1000) {
    return `${(safeKg / 1000).toFixed(2)} ton`;
  }
  
  // Format dengan precision yang sesuai
  if (safeKg < 1) {
    return `${safeKg.toFixed(3)} kg`;
  }
  
  return `${safeKg.toFixed(2)} kg`;
};

/**
 * Format weight untuk display dengan unit yang lebih readable
 */
export const formatWeightDetailed = (kg: number): { value: string; unit: string } => {
  const safeKg = Math.max(0, Number(kg) || 0);
  
  if (safeKg >= 1000) {
    return { value: (safeKg / 1000).toFixed(2), unit: "ton" };
  }
  
  if (safeKg < 1) {
    return { value: safeKg.toFixed(3), unit: "kg" };
  }
  
  return { value: safeKg.toFixed(2), unit: "kg" };
};