/**
 * Condition Builder Component
 * 
 * Provides a user-friendly UI for building If/Else conditions
 * without requiring users to write raw expressions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConditionRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'contains' | 'not_contains';
  value: string | number | boolean;
}

export interface ConditionBuilderProps {
  value: ConditionRule[] | string | null | undefined;
  onChange: (value: ConditionRule[]) => void;
  availableFields?: string[]; // Fields available from previous nodes
  className?: string;
}

const OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '!=' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'greater_than_or_equal', label: '>=' },
  { value: 'less_than_or_equal', label: '<=' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
] as const;

/**
 * Parse legacy expression format to structured condition
 * Example: "{{input.age}} >= 60" -> { field: "input.age", operator: "greater_than_or_equal", value: 60 }
 */
function parseLegacyExpression(expression: string): ConditionRule | null {
  const expr = expression.trim();
  
  // Remove {{ }} wrappers
  const cleaned = expr.replace(/\{\{|\}\}/g, '');
  
  // Try to match patterns like: input.age >= 60, $json.status == 'active', etc.
  const patterns = [
    { regex: /(.+?)\s*(>=|greater_than_or_equal)\s*(.+)/, op: 'greater_than_or_equal' as const },
    { regex: /(.+?)\s*(<=|less_than_or_equal)\s*(.+)/, op: 'less_than_or_equal' as const },
    { regex: /(.+?)\s*(>|greater_than)\s*(.+)/, op: 'greater_than' as const },
    { regex: /(.+?)\s*(<|less_than)\s*(.+)/, op: 'less_than' as const },
    { regex: /(.+?)\s*(===|==|equals)\s*(.+)/, op: 'equals' as const },
    { regex: /(.+?)\s*(!==|!=|not_equals)\s*(.+)/, op: 'not_equals' as const },
    { regex: /(.+?)\s*(contains)\s*(.+)/i, op: 'contains' as const },
    { regex: /(.+?)\s*(not_contains)\s*(.+)/i, op: 'not_contains' as const },
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      const field = match[1].trim();
      const valueStr = match[3].trim();
      
      // Try to parse value as number, boolean, or string
      let value: string | number | boolean = valueStr;
      if (valueStr === 'true') value = true;
      else if (valueStr === 'false') value = false;
      else if (!isNaN(Number(valueStr)) && valueStr.trim() !== '') {
        value = Number(valueStr);
      } else if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || 
                 (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
        value = valueStr.slice(1, -1);
      }
      
      return {
        field,
        operator: pattern.op,
        value,
      };
    }
  }
  
  return null;
}

/**
 * Convert structured condition to legacy expression format (for backward compatibility)
 */
function conditionToExpression(condition: ConditionRule): string {
  const field = condition.field.includes('.') ? `{{${condition.field}}}` : `{{${condition.field}}}`;
  const operatorMap: Record<ConditionRule['operator'], string> = {
    equals: '===',
    not_equals: '!==',
    greater_than: '>',
    less_than: '<',
    greater_than_or_equal: '>=',
    less_than_or_equal: '<=',
    contains: '.includes(',
    not_contains: '!.includes(',
  };
  
  const op = operatorMap[condition.operator];
  
  if (condition.operator === 'contains' || condition.operator === 'not_contains') {
    const valueStr = typeof condition.value === 'string' ? `"${condition.value}"` : String(condition.value);
    return `${field} ${op}${valueStr})`;
  }
  
  const valueStr = typeof condition.value === 'string' ? `"${condition.value}"` : String(condition.value);
  return `${field} ${op} ${valueStr}`;
}

