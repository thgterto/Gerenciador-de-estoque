
import React from 'react';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
    <table ref={ref} className={`w-full caption-bottom text-sm text-left ${className}`} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={`bg-background-light dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark text-xs uppercase font-semibold text-text-secondary dark:text-slate-400 tracking-wider ${className}`} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={`[&_tr:last-child]:border-0 divide-y divide-border-light dark:divide-border-dark ${className}`} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800 ${className}`}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={`h-12 px-6 py-3 text-left align-middle font-semibold text-text-secondary dark:text-slate-400 [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={`p-4 px-6 align-middle [&:has([role=checkbox])]:pr-0 text-text-main dark:text-white ${className}`} {...props} />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
