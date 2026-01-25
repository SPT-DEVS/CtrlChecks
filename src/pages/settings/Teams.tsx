import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Users, UserPlus, Crown, Shield, Eye, Settings } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type TeamRole = Database["public"]["Enums"]["team_role"];

interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
}

export default function TeamsSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("member");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  const loadTeams = useCallback(async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user?.id);

      if (memberError) throw memberError;

      if (memberData && memberData.length > 0) {
        const teamIds = memberData.map(m => m.team_id);
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .in("id", teamIds)
          .order("created_at", { ascending: false });

        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
        if (teamsData && teamsData.length > 0 && !selectedTeam) {
          setSelectedTeam(teamsData[0]);
        }
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error("Error loading teams:", error);
      toast.error("Failed to load teams");
    }
  }, [user, selectedTeam]);

  const loadMembers = useCallback(async (teamId: string) => {
    setLoadingMembers(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);

      if (membersError) throw membersError;

      // Load profiles separately
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const membersWithProfiles = (membersData || []).map(member => ({
        ...member,
        profile: profilesData?.find(p => p.user_id === member.user_id),
      })) as TeamMember[];

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user, loadTeams]);

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam.id);
    }
  }, [selectedTeam, loadMembers]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: newTeamName,
          description: newTeamDescription || null,
          owner_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Team created successfully");
      setNewTeamName("");
      setNewTeamDescription("");
      setCreateDialogOpen(false);
      loadTeams();
      if (data) setSelectedTeam(data);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedTeam) {
      toast.error("Please enter an email address");
      return;
    }

    setInviting(true);
    try {
      const { error } = await supabase
        .from("team_invitations")
        .insert({
          team_id: selectedTeam.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user?.id,
        });

      if (error) throw error;

      toast.success("Invitation sent successfully");
      setInviteEmail("");
      setInviteRole("member");
      setInviteDialogOpen(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case "owner": return <Crown className="h-3 w-3" />;
      case "admin": return <Shield className="h-3 w-3" />;
      case "viewer": return <Eye className="h-3 w-3" />;
      default: return null;
    }
  };

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case "owner": return "default";
      case "admin": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage your teams and collaborate with others</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team to collaborate on workflows with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name</Label>
                <Input
                  id="team_name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Engineering Team"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_description">Description (optional)</Label>
                <Input
                  id="team_description"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="What does this team do?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to start collaborating
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Your Teams</Label>
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTeam?.id === team.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                    }`}
                >
                  <p className="font-medium">{team.name}</p>
                  {team.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {team.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedTeam && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedTeam.name}</CardTitle>
                    <CardDescription>
                      {selectedTeam.description || "No description"}
                    </CardDescription>
                  </div>
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join {selectedTeam.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite_email">Email Address</Label>
                          <Input
                            id="invite_email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite_role">Role</Label>
                          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleInviteMember} disabled={inviting}>
                          {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Send Invitation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {member.profile?.email?.slice(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.profile?.full_name || member.profile?.email || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.profile?.email || `User ${member.user_id.slice(0, 8)}`}
                            </p>
                          </div>
                          <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
