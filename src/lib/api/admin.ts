/**
 * Admin API Client
 * Admin-only template operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ENDPOINTS } from '@/config/endpoints';

type Template = Database['public']['Tables']['templates']['Row'];
type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
type TemplateUpdate = Database['public']['Tables']['templates']['Update'];

const ADMIN_API_BASE = `${ENDPOINTS.itemBackend}/admin-templates`;

/**
 * Get Supabase session token
 */
async function getAuthToken(): Promise<string> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
  
    if (error || !session) {
      throw new Error('Not authenticated');
    }
  
    return session.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

/**
 * List all templates (admin only - includes inactive)
 */
export async function getAllTemplates(): Promise<Template[]> {
  const token = await getAuthToken();
  
  const response = await fetch(ADMIN_API_BASE, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch templates');
  }

  const data = await response.json();
  return data.templates || [];
}

/**
 * Get single template (admin only)
 */
export async function getTemplateById(templateId: string): Promise<Template> {
  const token = await getAuthToken();
  
  const response = await fetch(`${ADMIN_API_BASE}/${templateId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch template');
  }

  const data = await response.json();
  return data.template;
}

/**
 * Create new template (admin only)
 */
export async function createTemplate(template: Omit<TemplateInsert, 'id' | 'created_at' | 'version' | 'use_count'>): Promise<Template> {
  const token = await getAuthToken();
  
  const response = await fetch(ADMIN_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create template');
  }

  const data = await response.json();
  return data.template;
}

/**
 * Update template (admin only - auto-increments version)
 */
export async function updateTemplate(templateId: string, updates: Partial<TemplateUpdate>): Promise<Template> {
  const token = await getAuthToken();
  
  const response = await fetch(`${ADMIN_API_BASE}/${templateId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update template');
  }

  const data = await response.json();
  return data.template;
}

/**
 * Toggle template active status (admin only)
 */
export async function toggleTemplateActive(templateId: string, isActive: boolean): Promise<Template> {
  const token = await getAuthToken();
  
  const response = await fetch(`${ADMIN_API_BASE}/${templateId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update template');
  }

  const data = await response.json();
  return data.template;
}

/**
 * Delete template (admin only - soft delete if workflows use it)
 */
export async function deleteTemplate(templateId: string): Promise<{ message: string }> {
  const token = await getAuthToken();
  
  const response = await fetch(`${ADMIN_API_BASE}/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete template');
  }

  return response.json();
}

