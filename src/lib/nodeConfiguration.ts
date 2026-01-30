import { supabase } from '@/integrations/supabase/client';
import { LinkedInCredentials } from './credentials';

/**
 * Update all LinkedIn nodes in all workflows with new credentials
 */
export async function updateLinkedInNodes(credentials: LinkedInCredentials): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Get all workflows for the user
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('id, nodes')
      .eq('user_id', user.id);

    if (workflowsError) {
      throw new Error(`Failed to fetch workflows: ${workflowsError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      console.log('No workflows found to update');
      return;
    }

    let updatedCount = 0;

    // Update each workflow
    for (const workflow of workflows) {
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        continue;
      }

      let workflowUpdated = false;
      const updatedNodes = workflow.nodes.map((node: any) => {
        // Check if this is a LinkedIn node
        if (node.data?.type === 'linkedin' || node.type === 'linkedin') {
          workflowUpdated = true;
          updatedCount++;

          // Update node configuration with credentials
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data?.config,
                accessToken: credentials.accessToken,
                accountType: credentials.accountType,
                organizationId: credentials.accountType === 'organization' 
                  ? credentials.organizationId 
                  : undefined,
                configured: true,
              },
            },
          };
        }
        return node;
      });

      // Save updated workflow if any LinkedIn nodes were found
      if (workflowUpdated) {
        const { error: updateError } = await supabase
          .from('workflows')
          .update({ nodes: updatedNodes })
          .eq('id', workflow.id);

        if (updateError) {
          console.error(`Failed to update workflow ${workflow.id}:`, updateError);
        } else {
          console.log(`Updated workflow ${workflow.id} with LinkedIn credentials`);
        }
      }
    }

    console.log(`Updated ${updatedCount} LinkedIn node(s) across ${workflows.length} workflow(s)`);
  } catch (error) {
    console.error('Error updating LinkedIn nodes:', error);
    throw error;
  }
}

/**
 * Get credentials for a specific node type
 */
export async function getNodeCredentials(nodeType: 'linkedin' | 'google'): Promise<any> {
  const { getCredentials } = await import('./credentials');
  return await getCredentials(nodeType);
}
