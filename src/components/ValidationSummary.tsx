// src/components/ValidationSummary.tsx
import React from 'react';
import { Alert, Typography, List, ListItem, ListItemText, Box } from '@mui/material';
// Import ValidationError from the context file
import { ValidationError } from '../context/ValidationErrorsContext';

interface ValidationSummaryProps {
  errors: ValidationError[];
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ errors }) => {
  if (errors.length === 0) {
    return null; // Don't render anything if there are no errors
  }

  return (
    <Alert severity="error" sx={{ my: 3 }}>
      <Typography variant="h6">Validation Errors Found:</Typography>
      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
        {errors.map((error) => (
          <ListItem key={error.id} sx={{ py: 0.5 }}>
            <ListItemText
              primary={
                <>
                  <Typography component="span" variant="body2" fontWeight="bold">
                    {error.dataSetType === 'cross-dataset' ? 'Cross-Dataset' : error.dataSetType.charAt(0).toUpperCase() + error.dataSetType.slice(1)}{' '}
                    {error.rowId !== 'N/A' && `(Row: ${error.rowId})`}{error.field && `, Field: ${error.field}`}:
                  </Typography>{' '}
                  {error.message}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      {errors.length > 5 && (
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              Scroll within the list to see all errors.
          </Typography>
      )}
    </Alert>
  );
};

export default ValidationSummary;