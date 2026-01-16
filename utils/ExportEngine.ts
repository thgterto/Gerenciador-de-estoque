
import * as XLSX from 'xlsx';
import { InventoryItem, MovementRecord } from '../types';

interface ExportDataOptions {
    fileName?: string;
    sheetName?: string;
}

export const ExportEngine = {
    /**
     * Gera e baixa um arquivo Excel com múltiplas abas.
     */
    generateExcel: (sheets: { name: string, data: any[] }[], fileName: string) => {
        const wb = XLSX.utils.book_new();
        
        sheets.forEach(sheet => {
            const ws = XLSX.utils.json_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });

        const finalName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
        XLSX.writeFile(wb, finalName);
    },

    /**
     * Prepara os dados de inventário para o formato tabular de exportação.
     */
    prepareInventoryData: (items: InventoryItem[]) => {
        return items.map(i => {
            const risks = Object.entries(i.risks)
                .filter(([_, active]) => active)
                .map(([key]) => key)
                .join(', ');
    
            return {
                "ID Sistema": i.id,
                "Produto": i.name,
                "Código SAP": i.sapCode,
                "Lote": i.lotNumber,
                "CAS": i.casNumber || '',
                "Fórmula": i.molecularFormula || '',
                "Categoria": i.category,
                "Quantidade": i.quantity,
                "Unidade": i.baseUnit,
                "Estoque Mínimo": i.minStockLevel,
                "Fabricante": i.supplier, 
                "Armazém": i.location.warehouse,
                "Armário": i.location.cabinet,
                "Prateleira": i.location.shelf,
                "Posição": i.location.position,
                "Validade": i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : '',
                "Data Aquisição": i.dateAcquired ? new Date(i.dateAcquired).toLocaleDateString() : '',
                "Riscos": risks,
                "Atualizado em": new Date(i.lastUpdated).toLocaleDateString()
            };
        });
    },

    /**
     * Prepara os dados de histórico para exportação.
     */
    prepareHistoryData: (history: MovementRecord[]) => {
        return history.map(h => ({
            "Data": new Date(h.date).toLocaleString(),
            "Tipo": h.type,
            "Produto": h.productName,
            "Código SAP": h.sapCode,
            "Lote": h.lot,
            "Quantidade": h.quantity,
            "Unidade": h.unit,
            "Observação": h.observation || '',
            "Usuário": h.userId || 'Sistema',
            "ID Item": h.itemId || 'N/A'
        }));
    }
};
