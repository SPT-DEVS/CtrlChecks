import { 
  LayoutDashboard, 
  GitBranch, 
  Play, 
  Settings, 
  Users, 
  Key,
  Bell,
  User,
  LogOut,
  ChevronDown,
  LayoutTemplate,
  Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/hooks/useRole";
import { useNavigate } from "react-router-dom";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Workflows", url: "/workflows", icon: GitBranch },
  { title: "Executions", url: "/executions", icon: Play },
];

const settingsNavItems = [
  { title: "Profile", url: "/settings/profile", icon: User },
  { title: "API Keys", url: "/settings/api-keys", icon: Key },
  { title: "Teams", url: "/settings/teams", icon: Users },
  { title: "Notifications", url: "/settings/notifications", icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const { canAccessAdmin } = useRole();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CtrlChecks
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {canAccessAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Admin Dashboard">
                      <NavLink 
                        to="/admin/dashboard" 
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <Shield className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Admin Dashboard</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Templates Manager">
                      <NavLink 
                        to="/admin/templates" 
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <LayoutTemplate className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Templates Manager</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings/api-keys")}>
              <Key className="mr-2 h-4 w-4" />
              API Keys
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ProfileSettingsModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
