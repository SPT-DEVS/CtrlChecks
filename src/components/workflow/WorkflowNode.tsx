import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { NodeData } from '@/stores/workflowStore';
import { NODE_CATEGORIES } from './nodeTypes';
import { useDebugStore } from '@/stores/debugStore';
import {
  Play, Webhook, Clock, Globe, Brain, Sparkles, Gem, Link, GitBranch,
  GitMerge, Repeat, Timer, ShieldAlert, Code, Braces, Table, Type,
  Combine, Send, Mail, MessageSquare, Database, Box,
  CheckCircle, XCircle, Loader2,
  FileText, DatabaseZap, Calendar, Users,
  Layers, Edit, Edit3, Tag, Code2, ListChecks,
  ArrowUpDown, List, Terminal, Calculator, Lock, Rss, Target, Bug, Bot,
  AlertTriangle, Plus
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Play, Webhook, Clock, Globe, Brain, Sparkles, Gem, Link, GitBranch,
  GitMerge, Repeat, Timer, ShieldAlert, Code, Braces, Table, Type,
  Combine, Send, Mail, MessageSquare, Database, Box, FileText, DatabaseZap,
  Calendar, CheckCircle, Users,
  XCircle, Layers, Edit, Edit3, Tag, Code2, ListChecks, ArrowUpDown, List, Terminal,
  Calculator, Lock, Rss, Target, Bot
};

type WorkflowNodeProps = Node<NodeData>;

