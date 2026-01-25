import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  defaultValue?: string;
}

interface FormTriggerNodeData extends Record<string, unknown> {
  type: 'form';
  label: string;
  category: string;
  icon: string;
  config: {
    formTitle: string;
    formDescription: string;
    fields: FormField[];
    submitButtonText: string;
    successMessage: string;
    redirectUrl: string;
  };
  executionStatus?: 'idle' | 'running' | 'success' | 'error' | 'waiting';
}

type FormTriggerNodeProps = Node<FormTriggerNodeData>;

const FormTriggerNode = memo(({ data, selected }: NodeProps<FormTriggerNodeProps>) => {
  const config = data?.config || {
    formTitle: 'Form Submission',
    formDescription: '',
    fields: [],
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    redirectUrl: '',
  };

  const status = data?.executionStatus || 'idle';
  const fields = Array.isArray(config.fields) ? config.fields : [];

  // Determine border color based on status
  const getBorderColor = () => {
    if (status === 'waiting') return 'border-yellow-500 border-2';
    if (status === 'success') return 'border-green-500 border-2';
    if (status === 'error') return 'border-red-500 border-2';
    if (status === 'running') return 'border-blue-500 border-2';
    return selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/50';
  };

  // Get field count for display
  const fieldCount = fields.length;
  const formTitle = config.formTitle || 'Form Submission';

  return (
    <div
      className={cn(
        'px-5 py-4 rounded-lg border-2 bg-card shadow-md transition-all relative',
        getBorderColor()
      )}
      style={{ width: '240px', minHeight: '70px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />

      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm leading-tight break-words hyphens-auto">{formTitle}</div>
          <div className="text-xs text-muted-foreground leading-tight break-words mt-0.5">
            {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
            {status === 'waiting' && ' • Waiting...'}
            {status === 'success' && ' • Submitted'}
            {status === 'error' && ' • Error'}
          </div>
        </div>
        {status === 'waiting' && (
          <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0 animate-pulse" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        )}
        {status === 'error' && (
          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />
    </div>
  );
});

FormTriggerNode.displayName = 'FormTriggerNode';

export default FormTriggerNode;

