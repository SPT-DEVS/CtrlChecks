import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a Supabase/PostgREST error is a 406 (Not Acceptable) error.
 * 
 * Why 406 happens:
 * - PostgREST returns 406 when a query is syntactically valid but returns no visible rows
 * - This occurs when RLS (Row Level Security) policies block access to empty result sets
 * - Common scenario: Querying executions for a workflow that has no executions yet
 * 
 * Why this is expected:
 * - The query is valid (table exists, columns exist, RLS allows access)
 * - But when filtering by workflow_id that has no executions, PostgREST can't determine
 *   if the empty result is due to "no rows exist" vs "RLS blocked all rows"
 * - Returns 406 instead of 200 [] to signal this ambiguity
 * 
 * How to handle:
 * - Treat 406 errors as "no executions/results yet" (empty result set)
 * - Do NOT retry or treat as a real error
 * - Suppress from console logs to reduce noise
 */
export function is406Error(error: any): boolean {
  if (!error) return false;
  
  // Check various error formats that Supabase/PostgREST might use
  return (
    error.code === 'PGRST116' ||
    error.status === 406 ||
    error.statusCode === 406 ||
    (error as any)?.status === 406 ||
    (error as any)?.statusCode === 406 ||
    (typeof error.message === 'string' && error.message.includes('406')) ||
    (typeof error === 'string' && error.includes('406')) ||
    // Check nested response objects
    (error.response && (error.response.status === 406 || error.response.statusCode === 406)) ||
    // Check for "Not Acceptable" in message
    (typeof error.message === 'string' && error.message.toLowerCase().includes('not acceptable'))
  );
}