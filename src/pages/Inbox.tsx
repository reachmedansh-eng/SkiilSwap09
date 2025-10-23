import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface Exchange {
  id: string;
  listing_id: string | null;
  requester_id: string;
  provider_id: string;
  status: string;
  created_at: string;
  listing?: { skill_offered: string; skill_wanted: string } | null;
  requester?: { username: string } | null;
}

export default function Inbox() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      setUserId(session.user.id);
      await fetchInbox(session.user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const fetchInbox = async (uid: string) => {
    const { data, error } = await supabase
      .from("exchanges")
      .select(`
        *,
        listing:skill_listings (skill_offered, skill_wanted),
        requester:profiles!exchanges_requester_id_fkey (username)
      `)
      .eq("provider_id", uid)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: 'Error loading inbox', description: error.message, variant: 'destructive' });
      return;
    }
    setRequests((data || []) as unknown as Exchange[]);
  };

  const updateStatus = async (id: string, status: 'active' | 'cancelled') => {
    const { error } = await supabase.from('exchanges').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'active' ? 'Accepted' : 'Declined' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary retro-text">📥 Inbox</h1>
          <p className="text-muted-foreground">Requests from people who want to learn from you or swap</p>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : requests.length === 0 ? (
          <Card className="bg-card border-4 border-dashed border-muted pixel-corners">
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">No incoming requests right now</div>
              <Button variant="outline" className="mt-4 pixel-corners" onClick={() => navigate('/propose-swap')}>Find swaps</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r.id} className="bg-card border-4 border-primary/20 pixel-corners">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">{r.requester?.username || 'Someone'} wants {r.listing?.skill_offered || 'a skill'}</CardTitle>
                  <CardDescription>Requested {new Date(r.created_at).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">They can teach: {r.listing?.skill_wanted || '...'}</div>
                  <div className="flex gap-2">
                    <Button className="pixel-corners" onClick={() => updateStatus(r.id, 'active')}>
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button variant="destructive" className="pixel-corners" onClick={() => updateStatus(r.id, 'cancelled')}>
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
