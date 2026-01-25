import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRightLeft, Lightbulb, Code } from 'lucide-react';
import { NodeUsageGuide } from './nodeTypes';

interface NodeUsageCardProps {
  guide: NodeUsageGuide;
  nodeLabel: string;
}

export default function NodeUsageCard({ guide, nodeLabel }: NodeUsageCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="io" className="text-xs">I/O</TabsTrigger>
            <TabsTrigger value="example" className="text-xs">Example</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {guide.overview}
            </p>
            {guide.tips && guide.tips.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Lightbulb className="h-3 w-3" />
                  Tips
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="io" className="mt-2 space-y-3">
            <div>
              <div className="flex items-center gap-1 text-xs font-medium mb-1">
                <ArrowRightLeft className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Inputs</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {guide.inputs.map((input, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-green-500/10 border-green-500/30">
                    {input}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-medium mb-1">
                <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                <span className="text-blue-600">Outputs</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {guide.outputs.map((output, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30">
                    {output}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="example" className="mt-2">
            <div className="flex items-center gap-1 text-xs font-medium mb-2 text-primary">
              <Code className="h-3 w-3" />
              Example Usage
            </div>
            <ScrollArea className="h-[100px]">
              <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                {guide.example}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
