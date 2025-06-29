// src/utils/ruleParser.ts
import { StructuredRule } from '../types/rules';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

export function parseNaturalLanguageRule(ruleText: string): StructuredRule {
  const parsedRule: StructuredRule = {
    id: uuidv4(),
    originalText: ruleText,
    conditions: [],
    actions: [],
    parsedSuccessfully: false,
  };

  const lowerCaseRule = ruleText.toLowerCase();

  // --- Simple Condition Parsing ---
  // Pattern 1: Clients with priority level X (e.g., "clients with priority level 1")
  let match = lowerCaseRule.match(/(clients|client) (with|have) priority ?level (\d+)/);
  if (match) {
    parsedRule.conditions.push({
      type: 'fieldComparison',
      dataSet: 'clients',
      field: 'PriorityLevel',
      operator: 'equals',
      value: parseInt(match[3], 10),
    });
  }

  // Pattern 2: Workers with skill [skillName] (e.g., "workers with skill welding")
  match = lowerCaseRule.match(/(workers|worker) (with|has) skill (.+?)(,|$|\.|\b)/);
  if (match && match[3]) {
    parsedRule.conditions.push({
      type: 'fieldComparison',
      dataSet: 'workers',
      field: 'Skills',
      operator: 'contains', // Assumes skills are comma-separated and we check for containment
      value: match[3].trim(),
    });
  }

  // Pattern 3: Tasks in category 'X' (e.g., "tasks in category 'critical'")
  match = lowerCaseRule.match(/(tasks|task) (in category|are) '(.+?)'/);
  if (match && match[3]) {
    parsedRule.conditions.push({
      type: 'fieldComparison',
      dataSet: 'tasks',
      field: 'Category',
      operator: 'equals',
      value: match[3].trim(),
    });
  }


  // --- Simple Action Parsing ---
  // Pattern 1: Assign to high priority workers (simplistic)
  if (lowerCaseRule.includes('assign to high priority workers')) {
    parsedRule.actions.push({
      type: 'assignmentPreference',
      preferenceTarget: 'workers',
      field: 'PriorityLevel',
      value: 'high', // This would need a mapping to actual values
    });
  }
  // Pattern 2: Assign to critical tasks
  else if (lowerCaseRule.includes('assign to critical tasks')) {
     parsedRule.actions.push({
      type: 'assignmentPreference',
      preferenceTarget: 'tasks',
      field: 'Category',
      value: 'Critical'
    });
  }

  // Pattern 3: Flag as [risk] (e.g., "flag as high risk")
  match = lowerCaseRule.match(/flag as (.+?)(,|$|\.|\b)/);
  if (match && match[1]) {
    parsedRule.actions.push({
      type: 'flag',
      message: `Flagged as: ${match[1].trim()}`,
    });
  }

  // Determine if parsing was at least partially successful
  if (parsedRule.conditions.length > 0 || parsedRule.actions.length > 0) {
    parsedRule.parsedSuccessfully = true;
  } else {
    parsedRule.parsedSuccessfully = false;
    parsedRule.parseError = "Could not understand the rule. Please try a simpler format, e.g., 'clients with priority level 1 assign to critical tasks'.";
  }

  return parsedRule;
}