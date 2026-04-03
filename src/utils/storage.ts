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

// ==========================================
// ERROR HANDLING UTILITIES
// ==========================================

class StorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "StorageError";
  }
}

const handleStorageError = (operation: string, error: unknown): void => {
  if (error instanceof Error) {
    if (error.name === "QuotaExceededError" || (error as DOMException).code === 22) {
      console.error(`[Storage] Quota exceeded during ${operation}. Consider clearing old history.`);
      throw new StorageError("Storage quota exceeded. Please clear some history data.", "QUOTA_EXCEEDED");
    }
    console.error(`[Storage] Error during ${operation}:`, error);
    throw new StorageError(`Failed to ${operation}: ${error.message}`, "UNKNOWN");
  }
  throw error;
};

// ==========================================
// PARSING FUNCTIONS
// ==========================================

const parseHistory = (raw: string | null): TransactionRecord[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as TransactionRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: entry.createdAt || new Date().toISOString(),
      snapshot: normalizeSnapshot(entry.snapshot),
    }));
  } catch (error) {
    console.warn("[Storage] Failed to parse history:", error);
    return [];
  }
};

// ==========================================
// PUBLIC API
// ==========================================

export const loadInitialSnapshot = (): FormSnapshot => {
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    if (currentRaw) {
      try {
        const parsed = JSON.parse(currentRaw) as Partial<FormSnapshot>;
        return normalizeSnapshot(parsed);
      } catch (parseError) {
        console.warn("[Storage] Failed to parse current snapshot, using defaults");
        return getDefaultSnapshot();
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
    if (!legacyRaw) return getDefaultSnapshot();

    try {
      const legacyParsed = JSON.parse(legacyRaw) as Partial<FormSnapshot>;
      const migrated = migrateV2toV3(legacyParsed);
      // Try to save migrated data, but don't fail if storage is full
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } catch (saveError) {
        console.warn("[Storage] Could not save migrated snapshot, using in-memory only");
      }
      return migrated;
    } catch (parseError) {
      console.warn("[Storage] Failed to parse legacy snapshot");
      return getDefaultSnapshot();
    }
  } catch (error) {
    handleStorageError("loadInitialSnapshot", error);
    return getDefaultSnapshot();
  }
};

export const loadInitialHistory = (): TransactionRecord[] => {
  try {
    const currentRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (currentRaw !== null) {
      return parseHistory(currentRaw);
    }

    const legacyHistory = parseHistory(localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY_V1));
    if (legacyHistory.length > 0) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(legacyHistory));
      } catch (saveError) {
        console.warn("[Storage] Could not migrate legacy history");
      }
    }
    return legacyHistory;
  } catch (error) {
    handleStorageError("loadInitialHistory", error);
    return [];
  }
};

export const persistSnapshot = (snapshot: FormSnapshot): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    handleStorageError("persistSnapshot", error);
  }
};

export const persistHistory = (history: TransactionRecord[]): void => {
  try {
    // Limit history size to prevent quota issues (keep last 100)
    const limitedHistory = history.slice(0, 100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    handleStorageError("persistHistory", error);
  }
};

/**
 * Clear old history entries to free up space
 */
export const clearOldHistory = (keepCount: number = 50): void => {
  try {
    const history = loadInitialHistory();
    if (history.length > keepCount) {
      const trimmed = history.slice(0, keepCount);
      persistHistory(trimmed);
    }
  } catch (error) {
    console.error("[Storage] Failed to clear old history:", error);
  }
};