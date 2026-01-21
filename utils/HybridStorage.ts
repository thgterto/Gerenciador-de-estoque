
import { Table } from 'dexie';
import { InventoryItem, MovementRecord, StockBalance } from '../types';

// --- Interfaces & Types ---
type ChangeType = 'ADD' | 'UPDATE' | 'DELETE' | 'BULK' | 'BULK_DELETE';
type Listener = () => void;

class HybridTableWrapper<T, TKey> {
  private tableName: string;
  private dexieTable: Table<T, TKey>;
  private primaryKeyField: string;
  private notifyChange: () => void;
  private _memoryCache: T[] | null = null;

  constructor(
      tableName: string, 
      dexieTable: Table<T, TKey>, 
      primaryKeyField: string = 'id',
      notifyChange: () => void
  ) {
    this.tableName = tableName;
    this.dexieTable = dexieTable;
    this.primaryKeyField = primaryKeyField;
    this.notifyChange = notifyChange;
  }

  invalidate() {
      this._memoryCache = null;
      this.notifyChange();
  }

  get memoryCache(): T[] | null {
      return this._memoryCache;
  }

  // Otimização: Atualiza memória imediatamente para UI responsiva
  private optimisticUpdate(action: ChangeType, itemOrKey: T | TKey | T[] | TKey[]) {
    // Se não temos cache em memória, não fazemos update otimista, esperamos o DB
    if (this._memoryCache === null) return null;

    const previousCache = [...this._memoryCache];

    try {
        if (action === 'ADD') {
            this._memoryCache.push(itemOrKey as T);
        } 
        else if (action === 'UPDATE') {
            const item = itemOrKey as any;
            const idx = this._memoryCache.findIndex((i: any) => i[this.primaryKeyField] === item[this.primaryKeyField]);
            if (idx >= 0) {
                this._memoryCache[idx] = item;
            } else {
                this._memoryCache.push(item);
            }
        } 
        else if (action === 'DELETE') {
            const key = itemOrKey as any;
            this._memoryCache = this._memoryCache.filter((i: any) => i[this.primaryKeyField] !== key);
        }
        else if (action === 'BULK') {
            const items = itemOrKey as T[];
            // Se bulk muito grande (>1000), invalidamos cache para economizar CPU na reconstrução do array
            // e deixamos o recarregamento cuidar disso
            if (items.length > 1000) {
                 this._memoryCache = null; 
                 return previousCache;
            }
            
            const map = new Map(this._memoryCache.map((i: any) => [i[this.primaryKeyField], i]));
            items.forEach((i: any) => map.set(i[this.primaryKeyField], i));
            this._memoryCache = Array.from(map.values());
        }
        else if (action === 'BULK_DELETE') {
            const keys = new Set(itemOrKey as TKey[]);
            this._memoryCache = this._memoryCache.filter((i: any) => !keys.has(i[this.primaryKeyField]));
        }

        this.notifyChange();

    } catch (e) {
        console.error(`[HybridStorage] Optimistic update failed. Reverting L1.`, e);
        this._memoryCache = previousCache;
        this.notifyChange();
    }

    return previousCache;
  }

  async get(key: TKey): Promise<T | undefined> {
    if (this._memoryCache) {
      return this._memoryCache.find((i: any) => i[this.primaryKeyField] === key);
    }
    return await this.dexieTable.get(key);
  }

  async toArray(): Promise<T[]> {
    if (this._memoryCache !== null) {
        return this._memoryCache;
    }
    return await this.bgSyncL3();
  }

  private async bgSyncL3(): Promise<T[]> {
      try {
          const data = await this.dexieTable.toArray();
          this._memoryCache = data;
          return data;
      } catch (error) {
          // Silent fail to avoid crashing UI if DB is locked/closed, just log warning
          console.warn(`[HybridStorage] L3 Sync Skipped (${this.tableName})`, error);
          return [];
      }
  }

  async add(item: T): Promise<TKey> {
    const rollback = this.optimisticUpdate('ADD', item);
    try {
        const res = await this.dexieTable.add(item);
        if (!rollback) this.notifyChange(); 
        return res;
    } catch (e) {
        if (rollback) this._memoryCache = rollback;
        this.notifyChange();
        throw e;
    }
  }

  async put(item: T): Promise<TKey> {
    const rollback = this.optimisticUpdate('UPDATE', item);
    try {
        const res = await this.dexieTable.put(item);
        if (!rollback) this.notifyChange();
        return res;
    } catch (e) {
        if (rollback) this._memoryCache = rollback;
        this.notifyChange();
        throw e;
    }
  }
  
