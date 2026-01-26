import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ENDPOINTS } from '@/config/endpoints';
import { Loader2 } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string } | string>;
}

interface FormConfig {
  formTitle: string;
  formDescription?: string;
  fields: FormField[];
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
}

export default function FormTrigger() {
  const { workflowId, nodeId } = useParams<{ workflowId: string; nodeId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadFormConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch workflow and form node config
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError || !workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status !== 'active') {
        throw new Error('This form is no longer active. The workflow has been deactivated.');
      }

      const nodes = workflow.nodes as any[];
      const formNode = nodes?.find(
        (node: any) =>
          (node.id === nodeId || node.data?.id === nodeId) &&
          (node.data?.type === 'form' || node.type === 'form')
      );

      if (!formNode) {
        throw new Error('Form node not found in this workflow');
      }

      const config = formNode.data?.config || formNode.config || {};

      // Parse fields
      let fields: FormField[] = [];
      if (Array.isArray(config.fields)) {
        fields = config.fields;
      } else if (typeof config.fields === 'string') {
        try {
          fields = JSON.parse(config.fields || '[]');
        } catch (e) {
          console.error('Failed to parse fields JSON:', e);
          fields = [];
        }
      }

      setFormConfig({
        formTitle: config.formTitle || 'Form Submission',
        formDescription: config.formDescription || '',
        fields,
        submitButtonText: config.submitButtonText || 'Submit',
        successMessage: config.successMessage || 'Thank you for your submission!',
        redirectUrl: config.redirectUrl || '',
      });
    } catch (err) {
      console.error('Error loading form config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load form');
    } finally {
      setLoading(false);
    }
  }, [workflowId, nodeId]);

  useEffect(() => {
    if (!workflowId || !nodeId) {
      setError('Invalid form URL');
      setLoading(false);
      return;
    }

    loadFormConfig();
  }, [workflowId, nodeId, loadFormConfig]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workflowId || !nodeId || !formConfig) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data: Record<string, any> = {};

      // Collect form data
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }

      // Generate idempotency key
      const idempotencyKey = `form_${workflowId}_${nodeId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await fetch(
        `${ENDPOINTS.itemBackend}/form-trigger/${workflowId}/${nodeId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ formData: data }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(errorData.message || errorData.error || 'Submission failed. Please try again.');
      }

      // Parse success response
      const result = await response.json();

      // Success
      setSubmitSuccess(true);

      // Handle redirect if configured
      if (result.redirect || formConfig.redirectUrl) {
        setTimeout(() => {
          window.location.href = result.redirect || formConfig.redirectUrl!;
        }, 2000);
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✗</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!formConfig) {
    return null;
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Success!</h1>
          <p className="text-gray-600 dark:text-gray-300">{formConfig.successMessage}</p>
          {formConfig.redirectUrl && (
            <p className="text-sm text-muted-foreground mt-4">Redirecting...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formConfig.formTitle}
          </h1>
          {formConfig.formDescription && (
            <p className="text-gray-600 dark:text-gray-300 mb-6">{formConfig.formDescription}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {formConfig.fields.map((field) => {
              // Create unique field ID using workflowId, nodeId, and field name to prevent duplicates
              const fieldId = `form-${workflowId}-${nodeId}-${field.name}`;
              return <div key={field.name} className="space-y-2">
                  <label
                    htmlFor={fieldId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={fieldId}
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      defaultValue={field.defaultValue}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={fieldId}
                      name={field.name}
                      required={field.required}
                      defaultValue={field.defaultValue}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map((opt) => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      id={fieldId}
                      name={field.name}
                      defaultChecked={field.defaultValue === 'true'}
                      required={field.required}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  ) : field.type === 'radio' ? (
                    <div className="space-y-2">
                      {(field.options || []).map((opt, idx) => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const radioId = `${fieldId}-${idx}-${value}`;
                        return (
                          <label key={idx} htmlFor={radioId} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={radioId}
                              name={field.name}
                              value={value}
                              required={field.required && idx === 0}
                              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'file' ? (
                    <input
                      type="file"
                      id={fieldId}
                      name={field.name}
                      required={field.required}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <input
                      type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'tel' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'}
                      id={fieldId}
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      defaultValue={field.defaultValue}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  )}

                {field.helpText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{field.helpText}</p>
                )}
              </div>;
            })}

            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-md shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Submitting...
                </span>
              ) : (
                formConfig.submitButtonText
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

