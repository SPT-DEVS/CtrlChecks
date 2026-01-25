/**
 * Admin Dashboard
 * Main landing page for admin users
 */

import { useNavigate } from 'react-router-dom';
import { Shield, LayoutTemplate, Users, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminActions = [
    {
      title: 'Templates Manager',
      description: 'Create, edit, and manage workflow templates',
      icon: LayoutTemplate,
      action: () => navigate('/admin/templates'),
      color: 'text-blue-500',
    },
    {
      title: 'User Management',
      description: 'View and manage user accounts',
      icon: Users,
      action: () => navigate('/admin/users'),
      color: 'text-green-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      color: 'text-purple-500',
    },
    {
      title: 'Analytics',
      description: 'View platform usage and statistics',
      icon: BarChart3,
      action: () => navigate('/admin/analytics'),
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage templates, users, and system settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.title}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={action.action}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${action.color}`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Manage
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/admin/templates')}>
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Manage Templates
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              View User Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              Create Workflow
            </Button>
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              View Workflows
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

