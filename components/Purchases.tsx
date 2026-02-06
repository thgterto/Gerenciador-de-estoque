import React, { useState, useMemo } from 'react';
import { InventoryItem, PurchaseRequestItem } from '../types';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import {
    Box,
    Button,
    Typography,
    Paper,
    Stack,
    TextField,
    InputAdornment,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Checkbox,
    Popover
} from '@mui/material';

// Icons
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';

interface PurchasesProps {
  items: InventoryItem[];
  purchaseList: PurchaseRequestItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onSubmit: () => void;
  onAdd: (item: InventoryItem) => void;
}

export const Purchases: React.FC<PurchasesProps> = ({ 
    items, 
    purchaseList, 
    onRemove, 
    onUpdateQuantity, 
    onSubmit,
    onAdd
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const totalQuantity = useMemo(() => purchaseList.reduce((acc, item) => acc + item.requestedQty, 0), [purchaseList]);

    const searchResults = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        const term = searchQuery.toLowerCase();
        return items
            .filter(i => i.name.toLowerCase().includes(term) || i.sapCode?.toLowerCase().includes(term))
            .slice(0, 10);
    }, [items, searchQuery]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        if (event.target.value.length >= 2) {
            setAnchorEl(event.target.parentElement);
        } else {
            setAnchorEl(null);
        }
    };

    const handleAdd = (item: InventoryItem) => {
        onAdd(item);
        setSearchQuery('');
        setAnchorEl(null);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl) && searchResults.length > 0;

    return (
        <PageContainer scrollable>
            <PageHeader 
                title="Gestão de Compras"
                description="Central de requisições e reposição de estoque."
            >
                <Button 
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={purchaseList.length === 0}
                    onClick={onSubmit}
                    size="large"
                >
                    Enviar Pedido
                </Button>
            </PageHeader>

            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
                {/* Search & Add Bar */}
                <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }} variant="outlined">
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <TextField
                            fullWidth
                            placeholder="Buscar item para adicionar..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                        <Popover
                            open={open}
                            anchorEl={anchorEl}
                            onClose={handlePopoverClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            PaperProps={{ sx: { width: anchorEl?.clientWidth, maxHeight: 300 } }}
                            disableAutoFocus
                            disableEnforceFocus
                        >
                            <List dense>
                                {searchResults.map((res) => (
                                    <ListItemButton
                                        key={res.id}
                                        onClick={() => handleAdd(res)}
                                        divider
                                    >
                                        <ListItemText
                                            primary={<Typography variant="subtitle2">{res.name}</Typography>}
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    SAP: {res.sapCode} • Estoque: {res.quantity} {res.baseUnit}
                                                </Typography>
                                            }
                                        />
                                        <AddCircleIcon color="primary" />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Popover>
                    </Box>
                </Paper>

                {/* List Content */}
                {purchaseList.length > 0 ? (
                    <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Table containerClassName="flex-1 overflow-auto">
                            <TableHeader>
                                <TableRow>
                                    <TableHead sx={{ width: 48 }}>
                                        <Checkbox size="small" checked disabled />
                                    </TableHead>
                                    <TableHead>Item / Detalhes</TableHead>
                                    <TableHead>Código SAP</TableHead>
                                    <TableHead align="center">Estoque Atual</TableHead>
                                    <TableHead align="center" sx={{ width: 140 }}>Qtd. Compra</TableHead>
                                    <TableHead align="right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseList.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Checkbox size="small" checked />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="bold">{item.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">Unidade: {item.unit}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace">{item.sapCode || '-'}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                             <Badge variant={item.currentStock <= 0 ? 'danger' : 'neutral'} withDot={item.currentStock > 0}>
                                                {item.currentStock}
                                             </Badge>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onUpdateQuantity(item.id, item.requestedQty - 1)}
                                                    color="primary"
                                                >
                                                    <RemoveIcon fontSize="small" />
                                                </IconButton>
                                                <Typography variant="body2" fontWeight="bold" sx={{ px: 1, minWidth: 24, textAlign: 'center' }}>
                                                    {item.requestedQty}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onUpdateQuantity(item.id, item.requestedQty + 1)}
                                                    color="primary"
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                onClick={() => onRemove(item.id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Mostrando <strong>{purchaseList.length}</strong> itens
                            </Typography>
                            <Box textAlign="right">
                                <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                    Quantidade Total
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    {totalQuantity} <Typography component="span" variant="caption">unidades</Typography>
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                ) : (
                    <EmptyState 
                        title="Lista de compras vazia" 
                        description="Adicione itens manualmente ou através dos alertas de estoque baixo."
                        icon="shopping_basket"
                    />
                )}
            </Box>
        </PageContainer>
    );
};
