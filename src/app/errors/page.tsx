'use client'
import React from 'react';
import { Container, Typography, Box, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation'; // To navigate back to home
import ValidationSummary from '../../components/ValidationSummary'; // Re-use the existing summary component
import { useValidationErrors } from '../../context/ValidationErrorsContext'; // Access the errors from context

const ErrorsPage: React.FC = () => {
  // Get validationErrors from the context
  const { validationErrors } = useValidationErrors();
  const router = useRouter(); // Initialize router for navigation

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Validation Errors
        </Typography>
        {/* Button to navigate back to the home page */}
        <Button variant="contained" onClick={() => router.push('/')} sx={{ mb: 3 }}>
          Back to Home
        </Button>
      </Box>

      {/* Use the ValidationSummary component to display the errors */}
      <ValidationSummary errors={validationErrors} />

      {/* Message if no errors are present */}
      {validationErrors.length === 0 && (
        <Alert severity="success" sx={{ mt: 3 }}>
          No validation errors to display. Your data is clean!
        </Alert>
      )}
    </Container>
  );
};

export default ErrorsPage;