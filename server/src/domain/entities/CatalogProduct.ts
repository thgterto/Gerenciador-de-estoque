
export interface CatalogProduct {
  id: string;
  sapCode: string | null;
  name: string;
  categoryId: string | null;
  baseUnit: string;
  casNumber?: string | null;
  molecularFormula?: string | null;
  molecularWeight?: number | null;
  risks: Record<string, boolean>; // Parsed from JSON
  isControlled: boolean;
  minStockLevel: number;
  isActive: boolean;
  updatedAt?: string | null;
}
