import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RetroArcadeMachine } from "@/components/RetroArcadeMachine";
// Replace the live canvas background with a static retro game room background
import { RetroGameRoomBackground } from "@/components/RetroGameRoomBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;

    // 1) Basic email format validation (RFC-like, practical)
    const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // 2) Username guardrails
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      toast.error("Username must be 3-20 characters, letters/numbers/underscore only.");
      setLoading(false);
      return;
    }

    // 3) Age verification - must be 13+
    if (!dateOfBirth) {
      toast.error("Please enter your date of birth.");
      setLoading(false);
      return;
    }
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 13) {
      toast.error("You must be at least 13 years old to create an account.");
      setLoading(false);
      return;
    }
    if (age > 120) {
      toast.error("Please enter a valid date of birth.");
      setLoading(false);
      return;
    }

    // 4) Check username availability (case-insensitive)
    const { count: unameCount, error: unameErr } = await supabase
      .from("profiles")
      .select("id", { count: 'exact', head: true })
      .ilike("username", cleanUsername);
    if ((unameCount ?? 0) > 0) {
      toast.error("That username is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Store chosen username and DOB in user metadata; we'll create profile on first verified sign-in
        data: { username: cleanUsername, date_of_birth: dateOfBirth },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Important: Do NOT create profile here. Wait until user verifies and signs in.
    toast.success("Account created! Please verify your email to continue.");
    setShowVerify(true);

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    // Sign out any existing session first
    await supabase.auth.signOut();
    
    // Clear only app-specific data, NOT Supabase session
    localStorage.removeItem('skillswap_credits');
    localStorage.removeItem('darkMode');
    localStorage.removeItem('emailNotif');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else if (data.session) {
      // Set default credits for new session
      localStorage.setItem('skillswap_credits', '10');
      
      // Ensure profile exists (first sign-in after verification)
      try {
        const user = data.user;
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profErr || !profile) {
          // Determine a unique username
          const base = (user.user_metadata?.username as string) || (user.email?.split('@')[0] ?? 'user');
          let candidate = base.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
          let suffix = 0;
          // Probe for availability
          while (true) {
            const checkName = suffix === 0 ? candidate : `${candidate}${suffix}`;
            const { count } = await supabase
              .from("profiles")
              .select("id", { count: 'exact', head: true })
              .ilike("username", checkName);
            if (!count) {
              candidate = checkName;
              break;
            }
            suffix++;
          }

          const { error: createErr } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              email: user.email!,
              username: candidate,
              date_of_birth: user.user_metadata?.date_of_birth || null,
              xp: 0,
              level: 1,
              streak_count: 0,
            });
        }
      } catch (e) {
        // Silent fail
      }

      toast.success("Welcome back!");
      
      // Use navigate instead of window.location to preserve session
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      <RetroGameRoomBackground />
      
      <RetroArcadeMachine>
        <Card className="w-full border-none bg-gray-900/90 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Welcome to SkillSwap
            </CardTitle>
                        <CardDescription className="text-gray-400">
              Exchange skills, grow together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="coollearner123"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-dob">Date of Birth</Label>
                    <Input
                      id="signup-dob"
                      name="dateOfBirth"
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-400">You must be 13 or older</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </RetroArcadeMachine>
      
      <AlertDialog open={showVerify} onOpenChange={setShowVerify}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify your email</AlertDialogTitle>
            <AlertDialogDescription>
              We sent a verification link to your inbox. Please click the link to activate your account. After verifying, return here and sign in to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowVerify(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
