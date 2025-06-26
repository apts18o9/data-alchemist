import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  Box,
} from '@mui/material';

// Define a type for a column definition
export interface Column<T> {
  id: keyof T; // Key of the data object
  label: string; // Display label for the column header
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string; 
}

interface DataTableProps<T extends object> {
  data: T[]; // Array of data objects
  columns: Column<T>[]; // Array of column definitions
  title: string; // Title for the table
}

const DataTable = <T extends object>({ data, columns, title }: DataTableProps<T>) => {
  if (data.length === 0) {
    return (
      <Box sx={{ my: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          No data available for {title.toLowerCase()}. Please upload a file.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label={`${title} table`}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={rowIndex}>
                {columns.map((column) => {
                  const value = row[column.id];
                  return (
                    <TableCell key={column.id as string} align={column.align}>
                      {column.format ? column.format(value) : String(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DataTable;