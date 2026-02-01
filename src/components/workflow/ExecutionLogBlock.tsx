import { useState } from 'react';
import { 
  CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronUp, Copy,
  Play, Webhook, Code, GitBranch, Database, FileText, MessageSquare,
  Timer, ShieldAlert, Link, Globe, Brain, Sparkles, Gem, GitMerge,
  Repeat, Braces, Table, Type, Combine, Send, Mail, Box, DatabaseZap,
  Calendar, Users, Layers, Edit, Edit3, Tag, Code2, ListChecks,
  ArrowUpDown, List, Terminal, Calculator, Lock, Rss, Target, Bot,
  AlertTriangle, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  nodeType?: string;
  status: 'running' | 'success' | 'failed' | 'skipped' | 'pending';
  startedAt: string;
  finishedAt?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
}

interface ExecutionLogBlockProps {
  log: ExecutionLog;
  index: number;
  totalNodes: number;
  isLast?: boolean;
}

// Map node types to icons
const getNodeIcon = (nodeType?: string, nodeName?: string): React.ComponentType<{ className?: string }> => {
  // Try to infer from nodeName if nodeType is not available
  const type = nodeType?.toLowerCase() || nodeName?.toLowerCase() || '';
  
  if (type.includes('trigger') || type.includes('manual')) return Play;
  if (type.includes('webhook')) return Webhook;
  if (type.includes('javascript') || type.includes('code')) return Code;
  if (type.includes('if') || type.includes('else') || type.includes('condition')) return GitBranch;
  if (type.includes('database') || type.includes('db')) return Database;
  if (type.includes('form')) return FileText;
  if (type.includes('chat') || type.includes('message')) return MessageSquare;
  if (type.includes('interval') || type.includes('timer')) return Timer;
  if (type.includes('error')) return ShieldAlert;
  if (type.includes('schedule') || type.includes('cron')) return Clock;
  if (type.includes('log')) return Terminal;
  if (type.includes('ai') || type.includes('llm') || type.includes('openai')) return Brain;
  if (type.includes('loop') || type.includes('repeat')) return Repeat;
  if (type.includes('format') || type.includes('json')) return Braces;
  if (type.includes('table') || type.includes('array')) return Table;
  if (type.includes('string') || type.includes('text')) return Type;
  if (type.includes('merge') || type.includes('combine')) return Combine;
  if (type.includes('email') || type.includes('mail')) return Mail;
  if (type.includes('send')) return Send;
  if (type.includes('storage') || type.includes('file')) return Box;
  if (type.includes('calendar') || type.includes('date')) return Calendar;
  if (type.includes('user') || type.includes('people')) return Users;
  if (type.includes('edit') || type.includes('modify')) return Edit;
  if (type.includes('tag') || type.includes('label')) return Tag;
  if (type.includes('list') || type.includes('array')) return List;
  if (type.includes('calculate') || type.includes('math')) return Calculator;
  if (type.includes('lock') || type.includes('secure')) return Lock;
  if (type.includes('rss') || type.includes('feed')) return Rss;
  if (type.includes('target') || type.includes('goal')) return Target;
  if (type.includes('bot') || type.includes('agent')) return Bot;
  
  // Default icon
  return Code;
};

// Count fields in an object (recursively)
const countFields = (obj: unknown): number => {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== 'object') return 1;
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countFields(item), 0);
  }
  return Object.keys(obj).length;
};

// Count modified fields between input and output
const countModifiedFields = (input: unknown, output: unknown): number => {
  if (!input || !output || typeof input !== 'object' || typeof output !== 'object') return 0;
  
  const inputKeys = Object.keys(input);
  const outputKeys = Object.keys(output);
  
  let modified = 0;
  for (const key of inputKeys) {
    if (outputKeys.includes(key)) {
      const inputVal = (input as Record<string, unknown>)[key];
      const outputVal = (output as Record<string, unknown>)[key];
      if (JSON.stringify(inputVal) !== JSON.stringify(outputVal)) {
        modified++;
      }
    }
  }
  return modified;
};

