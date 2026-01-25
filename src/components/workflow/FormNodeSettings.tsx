import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'tel' | 'url' | 'date' | 'file';
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  defaultValue?: string;
}

interface FormConfig {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
  submitButtonText: string;
  successMessage: string;
  redirectUrl: string;
}

interface FormNodeSettingsProps {
  config: FormConfig;
  onConfigChange: (config: FormConfig) => void;
}

export default function FormNodeSettings({ config, onConfigChange }: FormNodeSettingsProps) {
  const labelToName = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleAddField = useCallback(() => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      label: 'New Field',
      name: 'new_field',
      type: 'text',
      required: false,
      placeholder: '',
    };

    onConfigChange({
      ...config,
      fields: [...config.fields, newField],
    });
  }, [config, onConfigChange]);

  const handleRemoveField = useCallback((fieldId: string) => {
    onConfigChange({
      ...config,
      fields: config.fields.filter(f => f.id !== fieldId),
    });
  }, [config, onConfigChange]);

  const handleFieldChange = useCallback((fieldId: string, key: keyof FormField, value: any) => {
    const updatedFields = config.fields.map(field => {
      if (field.id === fieldId) {
        const updated = { ...field, [key]: value };
        if (key === 'label') {
          updated.name = labelToName(value);
        }
        return updated;
      }
      return field;
    });

    onConfigChange({
      ...config,
      fields: updatedFields,
    });
  }, [config, onConfigChange]);

  const handleConfigFieldChange = useCallback((key: keyof FormConfig, value: any) => {
    onConfigChange({
      ...config,
      [key]: value,
    });
  }, [config, onConfigChange]);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'tel', label: 'Phone' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'file', label: 'File' },
  ];

  return (
    <div className="space-y-6">
      {/* Form Title */}
      <div className="space-y-2">
        <Label htmlFor="formTitle">Form Title</Label>
        <Input
          id="formTitle"
          value={config.formTitle}
          onChange={(e) => handleConfigFieldChange('formTitle', e.target.value)}
          placeholder="Form Submission"
        />
      </div>

      {/* Form Description */}
      <div className="space-y-2">
        <Label htmlFor="formDescription">Description (Optional)</Label>
        <Textarea
          id="formDescription"
          value={config.formDescription}
          onChange={(e) => handleConfigFieldChange('formDescription', e.target.value)}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Form Fields</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddField}
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>

        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
          {config.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fields yet. Click "Add Field" to get started.
            </p>
          ) : (
            config.fields.map((field) => (
              <div key={field.id} className="space-y-3 p-3 border rounded-md bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`label-${field.id}`} className="text-xs">Label</Label>
                        <Input
                          id={`label-${field.id}`}
                          value={field.label}
                          onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                          placeholder="Field Label"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`type-${field.id}`} className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => handleFieldChange(field.id, 'type', value)}
                        >
                          <SelectTrigger id={`type-${field.id}`} className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`name-${field.id}`} className="text-xs">Internal Name</Label>
                      <Input
                        id={`name-${field.id}`}
                        value={field.name}
                        onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                        placeholder="field_name"
                        className="h-8 text-sm font-mono"
                      />
                    </div>

                    {(field.type === 'text' || field.type === 'email' || field.type === 'number' || field.type === 'textarea') && (
                      <div className="space-y-1">
                        <Label htmlFor={`placeholder-${field.id}`} className="text-xs">Placeholder</Label>
                        <Input
                          id={`placeholder-${field.id}`}
                          value={field.placeholder || ''}
                          onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                          placeholder="Enter placeholder text"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}

                    {(field.type === 'select' || field.type === 'radio') && (
                      <div className="space-y-1">
                        <Label htmlFor={`options-${field.id}`} className="text-xs">Options (comma-separated)</Label>
                        <Input
                          id={`options-${field.id}`}
                          value={field.options?.map(opt => typeof opt === 'string' ? opt : `${opt.label}:${opt.value}`).join(', ') || ''}
                          onChange={(e) => {
                            const options = e.target.value.split(',').map(opt => {
                              const trimmed = opt.trim();
                              if (trimmed.includes(':')) {
                                const [label, value] = trimmed.split(':').map(s => s.trim());
                                return { label, value: value || label };
                              }
                              return { label: trimmed, value: trimmed };
                            }).filter(opt => opt.label);
                            handleFieldChange(field.id, 'options', options);
                          }}
                          placeholder="Option 1, Option 2, Option 3"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => handleFieldChange(field.id, 'required', checked)}
                        id={`required-${field.id}`}
                      />
                      <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                        Required
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveField(field.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submit Button Text */}
      <div className="space-y-2">
        <Label htmlFor="submitButtonText">Submit Button Text</Label>
        <Input
          id="submitButtonText"
          value={config.submitButtonText}
          onChange={(e) => handleConfigFieldChange('submitButtonText', e.target.value)}
          placeholder="Submit"
        />
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <Label htmlFor="successMessage">Success Message</Label>
        <Textarea
          id="successMessage"
          value={config.successMessage}
          onChange={(e) => handleConfigFieldChange('successMessage', e.target.value)}
          placeholder="Thank you for your submission!"
          rows={2}
        />
      </div>

      {/* Redirect URL */}
      <div className="space-y-2">
        <Label htmlFor="redirectUrl">Redirect URL (Optional)</Label>
        <Input
          id="redirectUrl"
          value={config.redirectUrl}
          onChange={(e) => handleConfigFieldChange('redirectUrl', e.target.value)}
          placeholder="https://example.com/thank-you"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to show success message on the same page
        </p>
      </div>
    </div>
  );
}

