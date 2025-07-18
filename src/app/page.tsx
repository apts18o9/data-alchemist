'use client'
import React, { useState, useCallback, useEffect } from 'react';
import { Container, Typography, Box, Alert, Tooltip, Button, Paper, Slider } from '@mui/material';
import FileUpload from '../components/FileUpload';
import { DataGrid, GridColDef, GridRowId, GridCellParams } from '@mui/x-data-grid';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useRouter } from 'next/navigation';
import { useValidationErrors, ValidationError } from '../context/ValidationErrorsContext';
import RuleInput from '../components/RuleInput';
import { StructuredRule, RuleCondition, RuleAction } from '../types/rules';
import { parseNaturalLanguageRule } from '../utils/ruleParser';
import { convertToCsv } from '../utils/csvConverter'; // NEW: Import the CSV converter utility


// Define types for your parsed data (remain as reference, ensure 'id' is part of it for DataGrid)
interface ClientData {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON: string;
  id: GridRowId;
}

interface WorkerData {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: number;
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: string;
  id: GridRowId;
}

interface TaskData {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string;
  MaxConcurrent: number;
  id: GridRowId;
}


// --- Validation Helper Functions (Row-level) ---
const validateClientRow = (row: ClientData, allClients: ClientData[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!row.ClientID) { errors.push({ id: `${row.id}-ClientID-required`, rowId: row.id, field: 'ClientID', message: 'Client ID is required.', severity: 'error', dataSetType: 'clients' }); } else if (allClients.filter(c => c.ClientID === row.ClientID).length > 1) { errors.push({ id: `${row.id}-ClientID-unique`, rowId: row.id, field: 'ClientID', message: 'Client ID must be unique.', severity: 'error', dataSetType: 'clients' }); }
  if (!row.ClientName) { errors.push({ id: `${row.id}-ClientName-required`, rowId: row.id, field: 'ClientName', message: 'Client Name is required.', severity: 'error', dataSetType: 'clients' }); }
  const priority = Number(row.PriorityLevel);
  if (isNaN(priority) || priority < 1 || priority > 5) { errors.push({ id: `${row.id}-PriorityLevel-range`, rowId: row.id, field: 'PriorityLevel', message: 'Priority Level must be a number between 1 and 5.', severity: 'error', dataSetType: 'clients' }); }
  if (row.AttributesJSON) { try { JSON.parse(row.AttributesJSON); } catch (e) { errors.push({ id: `${row.id}-AttributesJSON-invalid`, rowId: row.id, field: 'AttributesJSON', message: 'Attributes JSON is invalid.', severity: 'error', dataSetType: 'clients' }); } }
  return errors;
};

const validateWorkerRow = (row: WorkerData, allWorkers: WorkerData[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!row.WorkerID) { errors.push({ id: `${row.id}-WorkerID-required`, rowId: row.id, field: 'WorkerID', message: 'Worker ID is required.', severity: 'error', dataSetType: 'workers' }); } else if (allWorkers.filter(w => w.WorkerID === row.WorkerID).length > 1) { errors.push({ id: `${row.id}-WorkerID-unique`, rowId: row.id, field: 'WorkerID', message: 'Worker ID must be unique.', severity: 'error', dataSetType: 'workers' }); }
  if (!row.WorkerName) { errors.push({ id: `${row.id}-WorkerName-required`, rowId: row.id, field: 'WorkerName', message: 'Worker Name is required.', severity: 'error', dataSetType: 'workers' }); }
  const slots = Number(row.AvailableSlots);
  if (isNaN(slots) || slots < 0) { errors.push({ id: `${row.id}-AvailableSlots-positive`, rowId: row.id, field: 'AvailableSlots', message: 'Available Slots must be a non-negative number.', severity: 'error', dataSetType: 'workers' }); }
  const maxLoad = Number(row.MaxLoadPerPhase);
  if (isNaN(maxLoad) || maxLoad <= 0) { errors.push({ id: `${row.id}-MaxLoadPerPhase-positive`, rowId: row.id, field: 'MaxLoadPerPhase', message: 'Max Load Per Phase must be a positive number.', severity: 'error', dataSetType: 'workers' }); }
  if (!isNaN(slots) && !isNaN(maxLoad) && slots < maxLoad) { errors.push({ id: `${row.id}-OverloadedWorker`, rowId: row.id, field: 'AvailableSlots', message: `Worker might be overloaded: Available Slots (${slots}) are less than Max Load Per Phase (${maxLoad}).`, severity: 'warning', dataSetType: 'workers' }); }
  return errors;
};

