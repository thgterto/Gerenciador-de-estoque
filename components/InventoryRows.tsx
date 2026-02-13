import React from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { InventoryItem } from '../types';
import { InventoryGroup } from '../hooks/useInventoryFilters';
import { getItemStatus } from '../utils/businessRules';
import { StatusBadge } from './ui/StatusBadge';
import { formatDate } from '../utils/formatters';
import {
    Box, Checkbox, Typography, IconButton, Tooltip, Chip, Stack
} from '@mui/material';

// Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PrintIcon from '@mui/icons-material/Print';

const GRID_TEMPLATE = "40px minmax(240px, 3fr) 120px minmax(180px, 1.5fr) 100px 100px 130px 110px";

interface ChildRowProps {
    item: InventoryItem;
    style: React.CSSProperties;
    isSelected: boolean;
    isAdmin: boolean;
    onSelect: (id: string) => void;
    onActions: {
        edit: (item: InventoryItem) => void;
        move: (item: InventoryItem) => void;
        delete: (id: string, name: string) => void;
        request: () => void;
        qr: (item: InventoryItem) => void;
        viewHistory: (item: InventoryItem) => void;
        clone: (item: InventoryItem) => void; 
    };
    copyToClipboard: (text: string, label: string) => void;
    isLast: boolean;
}

