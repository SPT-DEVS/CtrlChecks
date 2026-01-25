import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAsAdmin, setLoginAsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { signIn, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    // Step 1: Authenticate user
    const { error: authError } = await signIn(email, password);
    
    if (authError) {
      setLoading(false);
      toast({ 
        title: "Authentication Failed", 
        description: authError.message, 
        variant: "destructive" 
      });
      return;
    }

    // Step 2: If admin checkbox is checked, verify admin role
    if (loginAsAdmin) {
      try {
        // Wait a moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const userIsAdmin = await isAdmin();
        
        if (!userIsAdmin) {
          // User is not admin - reject login and sign out
          await signOut();
          
          setLoading(false);
          toast({ 
            title: "Unauthorized", 
            description: "Admin access only. You do not have admin privileges.", 
            variant: "destructive" 
          });
          return;
        }
        
        // User is admin - redirect to admin dashboard
        setLoading(false);
        navigate("/admin/dashboard");
        return;
      } catch (roleError) {
        // Role check failed - reject login
        await signOut();
        
        setLoading(false);
        toast({ 
          title: "Error", 
          description: "Failed to verify admin role. Please try again.", 
          variant: "destructive" 
        });
        return;
      }
    }

    // Step 3: Normal user login - redirect to dashboard
    setLoading(false);
    navigate("/dashboard");
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setGoogleLoading(false);
        // Check for common OAuth configuration errors
        if (error.message.includes('OAuth') || error.message.includes('provider')) {
          toast({ 
            title: "Google Sign-In Not Configured", 
            description: "Please configure Google OAuth in Supabase dashboard. See console for details.", 
            variant: "destructive" 
          });
          console.error('Google OAuth Configuration Error:', error);
          console.error('To fix this:');
          console.error('1. Go to Supabase Dashboard > Authentication > Providers');
          console.error('2. Enable Google provider');
          console.error('3. Add your Google OAuth credentials');
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      }
      // If no error, OAuth redirect will happen automatically
      // Don't set loading to false here as the page will redirect
    } catch (err) {
      setGoogleLoading(false);
      toast({ 
        title: "Error", 
        description: "Failed to initiate Google sign-in. Please try again.", 
        variant: "destructive" 
      });
      console.error('Google sign-in error:', err);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center">
                <img src="/favicon.ico" alt="logo" className="h-full w-full" />
              </div>
              <span className="text-2xl font-bold">CtrlChecks</span>
            </Link>
            <h1 className="mt-6 text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Sign in to continue to your dashboard</p>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Admin Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="admin-login" 
                checked={loginAsAdmin}
                onCheckedChange={(checked) => setLoginAsAdmin(checked === true)}
              />
              <Label 
                htmlFor="admin-login" 
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Login as Admin
              </Label>
            </div>
            
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:flex lg:flex-1 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <h2 className="text-3xl font-bold">Your workflows await</h2>
          <p className="mt-4 text-white/80">Continue building and managing your automation workflows with AI-powered intelligence.</p>
        </div>
      </div>
    </div>
  );
}
