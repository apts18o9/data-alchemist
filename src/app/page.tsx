// pages/index.tsx
'use client'

import React, { useState } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import FileUpload from '../components/FileUpload';

// Define types for your parsed data, adjust as needed

interface ClientData {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON: string;
}

interface WorkerData {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: string; // Will parse to array later
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: string;
}

interface TaskData {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string; // Will parse to array/range later
  MaxConcurrent: number;
}

export default function HomePage() {
  const [clientsData, setClientsData] = useState<ClientData[]>([]);
  const [workersData, setWorkersData] = useState<WorkerData[]>([]);
  const [tasksData, setTasksData] = useState<TaskData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // This handler will receive parsed data from the FileUpload component
  const handleFileUpload = (
    fileType: 'clients' | 'workers' | 'tasks',
    data: any[], // Use 'any' for now, will refine with validation in Phase 2
    fileName: string
  ) => {
    setError(null); // Clear previous errors
    try {
      // Basic check for data structure - more detailed validation in Phase 2
      if (data.length === 0) {
        throw new Error(`The uploaded file '${fileName}' appears to be empty or malformed.`);
      }

      // Assign data based on fileType
      switch (fileType) {
        case 'clients':
          // Basic type assertion and assignment
          setClientsData(data as ClientData[]);
          console.log(`Clients data loaded from ${fileName}:`, data);
          break;
        case 'workers':
          setWorkersData(data as WorkerData[]);
          console.log(`Workers data loaded from ${fileName}:`, data);
          break;
        case 'tasks':
          setTasksData(data as TaskData[]);
          console.log(`Tasks data loaded from ${fileName}:`, data);
          break;
        default:
          throw new Error(`Unknown file type: ${fileType}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during file processing.');
      console.error("Error processing uploaded file:", err);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Data Alchemist: Resource-Allocation Configurator
        </Typography>
        
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 3, mb: 6 }}>
        {/* Client File Upload */}
        <FileUpload
          id="clients-upload"
          label="Upload Clients Data (CSV/XLSX)"
          fileType="clients"
          onFileUpload={handleFileUpload}
        />
        {/* Worker File Upload */}
        <FileUpload
          id="workers-upload"
          label="Upload Workers Data (CSV/XLSX)"
          fileType="workers"
          onFileUpload={handleFileUpload}
        />
        {/* Task File Upload */}
        <FileUpload
          id="tasks-upload"
          label="Upload Tasks Data (CSV/XLSX)"
          fileType="tasks"
          onFileUpload={handleFileUpload}
        />
      </Box>

      {/* Placeholder for Data Grids - Will be implemented in Phase 2 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Uploaded Data Previews
        </Typography>
        {clientsData.length > 0 && (
          <Typography variant="h6" color="text-white">
            Clients Data Loaded: {clientsData.length} entries
            {/* <ClientDataTable data={clientsData} /> */}
          </Typography>
        )}
        {workersData.length > 0 && (
          <Typography variant="h6" color="text-white">
            Workers Data Loaded: {workersData.length} entries
            {/* <WorkerDataTable data={workersData} /> */}
          </Typography>
        )}
        {tasksData.length > 0 && (
          <Typography variant="h6" color="text-white">
            Tasks Data Loaded: {tasksData.length} entries
            {/* <TaskDataTable data={tasksData} /> */}
          </Typography>
        )}
        {clientsData.length === 0 && workersData.length === 0 && tasksData.length === 0 && (
            <Typography variant="body1" color="text-white">
                No data uploaded yet. Please upload files above.
            </Typography>
        )}
      </Box>
    </Container>
  );
}