export default function ConditionBuilder({ value, onChange, availableFields = [], className }: ConditionBuilderProps) {
  // Parse initial value - handle both structured and legacy formats
  const [conditions, setConditions] = useState<ConditionRule[]>(() => {
    if (!value) return [{ field: '', operator: 'equals', value: '' }];
    
    if (Array.isArray(value)) {
      // Check if it's already structured format
      if (value.length > 0 && typeof value[0] === 'object' && 'field' in value[0] && 'operator' in value[0]) {
        return value as ConditionRule[];
      }
      // Check if it's legacy format with expression field
      if (value.length > 0 && typeof value[0] === 'object' && 'expression' in value[0]) {
        const parsed = parseLegacyExpression((value[0] as any).expression);
        return parsed ? [parsed] : [{ field: '', operator: 'equals', value: '' }];
      }
    }
    
    // Legacy string format
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if ('expression' in parsed[0]) {
            const rule = parseLegacyExpression(parsed[0].expression);
            return rule ? [rule] : [{ field: '', operator: 'equals', value: '' }];
          }
          if ('field' in parsed[0]) {
            return parsed as ConditionRule[];
          }
        }
      } catch {
        // Not JSON, try direct parsing
        const rule = parseLegacyExpression(value);
        return rule ? [rule] : [{ field: '', operator: 'equals', value: '' }];
      }
    }
    
    return [{ field: '', operator: 'equals', value: '' }];
  });

  // Use ref to store latest onChange to avoid dependency issues
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Helper to notify parent of changes
  const notifyChange = useCallback((updatedConditions: ConditionRule[]) => {
    const filtered = updatedConditions.filter(c => c.field && c.value !== '');
    onChangeRef.current(filtered);
  }, []);

  const addCondition = () => {
    const updated = [...conditions, { field: '', operator: 'equals', value: '' }];
    setConditions(updated);
    // Don't notify on add - wait for user to fill in the condition
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    notifyChange(updated);
  };

  const updateCondition = (index: number, updates: Partial<ConditionRule>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
    notifyChange(updated);
  };

  // Generate field suggestions from available fields
  const fieldSuggestions = [
    ...availableFields,
    'input.age',
    'input.name',
    'input.email',
    '$json.status',
    '$json.amount',
    'input.status',
  ].filter((f, i, arr) => arr.indexOf(f) === i); // Deduplicate

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-xs font-medium">Conditions *</Label>
      <p className="text-xs text-muted-foreground">
        Build conditions using fields, operators, and values. The workflow will branch based on these conditions.
      </p>
      
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
          <div className="flex-1 grid grid-cols-3 gap-2">
            {/* Field Selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Field</Label>
              <Select
                value={condition.field && !fieldSuggestions.includes(condition.field) && condition.field !== '__custom__' 
                  ? '__custom__' 
                  : condition.field}
                onValueChange={(val) => {
                  if (val === '__custom__') {
                    // Keep the current custom value if it exists, otherwise set to __custom__
                    if (condition.field && !fieldSuggestions.includes(condition.field) && condition.field !== '__custom__') {
                      // Already has a custom value, keep it
                      return;
                    }
                    updateCondition(index, { field: '__custom__' });
                  } else {
                    updateCondition(index, { field: val });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldSuggestions.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {(condition.field === '__custom__' || (condition.field && !fieldSuggestions.includes(condition.field) && condition.field !== '__custom__')) && (
                <Input
                  className="h-7 mt-1 text-xs"
                  placeholder="e.g., input.age"
                  value={condition.field === '__custom__' ? '' : condition.field}
                  onChange={(e) => {
                    const customField = e.target.value;
                    updateCondition(index, { field: customField || '__custom__' });
                  }}
                  onBlur={(e) => {
                    const customField = e.target.value.trim();
                    if (customField) {
                      updateCondition(index, { field: customField });
                    } else if (condition.field === '__custom__') {
                      // Keep as __custom__ if empty
                      updateCondition(index, { field: '__custom__' });
                    }
                  }}
                />
              )}
            </div>

            {/* Operator Selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Operator</Label>
              <Select
                value={condition.operator}
                onValueChange={(val) => updateCondition(index, { operator: val as ConditionRule['operator'] })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Value</Label>
              <Input
                className="h-8 text-xs"
                type={typeof condition.value === 'number' ? 'number' : 'text'}
                value={String(condition.value)}
                placeholder="Enter value"
                onChange={(e) => {
                  const val = e.target.value;
                  // Try to infer type
                  let typedValue: string | number | boolean = val;
                  if (val === 'true') typedValue = true;
                  else if (val === 'false') typedValue = false;
                  else if (!isNaN(Number(val)) && val.trim() !== '') {
                    typedValue = Number(val);
                  }
                  updateCondition(index, { value: typedValue });
                }}
              />
            </div>
          </div>

          {/* Remove Button */}
          {conditions.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 mt-6"
              onClick={() => removeCondition(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs"
        onClick={addCondition}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Condition
      </Button>
    </div>
  );
}
