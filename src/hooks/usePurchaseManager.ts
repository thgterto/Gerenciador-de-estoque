
import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, PurchaseRequestItem, LocalPurchaseOrderDTO } from '../types';
import { useAlert } from '../context/AlertContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';

export const usePurchaseManager = () => {
    const { addToast } = useAlert();
    const navigate = useNavigate();

    const [currentOrder, setCurrentOrder] = useState<LocalPurchaseOrderDTO | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize or Fetch Draft Order
    useEffect(() => {
        const init = async () => {
            try {
                // Find existing draft
                const draft = await db.rawDb.localOrders
                    .where('status')
                    .equals('DRAFT')
                    .first();

                if (draft) {
                    setCurrentOrder(draft);
                } else {
                    // Create new draft
                    const newDraft: LocalPurchaseOrderDTO = {
                        id: crypto.randomUUID(),
                        orderNumber: `DRAFT-${Date.now().toString().slice(-6)}`,
                        status: 'DRAFT',
                        items: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    await db.rawDb.localOrders.add(newDraft);
                    setCurrentOrder(newDraft);
                }
            } catch (e) {
                console.error("Failed to initialize Purchase Manager", e);
                addToast('Erro', 'error', 'Falha ao carregar lista de compras.');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [addToast]);

    const addToPurchaseList = useCallback(async (
        item: InventoryItem, 
        reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL' = 'MANUAL',
        quantity?: number
    ) => {
        if (!currentOrder) return;

        if (currentOrder.items.find(p => p.itemId === item.id)) {
            addToast('Duplicado', 'warning', `O item ${item.name} já está na lista.`);
            navigate('/purchases');
            return;
        }

        const newItem: PurchaseRequestItem = {
            id: crypto.randomUUID(),
            itemId: item.id,
            name: item.name,
            sapCode: item.sapCode,
            currentStock: item.quantity,
            suggestedQty: quantity || (item.minStockLevel > 0 ? item.minStockLevel * 2 : 10),
            unit: item.baseUnit,
            reason: reason,
            status: 'PENDING'
        };

        const updatedOrder = {
            ...currentOrder,
            items: [...currentOrder.items, newItem],
            updatedAt: new Date().toISOString()
        };

        try {
            await db.rawDb.localOrders.put(updatedOrder);
            setCurrentOrder(updatedOrder);
            addToast('Adicionado', 'success', 'Item adicionado à lista de compras.');
            navigate('/purchases');
        } catch (e) {
            console.error("Failed to add item to purchase list", e);
            addToast('Erro', 'error', 'Falha ao salvar item.');
        }
    }, [currentOrder, addToast, navigate]);

    const removeFromPurchaseList = useCallback(async (itemId: string) => {
        if (!currentOrder) return;

        const updatedOrder = {
            ...currentOrder,
            items: currentOrder.items.filter(item => item.id !== itemId), // Note: using item.id (PurchaseRequestItem ID)
            updatedAt: new Date().toISOString()
        };

        try {
            await db.rawDb.localOrders.put(updatedOrder);
            setCurrentOrder(updatedOrder);
        } catch (e) {
            console.error("Failed to remove item", e);
            addToast('Erro', 'error', 'Falha ao remover item.');
        }
    }, [currentOrder, addToast]);

    const updatePurchaseQuantity = useCallback(async (itemId: string, newQty: number) => {
        if (!currentOrder) return;

        const updatedOrder = {
            ...currentOrder,
            items: currentOrder.items.map(p => p.id === itemId ? { ...p, suggestedQty: Math.max(1, newQty) } : p),
            updatedAt: new Date().toISOString()
        };

        try {
            await db.rawDb.localOrders.put(updatedOrder);
            setCurrentOrder(updatedOrder);
        } catch (e) {
            console.error("Failed to update quantity", e);
        }
    }, [currentOrder]);

    const submitOrder = useCallback(async () => {
        if (!currentOrder || currentOrder.items.length === 0) return;

        if (confirm('Deseja confirmar a solicitação de compra para estes itens?')) {
            try {
                // Finalize current order
                const finalOrder: LocalPurchaseOrderDTO = {
                    ...currentOrder,
                    status: 'SUBMITTED',
                    orderNumber: `PO-${Date.now().toString().slice(-8)}`, // Generate formal PO number
                    updatedAt: new Date().toISOString()
                };

                await db.rawDb.localOrders.put(finalOrder);

                // Create new draft immediately
                const newDraft: LocalPurchaseOrderDTO = {
                    id: crypto.randomUUID(),
                    orderNumber: `DRAFT-${Date.now().toString().slice(-6)}`,
                    status: 'DRAFT',
                    items: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await db.rawDb.localOrders.add(newDraft);

                setCurrentOrder(newDraft);
                addToast('Pedido Enviado', 'success', `Solicitação ${finalOrder.orderNumber} gerada com sucesso.`);
                navigate('/dashboard');

            } catch (e) {
                console.error("Failed to submit order", e);
                addToast('Erro', 'error', 'Falha ao enviar pedido.');
            }
        }
    }, [currentOrder, addToast, navigate]);

    return {
        purchaseList: currentOrder ? currentOrder.items : [],
        loading,
        addToPurchaseList,
        removeFromPurchaseList,
        updatePurchaseQuantity,
        submitOrder
    };
};