const validateTaskRow = (row: TaskData, allTasks: TaskData[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!row.TaskID) { errors.push({ id: `${row.id}-TaskID-required`, rowId: row.id, field: 'TaskID', message: 'Task ID is required.', severity: 'error', dataSetType: 'tasks' }); } else if (allTasks.filter(t => t.TaskID === row.TaskID).length > 1) { errors.push({ id: `${row.id}-TaskID-unique`, rowId: row.id, field: 'TaskID', message: 'Task ID must be unique.', severity: 'error', dataSetType: 'tasks' }); }
  if (!row.TaskName) { errors.push({ id: `${row.id}-TaskName-required`, rowId: row.id, field: 'TaskName', message: 'Task Name is required.', severity: 'error', dataSetType: 'tasks' }); }
  const duration = Number(row.Duration);
  if (isNaN(duration) || duration <= 0) { errors.push({ id: `${row.id}-Duration-positive`, rowId: row.id, field: 'Duration', message: 'Duration must be a positive number.', severity: 'error', dataSetType: 'tasks' }); }
  const maxConcurrent = Number(row.MaxConcurrent);
  if (isNaN(maxConcurrent) || maxConcurrent <= 0) { errors.push({ id: `${row.id}-MaxConcurrent-positive`, rowId: row.id, field: 'MaxConcurrent', message: 'Max Concurrent must be a positive number.', severity: 'error', dataSetType: 'tasks' }); }
  return errors;
};


