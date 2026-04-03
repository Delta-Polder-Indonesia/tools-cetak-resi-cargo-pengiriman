import type { FormSnapshot } from "../models/formSnapshot";

export type TransactionRecord = {
  id: string;
  createdAt: string;
  snapshot: FormSnapshot;
};
