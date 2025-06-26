import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const xlsxParsingLogic = (file: File, e:ProgressEvent<FileReader>) => {
    let parsedData : any[] = [];

    const data = new Uint8Array(e.target?.result as ArrayBuffer)

    const workbook = XLSX.read(data, {type: 'array'})
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    return parsedData
}

export const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let parsedData: any[] = [];
        if (file.name.endsWith('.csv')) {
          const csvText = e.target?.result as string;
          Papa.parse(csvText, {
            header: true, // Treat first row as headers
            skipEmptyLines: true,
            complete: (results) => {
              // PapaParse returns data in results.data
              parsedData = results.data;
              resolve(parsedData);
            },
            error: (error: any) => {
              reject(new Error(`CSV parsing error: ${error.message}`));
            }
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          resolve(parsedData);
        } else {
          reject(new Error('Unsupported file type. Please upload a CSV or XLSX file.'));
        }
      } catch (error: any) {
        // Catch any errors during file reading or initial parsing attempts
        reject(new Error(`Error reading or parsing file: ${error.message || 'Unknown error'}`));
      }
    };

    reader.onerror = (error) => {
      reject(new Error(`FileReader error: ${reader.error?.message || 'Unknown error'}`));
    };

    // Determine how to read the file based on its extension
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsArrayBuffer(file);
    } else {
      
      reject(new Error('Unsupported file type. Please upload a CSV or XLSX file.'));
    }
  });
};