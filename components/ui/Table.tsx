import React from 'react';
import {
    Table as MuiTable,
    TableBody as MuiTableBody,
    TableCell as MuiTableCell,
    TableContainer as MuiTableContainer,
    TableHead as MuiTableHead,
    TableRow as MuiTableRow,
    Paper
} from '@mui/material';

// Table: Wraps MuiTable in a TableContainer
export const Table = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof MuiTable> & { containerClassName?: string }>(
    ({ className, containerClassName, children, ...props }, ref) => (
    <MuiTableContainer
        component={Paper}
        variant="outlined"
        className={containerClassName}
        sx={{ width: '100%', overflowX: 'auto', borderRadius: 2 }}
        ref={ref}
    >
        <MuiTable className={className} {...props}>
            {children}
        </MuiTable>
    </MuiTableContainer>
));
Table.displayName = "Table";

// TableHeader: Maps to MuiTableHead
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<typeof MuiTableHead>>(
    ({ className, ...props }, ref) => (
    <MuiTableHead
        ref={ref}
        className={className}
        sx={{
            bgcolor: 'action.hover',
            '& th': {
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em'
            }
        }}
        {...props}
    />
));
TableHeader.displayName = "TableHeader";

// TableBody: Maps to MuiTableBody
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<typeof MuiTableBody>>(
    ({ className, ...props }, ref) => (
    <MuiTableBody ref={ref} className={className} {...props} />
));
TableBody.displayName = "TableBody";

// TableRow: Maps to MuiTableRow
export const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentProps<typeof MuiTableRow>>(
    ({ className, hover = true, ...props }, ref) => (
    <MuiTableRow
        ref={ref}
        hover={hover}
        className={className}
        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        {...props}
    />
));
TableRow.displayName = "TableRow";

// TableHead: Maps to MuiTableCell (variant="head") - Used for TH elements
export const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentProps<typeof MuiTableCell>>(
    ({ className, ...props }, ref) => (
    <MuiTableCell
        ref={ref}
        variant="head"
        className={className}
        {...props}
    />
));
TableHead.displayName = "TableHead";

// TableCell: Maps to MuiTableCell (standard) - Used for TD elements
export const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentProps<typeof MuiTableCell>>(
    ({ className, ...props }, ref) => (
    <MuiTableCell
        ref={ref}
        className={className}
        {...props}
    />
));
TableCell.displayName = "TableCell";
