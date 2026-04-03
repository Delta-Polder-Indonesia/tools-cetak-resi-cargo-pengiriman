import {
  HISTORY_STORAGE_KEY,
  LEGACY_HISTORY_STORAGE_KEY_V1,
  LEGACY_STORAGE_KEY_V2,
  STORAGE_KEY,
} from "../constants/appConfig";
import {
  type FormSnapshot,
  getDefaultSnapshot,
  migrateV2toV3,
  normalizeSnapshot,
} from "../models/formSnapshot";
import type { TransactionRecord } from "../types/transaction";

const parseHistory = (raw: string | null): TransactionRecord[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as TransactionRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      snapshot: normalizeSnapshot(entry.snapshot),
    }));
  } catch {
    return [];
  }
};

export const loadInitialSnapshot = (): FormSnapshot => {
  const currentRaw = localStorage.getItem(STORAGE_KEY);
  if (currentRaw) {
    try {
      const parsed = JSON.parse(currentRaw) as Partial<FormSnapshot>;
      return normalizeSnapshot(parsed);
    } catch {
      return getDefaultSnapshot();
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
  if (!legacyRaw) return getDefaultSnapshot();

  try {
    const legacyParsed = JSON.parse(legacyRaw) as Partial<FormSnapshot>;
    const migrated = migrateV2toV3(legacyParsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return getDefaultSnapshot();
  }
};

export const loadInitialHistory = (): TransactionRecord[] => {
  const currentRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (currentRaw !== null) {
    return parseHistory(currentRaw);
  }

  const legacyHistory = parseHistory(localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY_V1));
  if (legacyHistory.length > 0) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(legacyHistory));
  }
  return legacyHistory;
};

export const persistSnapshot = (snapshot: FormSnapshot) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

export const persistHistory = (history: TransactionRecord[]) => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};
