import type { Dimensions } from "../models/formSnapshot";

export const calculateVolumetricWeight = (length: number, width: number, height: number): number => {
  const safeLength = Math.max(0, Number(length) || 0);
  const safeWidth = Math.max(0, Number(width) || 0);
  const safeHeight = Math.max(0, Number(height) || 0);
  return (safeLength * safeWidth * safeHeight) / 5000;
};

export const getChargeableWeight = (actualWeightGr: number, dimensions: Dimensions): number => {
  const actualWeightKg = Math.max(0, Number(actualWeightGr) || 0) / 1000;
  const volumetricWeightKg = calculateVolumetricWeight(dimensions.length, dimensions.width, dimensions.height);
  return Math.max(actualWeightKg, volumetricWeightKg);
};

export const formatWeight = (kg: number): string => {
  const safeKg = Math.max(0, Number(kg) || 0);
  if (safeKg >= 1000) {
    return `${(safeKg / 1000).toFixed(2)} ton`;
  }
  return `${safeKg.toFixed(2)} kg`;
};