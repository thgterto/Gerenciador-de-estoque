
export interface StorageLocation {
  id: string;
  name: string;
  type?: string | null;
  parentId?: string | null;
  isActive: boolean;
}
