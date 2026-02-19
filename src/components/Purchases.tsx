
import React, { useState, useMemo } from 'react';
import { InventoryItem, PurchaseItem } from '../types';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';
import { EmptyState } from './ui/EmptyState';
import { OrbitalCard } from './ui/orbital/OrbitalCard';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { OrbitalTable, OrbitalHead, OrbitalBody, OrbitalRow, OrbitalTh, OrbitalTd } from './ui/orbital/OrbitalTable';
import { OrbitalBadge } from './ui/orbital/OrbitalBadge';
import { OrbitalInput } from './ui/orbital/OrbitalInput';
import { PurchaseAlertCard } from './PurchaseAlertCard';
import {
    Trash2,
    Send,
    Plus,
    FileText,
    AlertTriangle,
    Search
} from 'lucide-react';
import { RequestModal } from './Modals';

interface Props {
  items: InventoryItem[];
  purchaseList: PurchaseItem[];
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onSubmit: () => void;
  onAdd: (item: InventoryItem) => void;
}

export const Purchases: React.FC<Props> = ({
    items, 
    purchaseList, 
    onRemove, 
    onUpdateQuantity, 
    onSubmit,
    onAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Filter recommendations: Low stock or Expiring
  const recommendations = useMemo(() => {
      if (!items) return [];
      return items.filter(i => {
          const isLow = i.quantity <= i.minStockLevel;
          const daysToExpiry = i.expiryDate ? Math.ceil((new Date(i.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
          const isExpiring = daysToExpiry < 30;
          const alreadyInList = purchaseList.some(p => p.id === i.id);
          return (isLow || isExpiring) && !alreadyInList;
      }).slice(0, 6);
  }, [items, purchaseList]);

  // Filtered List
  const filteredList = useMemo(() => {
      return purchaseList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [purchaseList, searchTerm]);

  return (
    <PageContainer scrollable>
        <PageHeader
            title="Gestão de Compras"
            description="Planejamento e solicitação de reposição de estoque."
        >
            <div className="flex gap-3">
                <OrbitalButton
                    variant="outline"
                    icon={<FileText size={16} />}
                    onClick={() => {}} // TODO: Export list
                >
                    Exportar Lista
                </OrbitalButton>
                <OrbitalButton
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={() => setShowRequestModal(true)}
                >
                    Adicionar Item
                </OrbitalButton>
            </div>
        </PageHeader>

        {/* Recommendations Row */}
        {recommendations.length > 0 && (
            <div className="mb-8 animate-fade-in">
                <div className="flex items-center gap-2 mb-4 text-orbital-warning">
                    <AlertTriangle size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Sugestões de Reposição</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-2">
                    {recommendations.map(item => {
                        const daysToExpiry = item.expiryDate ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
                        const reason = daysToExpiry < 30 ? 'EXPIRING' : 'LOW_STOCK';
                        return (
                            <PurchaseAlertCard 
                                key={item.id}
                                item={item}
                                onAdd={onAdd}
                                reason={reason}
                            />
                        );
                    })}
                </div>
            </div>
        )}

        {/* Purchase List */}
        <OrbitalCard className="min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-orbital-text uppercase tracking-wide">Lista de Pedidos</h3>
                    <span className="bg-orbital-accent text-orbital-bg text-xs font-bold px-2 py-0.5 rounded-full">
                        {purchaseList.length}
                    </span>
                </div>
                <div className="w-64">
                    <OrbitalInput
                        placeholder="Buscar na lista..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        startAdornment={<Search size={14} />}
                    />
                </div>
            </div>

            {filteredList.length > 0 ? (
                <div className="overflow-x-auto">
                    <OrbitalTable>
                        <OrbitalHead>
                            <OrbitalRow isHoverable={false}>
                                <OrbitalTh>Item / SKU</OrbitalTh>
                                <OrbitalTh>Motivo</OrbitalTh>
                                <OrbitalTh>Atual</OrbitalTh>
                                <OrbitalTh>Solicitado</OrbitalTh>
                                <OrbitalTh align="right">Ações</OrbitalTh>
                            </OrbitalRow>
                        </OrbitalHead>
                        <OrbitalBody>
                            {filteredList.map(item => (
                                <OrbitalRow key={item.id}>
                                    <OrbitalTd>
                                        <div className="font-bold text-orbital-text">{item.name}</div>
                                        <div className="text-xs text-orbital-subtext font-mono">{item.sapCode}</div>
                                    </OrbitalTd>
                                    <OrbitalTd>
                                        <OrbitalBadge
                                            label={item.reason === 'LOW_STOCK' ? 'Estoque Baixo' : item.reason === 'EXPIRING' ? 'Vencimento' : 'Manual'}
                                            variant={item.reason === 'LOW_STOCK' ? 'warning' : item.reason === 'EXPIRING' ? 'danger' : 'info'}
                                        />
                                    </OrbitalTd>
                                    <OrbitalTd>
                                        {item.currentStock} {item.unit}
                                    </OrbitalTd>
                                    <OrbitalTd>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                className="w-6 h-6 flex items-center justify-center rounded border border-orbital-border hover:bg-orbital-surface hover:text-orbital-accent transition-colors"
                                                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.suggestedQty - 1))}
                                            >
                                                -
                                            </button>
                                            <span className="font-bold text-orbital-text w-8 text-center">{item.suggestedQty}</span>
                                            <button
                                                className="w-6 h-6 flex items-center justify-center rounded border border-orbital-border hover:bg-orbital-surface hover:text-orbital-accent transition-colors"
                                                onClick={() => onUpdateQuantity(item.id, item.suggestedQty + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </OrbitalTd>
                                    <OrbitalTd align="right">
                                        <OrbitalButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemove(item.id)}
                                            className="text-orbital-subtext hover:text-orbital-danger"
                                        >
                                            <Trash2 size={16} />
                                        </OrbitalButton>
                                    </OrbitalTd>
                                </OrbitalRow>
                            ))}
                        </OrbitalBody>
                    </OrbitalTable>
                </div>
            ) : (
                <EmptyState
                    title="Lista Vazia"
                    description="Adicione itens manualmente ou selecione das recomendações acima."
                    icon="shopping_cart"
                />
            )}

            {filteredList.length > 0 && (
                <div className="mt-6 flex justify-end pt-4 border-t border-orbital-border">
                    <OrbitalButton
                        variant="primary"
                        size="lg"
                        onClick={onSubmit}
                        icon={<Send size={16} />}
                    >
                        Finalizar Pedido
                    </OrbitalButton>
                </div>
            )}
        </OrbitalCard>

        <RequestModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            onConfirm={(item, qty) => {
                onAdd({...item}); // Ensure item matches expected type structure if needed, or update onAdd signature
                onUpdateQuantity(item.id, qty);
            }}
            items={items} // Pass all items for selection
        />
    </PageContainer>
  );
};
