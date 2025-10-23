import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Flame, BookOpen, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  username: string;
  bio: string | null;
  xp: number;
  level: number;
  streak_count: number;
  avatar_url?: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      fetchProfile(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, bio, xp, level, streak_count, avatar_url")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setEditedBio(data.bio || "");
    }
    setLoading(false);
  };

  const handleSaveBio = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ bio: editedBio })
      .eq("id", session.user.id);

    if (error) {
      toast.error("Failed to update bio");
    } else {
      toast.success("Bio updated!");
      setProfile(prev => prev ? { ...prev, bio: editedBio } : null);
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header - Large square avatar left, username/bio right */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <div className="w-full">
                <div className="w-full aspect-square max-h-[520px] bg-muted/30 border-4 border-primary/30 pixel-corners overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">{profile?.username}</h1>
                {editing ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={8}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveBio}>Save</Button>
                      <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{profile?.bio || "No bio yet"}</p>
                    <Button variant="ghost" className="mt-2" onClick={() => setEditing(true)}>
                      Edit Bio
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Trophy className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-lg font-bold">{profile?.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-lg border border-warning/20">
                    <Flame className="w-5 h-5 text-warning" />
                    <div>
                      <p className="text-xs text-muted-foreground">Streak</p>
                      <p className="text-lg font-bold">{profile?.streak_count} days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">XP</p>
                      <p className="text-lg font-bold">{profile?.xp}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-warning" />
              <CardTitle>Achievements</CardTitle>
            </div>
            <CardDescription>Badges and milestones you've earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 glass rounded-lg">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm font-semibold">First Course</p>
                <p className="text-xs text-muted-foreground">Complete your first lesson</p>
              </div>
              
              <div className="text-center p-4 glass rounded-lg opacity-50">
                <div className="text-4xl mb-2">🔥</div>
                <p className="text-sm font-semibold">7 Day Streak</p>
                <p className="text-xs text-muted-foreground">Learn for 7 days straight</p>
              </div>
              
              <div className="text-center p-4 glass rounded-lg opacity-50">
                <div className="text-4xl mb-2">⭐</div>
                <p className="text-sm font-semibold">Level 10</p>
                <p className="text-xs text-muted-foreground">Reach level 10</p>
              </div>
              
              <div className="text-center p-4 glass rounded-lg opacity-50">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm font-semibold">Course Master</p>
                <p className="text-xs text-muted-foreground">Complete 5 courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
