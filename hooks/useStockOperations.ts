
import { useCallback } from 'react';
import { InventoryService } from '../services/InventoryService';
import { ImportService } from '../services/ImportService';
import { InventoryItem } from '../types';
import { useAlert } from '../context/AlertContext';

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
        try {
            const result = await ImportService.importFromExcel(file);
            addToast('Importação Concluída', 'success', `${result.total} itens processados.`);
        } catch (error) {
            console.error("Import error:", error);
            addToast('Erro na Importação', 'error', (error as Error).message);
        }
    }, [addToast]);

    return {
        registerMovement,
        updateItem,
        deleteItem,
        deleteManyItems,
        importLegacyExcel
    };
};
