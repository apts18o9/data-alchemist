'use client'
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { GridRowId } from '@mui/x-data-grid';

// Define the ValidationError interface
export interface ValidationError {
  id: string; // Unique ID for the error (e.g., rowId-field-errorType)
  rowId: GridRowId | 'N/A'; // Can be 'N/A' for cross-dataset errors
  field: string;
  message: string;
  severity: 'error' | 'warning';
  dataSetType: 'clients' | 'workers' | 'tasks' | 'cross-dataset'; // To know which dataset the error belongs to
}

// Define the shape of our context value
interface ValidationErrorsContextType {
  validationErrors: ValidationError[];
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationError[]>>;
}

// Create the context with an undefined initial value (will be set by the Provider)
const ValidationErrorsContext = createContext<ValidationErrorsContextType | undefined>(undefined);

// Define the props for our provider component
interface ValidationErrorsProviderProps {
  children: ReactNode; // This allows the provider to wrap other components
}

// The provider component that manages the state and provides it to consumers
export const ValidationErrorsProvider: React.FC<ValidationErrorsProviderProps> = ({ children }) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // The value that will be exposed to consumers of this context
  const contextValue = {
    validationErrors,
    setValidationErrors,
  };

  return (
    <ValidationErrorsContext.Provider value={contextValue}>
      {children}
    </ValidationErrorsContext.Provider>
  );
};

// Custom hook to easily consume the context
export const useValidationErrors = () => {
  const context = useContext(ValidationErrorsContext);
  if (context === undefined) {
    throw new Error('useValidationErrors must be used within a ValidationErrorsProvider');
  }
  return context;
};