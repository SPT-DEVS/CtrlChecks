/**
 * Templates Page (User View)
 * Browse and copy workflow templates
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Star, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getActiveTemplates, copyTemplate } from '@/lib/api/templates';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Template = Database['public']['Tables']['templates']['Row'] & {
  difficulty?: string;
  estimated_setup_time?: number;
  tags?: string[];
};

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function handleCopyTemplate(template: Template) {
    try {
      const result = await copyTemplate(template.id, `${template.name} (Copy)`);
      toast({
        title: 'Success',
        description: 'Template copied to your workflows',
      });
      navigate(`/workflow/${result.workflow.id}`);
    } catch (error) {
      console.error('Failed to copy template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to copy template',
        variant: 'destructive',
      });
    }
  }

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workflow Templates</h1>
        <p className="text-muted-foreground mt-1">
          Browse pre-built workflow templates. Copy any template to start customizing.
        </p>
      </div>

      <Input
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  {template.difficulty && (
                    <Badge variant="secondary">{template.difficulty}</Badge>
                  )}
                  {template.estimated_setup_time && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {template.estimated_setup_time} min
                    </Badge>
                  )}
                </div>
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{template.use_count || 0} uses</span>
                  </div>
                  <Button onClick={() => handleCopyTemplate(template)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found</p>
        </div>
      )}
    </div>
  );
}

