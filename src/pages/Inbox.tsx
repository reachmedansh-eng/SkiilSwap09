import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      setUserId(session.user.id);
      await Promise.all([
        fetchInbox(session.user.id),
        fetchSessions(session.user.id)
      ]);
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
    if (status === 'cancelled') {
      // Use RPC to cancel a pending exchange and refund 1 credit to the requester atomically
      const { data, error } = await (supabase as any).rpc('refund_exchange_credit', { p_exchange_id: id });
      if (error) {
        toast({ title: 'Failed to decline', description: error.message, variant: 'destructive' });
        return;
      }
      // data may be true/false depending on whether refund+cancel succeeded
      if (data) {
        toast({ title: 'Declined', description: 'The requester has been refunded 1 credit.' });
      } else {
        // Fallback: if RPC returned false (e.g., already processed), attempt plain status update
        const { error: uErr } = await supabase.from('exchanges').update({ status: 'cancelled' }).eq('id', id);
        if (uErr) {
          toast({ title: 'Failed to decline', description: uErr.message, variant: 'destructive' });
          return;
        }
        toast({ title: 'Declined' });
      }
      // Remove from inbox
      setRequests((prev) => prev.filter((r) => r.id !== id));
      // Notify credits badge listeners (requester will see updated value on their side)
      window.dispatchEvent(new Event('creditsChanged'));
      return;
    }

    // Accept path: plain status update
    const { error } = await supabase.from('exchanges').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Accepted' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const fetchSessions = async (uid: string) => {
    const nowIso = new Date().toISOString();
    const { data, error } = await (supabase as any)
      .from('sessions')
      .select('*')
      .or(`mentor_id.eq.${uid},mentee_id.eq.${uid}`)
      .gte('scheduled_at', nowIso)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });
    if (error) {
      return;
    }
    setSessions(data || []);
  };

  const completeSession = async (session: any, satisfied: boolean) => {
    // 1) Mark session completed with satisfaction
    const { error: sErr } = await (supabase as any)
      .from('sessions')
      .update({ status: 'completed', satisfied })
      .eq('id', session.id);
    if (sErr) {
      toast({ title: 'Could not complete session', description: sErr.message, variant: 'destructive' });
      return;
    }

    // 2) If satisfied, increment exchange progress
    if (satisfied) {
      // Read current progress and increment capped by total_sessions
      const { data: ex, error: exErr } = await supabase
        .from('exchanges')
        .select('id, completed_sessions, total_sessions')
        .eq('id', session.exchange_id)
        .single();
      if (!exErr && ex) {
        const current = (ex.completed_sessions as number) || 0;
        const total = (ex.total_sessions as number) || 3;
        const nextVal = Math.min(total, current + 1);
        await supabase
          .from('exchanges')
          .update({ completed_sessions: nextVal })
          .eq('id', session.exchange_id);
      }
    }

    // Refresh list
    if (userId) fetchSessions(userId);
    toast({ title: 'Session recorded', description: satisfied ? 'Progress updated ✅' : 'Marked as completed' });
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
          <div className="space-y-6">
            {sessions.length > 0 && (
              <Card className="bg-card border-4 border-success/40 pixel-corners">
                <CardHeader>
                  <CardTitle className="text-success">Upcoming Sessions</CardTitle>
                  <CardDescription>Quick links to your next lessons</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 p-3 border-2 border-success/20 rounded-sm pixel-corners">
                      <div>
                        <div className="text-sm text-foreground font-medium">{new Date(s.scheduled_at).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[420px]">
                          <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">{s.link}</a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="pixel-corners" onClick={() => window.open(s.link, '_blank')}>Join</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="pixel-corners">Complete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="pixel-corners border-4">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Were you satisfied with this session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                If yes, we’ll advance your session progress for this exchange.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => completeSession(s, false)}>Not satisfied</AlertDialogCancel>
                              <AlertDialogAction onClick={() => completeSession(s, true)}>Yes, satisfied</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
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
          </div>
        )}
      </div>
    </div>
  );
}
