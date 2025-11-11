/* eslint-disable @typescript-eslint/no-explicit-any */
import { read, utils, writeFile } from 'xlsx';
import { saveAs } from 'file-saver';
import { ColumnConfig } from '@/components/ui/data-display/CommonTable';

// Helper function to get nested values
const getNestedValue = (obj: any, path: string) => {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

export const exportSelectedData = (
  data: any[],
  selectedRows: any[],
  columns: ColumnConfig[],
  fileName: string,
  format: 'csv' | 'xlsx' = 'xlsx'
) => {
  const dataToExport = selectedRows && selectedRows.length > 0 ? selectedRows : data;
  
  const exportColumns = columns.filter(col => col.dataType !== 'action');
  const headers = exportColumns.map(col => col.key);
  
  const exportData = dataToExport.map(item => {
    const row: Record<string, any> = {};
    exportColumns.forEach(col => {
      row[col.key] = getNestedValue(item, col.key);
    });
    return row;
  });

  // Create worksheet
  const worksheet = utils.json_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Generate file based on format
  if (format === 'csv') {
    const csvOutput = utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  } else {
    writeFile(workbook, `${fileName}.xlsx`, { bookType: 'xlsx' });
  }
};

// Import data from file and return parsed data
export const importDataFromFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(firstSheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};



export const exportData = (
  data: any[],
  columns: ColumnConfig[],
  fileName: string,
  format: 'csv' | 'xlsx'
) => {
  // Prepare data for export (only include selected columns)
  const exportColumns = columns.filter(col => col.dataType !== 'action' && col.key !=='id');
  const headers = exportColumns.map(col => col.title);
  
  // Transform data to match headers
  const exportData = data.map(item => {
    const row: Record<string, any> = {};
    exportColumns.forEach(col => {
      row[col.key] = getNestedValue(item, col.key);
    });
    return row;
  });

  // Create worksheet
  const worksheet = utils.json_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Generate file based on format
  if (format === 'csv') {
    const csvOutput = utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  } else {
    writeFile(workbook, `${fileName}.xlsx`, { bookType: 'xlsx' });
  }
};
