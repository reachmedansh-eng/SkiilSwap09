import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  user_id: string;
  skill_offered: string;
  skill_wanted: string;
  category: string;
  description: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export default function Listings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "yours">("all"); // Toggle state

  const categories = ["All", "Design", "Development", "Business", "Arts", "Languages"];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      
      // Fetch current user's username
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();
      
      if (profileData) {
        setCurrentUsername(profileData.username);
      }
      
      fetchListings();
    };
    checkAuth();
  }, [navigate]);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from("skill_listings")
      .select(`
        *,
        profiles!skill_listings_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "🧨 Error loading listings",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setListings(data as Listing[]);
      toast({
        title: "💾 Success",
        description: `Loaded ${data.length} skill listings`,
      });
    }
    setLoading(false);
  };

  const proposeSwap = async (listingId: string, providerId: string) => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to propose a swap",
        variant: "destructive"
      });
      return;
    }

    // Prevent proposing swap to yourself
    if (providerId === currentUserId) {
      toast({
        title: "❌ Error",
        description: "You cannot propose a swap to yourself! This is your own listing.",
        variant: "destructive"
      });
      return;
    }

    // Check credits from server (fallback to local)
    let currentCredits = 10;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast({ title: "Not signed in", variant: "destructive" }); return; }
    const { data: pData } = await (supabase as any).from('profiles').select('credits').eq('id', session.user.id).single();
    if (pData && typeof (pData as any).credits === 'number') currentCredits = (pData as any).credits as number;
    else {
      const creditsStr = localStorage.getItem('skillswap_credits');
      currentCredits = creditsStr ? parseFloat(creditsStr) : 10;
    }

    if (currentCredits < 1) {
      toast({
        title: "💳 Insufficient Credits",
        description: "You need at least 1 credit to propose a swap. Complete tasks to earn more!",
        variant: "destructive"
      });
      return;
    }

    // Insert exchange request
    const { error } = await supabase
      .from("exchanges")
      .insert({
        listing_id: listingId,
        requester_id: currentUserId,
        provider_id: providerId,
        status: "pending",
        completed_sessions: 0,
        total_sessions: 3
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Deduct 1 credit on server
      const newCredits = parseFloat((currentCredits - 1).toFixed(2));
      await (supabase as any).from('profiles').update({ credits: newCredits }).eq('id', session.user.id);
      localStorage.setItem('skillswap_credits', String(newCredits));
      window.dispatchEvent(new Event('creditsChanged'));
      
      toast({
        title: "🎉 Swap Proposed!",
        description: `Request sent! 1 credit deducted. You have ${newCredits} credits remaining.`,
      });
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.skill_offered.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.skill_wanted.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || listing.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // Filter based on view mode
    const matchesViewMode = viewMode === "all" 
      ? listing.user_id !== currentUserId  // Show only OTHER users' listings
      : listing.user_id === currentUserId; // Show only YOUR listings
    
    return matchesSearch && matchesCategory && matchesViewMode;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-20 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 retro-text">🎮 Skill Listings</h1>
          <p className="text-muted-foreground text-lg">Discover skills to learn and people to connect with</p>
          
          {/* Show current user */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-lg pixel-corners">
            <span className="text-sm text-muted-foreground">Logged in as:</span>
            <span className="font-bold text-primary">{currentUsername || "Loading..."}</span>
          </div>
        </div>

        {/* Toggle: Your Listings vs All Listings */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-card border-4 border-primary/30 rounded-lg pixel-corners overflow-hidden">
            <Button
              onClick={() => setViewMode("all")}
              variant={viewMode === "all" ? "default" : "ghost"}
              className={`rounded-none px-8 py-3 font-bold transition-all ${
                viewMode === "all" 
                  ? "bg-primary text-primary-foreground pixel-shadow" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Listings
            </Button>
            <div className="w-1 bg-primary/30" />
            <Button
              onClick={() => setViewMode("yours")}
              variant={viewMode === "yours" ? "default" : "ghost"}
              className={`rounded-none px-8 py-3 font-bold transition-all ${
                viewMode === "yours" 
                  ? "bg-primary text-primary-foreground pixel-shadow" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Your Listings
            </Button>
          </div>
        </div>

        {/* Search and Filters with Pixel styling */}
        <div className="bg-card/80 backdrop-blur-lg rounded-lg p-6 border-4 border-primary pixel-corners mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
                className="pl-10 border-2 border-primary/30 focus:border-primary"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat.toLowerCase())}
                  variant={selectedCategory === cat.toLowerCase() ? "default" : "outline"}
                  className={`rounded-sm whitespace-nowrap pixel-corners ${
                    selectedCategory === cat.toLowerCase()
                      ? "bg-primary text-primary-foreground pixel-shadow"
                      : "border-2 border-muted hover:border-primary"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Grid with Pixel styling */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="bg-card border-4 border-primary/20 pixel-corners hover:border-primary transition-all hover:pixel-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-sm flex items-center justify-center text-2xl pixel-corners border-2 border-primary">
                    {listing.profiles?.avatar_url ? (
                      <img src={listing.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-sm" />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">{listing.profiles?.username || "Anonymous"}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-semibold text-muted-foreground">Active</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="bg-primary/10 rounded-sm p-3 border-2 border-primary/20 pixel-corners">
                    <p className="text-xs text-muted-foreground mb-1">🎁 Offers</p>
                    <p className="font-semibold text-primary">{listing.skill_offered}</p>
                  </div>
                  
                  <div className="bg-accent/10 rounded-sm p-3 border-2 border-accent/20 pixel-corners">
                    <p className="text-xs text-muted-foreground mb-1">🎯 Wants</p>
                    <p className="font-semibold text-foreground">{listing.skill_wanted}</p>
                  </div>
                </div>

                {viewMode === "all" ? (
                  <Button 
                    onClick={() => proposeSwap(listing.id, listing.user_id)}
                    className="w-full bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 pixel-corners border-2 border-primary/50"
                  >
                    💬 Propose Swap
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/my-listings')}
                    variant="outline"
                    className="w-full rounded-sm pixel-corners border-2 border-primary/50"
                  >
                    ⚙️ Manage Listing
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && !loading && (
          <div className="text-center py-12 bg-card border-4 border-dashed border-muted rounded-lg pixel-corners">
            <p className="text-muted-foreground text-lg mb-4">📭 No listings found matching your criteria</p>
            <Button variant="outline" className="pixel-corners">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
