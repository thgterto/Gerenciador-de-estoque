import React, { useState, useCallback, useEffect } from 'react';
import { InventoryItem } from '../types';
import { Button, Box, Paper } from '@mui/material';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';
import { useAuth } from '../context/AuthContext';
import { useStockOperations } from '../hooks/useStockOperations';
import { useInventoryFilters } from '../hooks/useInventoryFilters';

import { InventoryKPIs } from './inventory/InventoryKPIs';
import { InventoryFilters } from './inventory/InventoryFilters';
import { InventoryList } from './inventory/InventoryList';

// Icons
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  items: InventoryItem[];
  onActions: {
    edit: (item: InventoryItem) => void;
    move: (item: InventoryItem) => void;
    delete: (id: string, name: string) => void;
    request: () => void;
    qr: (item: InventoryItem) => void;
    viewHistory: (item: InventoryItem) => void;
    clone: (item: InventoryItem) => void; 
  };
  onAddNew?: () => void;
}

export const InventoryTable: React.FC<Props> = ({ items, onActions, onAddNew }) => {
  const { hasRole } = useAuth();
  const { deleteManyItems } = useStockOperations();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
      term, setTerm,
      catFilter, setCatFilter,
      locationFilter, setLocationFilter,
      statusFilter, setStatusFilter,
      hideZeroStock, setHideZeroStock,
      filteredItems,
      flatList,
      uniqueLocations,
      uniqueCategories,
      stats,
      toggleGroupExpand,
      expandedGroups,
      totalGroups
  } = useInventoryFilters(items);

  const handleSelectAll = useCallback((checked: boolean) => {
      if (checked) {
          const allIds = new Set(filteredItems.map(i => i.id));
          setSelectedIds(allIds);
      } else {
          setSelectedIds(new Set());
      }
  }, [filteredItems]);

  const handleSelectGroup = useCallback((groupIds: string[], checked: boolean) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          groupIds.forEach(id => {
              if (checked) newSet.add(id);
              else newSet.delete(id);
          });
          return newSet;
      });
  }, []);

  const handleSelectRow = useCallback((id: string) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  }, []);
  
  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      if (confirm(`Tem certeza que deseja excluir ${selectedIds.size} itens?`)) {
          const success = await deleteManyItems(Array.from(selectedIds));
          if (success) setSelectedIds(new Set());
      }
  };

  const getCategoryIcon = useCallback((cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes('reagente') || c.includes('quimico')) return 'science';
      if (c.includes('vidraria')) return 'biotech';
      if (c.includes('equipamento')) return 'memory';
      if (c.includes('peça') || c.includes('manutencao')) return 'build';
      if (c.includes('consum')) return 'inventory';
      return 'inventory_2'; 
  }, []);

  const copyToClipboard = useCallback((text: string) => {
      if(!text) return;
      navigator.clipboard.writeText(text);
  }, []);

  return (
    <PageContainer scrollable={isMobile}>
        <PageHeader 
            title="Inventário" 
            description="Gerencie lotes, reagentes e vidrarias."
            className="mb-4"
        >
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => alert("Use o menu de Configurações para exportar dados completos.")} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                Exportar
            </Button>
            {onAddNew && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={onAddNew}>
                    Adicionar
                </Button>
            )}
        </PageHeader>

        <InventoryKPIs stats={stats} />

        <InventoryFilters
            term={term} setTerm={setTerm}
            catFilter={catFilter} setCatFilter={setCatFilter}
            locationFilter={locationFilter} setLocationFilter={setLocationFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            hideZeroStock={hideZeroStock} setHideZeroStock={setHideZeroStock}
            uniqueLocations={uniqueLocations}
            uniqueCategories={uniqueCategories}
            getCategoryIcon={getCategoryIcon}
        />

        <InventoryList
            flatList={flatList}
            isMobile={isMobile}
            selectedIds={selectedIds}
            handleSelectGroup={handleSelectGroup}
            handleSelectRow={handleSelectRow}
            onActions={onActions}
            toggleGroupExpand={toggleGroupExpand}
            copyToClipboard={copyToClipboard}
            getCategoryIcon={getCategoryIcon}
            hasRole={hasRole}
            onAddNew={onAddNew}
            totalGroups={totalGroups}
            filteredItemsCount={filteredItems.length}
            hideZeroStock={hideZeroStock}
            handleSelectAll={handleSelectAll}
            expandedGroups={expandedGroups}
        />

        {/* Bulk Actions Snackbar/Floating Bar */}
        {selectedIds.size > 0 && hasRole('ADMIN') && (
            <Paper
                elevation={6}
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'text.primary',
                    color: 'background.paper',
                    px: 3, py: 1.5,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    zIndex: 1300
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {selectedIds.size}
                    </Box>
                    <span className="hidden sm:inline">Itens Selecionados</span>
                </Box>
                <Box sx={{ height: 24, width: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={handleBulkDelete}
                        sx={{ borderRadius: 4 }}
                    >
                        Excluir
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setSelectedIds(new Set())}
                        aria-label="Cancelar seleção"
                        sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 0, p: 1, borderRadius: '50%' }}
                    >
                        <CloseIcon />
                    </Button>
                </Box>
            </Paper>
        )}
    </PageContainer>
  );
};
