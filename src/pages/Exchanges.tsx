import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface Exchange {
  id: string;
  status: string;
  requester_id: string;
  provider_id: string;
  completed_sessions: number;
  total_sessions: number;
  rating: number | null;
  created_at: string;
  provider: {
    username: string;
    avatar_url: string | null;
  } | null;
  requester: {
    username: string;
    avatar_url: string | null;
  } | null;
  skill_listings: {
    skill_offered: string;
  } | null;
}

export default function Exchanges() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      fetchExchanges(session.user.id);
    };
    checkAuth();
    
    // Trigger credits badge to refresh when this page loads
    window.dispatchEvent(new Event('creditsChanged'));
  }, [navigate]);

  const fetchExchanges = async (uid: string) => {
    const { data, error } = await supabase
      .from("exchanges")
      .select(`
        *,
        provider:profiles!exchanges_provider_id_fkey (username, avatar_url),
        requester:profiles!exchanges_requester_id_fkey (username, avatar_url),
        skill_listings (skill_offered)
      `)
      .or(`requester_id.eq.${uid},provider_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "🧨 Error loading exchanges",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setExchanges(data as Exchange[]);
      toast({
        title: "💾 Success",
        description: `Loaded ${data.length} exchanges`,
      });
    }
    setLoading(false);
  };

  const abandonSession = async (exchange: Exchange) => {
    if (!userId) return;

    // Calculate refund based on sessions completed
    const totalSessions = exchange.total_sessions || 3;
    const completedSessions = exchange.completed_sessions || 0;
    const sessionsRemaining = totalSessions - completedSessions;
    
    // Refund formula: (remaining sessions / total sessions) * 1 credit
    const refundAmount = parseFloat((sessionsRemaining / totalSessions).toFixed(2));
    
    // Refund the REQUESTER (the person who paid), regardless of who abandons
    // But only if the current user is the requester
    let refundMessage = "";
    if (exchange.requester_id === userId) {
      const creditsStr = localStorage.getItem('skillswap_credits');
      const currentCredits = creditsStr ? parseFloat(creditsStr) : 10;
      const newCredits = parseFloat((currentCredits + refundAmount).toFixed(2));
      
      localStorage.setItem('skillswap_credits', String(newCredits));
      window.dispatchEvent(new Event('creditsChanged'));
      
      refundMessage = `You received ${refundAmount} credit${refundAmount !== 1 ? 's' : ''} refund (${completedSessions}/${totalSessions} sessions completed)`;
    } else {
      refundMessage = `Exchange cancelled. The requester will receive a ${refundAmount} credit refund.`;
    }

    // Update exchange status to cancelled
    const { error } = await supabase
      .from("exchanges")
      .update({ status: "cancelled" })
      .eq("id", exchange.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "🚪 Session Abandoned",
        description: refundMessage,
      });
      
      // Refresh exchanges
      if (userId) fetchExchanges(userId);
    }
  };

  const activeExchanges = exchanges.filter(e => e.status === "active");
  const pendingExchanges = exchanges.filter(e => e.status === "pending");
  const completedExchanges = exchanges.filter(e => e.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-20 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
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
          <h1 className="text-4xl font-bold text-primary mb-2 retro-text">🔄 My Exchanges</h1>
          <p className="text-muted-foreground text-lg">Track your active swaps and learning progress</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card border-4 border-primary p-1 rounded-sm pixel-corners">
            <TabsTrigger value="active" className="rounded-sm pixel-corners data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              🎮 Active ({activeExchanges.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-sm pixel-corners data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              ⏳ Pending ({pendingExchanges.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-sm pixel-corners data-[state=active]:bg-success data-[state=active]:text-success-foreground">
              ✅ Completed ({completedExchanges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeExchanges.length === 0 ? (
              <Card className="bg-card border-4 border-dashed border-muted pixel-corners">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-lg">No active exchanges yet. Start one from Listings!</p>
                </CardContent>
              </Card>
            ) : (
              activeExchanges.map((exchange) => {
                const partner = userId === exchange.requester_id ? exchange.provider : exchange.requester;
                const totalSessions = exchange.total_sessions || 3; // Default to 3 if missing
                const completedSessions = exchange.completed_sessions || 0;
                
                return (
                  <Card key={exchange.id} className="bg-card border-4 border-primary/30 pixel-corners hover:pixel-shadow transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-sm flex items-center justify-center text-2xl pixel-corners border-2 border-primary">
                            {partner?.avatar_url ? (
                              <img src={partner.avatar_url} alt="" className="w-full h-full object-cover rounded-sm" />
                            ) : "👤"}
                          </div>
                          <div>
                            <CardTitle className="text-xl text-foreground">{partner?.username || "Partner"}</CardTitle>
                            <CardDescription>Teaching you {exchange.skill_listings?.skill_offered || "a skill"}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-sm pixel-corners">
                          <Clock className="w-4 h-4" />
                          {completedSessions}/{totalSessions} sessions
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ProgressBar current={completedSessions} total={totalSessions} />
                      
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 pixel-corners"
                          onClick={() => {
                            toast({
                              title: "📅 Schedule Session",
                              description: "Session scheduling feature coming soon! For now, coordinate via chat.",
                            });
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Session
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-2 border-primary/30 text-primary rounded-sm hover:bg-primary/10 pixel-corners"
                          onClick={() => {
                            const partnerId = userId === exchange.requester_id ? exchange.provider_id : exchange.requester_id;
                            navigate(`/chat?userId=${partnerId}`);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                      
                      {/* Abandon Session button */}
                      <Button 
                        variant="destructive" 
                        className="w-full rounded-sm pixel-corners"
                        onClick={() => {
                          if (confirm(`Are you sure you want to abandon this session?\n\n${exchange.requester_id === userId ? `You'll receive a ${((exchange.total_sessions - exchange.completed_sessions) / exchange.total_sessions).toFixed(2)} credit refund based on ${exchange.completed_sessions}/${exchange.total_sessions} sessions completed.` : 'This will cancel the exchange.'}`)) {
                            abandonSession(exchange);
                          }
                        }}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Abandon Session
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            {pendingExchanges.length === 0 ? (
              <Card className="bg-card border-4 border-dashed border-muted pixel-corners">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-lg">No pending exchanges</p>
                </CardContent>
              </Card>
            ) : (
              pendingExchanges.map((exchange) => {
                const partner = userId === exchange.requester_id ? exchange.provider : exchange.requester;
                return (
                  <Card key={exchange.id} className="bg-card border-4 border-accent/40 pixel-corners">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-accent to-warning rounded-sm flex items-center justify-center text-2xl pixel-corners border-2 border-accent">
                            {partner?.avatar_url ? (
                              <img src={partner.avatar_url} alt="" className="w-full h-full object-cover rounded-sm" />
                            ) : "👤"}
                          </div>
                          <div>
                            <CardTitle className="text-xl text-foreground">{partner?.username || "Partner"}</CardTitle>
                            <CardDescription>{exchange.skill_listings?.skill_offered || "Skill exchange"}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-accent bg-accent/10 px-3 py-1 rounded-sm pixel-corners">
                          <AlertCircle className="w-4 h-4" />
                          Pending
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-accent/10 rounded-sm p-4 border-2 border-accent/20 pixel-corners">
                        <p className="text-sm text-muted-foreground">⏳ Awaiting confirmation...</p>
                      </div>
                      
                      <Button variant="outline" className="w-full border-2 border-accent/30 text-accent rounded-sm hover:bg-accent/10 pixel-corners">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedExchanges.length === 0 ? (
              <Card className="bg-card border-4 border-dashed border-muted pixel-corners">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-lg">No completed exchanges yet</p>
                </CardContent>
              </Card>
            ) : (
              completedExchanges.map((exchange) => {
                const partner = userId === exchange.requester_id ? exchange.provider : exchange.requester;
                return (
                  <Card key={exchange.id} className="bg-card border-4 border-success/30 pixel-corners">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-success to-primary rounded-sm flex items-center justify-center text-2xl pixel-corners border-2 border-success">
                            {partner?.avatar_url ? (
                              <img src={partner.avatar_url} alt="" className="w-full h-full object-cover rounded-sm" />
                            ) : "👤"}
                          </div>
                          <div>
                            <CardTitle className="text-xl text-foreground">{partner?.username || "Partner"}</CardTitle>
                            <CardDescription>
                              {exchange.skill_listings?.skill_offered || "Skill"} • Completed {new Date(exchange.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-success" />
                          {exchange.rating && <span className="text-sm font-semibold text-foreground">{exchange.rating} ⭐</span>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-success/10 rounded-sm p-4 border-2 border-success/20 pixel-corners">
                        <p className="text-sm text-muted-foreground">🎉 You both completed this exchange successfully!</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
