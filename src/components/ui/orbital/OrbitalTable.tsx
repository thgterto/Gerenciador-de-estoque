import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    align?: 'left' | 'center' | 'right';
}

interface OrbitalTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    loading?: boolean;
}

export const OrbitalTable = <T extends { id: string | number }>({
    data,
    columns,
    onRowClick,
    emptyMessage = "No data available",
    loading = false
}: OrbitalTableProps<T>) => {

    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center text-orbital-primary animate-pulse font-mono">
                INITIALIZING DATA STREAM...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-32 flex items-center justify-center text-gray-500 font-mono italic border border-orbital-border border-dashed rounded-sm bg-orbital-card/20">
                // {emptyMessage}
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-sm border border-orbital-border bg-orbital-card shadow-orbital">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-orbital-bg/80 border-b border-orbital-border text-xs font-mono text-gray-400 uppercase tracking-wider">
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className={`p-4 font-normal ${col.className || ''} text-${col.align || 'left'}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-orbital-border/30 font-mono text-sm">
                    {data.map((row, rowIdx) => (
                        <tr
                            key={row.id}
                            onClick={() => onRowClick && onRowClick(row)}
                            className={`
                                group transition-colors duration-150
                                ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}
                                ${rowIdx % 2 === 0 ? 'bg-orbital-card/50' : 'bg-orbital-card/30'}
                            `}
                        >
                            {columns.map((col, colIdx) => (
                                <td
                                    key={colIdx}
                                    className={`p-4 text-gray-300 group-hover:text-white transition-colors text-${col.align || 'left'}`}
                                >
                                    {typeof col.accessor === 'function'
                                        ? col.accessor(row)
                                        : (row[col.accessor] as React.ReactNode)
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
