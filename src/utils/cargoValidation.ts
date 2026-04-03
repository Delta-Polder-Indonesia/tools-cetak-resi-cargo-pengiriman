import type { FormSnapshot } from "../models/formSnapshot";
import { getChargeableWeight } from "./weight";

export const validateCargo = (snapshot: FormSnapshot): string[] => {
  const errors: string[] = [];
  const { cargoType, dimensions, fragile, insuranceValue, dangerousGoods, itemWeightGr } = snapshot;

  if (cargoType !== "REGULER") {
    const validDimensionCount = [dimensions.length, dimensions.width, dimensions.height].filter((value) => Number(value) > 0).length;
    if (validDimensionCount < 2) {
      errors.push("Untuk pengiriman cargo, isi minimal 2 dimensi barang (panjang/lebar/tinggi).");
    }
  }

  if (fragile && Number(insuranceValue) <= 0) {
    errors.push("Barang fragile wajib menggunakan nilai asuransi lebih dari 0.");
  }

  if (dangerousGoods) {
    errors.push("Warning: Memerlukan dokumen MSDS.");
  }

  const chargeableWeight = getChargeableWeight(itemWeightGr, dimensions);
  if (chargeableWeight <= 0) {
    errors.push("Berat tertagih harus lebih dari 0 kg.");
  }

  return errors;
};