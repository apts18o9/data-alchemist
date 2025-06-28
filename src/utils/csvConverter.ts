// src/utils/csvConverter.ts
export function convertToCsv<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from the first object, excluding 'id' which is internal to DataGrid
  // Ensure the order of headers is consistent if possible, though Object.keys generally preserves insertion order.
  const headers = Object.keys(data[0]).filter(key => key !== 'id');

  // Create CSV header row, enclosing in double quotes to handle spaces/special characters
  const csvHeader = headers.map(header => `"${header}"`).join(',');

  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      if (value === null || value === undefined) {
        value = ''; // Convert null/undefined to empty string
      } else if (typeof value === 'string') {
        // Escape double quotes by doubling them, then enclose the whole value in double quotes
        value = `"${value.replace(/"/g, '""')}"`;
      } else {
        // Convert non-string values to string
        value = String(value);
      }
      return value;
    }).join(',');
  });

  return [csvHeader, ...csvRows].join('\n');
}