const WorkflowNode = memo(({ data, selected, id }: NodeProps<WorkflowNodeProps>) => {
  const { openDebug } = useDebugStore();
  
  // Skip rendering form nodes - they use custom FormTriggerNode component
  if (data?.type === 'form') {
    return null;
  }
  
  // Fallback for missing data fields
  if (!data) {
    console.warn('[WorkflowNode] Missing data prop');
    return null;
  }

  const handleDebugClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openDebug(id);
  };
  
  // Ensure required fields exist with fallbacks
  const nodeType = data.type || 'unknown';
  const nodeLabel = data.label || nodeType || 'Unknown Node';
  const nodeCategory = data.category || 'data';
  const nodeIcon = data.icon || 'Box';
  
  const category = NODE_CATEGORIES.find((c) => c.id === nodeCategory);
  const IconComponent = iconMap[nodeIcon] || Box;
  const isIfElseNode = nodeType === 'if_else';
  const isSwitchNode = nodeType === 'switch';
  const isAIAgentNode = nodeType === 'ai_agent';

  // Parse Switch cases to create output handles
  // This will automatically update when data.config.cases changes
  let switchCases: Array<{ value: string; label?: string }> = [];
  if (isSwitchNode && data.config?.cases) {
    try {
      const casesConfig = data.config.cases;
      if (typeof casesConfig === 'string') {
        switchCases = JSON.parse(casesConfig);
      } else if (Array.isArray(casesConfig)) {
        switchCases = casesConfig;
      }
    } catch (error) {
      console.error('Failed to parse Switch cases:', error);
    }
  }

  // Create a key based on cases to help React identify when handles need to update
  const switchCasesKey = isSwitchNode
    ? JSON.stringify(switchCases.map(c => c.value).sort())
    : '';

  const status = data.executionStatus || 'idle';

  // Determine border styles based on status
  let borderClass = selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/50';

  if (status === 'running') {
    borderClass = 'border-blue-500 border-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse';
  } else if (status === 'success') {
    borderClass = 'border-blue-500 border-2';
  }
  // Error nodes keep default border color (no red)

  return (
    <div
      className={cn(
        'px-5 py-4 rounded-lg border-2 bg-card shadow-md transition-all relative',
        borderClass,
        isAIAgentNode && 'pb-16' // Extra padding for bottom port labels
      )}
      style={{ width: isAIAgentNode ? '280px' : '240px', minHeight: isAIAgentNode ? '120px' : '70px' }}
    >
      {/* Execution Status Indicators */}
      {status === 'running' && (
        <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border border-border z-10">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        </div>
      )}
      {status === 'success' && (
        <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border border-border z-10">
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
      )}
      {status === 'error' && (
        <>
          <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border border-border z-10">
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          {/* Error indicator in bottom-right corner for AI Agent */}
          {isAIAgentNode && (
            <div className="absolute bottom-2 right-2 z-10">
              <div className="bg-red-500 rounded-sm p-0.5">
                <AlertTriangle className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
        </>
      )}

      {/* AI Agent has multiple input ports with labels */}
      {isAIAgentNode ? (
        <>
          {/* Left side: General input handle with visual indicator (for userInput) */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 flex items-center pointer-events-none z-0">
            <Plus className="h-2 w-2 text-muted-foreground/50 mr-0.5" />
            <div className="w-2 h-px bg-border/40"></div>
          </div>
          <Handle
            type="target"
            id="userInput"
            position={Position.Left}
            className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          />
          
          {/* Bottom Input Ports with Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end px-2 pb-1">
            {/* Chat Model* (left) */}
            <div className="flex flex-col items-center relative" style={{ flex: 1 }}>
              <div className="relative mb-1">
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <div className="w-2.5 h-2.5 bg-muted-foreground border-2 border-background rotate-45"></div>
                </div>
                <Handle
                  type="target"
                  id="chat_model"
                  position={Position.Bottom}
                  className="!w-2.5 !h-2.5 !bg-transparent !border-0"
                />
              </div>
              <div className="text-[10px] text-foreground font-medium whitespace-nowrap text-center leading-tight mt-0.5">
                Chat Model<span className="text-red-500 ml-0.5">*</span>
              </div>
              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <div className="w-px h-2.5 bg-border/40"></div>
                <Plus className="h-2 w-2 text-muted-foreground/50 -mt-0.5" />
              </div>
            </div>
            
            {/* Memory (middle) */}
            <div className="flex flex-col items-center relative" style={{ flex: 1 }}>
              <div className="relative mb-1">
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <div className="w-2.5 h-2.5 bg-muted-foreground border-2 border-background rotate-45"></div>
                </div>
                <Handle
                  type="target"
                  id="memory"
                  position={Position.Bottom}
                  className="!w-2.5 !h-2.5 !bg-transparent !border-0"
                />
              </div>
              <div className="text-[10px] text-foreground font-medium whitespace-nowrap text-center leading-tight mt-0.5">
                Memory
              </div>
              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <div className="w-px h-2.5 bg-border/40"></div>
                <Plus className="h-2 w-2 text-muted-foreground/50 -mt-0.5" />
              </div>
            </div>
            
            {/* Tool (right) */}
            <div className="flex flex-col items-center relative" style={{ flex: 1 }}>
              <div className="relative mb-1">
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <div className="w-2.5 h-2.5 bg-muted-foreground border-2 border-background rotate-45"></div>
                </div>
                <Handle
                  type="target"
                  id="tool"
                  position={Position.Bottom}
                  className="!w-2.5 !h-2.5 !bg-transparent !border-0"
                />
              </div>
              <div className="text-[10px] text-foreground font-medium whitespace-nowrap text-center leading-tight mt-0.5">
                Tool
              </div>
              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <div className="w-px h-2.5 bg-border/40"></div>
                <Plus className="h-2 w-2 text-muted-foreground/50 -mt-0.5" />
              </div>
            </div>
          </div>
          
          {/* Output handle on right side (centered vertically) with visual connection indicator */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-10">
            <Handle
              type="source"
              id="output"
              position={Position.Right}
              className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
            />
          </div>
          {/* Visual output connection indicator - horizontal line and plus sign extending to the right */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 flex items-center pointer-events-none z-0">
            <div className="w-3 h-px bg-border/40"></div>
            <Plus className="h-2.5 w-2.5 text-muted-foreground/50 -ml-0.5" />
          </div>
        </>
      ) : (
        <>
          <Handle
            type="target"
            id="input"
            position={Position.Top}
            className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
          />
        </>
      )}

      <div className={cn("flex items-center gap-3", isAIAgentNode && "justify-center")}>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0"
          style={{ backgroundColor: category?.color + '20', color: category?.color }}
        >
          <IconComponent className="h-4 w-4" />
        </div>
        {isAIAgentNode ? (
          <div className="flex-1 min-w-0 text-center">
            <div className="font-medium text-sm leading-tight break-words hyphens-auto">
              {nodeLabel}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm leading-tight break-words hyphens-auto">
              {nodeLabel}
            </div>
            <div className="text-xs text-muted-foreground capitalize leading-tight break-words mt-0.5">
              {nodeCategory}
            </div>
          </div>
        )}
        <button
          onClick={handleDebugClick}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded-md flex-shrink-0",
            "text-muted-foreground/60 hover:text-foreground/80 hover:bg-muted/60",
            "transition-colors duration-150",
            "border border-border/40 hover:border-border"
          )}
          title="Debug Node"
          aria-label="Debug Node"
        >
          <Bug className="h-3.5 w-3.5" />
        </button>
      </div>

      {isIfElseNode ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Bottom}
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
            style={{ left: '25%' }}
          />
          <Handle
            type="source"
            id="false"
            position={Position.Bottom}
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
            style={{ left: '75%' }}
          />
        </>
      ) : isSwitchNode ? (
        switchCases.length > 0 ? (
          <>
            {/* Output handles - dynamically positioned based on number of cases */}
            {switchCases.map((c, idx) => {
              // Calculate position: evenly distribute handles across the bottom border
              // For 1 case: 50% (center)
              // For 2 cases: 25% and 75%
              // For 3+ cases: evenly spaced from edges
              let leftPercent: string;
              if (switchCases.length === 1) {
                leftPercent = '50%';
              } else if (switchCases.length === 2) {
                leftPercent = idx === 0 ? '25%' : '75%';
              } else {
                // For 3+ cases, distribute evenly across the border
                const spacing = 70 / (switchCases.length - 1);
                leftPercent = `${15 + (idx * spacing)}%`;
              }

              return (
                <Handle
                  key={`${c.value}-${switchCasesKey}`}
                  type="source"
                  id={c.value}
                  position={Position.Bottom}
                  className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background"
                  style={{
                    left: leftPercent,
                    transform: 'translateX(-50%)'
                  }}
                />
              );
            })}
          </>
        ) : (
          // No cases configured yet - show single default handle
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
          />
        )
      ) : isAIAgentNode ? null : (
        <Handle
          type="source"
          id="output"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;
