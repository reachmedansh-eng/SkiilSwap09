import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  user_id: string;
  skill_offered: string;
  skill_wanted: string;
  category: string;
  description: string | null;
  status: string;
  created_at: string;
}

export default function MyListings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);

  // Form state
  const [skillOffered, setSkillOffered] = useState("");
  const [category, setCategory] = useState("Design");
  const [description, setDescription] = useState("");
  const categories = ["Design", "Development", "Business", "Arts", "Languages"]; 

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      await fetchMyListings(session.user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const fetchMyListings = async (uid: string) => {
    const { data, error } = await supabase
      .from("skill_listings")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "🧨 Error", description: error.message, variant: "destructive" });
      return;
    }
    setListings((data || []) as Listing[]);
  };

  const createListing = async () => {
    if (!userId) return;
    if (!skillOffered || !category) {
      toast({ title: "Missing fields", description: "Offer and Category are required.", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase
      .from("skill_listings")
      .insert({
        user_id: userId,
        skill_offered: skillOffered,
  skill_wanted: 'Open to offers',
        category,
        description: description || null,
        status: "active",
      })
      .select("*")
      .single();
    if (error) {
      toast({ title: "🧨 Could not create listing", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Listing created", description: "Your listing is now active." });
    setSkillOffered("");
    setCategory("Design");
    setDescription("");
    setListings((prev) => [data as Listing, ...prev]);
  };

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 retro-text">📦 My Listings</h1>
          <p className="text-muted-foreground text-lg">Create and manage your active listings</p>
        </div>

        <Tabs defaultValue="create" className="space-y-8">
          <TabsList className="bg-card border-4 border-primary p-1 rounded-sm pixel-corners">
            <TabsTrigger value="create" className="rounded-sm pixel-corners data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Create</TabsTrigger>
            <TabsTrigger value="active" className="rounded-sm pixel-corners data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Active ({listings.filter(l => l.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-sm pixel-corners data-[state=active]:bg-muted data-[state=active]:text-foreground">Inactive ({listings.filter(l => l.status === 'inactive').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card className="bg-card border-4 border-primary/30 pixel-corners">
              <CardHeader>
                <CardTitle className="text-foreground">Create a new listing</CardTitle>
                <CardDescription>Describe what you offer and what you want to learn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">🎁 Skill you offer</label>
                    <Input value={skillOffered} onChange={(e) => setSkillOffered(e.target.value)} placeholder="e.g., UI/UX Design" className="border-2 border-primary/30" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">📚 Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 rounded-sm bg-background border-2 border-muted hover:border-primary focus:border-primary px-3"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">📝 Description (optional)</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." className="border-2 border-muted" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={createListing} className="bg-primary text-primary-foreground hover:bg-primary/90 pixel-corners">Create Listing</Button>
                  <Button variant="outline" onClick={() => navigate('/listings')} className="pixel-corners">Browse Public Listings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {listings.filter(l => l.status === 'active').length === 0 ? (
              <Card className="bg-card border-4 border-dashed border-muted pixel-corners">
                <CardContent className="py-10 text-center text-muted-foreground">No active listings yet</CardContent>
              </Card>
            ) : (
              listings.filter(l => l.status === 'active').map((l) => (
                <Card key={l.id} className="bg-card border-4 border-primary/20 pixel-corners">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{l.skill_offered} → {l.skill_wanted}</div>
                      <div className="text-sm text-muted-foreground">{l.category}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="pixel-corners border-2" onClick={async () => {
                        const { error } = await supabase.from('skill_listings').update({ status: 'inactive' }).eq('id', l.id);
                        if (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } else {
                          toast({ title: 'Listing updated', description: 'Moved to inactive' });
                          fetchMyListings(userId!);
                        }
                      }}>Deactivate</Button>
                      <Button variant="destructive" className="pixel-corners" onClick={async () => {
                        const { error } = await supabase.from('skill_listings').delete().eq('id', l.id);
                        if (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } else {
                          toast({ title: 'Listing deleted', description: 'Removed successfully' });
                          setListings((prev) => prev.filter((x) => x.id !== l.id));
                        }
                      }}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            {listings.filter(l => l.status === 'inactive').length === 0 ? (
              <Card className="bg-card border-4 border-dashed border-muted pixel-corners">
                <CardContent className="py-10 text-center text-muted-foreground">No inactive listings</CardContent>
              </Card>
            ) : (
              listings.filter(l => l.status === 'inactive').map((l) => (
                <Card key={l.id} className="bg-card border-4 border-muted pixel-corners">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{l.skill_offered} → {l.skill_wanted}</div>
                      <div className="text-sm text-muted-foreground">{l.category}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="pixel-corners" onClick={async () => {
                        const { error } = await supabase.from('skill_listings').update({ status: 'active' }).eq('id', l.id);
                        if (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } else {
                          toast({ title: 'Listing updated', description: 'Reactivated' });
                          fetchMyListings(userId!);
                        }
                      }}>Activate</Button>
                      <Button variant="destructive" className="pixel-corners" onClick={async () => {
                        const { error } = await supabase.from('skill_listings').delete().eq('id', l.id);
                        if (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } else {
                          toast({ title: 'Listing deleted', description: 'Removed successfully' });
                          setListings((prev) => prev.filter((x) => x.id !== l.id));
                        }
                      }}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
