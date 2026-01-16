
import { useCallback } from 'react';
import { InventoryService } from '../services/InventoryService';
import { InventoryItem } from '../types';
import { useAlert } from '../context/AlertContext';
import * as XLSX from 'xlsx';

export const useStockOperations = () => {
    const { addToast } = useAlert();

    const registerMovement = useCallback(async (
        item: InventoryItem, 
        type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA', 
        quantity: number, 
        date: string,
        observation: string,
        locationData?: { from?: string, to?: string }
    ) => {
        try {
            await InventoryService.processTransaction({
                itemId: item.id,
                type,
                quantity,
                date,
                observation,
                fromLocationId: locationData?.from,
                toLocationId: locationData?.to
            });
            
            const msg = type === 'TRANSFERENCIA' 
                ? 'Item transferido com sucesso.' 
                : `Movimentação de ${type} registrada.`;
                
            addToast('Sucesso', 'success', msg);
            return true;
        } catch (error) {
            addToast('Erro Operacional', 'error', (error as Error).message);
            return false;
        }
    }, [addToast]);

    const updateItem = useCallback(async (updatedItem: InventoryItem) => {
        try {
            await InventoryService.updateItem(updatedItem);
            addToast('Item Atualizado', 'success', `${updatedItem.name} atualizado.`);
            return true;
        } catch (error) {
            addToast('Erro', 'error', 'Falha ao atualizar item.');
            return false;
        }
    }, [addToast]);

    const deleteItem = useCallback(async (id: string, name: string) => {
        if(confirm(`Tem certeza que deseja excluir ${name}?`)) {
            try {
                await InventoryService.deleteItem(id);
                addToast('Excluído', 'success', 'Item removido do sistema.');
                return true;
            } catch (error) {
                addToast('Erro', 'error', 'Falha ao excluir item.');
                return false;
            }
        }
        return false;
    }, [addToast]);

    const deleteManyItems = useCallback(async (ids: string[]) => {
        if(confirm(`Tem certeza que deseja excluir ${ids.length} itens? Esta ação é irreversível.`)) {
            try {
                await InventoryService.deleteBulk(ids);
                addToast('Excluído', 'success', `${ids.length} itens removidos.`);
                return true;
            } catch (error) {
                addToast('Erro', 'error', 'Falha ao excluir itens.');
                return false;
            }
        }
        return false;
    }, [addToast]);

    const importLegacyExcel = useCallback(async (file: File) => {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    
                    const newItems: InventoryItem[] = rows.map((r) => {
                        const newUuid = crypto.randomUUID();
                        return {
                            id: newUuid,
                            sapCode: r['Código SAP'] || '',
                            name: r['Nome'] || 'Item Importado',
                            lotNumber: r['Lote'] || 'GEN',
                            type: 'ROH',
                            materialGroup: 'GERAL',
                            baseUnit: r['Unidade'] || 'UN',
                            category: 'Geral',
                            itemStatus: 'Ativo',
                            quantity: Number(r['Quantidade']) || 0,
                            minStockLevel: 0,
                            supplier: r['Fabricante'] || '',
                            expiryDate: r['Validade'] || '',
                            risks: { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false },
                            location: { warehouse: 'Central', cabinet: '', shelf: '', position: '' },
                            isControlled: false,
                            lastUpdated: new Date().toISOString(),
                            dateAcquired: new Date().toISOString(),
                            unitCost: 0,
                            currency: 'BRL',
                            batchId: `BAT-${newUuid}`,
                            catalogId: `CAT-${newUuid}`
                        };
                    });

                    await InventoryService.importBulk(newItems);
                    addToast('Importação Concluída', 'success', `${newItems.length} itens importados.`);
                    resolve();
                } catch (error) {
                    addToast('Erro na Importação', 'error', 'Verifique o formato do arquivo.');
                    reject(error);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }, [addToast]);

    return {
        registerMovement,
        updateItem,
        deleteItem,
        deleteManyItems,
        importLegacyExcel
    };
};
