// FIX: Changed the import for jsPDF from a default to a named import. This resolves the TypeScript error 'module "jspdf" cannot be found' during module augmentation, as `jsPDF` is exported as a named class.
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Property, Transaction, MaintenanceRequest, Tradesperson } from '../types';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// --- CSV UTILITIES ---

function convertToCSV<T extends object>(data: T[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj =>
    headers.map(header => {
      let value = (obj as any)[header];
      if (typeof value === 'string') {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- EXPORT FUNCTIONS ---

const getFormattedDate = () => new Date().toISOString().split('T')[0];

// Properties
export const exportProperties = (properties: Property[], format: 'csv' | 'pdf') => {
  if (format === 'csv') {
    const data = properties.map(({ id, ...rest }) => rest);
    const csv = convertToCSV(data);
    downloadFile(csv, `properties-${getFormattedDate()}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const doc = new jsPDF();
    doc.text('Property List', 14, 16);
    doc.autoTable({
      head: [['Address', 'Type', 'Status', 'Rent Status', 'Current Rent']],
      body: properties.map(p => [p.address, p.type, p.status, p.rentStatus, `£${p.currentRent}`]),
      startY: 20,
    });
    doc.save(`properties-${getFormattedDate()}.pdf`);
  }
};

// Transactions
export const exportTransactions = (transactions: Transaction[], format: 'csv' | 'pdf') => {
  if (format === 'csv') {
    const data = transactions.map(({ id, propertyId, ...rest }) => rest);
    const csv = convertToCSV(data);
    downloadFile(csv, `transactions-${getFormattedDate()}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const doc = new jsPDF();
    doc.text('Transaction History', 14, 16);
    doc.autoTable({
      head: [['Date', 'Property', 'Description', 'Type', 'Amount']],
      body: transactions.map(t => [t.date, t.propertyAddress, t.description, t.type, `£${t.amount.toFixed(2)}`]),
      startY: 20,
    });
    doc.save(`transactions-${getFormattedDate()}.pdf`);
  }
};

// Maintenance
export const exportMaintenance = (
  requests: MaintenanceRequest[],
  tradespeople: Tradesperson[],
  format: 'csv' | 'pdf'
) => {
    const tradespeopleMap = new Map(tradespeople.map(t => [t.id, t.name]));
    const data = requests.map(r => ({
        reportedDate: r.reportedDate,
        property: r.propertyAddress,
        issue: r.issue,
        status: r.status,
        urgency: r.urgency,
        assignedTo: r.assignedTradespersonId ? tradespeopleMap.get(r.assignedTradespersonId) || 'N/A' : 'N/A',
        cost: `£${r.cost.toFixed(2)}`
    }));

  if (format === 'csv') {
    const csv = convertToCSV(data);
    downloadFile(csv, `maintenance-${getFormattedDate()}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const doc = new jsPDF();
    doc.text('Maintenance Records', 14, 16);
    doc.autoTable({
      head: [['Date', 'Property', 'Issue', 'Status', 'Urgency', 'Assigned To', 'Cost']],
      body: data.map(r => Object.values(r)),
      startY: 20,
    });
    doc.save(`maintenance-${getFormattedDate()}.pdf`);
  }
};
