import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";

interface Profile {
  id: string;
  username: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      fetchUsers(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const fetchUsers = async (currentUserId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .neq("id", currentUserId)
      .limit(10);

    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[300px,1fr] gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No users yet. Invite friends to join!
                </p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback className="gradient-primary text-white">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-muted-foreground">Click to chat</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="glass flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-8">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground max-w-md">
                Select a user from the list to start chatting and exchanging knowledge!
              </p>
            </CardContent>
            <div className="border-t p-4 flex gap-2">
              <Input placeholder="Type your message..." disabled />
              <Button size="icon" disabled>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
