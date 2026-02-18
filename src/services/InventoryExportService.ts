import { InventoryItem, MovementRecord, ExportOptions } from '../types';
import { ExportEngine } from '../utils/ExportEngine';

export const InventoryExportService = {
    async exportData(
        items: InventoryItem[],
        historyProvider: () => Promise<MovementRecord[]>,
        options: ExportOptions
    ) {
      const sheets = [];
      sheets.push({ name: 'Inventario', data: ExportEngine.prepareInventoryData(items) });
      if (options.includeHistory) {
          const history = await historyProvider();
          sheets.push({ name: 'Historico', data: ExportEngine.prepareHistoryData(history) });
      }
      const filename = `LabControl_Export_${new Date().toISOString().split('T')[0]}`;
      ExportEngine.generateExcel(sheets, filename);
    }
};
