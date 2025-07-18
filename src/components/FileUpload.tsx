// src/components/FileUpload.tsx
import React, { ChangeEvent, useState } from 'react';
import { Button, Box, Typography, CircularProgress, Alert } from '@mui/material'; // Import Alert
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { parseFile } from '../utils/fileParser';

interface FileUploadProps {
  id: string;
  label: string;
  fileType: 'clients' | 'workers' | 'tasks';
  onFileUpload: (fileType: 'clients' | 'workers' | 'tasks', data: any[], fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ id, label, fileType, onFileUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      setLoading(true);
      setUploadError(null); // Clear previous errors

      try {
        const parsedData = await parseFile(file);
        onFileUpload(fileType, parsedData, file.name);
      } catch (error: any) {
        console.error("File processing error:", error);
        setUploadError(error.message || `Failed to process file: ${file.name}`);
        onFileUpload(fileType, [], file.name); // Notify parent of error with empty data
      } finally {
        setLoading(false);
        // Clear the file input value to allow re-uploading the same file
        event.target.value = '';
      }
    } else {
      setFileName(null);
      setUploadError(null);
    }
  };

  return (
    <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, width: '30%', minWidth: 250, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>{label}</Typography>
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Select File'}
        <input
          id={id}
          type="file"
          hidden
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
        />
      </Button>
      {fileName && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Selected: {fileName}
        </Typography>
      )}
      {loading && (
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Parsing...
          </Typography>
      )}
      {uploadError && (
        // Changed from Typography to Alert for more prominent error display
        <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
          {uploadError}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;