export default function HomePage() {
  const [clientsData, setClientsData] = useState<ClientData[]>([]);
  const [workersData, setWorkersData] = useState<WorkerData[]>([]);
  const [tasksData, setTasksData] = useState<TaskData[]>([]);

  const [clientTableColumns, setClientTableColumns] = useState<GridColDef[]>([]);
  const [workerTableColumns, setWorkerTableColumns] = useState<GridColDef[]>([]);
  const [taskTableColumns, setTaskTableColumns] = useState<GridColDef[]>([]);

  const { validationErrors, setValidationErrors } = useValidationErrors();
  const [appError, setAppError] = useState<string | null>(null);
  const router = useRouter();

  // State for defined rules (from previous step)
  const [definedRules, setDefinedRules] = useState<StructuredRule[]>([]);

  // State for Prioritization Weights (from previous step)
  const [priorityWeights, setPriorityWeights] = useState({
    clientPriorityFulfillment: 50,
    workerSkillMatch: 50,
    taskCompletionEfficiency: 50,
    // Add more criteria as needed with default values
  });


  // --- Core Validation Function (Includes Cross-Dataset Validations) ---
  const runValidations = useCallback(() => {
    let allErrors: ValidationError[] = [];

    // --- 1. Row-level validations ---
    clientsData.forEach(client => {
      allErrors = allErrors.concat(validateClientRow(client, clientsData));
    });

    workersData.forEach(worker => {
      allErrors = allErrors.concat(validateWorkerRow(worker, workersData));
    });

    tasksData.forEach(task => {
      allErrors = allErrors.concat(validateTaskRow(task, tasksData));
    });

    // --- 2. Cross-Dataset Validations ---

    // Unknown References: RequestedTaskID in clients.csv must exist in tasks.csv
    const allTaskIds = new Set(tasksData.map(task => task.TaskID).filter(Boolean));
    clientsData.forEach(client => {
      if (client.RequestedTaskIDs) {
        const requestedIds = client.RequestedTaskIDs.split(',').map(id => id.trim()).filter(id => id);
        requestedIds.forEach(reqId => {
          if (!allTaskIds.has(reqId)) {
            allErrors.push({
              id: `${client.id}-${reqId}-unknown-task-ref`,
              rowId: client.id,
              field: 'RequestedTaskIDs',
              message: `Requested Task ID '${reqId}' does not exist in Tasks data.`,
              severity: 'error',
              dataSetType: 'cross-dataset'
            });
          }
        });
      }
    });

    // Skill-Coverage Matrix: For every RequiredSkill in a task, at least one worker possesses that skill.
    const allWorkerSkills = new Set<string>();
    workersData.forEach(worker => {
      if (worker.Skills) {
        worker.Skills.split(',').map(skill => skill.trim()).filter(skill => skill).forEach(skill => allWorkerSkills.add(skill));
      }
    });

    tasksData.forEach(task => {
      if (task.RequiredSkills) {
        const requiredSkills = task.RequiredSkills.split(',').map(skill => skill.trim()).filter(skill => skill);
        requiredSkills.forEach(reqSkill => {
          if (requiredSkills.length > 0 && !allWorkerSkills.has(reqSkill)) {
            allErrors.push({
              id: `${task.id}-${reqSkill}-missing-skill-coverage`,
              rowId: task.id,
              field: 'RequiredSkills',
              message: `Required Skill '${reqSkill}' not found in any worker's skills.`,
              severity: 'warning',
              dataSetType: 'cross-dataset'
            });
          }
        });
      }
    });

    // Phase-Slot Saturation: Sum of task durations per phase vs. total worker slots per phase
    const phaseTaskDurations = new Map<string, number>();
    tasksData.forEach(task => {
      const duration = Number(task.Duration);
      if (isNaN(duration) || duration <= 0) return;

      if (task.PreferredPhases) {
        const phases = task.PreferredPhases.split(',').map(p => p.trim()).filter(p => p);
        if (phases.length === 0) {
             allErrors.push({ id: `${task.id}-PreferredPhases-empty`, rowId: task.id, field: 'PreferredPhases', message: `Preferred Phases field is empty.`, severity: 'warning', dataSetType: 'tasks' });
        }
        phases.forEach(phase => { phaseTaskDurations.set(phase, (phaseTaskDurations.get(phase) || 0) + duration); });
      } else {
         allErrors.push({ id: `${task.id}-PreferredPhases-missing`, rowId: 'N/A', field: 'PreferredPhases', message: `Preferred Phases field is missing or empty.`, severity: 'warning', dataSetType: 'tasks' });
      }
    });

    const phaseWorkerCapacities = new Map<string, number>();
    workersData.forEach(worker => {
      const slots = Number(worker.AvailableSlots);
      const maxLoad = Number(worker.MaxLoadPerPhase);
      if (isNaN(slots) || isNaN(maxLoad) || slots < 0) return;
      if (worker.WorkerGroup) {
         phaseWorkerCapacities.set(worker.WorkerGroup, (phaseWorkerCapacities.get(worker.WorkerGroup) || 0) + slots);
      }
    });

    phaseTaskDurations.forEach((totalDuration, phase) => {
      const totalCapacity = phaseWorkerCapacities.get(phase) || 0;
      if (totalCapacity === 0) {
          allErrors.push({ id: `phase-${phase}-no-capacity`, rowId: 'N/A', field: 'Phase Capacity', message: `Phase '${phase}' has tasks but no worker capacity defined.`, severity: 'warning', dataSetType: 'cross-dataset' });
      } else if (totalDuration > totalCapacity) {
        allErrors.push({ id: `phase-${phase}-saturation`, rowId: 'N/A', field: 'Phase Capacity', message: `Phase '${phase}' oversaturated: Task Duration (${totalDuration}) exceeds Worker Slots (${totalCapacity}).`, severity: 'error', dataSetType: 'cross-dataset' });
      } else if (totalDuration > (totalCapacity * 0.8)) {
         allErrors.push({ id: `phase-${phase}-high-saturation`, rowId: 'N/A', field: 'Phase Capacity', message: `Phase '${phase}' highly saturated: Task Duration (${totalDuration}) is close to Worker Slots (${totalCapacity}).`, severity: 'warning', dataSetType: 'cross-dataset' });
      }
    });

    setValidationErrors(allErrors);
    if (allErrors.length > 0) {
      setAppError(`Found ${allErrors.length} validation errors.`);
    } else {
      setAppError(null);
    }
  }, [clientsData, workersData, tasksData, setValidationErrors]);

  useEffect(() => {
    runValidations();
  }, [runValidations]);

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

      const dataWithIds = data.map((row: any, index: number) => ({
        ...row,
        id: row.ClientID || row.WorkerID || row.TaskID || `${fileType}-row-${index}-${Date.now()}`,
      }));

      const dynamicColumns: GridColDef[] = Object.keys(dataWithIds[0]).map(key => ({
        field: key,
        headerName: key,
        minWidth: 150,
        editable: true,
        renderCell: (params: GridCellParams<any, any, any>) => {
          const errorsForCell = validationErrors.filter(
            err => err.rowId === params.id && err.field === params.field && (err.dataSetType === fileType || err.dataSetType === 'cross-dataset')
          );
          if (errorsForCell.length > 0) {
            return (
              <Tooltip title={errorsForCell.map(e => e.message).join('\n')}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', height: '100%', border: '1px solid red', boxSizing: 'border-box'
                }}>
                  <Typography variant="body2" sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {String(params.value)}
                  </Typography>
                  <ErrorOutlineIcon color="error" fontSize="small" sx={{ flexShrink: 0 }}/>
                </Box>
              </Tooltip>
            );
          }
          return params.value;
        },
      }));

      switch (fileType) {
        case 'clients':
          setClientsData(dataWithIds as ClientData[]);
          setClientTableColumns(dynamicColumns);
          break;
        case 'workers':
          setWorkersData(dataWithIds as WorkerData[]);
          setWorkerTableColumns(dynamicColumns);
          break;
        case 'tasks':
          setTasksData(dataWithIds as TaskData[]);
          setTaskTableColumns(dynamicColumns);
          break;
        default:
          throw new Error(`Unknown file type: ${fileType}`);
      }
    } catch (err: any) {
      setAppError(err.message || 'An error occurred during file processing.');
      console.error("Error processing uploaded file in HomePage:", err);
      switch (fileType) {
        case 'clients': setClientsData([]); setClientTableColumns([]); break;
        case 'workers': setWorkersData([]); setWorkerTableColumns([]); break;
        case 'tasks': setTasksData([]); setTaskTableColumns([]); break;
      }
      setValidationErrors([]);
    }
  };

  const handleProcessRowUpdate = useCallback(async (
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
  }, [clientsData, workersData, tasksData]);

  const onProcessRowUpdateError = useCallback((error: any) => {
    console.error("DataGrid update error:", error);
    setAppError(`Data update failed: ${error.message || 'An unknown error occurred.'}`);
  }, []);

  const handleAddRule = useCallback((ruleText: string) => {
    setAppError(null);
    const parsedRule = parseNaturalLanguageRule(ruleText);

    if (parsedRule.parsedSuccessfully) {
      setDefinedRules((prevRules) => [...prevRules, parsedRule]);
      setAppError(`Successfully parsed and added rule: "${ruleText}".`);
    } else {
      setAppError(`Failed to parse rule: "${ruleText}". Error: ${parsedRule.parseError || 'Unknown parsing error. Please try a different phrasing.'}`);
    }
  }, []);

  const generateAndDownloadRulesConfig = useCallback(() => {
    const rulesConfig = {
      rules: definedRules,
      prioritizationWeights: priorityWeights,
    };

    const jsonString = JSON.stringify(rulesConfig, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'rules_config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setAppError("Rules configuration downloaded as 'rules_config.json'.");
  }, [definedRules, priorityWeights]);

  // NEW FUNCTION: To handle export of all current data as CSV files
  const handleExportAllData = useCallback(() => {
    setAppError(null); // Clear previous errors

    if (clientsData.length > 0) {
      const csvContent = convertToCsv(clientsData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'clients_data.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      setAppError("No client data to export.");
    }

    if (workersData.length > 0) {
      const csvContent = convertToCsv(workersData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'workers_data.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      setAppError(prev => (prev ? prev + " No worker data to export." : "No worker data to export."));
    }

    if (tasksData.length > 0) {
      const csvContent = convertToCsv(tasksData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tasks_data.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      setAppError(prev => (prev ? prev + " No task data to export." : "No task data to export."));
    }

    if (clientsData.length > 0 || workersData.length > 0 || tasksData.length > 0) {
        setAppError(prev => (prev ? prev : "All available data exported as CSV files."));
    }
  }, [clientsData, workersData, tasksData]);


  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Data Alchemist
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Upload your client, worker, and task data to bring order out of spreadsheet chaos.
        </Typography>
      </Box>

      {appError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {appError}
          {validationErrors.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2, fontWeight: 'bold' }}>
                Total Validation Errors: {validationErrors.length}
              </Typography>
              <Button variant="contained" color="error" onClick={() => router.push('/errors')}>
                View All Errors
              </Button>
            </Box>
          )}
        </Alert>
      )}

      {!appError && validationErrors.length > 0 && (
          <Box sx={{ mt: -2, mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, fontWeight: 'bold' }}>
              Total Validation Errors: {validationErrors.length}
            </Typography>
            <Button variant="contained" color="error" onClick={() => router.push('/errors')}>
              View All Errors
            </Button>
          </Box>
      )}

      {/* Rule Input Section */}
      <RuleInput onAddRule={handleAddRule} />

      {/* Section to Display Defined Rules */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Defined Business Rules ({definedRules.length})
        </Typography>
        {definedRules.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No rules defined yet. Add a rule using the input above.
          </Typography>
        ) : (
          <Paper elevation={2} sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
            {definedRules.map((rule) => (
              <Box key={rule.id} sx={{ mb: 2, p: 1.5, border: '1px solid #555', borderRadius: '4px', backgroundColor: '#333' }}>
                <Typography variant="body1" fontWeight="bold">
                  Original Rule: "{rule.originalText}"
                </Typography>
                {rule.parsedSuccessfully ? (
                  <Box sx={{ mt: 1 }}>
                    {rule.conditions.length > 0 && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Parsed Conditions:
                        </Typography>
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {rule.conditions.map((cond, idx) => (
                            <li key={idx}>
                              {cond.dataSet} {cond.field && `[${cond.field}]`} {cond.operator} {JSON.stringify(cond.value)}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {rule.actions.length > 0 && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Parsed Actions:
                        </Typography>
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {rule.actions.map((act, idx) => (
                            <li key={idx}>
                              {act.type === 'assignmentPreference' && `Assignment Preference: Target ${act.preferenceTarget || 'N/A'}, Field: ${act.field || 'N/A'}, Value: ${JSON.stringify(act.value)}`}
                              {act.type === 'flag' && `Flag: ${act.message}`}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Parsing Error: {rule.parseError}
                  </Typography>
                )}
              </Box>
            ))}
          </Paper>
        )}
        {definedRules.length > 0 && (
          <Button
            variant="contained"
            color="secondary"
            onClick={generateAndDownloadRulesConfig}
            sx={{ mt: 2 }}
          >
            Generate & Download Rules Config (rules_config.json)
          </Button>
        )}
      </Box>

      {/* Prioritization & Weights Interface */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, mt: 4 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Prioritization & Weights
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Adjust the sliders to set the relative importance of different allocation criteria (0-100%).
        </Typography>

        {Object.entries(priorityWeights).map(([key, value]) => (
          <Box key={key} sx={{ mb: 3 }}>
            <Typography gutterBottom>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </Typography>
            <Slider
              value={value}
              onChange={(_, newValue) => setPriorityWeights(prev => ({ ...prev, [key]: newValue as number }))}
              aria-labelledby={`${key}-slider`}
              valueLabelDisplay="auto"
              min={0}
              max={100}
            />
            <Typography variant="body2" color="text.secondary" align="right">
              {value}%
            </Typography>
          </Box>
        ))}
      </Paper>


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

      {/* NEW BUTTON: Export All Data as CSV */}
      {(clientsData.length > 0 || workersData.length > 0 || tasksData.length > 0) && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleExportAllData}
          sx={{ mb: 4, width: 'fit-content', mx: 'auto', display: 'block' }}
        >
          Export All Data as CSV
        </Button>
      )}

      <Box sx={{ mt: 4, width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Uploaded Data Previews (Editable & Validated)
        </Typography>

        {/* Client DataGrid */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Clients Data</Typography>
        {clientsData.length > 0 && clientTableColumns.length > 0 ? (
          <DataGrid
            rows={clientsData}
            columns={clientTableColumns}
            getRowId={(row) => row.id}
            processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'clients')}
            onProcessRowUpdateError={onProcessRowUpdateError}
            disableRowSelectionOnClick
            autoHeight={false}
            sx={{ minHeight: 200, maxHeight: 400, width: '100%' }}
          />
        ) : (
          <Typography variant="body2" color="text-white" sx={{ py: 2 }}>
            No Clients Data available. Please upload a file.
          </Typography>
        )}

        {/* Worker DataGrid */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Workers Data</Typography>
        {workersData.length > 0 && workerTableColumns.length > 0 ? (
          <DataGrid
            rows={workersData}
            columns={workerTableColumns}
            getRowId={(row) => row.id}
            processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'workers')}
            onProcessRowUpdateError={onProcessRowUpdateError}
            disableRowSelectionOnClick
            autoHeight={false}
            sx={{ minHeight: 200, maxHeight: 400, width: '100%' }}
          />
        ) : (
          <Typography variant="body2" color="text-white" sx={{ py: 2 }}>
            No Workers Data available. Please upload a file.
          </Typography>
        )}

        {/* Task DataGrid */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Tasks Data</Typography>
        {tasksData.length > 0 && taskTableColumns.length > 0 ? (
          <DataGrid
            rows={tasksData}
            columns={taskTableColumns}
            getRowId={(row) => row.id}
            processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'tasks')}
            onProcessRowUpdateError={onProcessRowUpdateError}
            disableRowSelectionOnClick
            autoHeight={false}
            sx={{ minHeight: 200, maxHeight: 400, width: '100%' }}
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