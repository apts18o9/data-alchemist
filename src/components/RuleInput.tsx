// src/components/RuleInput.tsx
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

interface RuleInputProps {
  onAddRule: (ruleText: string) => void;
}

const RuleInput: React.FC<RuleInputProps> = ({ onAddRule }) => {
  const [ruleText, setRuleText] = useState('');

  const handleAddRule = () => {
    if (ruleText.trim()) {
      onAddRule(ruleText);
      setRuleText(''); // Clear input after adding
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom>
        Define Your Business Rules (Natural Language)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter rules in plain English. For example: "Workers with Level 5 skills should handle tasks with high priority."
      </Typography>
      <TextField
        label="Enter Business Rule"
        multiline
        rows={4}
        fullWidth
        value={ruleText}
        onChange={(e) => setRuleText(e.target.value)}
        variant="outlined"
        sx={{ mb: 2 }}
        placeholder="e.g., 'Clients with PriorityLevel 1 must be assigned to tasks in Category 'Critical'."
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddRule}
        disabled={!ruleText.trim()}
      >
        Add Rule
      </Button>
    </Paper>
  );
};

export default RuleInput;