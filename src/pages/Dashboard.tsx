import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, MessageSquare, Settings as SettingsIcon, Inbox, Sparkles } from "lucide-react";
import { LevelHelmetAvatar } from "@/components/LevelHelmetAvatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  username: string;
  xp: number;
  level: number;
  streak_count: number;
  avatar_url?: string | null;
  bio?: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    console.log('Fetching profile for user ID:', session.user.id);
    console.log('User email:', session.user.email);
    setCurrentUserId(session.user.id);

    // Fetch profile
    const { data, error } = await supabase
      .from("profiles")
      .select("username, xp, level, streak_count, avatar_url, bio")
      .eq("id", session.user.id)
      .single();

    console.log('Dashboard fetched profile:', data);
    console.log('Profile username:', data?.username);
    
    if (error) {
      console.error('Error fetching profile:', error);
      
      // If profile doesn't exist, create it now
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile...');
        const defaultUsername = session.user.email?.split('@')[0] || 'user';
        
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: session.user.id,
            email: session.user.email,
            username: defaultUsername,
            xp: 0,
            level: 1,
            streak_count: 0
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create profile:', createError);
        } else {
          console.log('Profile created successfully:', newProfile);
          setProfile(newProfile);
        }
      }
    } else if (data) {
      setProfile(data);
      
      // Update last_login for streak tracking
      await supabase
        .from("profiles")
        .update({ last_login: new Date().toISOString() })
        .eq("id", session.user.id);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Reset state when user changes
    setProfile(null);
    setLoading(true);
    
    console.log('=== Dashboard mounted/remounted ===');
    console.log('Location key:', location.key);
    
    fetchProfile();
  }, [navigate, location.key]); // Refetch whenever location changes

  // Refetch profile data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase
            .from("profiles")
            .select("username, xp, level, streak_count, avatar_url, bio")
            .eq("id", session.user.id)
            .single();
          console.log('Dashboard refetched profile on visibility:', data);
          if (data) {
            setProfile(data);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Console - Full width at top */}
        <div>
            {/* Handheld console themed profile box (full width, stretched horizontally) */}
            <div className="relative p-8 pixel-corners">
              {/* Outer shell */}
              <div className="bg-gradient-to-br from-zinc-100/70 to-zinc-300/70 dark:from-zinc-800/60 dark:to-zinc-700/60 border-[20px] border-primary/40 rounded-[28px] pixel-corners shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                {/* Decorative top bar / cartridge ridge */}
                <div className="h-7 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30" />
                {/* Screen area with bezel - much larger and wider */}
                <div className="p-10">
                  <div className="bg-black/80 border-[14px] border-zinc-700 rounded-[16px] p-6 pixel-corners min-h-[360px] shadow-inner">
                    <div className="bg-secondary/15 border-6 border-primary/30 rounded-[12px] p-10 min-h-[320px] flex flex-col">
                    <div className="flex items-center gap-12 flex-1">
                      <LevelHelmetAvatar avatarUrl={profile?.avatar_url} username={profile?.username} level={profile?.level || 1} size={240} />
                      <div className="flex-1 min-w-0 space-y-6">
                        <div className="flex items-center justify-between gap-6">
                          <h3 className="font-bold text-foreground text-4xl">{profile?.username}</h3>
                          <Button size="icon" variant="ghost" className="pixel-corners" onClick={() => navigate('/settings')} title="Settings">
                            <SettingsIcon className="w-7 h-7" />
                          </Button>
                        </div>
                        <p className="text-xl text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
                          {profile?.bio || "No bio yet"}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-6">
                          {/* XP Progress Bar */}
                          <div>
                            <div className="flex justify-between text-base mb-3">
                              <span className="text-muted-foreground font-medium">To Level {(profile?.level || 1) + 1}</span>
                              <span className="font-bold text-primary">{profile?.xp || 0}/1000 XP</span>
                            </div>
                            <div className="w-full bg-muted rounded-sm h-4 overflow-hidden pixel-corners">
                              <div 
                                className="bg-gradient-to-r from-primary to-accent h-4 transition-all animate-pulse-glow"
                                style={{ width: `${((profile?.xp || 0) % 1000) / 10}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Streak */}
                          <div className="flex items-center gap-3 px-6 py-3 bg-warning/10 rounded-sm border-2 border-warning/20 pixel-corners">
                            <span className="text-warning text-3xl">🔥</span>
                            <div>
                              <p className="text-sm text-muted-foreground">Streak</p>
                              <p className="font-bold text-warning text-2xl">{profile?.streak_count || 0} days</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bottom controls - more console-like, larger */}
                <div className="px-10 pb-10 grid grid-cols-3 gap-10 items-center">
                  {/* D-pad */}
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-7 h-20 bg-primary/50 border-4 border-primary/70 rounded-sm" />
                      <div className="w-20 h-7 bg-primary/50 border-4 border-primary/70 rounded-sm absolute" />
                    </div>
                  </div>
                  {/* Speaker grill */}
                  <div className="flex items-center justify-center gap-2">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-2 h-12 bg-primary/30 rounded-sm" />
                    ))}
                  </div>
                  {/* A/B buttons */}
                  <div className="flex justify-end gap-6">
                    <div className="w-16 h-16 rounded-full bg-accent/60 border-4 border-accent/80 shadow-md" />
                    <div className="w-16 h-16 rounded-full bg-accent/60 border-4 border-accent/80 shadow-md" />
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-primary retro-text">
                Welcome back, <span className="text-accent">{profile?.username}</span>! 🚀
              </h1>
              <p className="text-muted-foreground text-lg">
                Ready to level up your skills today?
              </p>
            </div>

            {/* Top priority Inbox CTA */}
            <div className="flex items-center justify-between p-4 bg-card border-4 border-primary/30 pixel-corners">
              <div className="flex items-center gap-2 text-foreground"><Inbox className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Check requests in your inbox</span>
              </div>
              <Button onClick={() => navigate('/inbox')} className="pixel-corners">Open Inbox</Button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div 
                onClick={() => navigate("/propose-swap")}
                className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-105 transition-transform cursor-pointer p-6 rounded-sm pixel-corners border-4 border-primary/50 group hover:pixel-shadow"
              >
                <PlusCircle className="w-8 h-8 mb-3 group-hover:rotate-90 transition-transform animate-bounce-pixel" />
                <h3 className="text-xl font-bold mb-2">Propose Swap</h3>
                <p className="text-primary-foreground/80 text-sm">Start a new exchange</p>
              </div>

              <div 
                onClick={() => navigate("/listings")}
                className="bg-gradient-to-br from-secondary to-primary/20 text-foreground hover:scale-105 transition-transform cursor-pointer p-6 rounded-sm pixel-corners border-4 border-primary/30 group hover:pixel-shadow"
              >
                <Search className="w-8 h-8 mb-3 text-primary group-hover:scale-110 transition-transform animate-zoom-pulse" />
                <h3 className="text-xl font-bold mb-2">Find Match</h3>
                <p className="text-muted-foreground text-sm font-comfortaa">Browse listings</p>
              </div>

              <div 
                onClick={() => navigate("/my-listings")}
                className="bg-gradient-to-br from-accent to-primary/40 text-foreground hover:scale-105 transition-transform cursor-pointer p-6 rounded-sm pixel-corners border-4 border-accent/50 group hover:pixel-shadow"
              >
                <PlusCircle className="w-8 h-8 mb-3 group-hover:rotate-90 transition-transform" />
                <h3 className="text-xl font-bold mb-2">Create Listing</h3>
                <p className="text-muted-foreground text-sm font-comfortaa">Manage my listings</p>
              </div>
            </div>

            {/* Activity Feed removed until real data is available */}

            {/* Recommended section removed until recommendations are implemented */}

            {/* Daily Challenge */}
            <Card className="bg-card border-4 border-accent/30 pixel-corners">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <CardTitle className="text-foreground">🎯 Daily Challenge</CardTitle>
                </div>
                <CardDescription>
                  Complete today's challenge to earn bonus XP!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-accent/10 rounded-sm border-2 border-accent/20 pixel-corners">
                  <div>
                    <p className="font-semibold text-foreground">Complete 1 lesson today</p>
                    <p className="text-sm text-muted-foreground">+50 XP</p>
                  </div>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 pixel-corners">
                    Start Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
