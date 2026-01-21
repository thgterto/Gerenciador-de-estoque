
import * as XLSX from 'xlsx';
import { InventoryItem, MovementRecord } from '../types';
import { db } from '../db';

interface ExportDataOptions {
    fileName?: string;
    sheetName?: string;
}

// SECURITY: Sanitize cells to prevent CSV Injection (Formula Injection)
const sanitizeCell = (value: any): any => {
    if (typeof value === 'string') {
        // If the cell starts with a formula trigger character, prepend a quote to force text mode
        if (/^[=+\-@]/.test(value)) {
            return `'${value}`;
        }
    }
    return value;
};

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
     * Gera um arquivo .ts (TypeScript) contendo os dados atuais do banco no formato
     * compatível com o 'limsData.ts' original. Isso permite ao desenvolvedor substituir
     * o arquivo fonte para tornar os dados atuais permanentes no código.
     */
    generateLimsSeedFile: async () => {
        const items = await db.items.toArray();
        const history = await db.history.toArray();
        
        // Converte o formato interno para o formato esperado pelo Seed
        const exportData = {
            metadata: {
                gerado_em: new Date().toISOString(),
                status: "GENERATED FROM BROWSER DB",
                version: "1.8.0"
            },
            data: {
                items: items,
                history: history
            }
        };

        const fileContent = `
// ARQUIVO GERADO AUTOMATICAMENTE PELO LABCONTROL
// Substitua o conteúdo de 'limsData.ts' por este arquivo para tornar os dados permanentes.

export const LIMS_DATA: any = ${JSON.stringify(exportData, null, 2)};
`;

        const blob = new Blob([fileContent], { type: 'text/typescript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'limsData.ts';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
    
            const row = {
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

            // Apply Security Sanitization
            Object.keys(row).forEach(k => {
                (row as any)[k] = sanitizeCell((row as any)[k]);
            });

            return row;
        });
    },

    /**
     * Prepara os dados de histórico para exportação.
     */
    prepareHistoryData: (history: MovementRecord[]) => {
        return history.map(h => {
            const row = {
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
            };

            // Apply Security Sanitization
            Object.keys(row).forEach(k => {
                (row as any)[k] = sanitizeCell((row as any)[k]);
            });

            return row;
        });
    }
};
