
export interface RuleCondition {
  type: 'fieldComparison' | 'relationship';
  dataSet: 'clients' | 'workers' | 'tasks';
  field?: string; // Optional for relationship type
  operator?: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'notEquals' | 'hasSkill';
  value?: any;
  targetDataSet?: 'clients' | 'workers' | 'tasks'; // For relationship type
  targetField?: string; // For relationship type
  relationshipType?: 'references' | 'has'; // e.g., RequestedTaskIDs REFERENCES TaskID, Worker HAS Skill
}

export interface RuleAction {
  type: 'assignmentPreference' | 'flag' | 'default';
  dataSet?: 'clients' | 'workers' | 'tasks'; // Optional, might be cross-dataset action
  field?: string; // e.g., 'Category', 'PriorityLevel'
  value?: any;
  message?: string; // For 'flag' action
  preferenceTarget?: 'workers' | 'tasks'; // e.g., assign to specific worker group, or specific task category
}

export interface StructuredRule {
  id: string; // Unique identifier for the rule
  originalText: string; // The natural language input
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number; // Optional, for future prioritization logic
  parsedSuccessfully: boolean; // Indicate if parsing was successful
  parseError?: string; // Error message if parsing failed
}