  async bulkPut(items: T[]): Promise<TKey> {
    const rollback = this.optimisticUpdate('BULK', items);
    try {
        const res = await this.dexieTable.bulkPut(items);
        if (!rollback) this.notifyChange();
        return res;
    } catch (e) {
        if (rollback) this._memoryCache = rollback;
        this.notifyChange();
        throw e;
    }
  }

  async bulkAdd(items: T[]): Promise<TKey> {
    const rollback = this.optimisticUpdate('BULK', items);
    try {
        const res = await this.dexieTable.bulkAdd(items);
        if (!rollback) this.notifyChange();
        return res;
    } catch (e) {
        if (rollback) this._memoryCache = rollback;
        this.notifyChange();
        throw e;
    }
  }

  async delete(key: TKey): Promise<void> {
    const rollback = this.optimisticUpdate('DELETE', key);
    try {
        await this.dexieTable.delete(key);
        if (!rollback) this.notifyChange();
    } catch (e) {
        if (rollback) this._memoryCache = rollback;
        this.notifyChange();
        throw e;
    }
  }

  async bulkDelete(keys: TKey[]): Promise<void> {
    const rollback = this.optimisticUpdate('BULK_DELETE', keys);
    try {
        await this.dexieTable.bulkDelete(keys);
        if (!rollback) this.notifyChange();
    } catch (e) {
        if (rollback) this._memoryCache = rollback;
        this.notifyChange();
        throw e;
    }
  }

  async count(): Promise<number> {
    if (this._memoryCache) return this._memoryCache.length;
    return this.dexieTable.count();
  }
  
  async clear(): Promise<void> {
    this._memoryCache = [];
    this.notifyChange();
    return this.dexieTable.clear();
  }
}

export class HybridStorageManager {
  private db: any;
  public items: HybridTableWrapper<InventoryItem, string>;
  public history: HybridTableWrapper<MovementRecord, string>;
  public balances: HybridTableWrapper<StockBalance, string>;
  private listeners: Listener[] = [];
  private notifyTimeout: any = null;

  constructor(dexieInstance: any) {
    this.db = dexieInstance;
    const notify = () => this.emitChange();
    this.items = new HybridTableWrapper<InventoryItem, string>('items', this.db.items, 'id', notify);
    this.history = new HybridTableWrapper<MovementRecord, string>('history', this.db.history, 'id', notify);
    this.balances = new HybridTableWrapper<StockBalance, string>('balances', this.db.balances, 'id', notify);
  }

  get rawDb() { return this.db; }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // DEBOUNCED EMIT: Agrupa notificações múltiplas (ex: em loops) em uma única atualização de UI
  private emitChange() {
    if (this.notifyTimeout) clearTimeout(this.notifyTimeout);
    
    this.notifyTimeout = setTimeout(() => {
        if (this.listeners) {
            this.listeners.forEach(listener => {
                try {
                    listener();
                } catch (e) {
                    console.warn('[HybridStorage] Listener failed', e);
                }
            });
        }
    }, 16); // ~1 frame (60fps)
  }

  invalidateCaches() {
      this.items.invalidate();
      this.history.invalidate();
      this.balances.invalidate();
  }

  transaction(mode: string, tables: any[], scope: () => Promise<void>) {
      return this.db.transaction(mode, tables, scope);
  }
  
  async clearData() {
      await this.db.transaction('rw', [
          this.db.items, 
          this.db.history,
          this.db.sapOrders,
          this.db.sapOrderItems,
          this.db.locations,
          this.db.suppliers,
          this.db.localOrders,
          this.db.systemLogs,
          this.db.catalog,
          this.db.batches,
          this.db.partners,
          this.db.storage_locations,
          this.db.balances
      ], async () => {
          await Promise.all([
              this.db.items.clear(),
              this.db.history.clear(),
              this.db.sapOrders.clear(),
              this.db.sapOrderItems.clear(),
              this.db.locations.clear(),
              this.db.suppliers.clear(),
              this.db.localOrders.clear(),
              this.db.systemLogs.clear(),
              this.db.catalog.clear(),
              this.db.batches.clear(),
              this.db.partners.clear(),
              this.db.storage_locations.clear(),
              this.db.balances.clear()
          ]);
      });
      
      this.invalidateCaches();
  }

  delete() { return this.db.delete(); }

  public async performBackup(isAuto: boolean = false) {
    try {
      const items = await this.db.items.toArray(); 
      const history = await this.db.history.toArray();
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.8",
          type: isAuto ? "AUTO_SYNC" : "MANUAL_EXPORT"
        },
        data: { items, history }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LabControl_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[HybridStorage] Backup failed:', e);
    }
  }
}