export default function ExecutionLogBlock({ log, index, totalNodes, isLast = false }: ExecutionLogBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputExpanded, setInputExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);

  const NodeIcon = getNodeIcon(log.nodeType, log.nodeName);
  const nodeName = log.nodeName || log.nodeId || `Node ${index + 1}`;
  const status = log.status || 'unknown';

  // Calculate duration
  const duration = log.startedAt && log.finishedAt
    ? new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()
    : null;

  // Status-based styling
  const statusStyles = {
    success: {
      border: 'border-green-500/30',
      bg: 'bg-green-500/5',
      text: 'text-green-600',
      badge: 'bg-green-500/10 text-green-600 border-green-500/30',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    failed: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      text: 'text-red-600',
      badge: 'bg-red-500/10 text-red-600 border-red-500/30',
      icon: XCircle,
      iconColor: 'text-red-500'
    },
    running: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      text: 'text-blue-600',
      badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: Loader2,
      iconColor: 'text-blue-500'
    },
    skipped: {
      border: 'border-gray-500/30',
      bg: 'bg-gray-500/5',
      text: 'text-gray-600',
      badge: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
      icon: Minus,
      iconColor: 'text-gray-500'
    },
    pending: {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/5',
      text: 'text-yellow-600',
      badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      icon: Clock,
      iconColor: 'text-yellow-500'
    }
  };

  const style = statusStyles[status] || statusStyles.pending;
  const StatusIcon = style.icon;

  // Copy to clipboard function
  const copyToClipboard = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  // Format duration
  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const inputFieldCount = log.input !== undefined ? countFields(log.input) : 0;
  const outputFieldCount = log.output !== undefined && log.output !== null ? countFields(log.output) : 0;
  const addedFields = outputFieldCount - inputFieldCount;
  const modifiedFields = log.input && log.output ? countModifiedFields(log.input, log.output) : 0;

  return (
    <div className="relative">
      {/* Node Block */}
      <div 
        className={cn(
          "node-block border-2 rounded-xl p-4 mb-4 transition-all hover:shadow-lg",
          style.border,
          style.bg,
          "hover:scale-[1.01]"
        )}
        data-node-id={log.nodeId}
        data-status={status}
      >
        {/* Node Header */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="node-header flex items-center justify-between cursor-pointer p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg", style.bg)}>
                  <NodeIcon className={cn("h-5 w-5", style.iconColor)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">
                      Node #{index + 1}: {nodeName}
                    </h3>
                    <Badge variant="outline" className={cn("text-xs px-2 py-0", style.badge)}>
                      {status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {duration !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(duration)}
                      </span>
                    )}
                    {log.startedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(log.startedAt)}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      #{index + 1}/{totalNodes}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", style.iconColor, status === 'running' && "animate-spin")} />
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="node-content space-y-3 mt-3">
              {/* Input Section */}
              {log.input !== undefined && (
                <Collapsible open={inputExpanded} onOpenChange={setInputExpanded}>
                  <div className="input-output-section border-l-4 border-blue-500 pl-4">
                    <CollapsibleTrigger asChild>
                      <div className="section-header flex items-center justify-between mb-2 cursor-pointer hover:opacity-80">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-muted-foreground">📥 INPUT</h4>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {inputFieldCount} {inputFieldCount === 1 ? 'field' : 'fields'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(JSON.stringify(log.input, null, 2), 'Input');
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          {inputExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="json-viewer p-3 rounded-md bg-muted/30 border border-border/50 text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto">
                        {JSON.stringify(log.input, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Connection Arrow */}
              {log.input !== undefined && log.output !== undefined && log.output !== null && (
                <div className="connection-arrow flex flex-col items-center my-2">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <div className="text-blue-500 font-semibold">↓</div>
                    <span className="text-blue-500">Data Flow</span>
                    <div className="text-blue-500 font-semibold">↓</div>
                  </div>
                </div>
              )}

              {/* Output Section */}
              {log.output !== undefined && log.output !== null ? (
                <Collapsible open={outputExpanded} onOpenChange={setOutputExpanded}>
                  <div className="input-output-section border-l-4 border-green-500 pl-4">
                    <CollapsibleTrigger asChild>
                      <div className="section-header flex items-center justify-between mb-2 cursor-pointer hover:opacity-80">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-muted-foreground">📤 OUTPUT</h4>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {outputFieldCount} {outputFieldCount === 1 ? 'field' : 'fields'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(JSON.stringify(log.output, null, 2), 'Output');
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          {outputExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="json-viewer p-3 rounded-md bg-muted/30 border border-border/50 text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto">
                        {JSON.stringify(log.output, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ) : log.status === 'success' ? (
                <div className="text-xs text-muted-foreground italic p-2">
                  📤 OUTPUT: (null or empty)
                </div>
              ) : null}

              {/* Data Transformation Summary */}
              {log.input !== undefined && log.output !== undefined && log.output !== null && (
                <div className="transformation-summary p-2 rounded-md bg-muted/20 border border-border/30 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-muted-foreground">Data Changes:</strong>
                    {addedFields > 0 && (
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/20">
                        +{addedFields} {addedFields === 1 ? 'field' : 'fields'} added
                      </span>
                    )}
                    {modifiedFields > 0 && (
                      <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                        {modifiedFields} {modifiedFields === 1 ? 'field' : 'fields'} modified
                      </span>
                    )}
                    {addedFields === 0 && modifiedFields === 0 && (
                      <span className="text-muted-foreground">No changes detected</span>
                    )}
                  </div>
                </div>
              )}

              {/* Error Section */}
              {log.error && (
                <div className="error-section mt-3 pt-3 border-t border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h4 className="text-xs font-semibold text-red-500">❌ ERROR</h4>
                  </div>
                  <pre className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 whitespace-pre-wrap break-words">
                    {log.error}
                  </pre>
                </div>
              )}

              {/* Data Flow Tags */}
              {log.output && typeof log.output === 'object' && !Array.isArray(log.output) && (
                <div className="node-footer mt-3 pt-3 border-t border-border/30">
                  <div className="text-xs text-muted-foreground mb-2">Data Fields Passed to Next Node:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(log.output).slice(0, 10).map((key) => (
                      <span
                        key={key}
                        className="data-tag px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border border-border/50"
                        title={`Field: ${key}`}
                      >
                        {key}
                      </span>
                    ))}
                    {Object.keys(log.output).length > 10 && (
                      <span className="data-tag px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border border-border/50">
                        +{Object.keys(log.output).length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Connection Line to Next Block */}
      {!isLast && (
        <div className="connection-line flex flex-col items-center mb-4">
          <div className="w-0.5 h-6 bg-gradient-to-b from-blue-400 via-blue-300 to-transparent"></div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span>↓</span>
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          </div>
        </div>
      )}
    </div>
  );
}