export const InventoryChildRow = React.memo(({ 
    item, 
    style,
    isSelected, 
    onActions,
    copyToClipboard,
    isLast
}: ChildRowProps) => {
    const status = getItemStatus(item);
    
    let validityContent = formatDate(item.expiryDate);
    let validityColor = status.isExpired ? 'error.main' : 'text.secondary';
    let validityTooltip = "Validade";

    if (item.itemType === 'EQUIPMENT' && item.maintenanceDate) {
        validityContent = `Manut: ${formatDate(item.maintenanceDate)}`;
        validityColor = 'info.main';
        validityTooltip = "Próxima Manutenção";
    } else if (item.itemType === 'GLASSWARE' && item.glassVolume) {
        validityContent = item.glassVolume;
        validityColor = 'text.secondary';
        validityTooltip = "Volume Nominal";
    }

    return (
        <div style={style}>
            <Box
                sx={{
                    height: '100%',
                    position: 'relative',
                    borderBottom: isLast ? 0 : 1,
                    borderColor: 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s'
                }}
            >
                <Box sx={{ position: 'absolute', left: 20, top: 0, bottom: '50%', width: 1, borderLeft: '1px dashed', borderColor: 'divider' }} />
                <Box sx={{ position: 'absolute', left: 20, top: '50%', width: 24, height: 1, borderTop: '1px dashed', borderColor: 'divider' }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE, alignItems: 'center', height: '100%', px: 2 }}>
                    
                    <Box />

                    <Box sx={{ px: 1, pl: 3, display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                        <QrCode2Icon color="action" fontSize="small" />
                        <Tooltip title={`Lote: ${item.lotNumber}`}>
                            <Typography
                                variant="caption"
                                fontFamily="monospace"
                                fontWeight="bold"
                                sx={{
                                    bgcolor: 'action.hover',
                                    px: 0.5,
                                    borderRadius: 0.5,
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main' }
                                }}
                                onClick={() => copyToClipboard(item.lotNumber, 'Lote')}
                            >
                                {item.lotNumber}
                            </Typography>
                        </Tooltip>
                        {item.isGhost && <Chip label="Legado" size="small" variant="outlined" />}
                    </Box>

                    <Box />

                    <Box sx={{ px: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <LocationOnIcon fontSize="inherit" />
                        <Typography variant="caption" noWrap>
                            {item.location.warehouse} {item.location.cabinet ? `› ${item.location.cabinet}` : ''}
                        </Typography>
                    </Box>

                    <Box sx={{ px: 1, textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium">{item.quantity}</Typography>
                    </Box>

                    <Box sx={{ px: 1, textAlign: 'right' }}>
                        <Tooltip title={validityTooltip}>
                            <Typography variant="caption" sx={{ color: validityColor, fontWeight: status.isExpired ? 'bold' : 'normal' }}>
                                {validityContent}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <Box sx={{ px: 1, display: 'flex', justifyContent: 'center' }}>
                        {(status.isExpired || status.isLowStock) && (
                            <StatusBadge status={status} compact showIcon={false} />
                        )}
                    </Box>

                    <Box sx={{ px: 1, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', opacity: 0, transition: 'opacity 0.2s', '.MuiBox-root:hover &': { opacity: 1 } }}>
                        <Tooltip title="Clonar">
                            <IconButton aria-label="Clonar item" size="small" onClick={() => onActions.clone(item)}><ContentCopyIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                            <IconButton aria-label="Editar item" size="small" onClick={() => onActions.edit(item)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Movimentar">
                            <IconButton aria-label="Movimentar item" size="small" onClick={() => onActions.move(item)}><SwapHorizIcon fontSize="small" /></IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
        </div>
    );
});

interface GroupRowProps {
    group: InventoryGroup;
    style: React.CSSProperties;
    isExpanded: boolean;
    toggleExpand: () => void;
    selectedChildIds: Set<string>;
    onSelectGroup: (groupIds: string[], checked: boolean) => void;
    getCategoryIcon: (cat: string) => string;
    copyToClipboard: (text: string, label: string) => void;
}

export const InventoryGroupRow = React.memo(({ 
    group, 
    style,
    isExpanded, 
    toggleExpand, 
    selectedChildIds,
    onSelectGroup,
    getCategoryIcon,
    copyToClipboard
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;
    const allSelected = items.every(i => selectedChildIds.has(i.id));
    const someSelected = items.some(i => selectedChildIds.has(i.id));

    return (
        <div style={style}>
            <Box
                sx={{
                    height: '100%',
                    borderBottom: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    bgcolor: isExpanded ? 'action.selected' : 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={toggleExpand}
            >
                <Box sx={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE, alignItems: 'center', height: '100%', px: 2 }}>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            size="small"
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            onChange={(e) => onSelectGroup(items.map(i => i.id), e.target.checked)}
                        />
                    </Box>

                    <Box sx={{ px: 1, overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                             <Box sx={{
                                 p: 0.5, borderRadius: 1, display: 'flex',
                                 bgcolor: isExpanded ? 'primary.main' : 'action.hover',
                                 color: isExpanded ? 'primary.contrastText' : 'text.secondary'
                             }}>
                                 <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{getCategoryIcon(primaryItem.category)}</span>
                             </Box>
                             <Box sx={{ minWidth: 0 }}>
                                 <Typography variant="body2" fontWeight="bold" noWrap title={primaryItem.name}>
                                     {primaryItem.name}
                                 </Typography>
                                 <Stack direction="row" spacing={1} alignItems="center">
                                     <Typography
                                        variant="caption"
                                        fontFamily="monospace"
                                        color="text.secondary"
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(primaryItem.sapCode, 'SKU'); }}
                                        sx={{ cursor: 'copy', '&:hover': { color: 'primary.main' } }}
                                     >
                                         {primaryItem.sapCode || 'N/A'}
                                     </Typography>
                                     {items.length > 1 && (
                                         <Chip label={`${items.length} lotes`} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                                     )}
                                 </Stack>
                             </Box>
                        </Box>
                    </Box>

                    <Box sx={{ px: 1 }}>
                         <Chip label={primaryItem.category} size="small" />
                    </Box>

                    <Box sx={{ px: 1 }}>
                        <Tooltip title={group.locations.join(', ')}>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {group.locations.length === 1 ? group.locations[0] : `${group.locations.length} locais`}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <Box sx={{ px: 1, textAlign: 'right' }}>
                         <Typography variant="body2" fontWeight="bold">
                            {totalQuantity.toLocaleString('pt-BR')} <Typography component="span" variant="caption" color="text.secondary">{primaryItem.baseUnit}</Typography>
                         </Typography>
                    </Box>

                    <Box sx={{ px: 1, textAlign: 'right' }}>
                        {aggregatedStatus.isExpired ? (
                             <Chip label="Vencidos" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        ) : (
                             <Typography variant="caption" color="text.disabled">--</Typography>
                        )}
                    </Box>

                    <Box sx={{ px: 1, display: 'flex', justifyContent: 'center' }}>
                        <StatusBadge status={aggregatedStatus} compact />
                    </Box>

                    <Box sx={{ px: 1, textAlign: 'right' }}>
                         <ChevronRightIcon
                            color={isExpanded ? 'primary' : 'action'}
                            sx={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                        />
                    </Box>
                </Box>
            </Box>
        </div>
    );
});

export const InventoryMobileGroupRow = React.memo(({ 
    group, 
    style, 
    isExpanded, 
    toggleExpand,
    getCategoryIcon
}: GroupRowProps) => {
    const { primaryItem, totalQuantity, aggregatedStatus, items } = group;

    return (
        <div style={style} className="px-2 pt-2 pb-1">
            <Box
                onClick={toggleExpand}
                sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: 1,
                    borderColor: isExpanded ? 'primary.main' : 'divider',
                    boxShadow: 1,
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ p: 1.5, display: 'flex', gap: 2 }}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: isExpanded ? 'primary.main' : 'action.selected',
                        color: isExpanded ? 'primary.contrastText' : 'text.secondary'
                    }}>
                        <span className="material-symbols-outlined">{getCategoryIcon(primaryItem.category)}</span>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                             <Typography variant="subtitle2" noWrap>{primaryItem.name}</Typography>
                             {items.length > 1 && <Chip label={items.length} size="small" sx={{ height: 20 }} />}
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                             <Typography variant="caption" fontFamily="monospace" sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
                                 {primaryItem.sapCode || 'S/ SAP'}
                             </Typography>
                             {(aggregatedStatus.isExpired || aggregatedStatus.isLowStock) && (
                                <StatusBadge status={aggregatedStatus} compact />
                             )}
                        </Stack>
                    </Box>
                </Box>

                <Box sx={{ px: 1.5, py: 1, bgcolor: isExpanded ? 'primary.light' : 'action.hover', borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <WarehouseIcon fontSize="small" />
                        <Typography variant="caption" noWrap sx={{ maxWidth: 120 }}>{group.locations.join(', ')}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                        {totalQuantity} <Typography component="span" variant="caption">{primaryItem.baseUnit}</Typography>
                    </Typography>
                </Box>
            </Box>
        </div>
    );
});

export const InventoryMobileChildRow = React.memo(({ 
    item, 
    style, 
    onActions
}: ChildRowProps) => {
    const status = getItemStatus(item);
    const controls = useAnimation();
    
    let validityInfo = formatDate(item.expiryDate);
    if (item.itemType === 'EQUIPMENT' && item.maintenanceDate) validityInfo = `Manut: ${formatDate(item.maintenanceDate)}`;
    else if (item.itemType === 'GLASSWARE' && item.glassVolume) validityInfo = item.glassVolume;

    const handleDragEnd = async ( _event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        if (offset < -100) {
            await controls.start({ x: -100 });
            onActions.edit(item);
            controls.start({ x: 0 });
        } else if (offset > 100) {
            await controls.start({ x: 100 });
            onActions.move(item);
            controls.start({ x: 0 });
        } else {
            controls.start({ x: 0 });
        }
    };

    return (
        <div style={style} className="px-2 pl-4 pb-1">
             <Box sx={{ position: 'absolute', insetY: 4, left: 16, right: 8, borderRadius: 2, display: 'flex', overflow: 'hidden' }}>
                <Box sx={{ width: '50%', bgcolor: 'info.main', display: 'flex', alignItems: 'center', pl: 2, color: 'white' }}>
                    <SwapHorizIcon />
                </Box>
                <Box sx={{ width: '50%', bgcolor: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'end', pr: 2, color: 'white' }}>
                    <EditIcon />
                </Box>
             </Box>

             <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ position: 'relative', zIndex: 10 }}
             >
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 1.5, border: 1, borderColor: 'divider', boxShadow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <QrCode2Icon color="primary" fontSize="small" />
                                <Typography variant="body2" fontFamily="monospace" fontWeight="bold">{item.lotNumber}</Typography>
                            </Stack>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                                <LocationOnIcon fontSize="inherit" />
                                <Typography variant="caption">{item.location.warehouse} {item.location.cabinet ? `• ${item.location.cabinet}` : ''}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                             <Typography variant="body2" fontWeight="bold">
                                 {item.quantity} <Typography component="span" variant="caption">{item.baseUnit}</Typography>
                             </Typography>
                             <Typography variant="caption" color={status.isExpired ? 'error' : 'text.secondary'} display="block">
                                 {validityInfo}
                             </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        <IconButton aria-label="Movimentar item" size="small" onClick={(e) => { e.stopPropagation(); onActions.move(item); }}><SwapHorizIcon /></IconButton>
                        <IconButton aria-label="Clonar item" size="small" onClick={(e) => { e.stopPropagation(); onActions.clone(item); }}><ContentCopyIcon /></IconButton>
                        <IconButton aria-label="Editar item" size="small" onClick={(e) => { e.stopPropagation(); onActions.edit(item); }}><EditIcon /></IconButton>
                        <IconButton aria-label="Imprimir etiqueta" size="small" onClick={(e) => { e.stopPropagation(); onActions.qr(item); }}><PrintIcon /></IconButton>
                    </Box>
                </Box>
             </motion.div>
        </div>
    );
});
