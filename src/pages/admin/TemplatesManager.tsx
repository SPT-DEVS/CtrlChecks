/**
 * Admin Templates Manager
 * Full CRUD interface for managing global templates
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Star, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getAllTemplates, deleteTemplate, toggleTemplateActive, createTemplate, updateTemplate } from '@/lib/api/admin';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Template = Database['public']['Tables']['templates']['Row'];

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    estimated_setup_time: 5,
    tags: '',
    is_featured: false,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(templateId: string, currentStatus: boolean) {
    try {
      await toggleTemplateActive(templateId, !currentStatus);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  }

  async function handleDelete(templateId: string) {
    if (!confirm('Are you sure you want to delete this template? Existing workflows using it will continue to work.')) {
      return;
    }

    try {
      await deleteTemplate(templateId);
      toast({ title: 'Success', description: 'Template deleted successfully' });
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive' 
      });
    }
  }

  function handleCreateClick() {
    setFormData({
      name: '',
      description: '',
      category: '',
      difficulty: 'Beginner',
      estimated_setup_time: 5,
      tags: '',
      is_featured: false,
    });
    setEditingTemplate(null);
    setCreateDialogOpen(true);
  }

  function handleEditClick(template: Template) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      difficulty: 'Beginner',
      estimated_setup_time: 5,
      tags: '',
      is_featured: template.is_featured || false,
    });
    setEditDialogOpen(true);
  }

  async function handleCreateSubmit() {
    if (!formData.name || !formData.category) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name and Category are required',
        variant: 'destructive' 
      });
      return;
    }

    try {
      // Create a minimal template - nodes and edges will be empty initially
      // Admin can edit in workflow builder later
      const newTemplate = await createTemplate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        nodes: [] as any, // Empty initially - will be edited in workflow builder
        edges: [] as any, // Empty initially - will be edited in workflow builder
        is_featured: formData.is_featured,
      });

      toast({ 
        title: 'Success', 
        description: 'Template created successfully. Opening workflow editor...' 
      });
      setCreateDialogOpen(false);
      await loadTemplates();
      
      // Navigate to template editor to add nodes and edges
      navigate(`/admin/template/${newTemplate.id}/edit`);
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create template',
        variant: 'destructive' 
      });
    }
  }

  async function handleEditSubmit() {
    if (!editingTemplate || !formData.name || !formData.category) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name and Category are required',
        variant: 'destructive' 
      });
      return;
    }

    try {
      await updateTemplate(editingTemplate.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        is_featured: formData.is_featured,
      });

      toast({ title: 'Success', description: 'Template updated successfully' });
      setEditDialogOpen(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update template',
        variant: 'destructive' 
      });
    }
  }

  if (loading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage global workflow templates. Changes affect all users.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new workflow template. You can add nodes and edges in the workflow builder after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Customer Support Bot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this template does..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI Chatbots">AI Chatbots</SelectItem>
                      <SelectItem value="Webhook Automation">Webhook Automation</SelectItem>
                      <SelectItem value="Data Processing">Data Processing</SelectItem>
                      <SelectItem value="If-Else Logic">If-Else Logic</SelectItem>
                      <SelectItem value="Monitoring & Alerts">Monitoring & Alerts</SelectItem>
                      <SelectItem value="AI Agents">AI Agents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="setup_time">Setup Time (minutes)</Label>
                  <Input
                    id="setup_time"
                    type="number"
                    value={formData.estimated_setup_time}
                    onChange={(e) => setFormData({ ...formData, estimated_setup_time: parseInt(e.target.value) || 5 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="chatbot, ai, support"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked === true })}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Mark as Featured
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
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
                <Badge variant={template.is_featured ? 'default' : 'secondary'}>
                  {template.is_featured ? 'Featured' : 'Standard'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Category:</span>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Used:</span>
                  <span className="font-medium">{template.use_count || 0} times</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditClick(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/template/${template.id}/edit`)}
                    title="Edit Workflow"
                  >
                    <GitBranch className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template metadata. To edit nodes and edges, use the workflow builder.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Template Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Customer Support Bot"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this template does..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AI Chatbots">AI Chatbots</SelectItem>
                        <SelectItem value="Webhook Automation">Webhook Automation</SelectItem>
                        <SelectItem value="Data Processing">Data Processing</SelectItem>
                        <SelectItem value="If-Else Logic">If-Else Logic</SelectItem>
                        <SelectItem value="Monitoring & Alerts">Monitoring & Alerts</SelectItem>
                        <SelectItem value="AI Agents">AI Agents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-difficulty">Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-setup_time">Setup Time (minutes)</Label>
                    <Input
                      id="edit-setup_time"
                      type="number"
                      value={formData.estimated_setup_time}
                      onChange={(e) => setFormData({ ...formData, estimated_setup_time: parseInt(e.target.value) || 5 })}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                    <Input
                      id="edit-tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="chatbot, ai, support"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked === true })}
                  />
                  <Label htmlFor="edit-featured" className="cursor-pointer">
                    Mark as Featured
                  </Label>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/admin/template/${editingTemplate.id}/edit`)}
                  className="w-full sm:w-auto"
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  Edit Workflow
                </Button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                  <Button onClick={handleEditSubmit} className="flex-1 sm:flex-none">
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

