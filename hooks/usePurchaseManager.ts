
import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, PurchaseRequestItem } from '../types';
import { useAlert } from '../context/AlertContext';
import { useNavigate } from 'react-router-dom';

const SESSION_KEYS = {
    PURCHASE_LIST: 'LC_PURCHASE_LIST_CACHE'
};

export const usePurchaseManager = () => {
    const { addToast } = useAlert();
    const navigate = useNavigate();

    const [purchaseList, setPurchaseList] = useState<PurchaseRequestItem[]>(() => {
        try {
            const saved = localStorage.getItem(SESSION_KEYS.PURCHASE_LIST);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Persist changes
    useEffect(() => {
        localStorage.setItem(SESSION_KEYS.PURCHASE_LIST, JSON.stringify(purchaseList));
    }, [purchaseList]);

    const addToPurchaseList = useCallback((
        item: InventoryItem, 
        reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL' = 'MANUAL',
        quantity?: number
    ) => {
        if (purchaseList.find(p => p.itemId === item.id)) {
            addToast('Duplicado', 'warning', `O item ${item.name} já está na lista.`);
            navigate('/purchases');
            return;
        }

        const newItem: PurchaseRequestItem = {
            id: Math.random().toString(36).substr(2, 9),
            itemId: item.id,
            name: item.name,
            sapCode: item.sapCode,
            currentStock: item.quantity,
            requestedQty: quantity || (item.minStockLevel > 0 ? item.minStockLevel * 2 : 10),
            unit: item.baseUnit,
            reason: reason,
            status: 'PENDING'
        };

        setPurchaseList(prev => [...prev, newItem]);
        addToast('Adicionado', 'success', 'Item adicionado à lista de compras.');
        navigate('/purchases');
    }, [purchaseList, addToast, navigate]);

    const removeFromPurchaseList = useCallback((id: string) => {
        setPurchaseList(prev => prev.filter(item => item.id !== id));
    }, []);

    const updatePurchaseQuantity = useCallback((id: string, newQty: number) => {
        setPurchaseList(prev => prev.map(p => p.id === id ? { ...p, requestedQty: Math.max(1, newQty) } : p));
    }, []);

    const submitOrder = useCallback(() => {
        if (purchaseList.length === 0) return;
        if (confirm('Deseja confirmar a solicitação de compra para estes itens?')) {
            setTimeout(() => {
                addToast('Pedido Enviado', 'success', `Solicitação PO-${Math.floor(Math.random() * 100000)} gerada.`);
                setPurchaseList([]);
                navigate('/dashboard');
            }, 500);
        }
    }, [purchaseList, addToast, navigate]);

    return {
        purchaseList,
        addToPurchaseList,
        removeFromPurchaseList,
        updatePurchaseQuantity,
        submitOrder
    };
};
