/**
 * Template API Client
 * User-facing template operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';

// Template type - using any to avoid complex type inference issues
type Template = any;

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  estimated_setup_time: number | null;
  tags: string[] | null;
  version: number;
  is_featured: boolean;
  use_count: number;
  preview_image: string | null;
}

/**
 * Get all active templates (for users)
 */
export async function getActiveTemplates(): Promise<Template[]> {
  // @ts-expect-error - Type inference issue with Supabase complex types
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Template[];
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Copy template to user workflow
 */
export async function copyTemplate(templateId: string, workflowName?: string): Promise<{ workflow: any; message: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${ENDPOINTS.itemBackend}/copy-template`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          templateId,
          workflowName: workflowName || undefined,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to copy template' }));
      throw new Error(error.error || 'Failed to copy template');
    }

    return response.json();
  } catch (error) {
    console.error('Error copying template:', error);
    throw error;
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)
    .order('is_featured', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Search templates
 */
export async function searchTemplates(query: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('is_featured', { ascending: false });

  if (error) throw error;
  return data || [];
}

