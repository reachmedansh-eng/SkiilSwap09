import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Inbox, ThumbsUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  user_id: string;
  skill_offered: string;
  skill_wanted: string;
  category: string;
}

export default function ProposeSwap() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      const { data, error } = await supabase
        .from("skill_listings")
        .select("id, user_id, skill_offered, skill_wanted, category")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setListings((data || []) as Listing[]);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(l =>
      l.skill_offered.toLowerCase().includes(q) ||
      l.skill_wanted.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q)
    );
  }, [search, listings]);

  const recommended = useMemo(() => {
    // naive recommendation: pick top 3 most recent different users
    return listings.filter(l => l.user_id !== userId).slice(0, 3);
  }, [listings, userId]);

  const requestSwap = async (listing: Listing) => {
    if (!userId) return;
    if (listing.user_id === userId) {
      toast({ title: "Can't request", description: "This is your own listing.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("exchanges").insert({
      listing_id: listing.id,
      requester_id: userId,
      provider_id: listing.user_id,
      status: "pending",
      completed_sessions: 0,
      total_sessions: 3
    });
    if (error) {
      toast({ title: "Failed to request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent", description: "They'll see it in their inbox." });
      navigate("/exchanges");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />

      {/* Top Priority: Inbox link */}
      <div className="sticky top-0 z-40 bg-secondary/60 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">Your Inbox has all incoming requests</span>
          </div>
          <Button onClick={() => navigate('/inbox')} className="pixel-corners bg-primary text-primary-foreground hover:bg-primary/90">
            Go to Inbox
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary retro-text">💡 Propose a Swap</h1>
          <p className="text-muted-foreground">Search for a match or pick from recommendations</p>
        </div>

        <div className="bg-card/80 border-4 border-primary p-4 rounded-sm pixel-corners">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills or categories" className="pl-10 border-2 border-primary/30" />
          </div>
        </div>

        {/* Mini listings grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-28">
          {filtered.map((l) => (
            <Card key={l.id} className="bg-card border-4 border-primary/20 pixel-corners">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">{l.skill_offered}</CardTitle>
                <CardDescription>wants {l.skill_wanted} • {l.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => requestSwap(l)} className="w-full pixel-corners">Request Swap</Button>
              </CardContent>
            </Card>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">No matches found.</div>
          )}
        </div>
      </div>

      {/* Recommended footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t-4 border-primary">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">Recommended Swaps</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {recommended.map((r) => (
              <Card key={r.id} className="bg-muted/40 border-2 border-primary/30 pixel-corners">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{r.skill_offered}</div>
                    <div className="text-xs text-muted-foreground">wants {r.skill_wanted}</div>
                  </div>
                  <Button size="sm" onClick={() => requestSwap(r)} className="pixel-corners">Swap</Button>
                </CardContent>
              </Card>
            ))}
            {recommended.length === 0 && (
              <div className="text-sm text-muted-foreground">No recommendations yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
