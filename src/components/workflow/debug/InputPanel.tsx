import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JsonKey {
  path: string;
  key: string;
  value: unknown;
  level: number;
}

interface JsonKeyItemProps {
  jsonKey: JsonKey;
  onCopy?: (path: string) => void;
  copiedPath: string | null;
}

function JsonKeyItem({ jsonKey, onCopy, copiedPath }: JsonKeyItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: jsonKey.path,
    data: {
      path: jsonKey.path,
      value: jsonKey.value,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const valueType = typeof jsonKey.value;
  const isPrimitive = valueType !== 'object' || jsonKey.value === null;
  const [isExpanded, setIsExpanded] = useState(true);
  const isCopied = copiedPath === jsonKey.path;

  const displayValue = useMemo(() => {
    if (jsonKey.value === null) return 'null';
    if (jsonKey.value === undefined) return 'undefined';
    if (typeof jsonKey.value === 'string') {
      return `"${jsonKey.value}"`;
    }
    if (typeof jsonKey.value === 'object') {
      if (Array.isArray(jsonKey.value)) {
        return `[${jsonKey.value.length} items]`;
      }
      return `{${Object.keys(jsonKey.value).length} keys}`;
    }
    return String(jsonKey.value);
  }, [jsonKey.value]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-grab active:cursor-grabbing',
          'hover:bg-muted/60 transition-colors',
          'border border-transparent hover:border-border',
          jsonKey.level > 0 && 'ml-4'
        )}
        {...listeners}
        {...attributes}
      >
        {!isPrimitive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="h-4 w-4 flex items-center justify-center hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {isPrimitive && <div className="w-4" />}
        
        <span className="text-sm font-mono text-foreground/90 flex-1 min-w-0">
          <span className="text-muted-foreground">{jsonKey.key}</span>
          {!isPrimitive && (
            <span className="text-muted-foreground/60 ml-1">
              {Array.isArray(jsonKey.value) ? '[]' : '{}'}
            </span>
          )}
        </span>
        
        {isPrimitive && (
          <span className="text-xs text-muted-foreground/70 font-mono truncate max-w-[200px]">
            {displayValue}
          </span>
        )}

        {onCopy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(jsonKey.path);
            }}
            className={cn(
              'h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-muted',
              isCopied && 'opacity-100 text-green-500'
            )}
            title="Copy path"
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface InputPanelProps {
  inputData: unknown;
}

export default function InputPanel({ inputData }: InputPanelProps) {
  const { toast } = useToast();
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Flatten JSON object into draggable keys
  const jsonKeys = useMemo(() => {
    const keys: JsonKey[] = [];

    function traverse(obj: unknown, prefix: string = '', level: number = 0) {
      if (obj === null || obj === undefined) {
        // Don't add null/undefined at root level, show message instead
        if (prefix === '') return;
        keys.push({
          path: prefix || 'null',
          key: prefix.split('.').pop() || 'null',
          value: obj,
          level,
        });
        return;
      }

      if (typeof obj === 'object' && !Array.isArray(obj)) {
        const objKeys = Object.keys(obj);
        if (objKeys.length === 0 && prefix === '') {
          // Empty object at root - don't add a key, let the empty state message show
          return;
        } else if (objKeys.length === 0) {
          // Empty object at nested level
          keys.push({
            path: prefix || '{}',
            key: prefix.split('.').pop() || '{}',
            value: obj,
            level,
          });
        } else {
          for (const key of objKeys) {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            const value = (obj as Record<string, unknown>)[key];
            
            keys.push({
              path: fullPath,
              key,
              value,
              level,
            });

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              traverse(value, fullPath, level + 1);
            } else if (Array.isArray(value)) {
              // For arrays, add array item keys
              value.forEach((item, index) => {
                const itemPath = `${fullPath}[${index}]`;
                keys.push({
                  path: itemPath,
                  key: `[${index}]`,
                  value: item,
                  level: level + 1,
                });
                if (typeof item === 'object' && item !== null) {
                  traverse(item, itemPath, level + 2);
                }
              });
            }
          }
        }
      } else {
        keys.push({
          path: prefix || String(obj),
          key: prefix.split('.').pop() || String(obj),
          value: obj,
          level,
        });
      }
    }

    traverse(inputData);
    return keys;
  }, [inputData]);

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
    toast({
      title: 'Copied',
      description: `Path "${path}" copied to clipboard`,
    });
  };

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Input</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag keys to property fields
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {jsonKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4">
              <p className="mb-2">No input data available</p>
              <p className="text-xs text-muted-foreground/70 text-center max-w-[200px]">
                {typeof inputData === 'object' && inputData !== null && Object.keys(inputData).length === 0
                  ? 'Empty object {} - run the previous node or provide input data'
                  : 'Connect a node or run the workflow to see input data'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {jsonKeys.map((key) => (
                <JsonKeyItem
                  key={key.path}
                  jsonKey={key}
                  onCopy={handleCopy}
                  copiedPath={copiedPath}
                />
              ))}
            </div>
          )}
        </div>
      </div>
  );
}

