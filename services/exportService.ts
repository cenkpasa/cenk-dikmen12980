import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data: any[], columns: any[], fileName: string) => {
    const exportData = data.map(row => {
        const newRow: Record<string, any> = {};
        columns.forEach(col => {
            newRow[col.header] = col.accessor(row);
        });
        return newRow;
    });
    
    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Rapor');
    writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPdf = (data: any[], columns: any[], title: string, fileName: string) => {
    const doc = new jsPDF();
    
    doc.text(title, 14, 20);

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => String(col.accessor(row)))),
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${fileName}.pdf`);
};
