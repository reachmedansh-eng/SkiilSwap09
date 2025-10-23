import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Profile {
  id: string;
  username: string;
  avatar_url?: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(session.user.id);
      await fetchUsers(session.user.id);
      
      // Check if userId is passed in URL params
      const userId = searchParams.get('userId');
      if (userId) {
        const user = await getUserById(userId);
        if (user) {
          setSelectedUser(user);
        }
      }
    };

    checkAuth();
  }, [navigate, searchParams]);

  // Subscribe to real-time messages when a user is selected
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;

    fetchMessages(selectedUser.id);
    markMessagesAsRead(selectedUser.id); // Mark as read when opening chat

    // Set up real-time subscription
  
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedUser.id},receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          markMessagesAsRead(selectedUser.id); // Auto-mark as read
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getUserById = async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", userId)
      .single();
    return data;
  };

  const fetchUsers = async (currentUserId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .neq("id", currentUserId)
      .limit(20);

    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async (otherUserId: string) => {
    if (!currentUserId) return;
    
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("receiver_id", currentUserId)
      .eq("sender_id", otherUserId)
      .eq("read", false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId || sending) return;

    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
        read: false
      });

    if (error) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setNewMessage("");
      await fetchMessages(selectedUser.id);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[300px,1fr] gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="glass overflow-hidden">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <CardContent className="space-y-2">
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No users yet. Invite friends to join!
                  </p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? 'bg-muted' : ''
                      }`}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
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
            </ScrollArea>
          </Card>

          {/* Chat Window */}
          <Card className="glass flex flex-col">
            {selectedUser ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar_url || undefined} />
                      <AvatarFallback className="gradient-primary text-white">
                        {selectedUser.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedUser.username}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Active now</p>
                    </div>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.sender_id === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4 flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                  />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-8">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a user from the list to start chatting and exchanging knowledge!
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
