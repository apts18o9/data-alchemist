'use client'
import React, { useState } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import FileUpload from '../components/FileUpload';
import DataTable, { Column } from '../components/DataTable'; 


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
  AvailableSlots: string;
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
  PreferredPhases: string;
  MaxConcurrent: number;
}

export default function HomePage() {
  const [clientsData, setClientsData] = useState<ClientData[]>([]);
  const [workersData, setWorkersData] = useState<WorkerData[]>([]);
  const [tasksData, setTasksData] = useState<TaskData[]>([]);

  // New state variables to store dynamically generated columns not the hardcoded 
  const [clientTableColumns, setClientTableColumns] = useState<Column<any>[]>([]);
  const [workerTableColumns, setWorkerTableColumns] = useState<Column<any>[]>([]);
  const [taskTableColumns, setTaskTableColumns] = useState<Column<any>[]>([]);

  const [appError, setAppError] = useState<string | null>(null);

  const handleFileUpload = (
    fileType: 'clients' | 'workers' | 'tasks',
    data: any[],
    fileName: string
  ) => {
    setAppError(null);
    try {
      if (data.length === 0) {
        // If data is empty, it means file was malformed or empty
        throw new Error(`The uploaded file '${fileName}' appears to be empty or malformed.`);
      }

   
      const dynamicColumns: Column<any>[] = Object.keys(data[0]).map(key => ({
        id: key as keyof any, // Cast key to keyof any to satisfy Column<any> interface
        label: key, // Use the key as the label
        minWidth: 150, // Default width, can be customized later
      }));

      // Assign data and dynamic columns based on fileType
      switch (fileType) {
        case 'clients':
          setClientsData(data as ClientData[]);
          setClientTableColumns(dynamicColumns); // Set dynamic columns for clients
          console.log(`Clients data loaded from ${fileName}:`, data);
          console.log(`Clients Columns generated:`, dynamicColumns);
          break;
        case 'workers':
          setWorkersData(data as WorkerData[]);
          setWorkerTableColumns(dynamicColumns); // Set dynamic columns for workers
          console.log(`Workers data loaded from ${fileName}:`, data);
          console.log(`Workers Columns generated:`, dynamicColumns);
          break;
        case 'tasks':
          setTasksData(data as TaskData[]);
          setTaskTableColumns(dynamicColumns); // Set dynamic columns for tasks
          console.log(`Tasks data loaded from ${fileName}:`, data);
          console.log(`Tasks Columns generated:`, dynamicColumns);
          break;
        default:
          throw new Error(`Unknown file type: ${fileType}`);
      }
    } catch (err: any) {
      setAppError(err.message || 'An error occurred during file processing.');
      console.error("Error processing uploaded file in HomePage:", err);

      // Also clear data and columns if there's an error
      switch (fileType) {
        case 'clients': setClientsData([]); setClientTableColumns([]); break;
        case 'workers': setWorkersData([]); setWorkerTableColumns([]); break;
        case 'tasks': setTasksData([]); setTaskTableColumns([]); break;
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Data Alchemist: Resource-Allocation Configurator
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Forge Your Own AI
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Upload your client, worker, and task data to bring order out of spreadsheet chaos.
        </Typography>
      </Box>

      {appError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {appError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 3, mb: 6, flexWrap: 'wrap' }}>
        
        <FileUpload
          id="clients-upload"
          label="Upload Clients Data (CSV/XLSX)"
          fileType="clients"
          onFileUpload={handleFileUpload}
        />
        <FileUpload
          id="workers-upload"
          label="Upload Workers Data (CSV/XLSX)"
          fileType="workers"
          onFileUpload={handleFileUpload}
        />
        <FileUpload
          id="tasks-upload"
          label="Upload Tasks Data (CSV/XLSX)"
          fileType="tasks"
          onFileUpload={handleFileUpload}
        />
      </Box>


      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Uploaded Data Previews
        </Typography>

        {/* Client Data Table - Now uses dynamic columns */}
        {clientsData.length > 0 && clientTableColumns.length > 0 && (
          <DataTable<any>
            data={clientsData}
            columns={clientTableColumns}
            title="Clients Data"
          />
        )}
        {clientsData.length === 0 && clientTableColumns.length === 0 && (
          <DataTable<any> // Render empty table with message if no data
            data={[]}
            columns={[]}
            title="Clients Data"
          />
        )}

     
        {workersData.length > 0 && workerTableColumns.length > 0 && (
          <DataTable<any>
            data={workersData}
            columns={workerTableColumns}
            title="Workers Data"
          />
        )}
        {workersData.length === 0 && workerTableColumns.length === 0 && (
          <DataTable<any> 
            data={[]}
            columns={[]}
            title="Workers Data"
          />
        )}

        {/* Task Data Table - Now uses dynamic columns */}
        {tasksData.length > 0 && taskTableColumns.length > 0 && (
          <DataTable<any>
            data={tasksData}
            columns={taskTableColumns}
            title="Tasks Data"
          />
        )}
        {tasksData.length === 0 && taskTableColumns.length === 0 && (
          <DataTable<any> 
            data={[]}
            columns={[]}
            title="Tasks Data"
          />
        )}


      
        {clientsData.length === 0 && workersData.length === 0 && tasksData.length === 0 && (
            <Typography variant="body1" color="text.primary" sx={{ mt: 2, color: 'white' }}>
                No data uploaded yet. Please upload files above.
            </Typography>
        )}
      </Box>
    </Container>
  );
}