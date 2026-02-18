
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem } from '../types';

// Simple formatter if not imported to avoid circular deps or complex imports
const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

export class ReportGenerator {
    private static addHeader(doc: jsPDF, title: string) {
        const pageWidth = doc.internal.pageSize.width;

        // Logo Placeholder (Text for now)
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("LabControl UMV", 14, 20);

        // Title
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text(title, 14, 30);

        // Timestamp
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 14, 20, { align: 'right' });

        // Line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 35, pageWidth - 14, 35);
    }

    static generateInventoryReport(items: InventoryItem[]) {
        const doc = new jsPDF();
        this.addHeader(doc, "Relatório Geral de Inventário");

        const tableData = items.map(item => [
            item.sapCode || '-',
            item.name,
            item.lotNumber,
            formatDate(item.expiryDate),
            `${item.quantity} ${item.baseUnit}`,
            `${item.location.warehouse} > ${item.location.cabinet}`
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['SAP', 'Produto', 'Lote', 'Validade', 'Qtd', 'Local']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`inventario_geral_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    static generateControlledReport(items: InventoryItem[]) {
        const doc = new jsPDF();
        this.addHeader(doc, "Relatório de Produtos Controlados");

        const controlledItems = items.filter(i => i.isControlled);

        const tableData = controlledItems.map(item => [
            item.casNumber || '-',
            item.name,
            item.molecularFormula || '-',
            `${item.quantity} ${item.baseUnit}`,
            item.risks ? Object.keys(item.risks).filter(k => (item.risks as any)[k]).join(', ') : '-'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['CAS', 'Produto', 'Fórmula', 'Saldo Atual', 'Riscos']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [192, 57, 43] } // Red for controlled
        });

        // Footer note
        const finalY = (doc as any).lastAutoTable.finalY || 40;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Este documento é confidencial e contém informações sobre substâncias controladas.", 14, finalY + 10);

        doc.save(`controlados_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}
