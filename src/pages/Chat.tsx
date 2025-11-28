import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Paperclip, Smile, MoreVertical, Ban, Shield, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Profile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['😊', '😂', '❤️', '👍', '👏', '🎉', '🔥', '💯', '✨', '🚀', '💪', '🙌', '👌', '😍', '🤔', '😎', '🎯', '💡'];

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

    // Set up real-time subscription for messages
    const messagesChannel = supabase
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

    // Set up real-time subscription for block status changes
    const blockChannel = supabase
      .channel('block_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_users',
        },
        () => {
          // Re-check block status whenever blocked_users table changes
          checkBlockStatus(selectedUser.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(blockChannel);
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
    // Fetch all other users excluding any blocked in either direction
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id, username, avatar_url')
      .neq('id', currentUserId)
      .limit(50);
    if (error) {
      setLoading(false);
      return;
    }
    if (!data) { setUsers([]); setLoading(false); return; }
    // Get blocked relationships
    const { data: blockedRows } = await (supabase as any)
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);
    const blockedSet = new Set<string>();
    const blockedByCurrentSet = new Set<string>();
    blockedRows?.forEach(r => {
      if (r.blocker_id === currentUserId) {
        blockedSet.add(r.blocked_id);
        blockedByCurrentSet.add(r.blocked_id);
      }
      if (r.blocked_id === currentUserId) blockedSet.add(r.blocker_id);
    });
    
    const filtered = data.filter(u => !blockedSet.has(u.id));
    const blockedUsersList = data.filter(u => blockedByCurrentSet.has(u.id));
    
    setUsers(filtered);
    setBlockedUsers(blockedUsersList);
    setLoading(false);
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!currentUserId) return;

    // Check if user is blocked
    await checkBlockStatus(otherUserId);
    // Determine ordered pair for chat_resets lookup
    const a = currentUserId < otherUserId ? currentUserId : otherUserId;
    const b = currentUserId < otherUserId ? otherUserId : currentUserId;

    // Fetch latest reset timestamp if any
    const { data: resetRow } = await (supabase as any)
      .from('chat_resets')
      .select('reset_at')
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle();
    const resetAt = resetRow?.reset_at ? new Date(resetRow.reset_at) : null;

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
      return;
    }

    let filtered = data || [];
    if (resetAt) {
      filtered = filtered.filter(m => new Date(m.created_at) > resetAt);
      // If any older messages slipped through (reset not applied yet), try RPC purge once
      if ((data?.length || 0) > 0 && filtered.length === 0) {
        // Attempt a forced reset again to physically delete residual rows
        await (supabase as any).rpc('reset_conversation', { p_user1: currentUserId, p_user2: otherUserId });
      }
    }
    setMessages(filtered);
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

  const checkBlockStatus = async (otherUserId: string) => {
    if (!currentUserId) return;

    const { data } = await (supabase as any)
      .from("blocked_users")
      .select("*")
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`)
      .maybeSingle();

    setIsBlocked(!!data);
  };

  const blockUser = async () => {
    if (!currentUserId || !selectedUser) return;

    const { error } = await (supabase as any)
      .from("blocked_users")
      .insert({
        blocker_id: currentUserId,
        blocked_id: selectedUser.id,
        reason: "Blocked via chat"
      });

    if (error) {
      toast({
        title: "Failed to block user",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setIsBlocked(true);
      // Move user from active list to blocked list
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setBlockedUsers(prev => [...prev, selectedUser]);
      toast({
        title: "User blocked",
        description: `You have blocked ${selectedUser.username}`,
      });
    }
  };

  const unblockUser = async () => {
    if (!currentUserId || !selectedUser) return;

    // @ts-ignore Suppress deep instantiation error from Supabase type inference
    // @ts-ignore Suppress deep instantiation error from Supabase type inference; blocked_users table may be outside generated types
    const { error } = await (supabase as any)
      .from("blocked_users")
      .delete()
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", selectedUser.id);

    if (error) {
      toast({
        title: "Failed to unblock user",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setIsBlocked(false);
      // Move user from blocked list back to active list
      setBlockedUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setUsers(prev => [...prev, selectedUser]);
      toast({
        title: "User unblocked",
        description: `You have unblocked ${selectedUser.username}`,
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId || sending) return;

    // Prevent sending if blocked
    if (isBlocked) {
      toast({
        title: "Cannot send message",
        description: "This conversation is blocked. No messages can be sent.",
        variant: "destructive"
      });
      return;
    }

    // Double-check block status before sending
    await checkBlockStatus(selectedUser.id);
    if (isBlocked) {
      toast({
        title: "Cannot send message",
        description: "This conversation is blocked. No messages can be sent.",
        variant: "destructive"
      });
      return;
    }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedUser || !currentUserId) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `chat-files/${fileName}`;
    
    setUploadingFile(true);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive"
      });
      setUploadingFile(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const fileMessage = `📎 File: ${file.name}\n${publicUrl}`;
    
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      content: fileMessage,
      read: false
    });

    if (error) {
      toast({
        title: "Failed to send file",
        description: error.message,
        variant: "destructive"
      });
    } else {
      await fetchMessages(selectedUser.id);
    }

    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  // Parse and clean progress request from display
  const parseProgressRequest = (text: string): { cleanText: string; exchangeId?: string; next?: number; total?: number } => {
    const tagStart = text.indexOf('::progress_request::');
    if (tagStart === -1) return { cleanText: text };
    
    const beforeTag = text.slice(0, tagStart).trim();
    const tag = text.slice(tagStart).trim();
    const match = /::progress_request::exchange=([^;]+);next=(\d+);total=(\d+)/.exec(tag);
    
    if (!match) return { cleanText: text };
    
    return { 
      cleanText: beforeTag, 
      exchangeId: match[1], 
      next: Number(match[2]), 
      total: Number(match[3]) 
    };
  };

  const acceptProgress = async (exchangeId: string, next: number, total: number) => {
    try {
      const updates: any = { completed_sessions: next };
      if (next >= total) {
        updates.status = 'completed';
      }
      const { error } = await supabase.from('exchanges').update(updates).eq('id', exchangeId);
      if (error) throw error;

      // Award XP to both users for completing the session
      const { error: xpError } = await (supabase as any).rpc('award_session_xp', {
        p_exchange_id: exchangeId,
        p_session_number: next
      });
      if (xpError) {
        console.error('Failed to award XP:', xpError);
      }

      toast({
        title: "Progress confirmed!",
        description: `${next}/${total} sessions completed. +50 XP awarded! 🎉`
      });

      if (currentUserId && selectedUser) {
        await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          content: `✅ Progress confirmed: ${next}/${total} sessions completed. Both earned +50 XP! 🎉`,
          read: false
        });
        await fetchMessages(selectedUser.id);
      }
    } catch (e) {
      toast({
        title: "Failed to confirm progress",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const deleteChatHistory = async () => {
    if (!selectedUser || !currentUserId) return;
    const confirmDelete = window.confirm(`Delete the entire chat for both you and ${selectedUser.username}? This cannot be undone.`);
    if (!confirmDelete) return;
    const { error } = await (supabase as any).rpc('reset_conversation', {
      p_user1: currentUserId,
      p_user2: selectedUser.id,
    });
    if (error) {
      toast({ title: 'Failed to delete chat', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchMessages(selectedUser.id);
    // Remove from user list so fresh start required later
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setSelectedUser(null);
    toast({ title: 'Chat cleared', description: 'All prior messages have been removed for both users.' });
  };

  // Render message with clickable links
  const renderContent = (text: string) => {
    const splitRegex = /(https?:\/\/[^\s]+)/g;
    const isFullUrl = (part: string) => /^https?:\/\/[^\s]+$/i.test(part);
    const parts = text.split(splitRegex);
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) =>
          isFullUrl(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80 break-words"
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
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
                {users.length === 0 && blockedUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No users yet. Invite friends to join!
                  </p>
                ) : (
                  <>
                    {/* Active Users */}
                    {users.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-muted-foreground px-3 py-2">ACTIVE CHATS</p>
                        {users.map((user) => (
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
                        ))}
                      </>
                    )}
                    
                    {/* Blocked Users */}
                    {blockedUsers.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-destructive px-3 py-2 mt-4">BLOCKED USERS</p>
                        {blockedUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors opacity-60 ${
                              selectedUser?.id === user.id ? 'bg-destructive/20' : ''
                            }`}
                          >
                            <Avatar className="opacity-60">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-destructive/50 text-white">
                                {user.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{user.username}</p>
                              <p className="text-sm text-destructive">Blocked</p>
                            </div>
                            <Ban className="w-4 h-4 text-destructive" />
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </ScrollArea>
          </Card>

          {/* Chat Window */}
          <Card className="glass flex flex-col">
            {selectedUser ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
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
                          {isBlocked && (
                            <Badge variant="destructive" className="text-xs">
                              <Ban className="w-3 h-3 mr-1" />
                              Blocked
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Active now</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isBlocked ? (
                          <>
                            <DropdownMenuItem onClick={unblockUser} className="cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" />
                              Unblock User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={deleteChatHistory} className="cursor-pointer text-destructive">
                              <X className="w-4 h-4 mr-2" /> Delete Chat History
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={blockUser} className="cursor-pointer text-destructive">
                            <Ban className="w-4 h-4 mr-2" />
                            Block User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.sender_id === currentUserId;
                      const parsed = parseProgressRequest(msg.content);
                      const hasProgressRequest = parsed.exchangeId && !isOwnMessage;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          {hasProgressRequest ? (
                            <div className="max-w-[85%] rounded-lg p-3 bg-amber-50 border-2 border-amber-300">
                              <p className="break-words text-amber-900 font-medium mb-2">{parsed.cleanText}</p>
                              <Button 
                                size="sm" 
                                onClick={() => acceptProgress(parsed.exchangeId!, parsed.next!, parsed.total!)}
                                className="pixel-corners"
                              >
                                Accept
                              </Button>
                              <p className="text-xs text-amber-700 mt-2">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ) : (
                            <div
                              className={`max-w-[85%] rounded-lg p-3 ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="break-words break-all">{renderContent(msg.content)}</p>
                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4">
                  <div className="flex gap-2 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile || sending}
                      title="Upload file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Add emoji"
                          disabled={sending}
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2">
                        <div className="grid grid-cols-6 gap-2">
                          {emojis.map((emoji, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              className="h-8 w-8 p-0 text-xl hover:scale-125 transition-transform"
                              onClick={() => insertEmoji(emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Input
                      placeholder={isBlocked ? "Blocked - cannot send messages" : uploadingFile ? "Uploading..." : "Type your message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending || uploadingFile || isBlocked}
                      className="flex-1"
                    />
                    <Button 
                      size="icon" 
                      onClick={sendMessage} 
                      disabled={sending || uploadingFile || !newMessage.trim() || isBlocked}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
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
