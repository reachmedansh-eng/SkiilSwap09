import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Calendar, Link as LinkIcon, ArrowLeft } from "lucide-react";

interface Exchange {
  id: string;
  provider_id: string;
  requester_id: string;
  completed_sessions?: number | null;
  total_sessions?: number | null;
  skill_listings: {
    skill_offered: string;
  } | null;
  provider: {
    username: string;
  } | null;
  requester: {
    username: string;
  } | null;
}

export default function ScheduleSession() {
  const navigate = useNavigate();
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [meetLink, setMeetLink] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      
      // Fetch exchange details
      if (exchangeId) {
        const { data, error } = await supabase
          .from("exchanges")
          .select(`
            *,
            provider:profiles!exchanges_provider_id_fkey (username),
            requester:profiles!exchanges_requester_id_fkey (username),
            skill_listings (skill_offered)
          `)
          .eq("id", exchangeId)
          .single();

        if (error || !data) {
          toast({ title: "Exchange not found", variant: "destructive" });
          navigate("/exchanges");
          return;
        }
        setExchange(data as Exchange);
      }
      setLoading(false);
    };
    init();
  }, [navigate, exchangeId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !exchange || !meetLink || !sessionDate || !sessionTime) {
      toast({ title: "Missing fields", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
  const mentorId = exchange.provider_id;
  const menteeId = exchange.requester_id;
      const partnerId = userId === mentorId ? menteeId : mentorId;

      // Combine date + time into ISO string
      const datetimeString = `${sessionDate}T${sessionTime}`;
      const scheduledAt = new Date(datetimeString).toISOString();

      // Normalize link to ensure it is clickable (add https:// if missing)
      const normalizedLink = /^https?:\/\//i.test(meetLink) ? meetLink : `https://${meetLink}`;

      // 1) Insert session into DB
      // Using any cast because generated Supabase types may not include 'sessions' yet
      const { error: sessionErr } = await (supabase as any).from('sessions').insert({
        exchange_id: exchange.id,
        mentor_id: mentorId,
        mentee_id: menteeId,
        link: normalizedLink,
        scheduled_at: scheduledAt,
        status: 'scheduled'
      });
      if (sessionErr) throw sessionErr;

      // 2) Send chat notification with clickable link
      const when = new Date(scheduledAt);
      const readable = when.toLocaleString();
      const content = `📅 Session scheduled for ${readable}\nJoin: ${normalizedLink}`;
      const { error: msgErr } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: partnerId,
        content,
        read: false
      });
      if (msgErr) throw msgErr;

      // 3) Send a progress confirmation request to the learner (requester)
      const total = exchange.total_sessions ?? 3;
      const next = Math.min(total, (exchange.completed_sessions ?? 0) + 1);
      const progressTag = `::progress_request::exchange=${exchange.id};next=${next};total=${total}`;
      const progressText = `✅ Mark ${next}/${total} sessions complete? ${progressTag}`;
      const receiverForProgress = menteeId; // learner is requester
      const { error: progErr } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: receiverForProgress,
        content: progressText,
        read: false
      });
      if (progErr) throw progErr;

      toast({ 
        title: '✅ Session Scheduled!', 
        description: 'Your partner was notified via chat with the meeting link.' 
      });
      navigate('/exchanges');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Failed to schedule', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Exchange not found</p>
          <Button onClick={() => navigate('/exchanges')} className="mt-4 pixel-corners">
            Back to Exchanges
          </Button>
        </div>
      </div>
    );
  }

  const partner = userId === exchange.requester_id ? exchange.provider : exchange.requester;

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4 pixel-corners" 
          onClick={() => navigate('/exchanges')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exchanges
        </Button>

        <Card className="bg-card border-4 border-primary pixel-corners">
          <CardHeader>
            <CardTitle className="text-3xl retro-text text-primary">📅 Schedule a Session</CardTitle>
            <CardDescription className="text-lg">
              Schedule your next learning session with <span className="font-semibold text-foreground">{partner?.username}</span>
              <br />
              Skill: <span className="text-primary">{exchange.skill_listings?.skill_offered || "Unknown"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSchedule} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="meetLink" className="text-base font-semibold flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Google Meet Link
                </Label>
                <Input
                  id="meetLink"
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-def"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="pixel-corners border-2"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Create a meeting at <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">meet.google.com</a> and paste the link here
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionDate" className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Session Date
                </Label>
                <Input
                  id="sessionDate"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="pixel-corners border-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTime" className="text-base font-semibold">
                  Session Time
                </Label>
                <Input
                  id="sessionTime"
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="pixel-corners border-2"
                  required
                />
              </div>

              <div className="bg-primary/10 border-2 border-primary/20 rounded-sm p-4 pixel-corners">
                <p className="text-sm text-foreground">
                  💡 <strong>Tip:</strong> Your partner will receive a chat notification with the meeting link and time. They can also see it in their Inbox under "Upcoming Sessions".
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 pixel-corners border-2"
                  onClick={() => navigate('/exchanges')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground pixel-corners hover:bg-primary/90"
                  disabled={submitting || !meetLink || !sessionDate || !sessionTime}
                >
                  {submitting ? 'Scheduling...' : '🚀 Schedule Session'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
