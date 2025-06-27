'use client'
import React, { useState } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import FileUpload from '../components/FileUpload';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';


interface ClientData {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON: string;
  // Ensure a unique ID for DataGrid's getRowId
  id?: string;
}

interface WorkerData {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: string;
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: string;
  id?: string;
}

interface TaskData {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string;
  MaxConcurrent: number;
  id?: string;
}

export default function HomePage() {
  const [clientsData, setClientsData] = useState<ClientData[]>([]);
  const [workersData, setWorkersData] = useState<WorkerData[]>([]);
  const [tasksData, setTasksData] = useState<TaskData[]>([]);

  // State variables for dynamically generated columns, now of type GridColDef[]
  const [clientTableColumns, setClientTableColumns] = useState<GridColDef[]>([]);
  const [workerTableColumns, setWorkerTableColumns] = useState<GridColDef[]>([]);
  const [taskTableColumns, setTaskTableColumns] = useState<GridColDef[]>([]);

  const [appError, setAppError] = useState<string | null>(null);

  const handleFileUpload = (
    fileType: 'clients' | 'workers' | 'tasks',
    data: any[],
    fileName: string
  ) => {
    setAppError(null);
    try {
      if (data.length === 0) {
        throw new Error(`The uploaded file '${fileName}' appears to be empty or malformed.`);
      }

      // Add a unique 'id' property required by DataGrid
      const dataWithIds = data.map((row: any, index: number) => ({
        ...row,
       
        id: row.ClientID || row.WorkerID || row.TaskID || String(index),
      }));

      // Dynamically generate columns from the first data row's keys
      const dynamicColumns: GridColDef[] = Object.keys(dataWithIds[0]).map(key => ({
        field: key, // 'field' is equivalent to 'id' in GridColDef
        headerName: key, // Use the key as the header name
        minWidth: 150, 
        editable: true, // Enable inline editing for all dynamically generated columns
       
      }));

      // Assign data and dynamic columns based on fileType
      switch (fileType) {
        case 'clients':
          setClientsData(dataWithIds as ClientData[]);
          setClientTableColumns(dynamicColumns);
          console.log(`Clients data loaded from ${fileName}:`, dataWithIds);
          console.log(`Clients Columns generated:`, dynamicColumns);
          break;
        case 'workers':
          setWorkersData(dataWithIds as WorkerData[]);
          setWorkerTableColumns(dynamicColumns);
          console.log(`Workers data loaded from ${fileName}:`, dataWithIds);
          console.log(`Workers Columns generated:`, dynamicColumns);
          break;
        case 'tasks':
          setTasksData(dataWithIds as TaskData[]);
          setTaskTableColumns(dynamicColumns);
          console.log(`Tasks data loaded from ${fileName}:`, dataWithIds);
          console.log(`Tasks Columns generated:`, dynamicColumns);
          break;
        default:
          throw new Error(`Unknown file type: ${fileType}`);
      }
    } catch (err: any) {
      setAppError(err.message || 'An error occurred during file processing.');
      console.error("Error processing uploaded file in HomePage:", err);

      // Clear data and columns if there's an error
      switch (fileType) {
        case 'clients': setClientsData([]); setClientTableColumns([]); break;
        case 'workers': setWorkersData([]); setWorkerTableColumns([]); break;
        case 'tasks': setTasksData([]); setTaskTableColumns([]); break;
      }
    }
  };

  // Handler for updating rows in the DataGrid
  const handleProcessRowUpdate = (
    newRow: any,
    oldRow: any,
    dataSetType: 'clients' | 'workers' | 'tasks'
  ) => {
    try {
      let updatedData;
      if (dataSetType === 'clients') {
        updatedData = clientsData.map((row) => (row.id === newRow.id ? newRow : row));
        setClientsData(updatedData);
      } else if (dataSetType === 'workers') {
        updatedData = workersData.map((row) => (row.id === newRow.id ? newRow : row));
        setWorkersData(updatedData);
      } else if (dataSetType === 'tasks') {
        updatedData = tasksData.map((row) => (row.id === newRow.id ? newRow : row));
        setTasksData(updatedData);
      }
      setAppError(null); 
      return newRow;
    } catch (error: any) {
      setAppError(`Failed to update row: ${error.message}`);
    
      return oldRow;
    }
  };

  // Generic error handler for DataGrid's processRowUpdate
  const onProcessRowUpdateError = (error: any) => {
    console.error("DataGrid update error:", error);
    setAppError(`Data update failed: ${error.message || 'An unknown error occurred.'}`);
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

      <Box  sx={{ mt: 4, height: 600, width: '100%' }}> {/* Added height for DataGrid */}
        <Typography variant="h4" gutterBottom>
          Uploaded Data Previews (Editable)
        </Typography>

       
        <Typography display={'flex'} variant="h6" gutterBottom sx={{ mt: 3 }}>Clients Data</Typography>
        {clientsData.length > 0 && clientTableColumns.length > 0 ? (
          <DataGrid
            rows={clientsData}
            columns={clientTableColumns}
            getRowId={(row) => row.id} // Use the added 'id' field
            processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'clients')}
            onProcessRowUpdateError={onProcessRowUpdateError}
            disableRowSelectionOnClick
          
            sx={{ minHeight: 200, maxHeight: 400 }} 
          
          />
        ) : (
          <Typography variant="body2" color="text-white" sx={{ py: 2 }}>
            No Clients Data available. Please upload a file.
          </Typography>
        )}

        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Workers Data</Typography>
        {workersData.length > 0 && workerTableColumns.length > 0 ? (
          <DataGrid
            rows={workersData}
            columns={workerTableColumns}
            getRowId={(row) => row.id}
            processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'workers')}
            onProcessRowUpdateError={onProcessRowUpdateError}
            disableRowSelectionOnClick
            // autoHeight={false}
            sx={{ minHeight: 200, maxHeight: 400 }}
          />
        ) : (
          <Typography variant="body2" color="text-white" sx={{ py: 2 }}>
            No Workers Data available. Please upload a file.
          </Typography>
        )}

       
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Tasks Data</Typography>
        {tasksData.length > 0 && taskTableColumns.length > 0 ? (
          <DataGrid
            rows={tasksData}
            columns={taskTableColumns}
            getRowId={(row) => row.id}
            processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'tasks')}
            onProcessRowUpdateError={onProcessRowUpdateError}
            disableRowSelectionOnClick
            // autoHeight={false}
            sx={{ minHeight: 200, maxHeight: 400 }}
          />
        ) : (
          <Typography variant="body2" color="text-white" sx={{ py: 2 }}>
            No Tasks Data available. Please upload a file.
          </Typography>
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